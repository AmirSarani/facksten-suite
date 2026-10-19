#!/usr/bin/env bash
# PushRSP suite — deploy on the server, run by .github/workflows/deploy.yml over SSH:
#
#   ssh deploy@server 'bash -s' -- <mode> <git-sha> < scripts/deploy/server-deploy.sh
#
# The server pulls the commit from GitHub itself (public repo, no credentials on the box).
#   diff    — fetch <sha> and report what a deploy would change in the live directories
#             (files the server has that GitHub doesn't = un-pushed server patches). Changes nothing.
#   deploy  — backup → sync code → npm ci → prisma db push (never --accept-data-loss) → build
#             → restart → health check; on any failure after the backup, restore and restart.
#
# Never overwritten: .env*, *.db*, uploads (market public/uploads, portfolio data/), node_modules.
# Overridable for the CI self-test: PUSHRSP_ROOT, PUSHRSP_REPO, SKIP_BUILD=1, SYSTEMCTL, HEALTH=0.
set -eEuo pipefail  # -E: the rollback trap also fires inside functions

MODE="${1:?usage: server-deploy.sh diff|deploy <git-sha>}"
SHA="${2:?missing git sha}"
ROOT="${PUSHRSP_ROOT:-/opt/pushrsp}"
REPO_URL="${PUSHRSP_REPO:-https://github.com/AmirSarani/facksten-suite.git}"
SUITE="$ROOT/suite"
BACKUPS="$ROOT/backups"
TOOLCHAIN="$ROOT/lab-toolchain"
SYSTEMCTL="${SYSTEMCTL:-systemctl}"
KEEP_BACKUPS=8

# app name → live dir, systemd unit (empty = static build only), health URL
APPS=(market portfolio-web portfolio-admin)
declare -A LIVE=([market]="$ROOT/app" [portfolio-web]="$ROOT/portfolio-web" [portfolio-admin]="$ROOT/portfolio-admin")
declare -A UNIT=([market]="pushrsp-market" [portfolio-web]="pushrsp-portfolio" [portfolio-admin]="")
declare -A HEALTH_URL=([market]="http://127.0.0.1:13010/pushrsp" [portfolio-web]="http://127.0.0.1:13020/portfolio" [portfolio-admin]="")

# Kept on the server across deploys (rsync filter rules, relative to each app dir).
PROTECT=(
  "P /.env*" "P *.db" "P *.db-journal" "P *.db-wal" "P *.db-shm"
  "P /node_modules/" "P /.next/" "P /dist/" "P /public/uploads/" "P /data/" "P /src/generated/"
)
EXCLUDE=(
  "- /.env*" "- *.db" "- *.db-journal" "- *.db-wal" "- *.db-shm" "- /node_modules/" "- /.next/" "- /dist/"
  "- /public/uploads/" "- /data/" "- /src/generated/" "- .git/" "- *.tsbuildinfo"
)

log() { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

rsync_filters() {
  local args=()
  for r in "${PROTECT[@]}"; do args+=(--filter="$r"); done
  for r in "${EXCLUDE[@]}"; do args+=(--filter="$r"); done
  printf '%s\0' "${args[@]}"
}

fetch_commit() {
  log "fetch $SHA from GitHub"
  # just that one commit, no history: git init + shallow fetch by sha
  if [ ! -d "$SUITE/.git" ]; then
    mkdir -p "$SUITE"
    git -C "$SUITE" init --quiet
    git -C "$SUITE" remote add origin "$REPO_URL"
  fi
  git -C "$SUITE" remote set-url origin "$REPO_URL"
  git -C "$SUITE" fetch --quiet --depth 1 origin "$SHA"
  git -C "$SUITE" -c advice.detachedHead=false checkout --quiet --force FETCH_HEAD
  git -C "$SUITE" clean -qfdx
  [ "$(git -C "$SUITE" rev-parse HEAD)" = "$SHA" ] || die "checked out $(git -C "$SUITE" rev-parse HEAD), expected $SHA"
}

# ---------------------------------------------------------------------------------------- diff
report_diff() {
  local app live filters
  for app in "${APPS[@]}"; do
    live="${LIVE[$app]}"
    log "$app → $live"
    if [ ! -d "$live" ]; then echo "  (not on the server yet — a deploy creates it)"; continue; fi
    mapfile -d '' filters < <(rsync_filters)
    # what a deploy would add/change (>f) or delete (*deleting)
    local changes
    changes="$(rsync -rcn --delete --itemize-changes "${filters[@]}" "$SUITE/$app/" "$live/" | grep -E '^(>f|\*deleting|cd)' || true)"
    if [ -z "$changes" ]; then echo "  identical to GitHub"; continue; fi
    local del upd new
    # itemize codes: ">f+++++++++" new file, ">fc…" / ">f.st…" changed file, "*deleting" server-only
    del="$(grep -c '^\*deleting' <<<"$changes" || true)"
    upd="$(grep -c '^>f[^+]' <<<"$changes" || true)"
    new="$(grep -c '^>f+' <<<"$changes" || true)"
    echo "  would update $upd file(s), add $new, DELETE $del (server-only)"
    # (each grep may match nothing — keep pipefail from ending the report)
    if [ "$del" -gt 0 ]; then
      echo "  ⚠ files on the server that GitHub doesn't have (un-pushed patches?) — deploy would remove them:"
      { grep '^\*deleting' <<<"$changes" || true; } | sed 's/^\*deleting */    - /' | head -60
    fi
    if [ "$upd" -gt 0 ]; then
      echo "  changed files:"
      { grep '^>f[^+]' <<<"$changes" || true; } | awk '{print "    ~ "$2}' | head -60
    fi
    if [ "$new" -gt 0 ]; then
      echo "  new files:"
      { grep '^>f+' <<<"$changes" || true; } | awk '{print "    + "$2}' | head -60
    fi
  done
}

# -------------------------------------------------------------------------------------- deploy
BACKUP_DIR=""
backup() {
  BACKUP_DIR="$BACKUPS/$(date +%Y%m%d-%H%M%S)-${SHA:0:7}"
  log "backup → $BACKUP_DIR"
  mkdir -p "$BACKUP_DIR"
  local app live
  for app in "${APPS[@]}"; do
    live="${LIVE[$app]}"
    [ -d "$live" ] || continue
    # code + build output, without dependencies (reinstalled on restore)
    tar -C "$live" --exclude=./node_modules --exclude=./data/uploads -czf "$BACKUP_DIR/$app.tgz" .
    # databases with sqlite's online backup when available (consistent while the app runs)
    for db in "$live"/*.db; do
      [ -f "$db" ] || continue
      local dest
      dest="$BACKUP_DIR/$app-$(basename "$db")"
      if ! { command -v sqlite3 >/dev/null && sqlite3 "$db" ".backup '$dest'"; }; then cp "$db" "$dest"; fi
    done
  done
  # keep the newest $KEEP_BACKUPS
  find "$BACKUPS" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -rn | tail -n +$((KEEP_BACKUPS + 1)) | cut -d' ' -f2- | xargs -r rm -rf
}

restore() {
  [ -n "$BACKUP_DIR" ] || return 0
  log "ROLLBACK from $BACKUP_DIR"
  local app live
  for app in "${APPS[@]}"; do
    live="${LIVE[$app]}"
    [ -f "$BACKUP_DIR/$app.tgz" ] || continue
    find "$live" -mindepth 1 -maxdepth 1 ! -name node_modules ! -name data ! -name '*.db' ! -name '.env*' -exec rm -rf {} +
    tar -C "$live" -xzf "$BACKUP_DIR/$app.tgz"
    for db in "$BACKUP_DIR/$app-"*.db; do
      if [ -f "$db" ]; then cp "$db" "$live/${db##*/"$app"-}"; fi
    done
    if [ "${SKIP_BUILD:-0}" != 1 ]; then (cd "$live" && npm ci --no-audit --no-fund --loglevel=error) || true; fi
    if [ -n "${UNIT[$app]}" ]; then "$SYSTEMCTL" restart "${UNIT[$app]}" || true; fi
  done
}

sync_app() {
  local app="$1" live="${LIVE[$1]}" filters
  mkdir -p "$live"
  mapfile -d '' filters < <(rsync_filters)
  rsync -rc --delete "${filters[@]}" "$SUITE/$app/" "$live/"
}

ensure_env() {
  # LAB_TOOLCHAIN_DIR for the shop, once (never touches other variables)
  local env="${LIVE[market]}/.env"
  [ -f "$env" ] || return 0
  grep -q '^LAB_TOOLCHAIN_DIR=' "$env" || { echo "LAB_TOOLCHAIN_DIR=$TOOLCHAIN" >>"$env"; echo "  + LAB_TOOLCHAIN_DIR in $env"; }
}

lab_toolchain() {
  # (Re)install the Arduino compiler when its pinned versions changed (stamp = hash of setup.ts).
  local stamp="$TOOLCHAIN/.setup-hash" want
  want="$(sha256sum "$SUITE/market/scripts/lab-toolchain/setup.ts" | cut -d' ' -f1)"
  if [ -f "$TOOLCHAIN/toolchain.json" ] && [ "$(cat "$stamp" 2>/dev/null)" = "$want" ]; then
    echo "  lab toolchain up to date"
    return 0
  fi
  if ! command -v avr-gcc >/dev/null; then
    if [ "$(id -u)" = 0 ] && command -v apt-get >/dev/null; then
      DEBIAN_FRONTEND=noninteractive apt-get install -y -qq gcc-avr avr-libc >/dev/null
    else
      echo "  ⚠ avr-gcc missing and can't install it (not root) — lab keeps the simple compiler"; return 0
    fi
  fi
  (cd "${LIVE[market]}" && npx --yes tsx scripts/lab-toolchain/setup.ts --dir "$TOOLCHAIN") && echo "$want" >"$stamp"
}

health() {
  local app="$1" url="${HEALTH_URL[$1]}"
  [ -n "$url" ] && [ "${HEALTH:-1}" = 1 ] || return 0
  for _ in $(seq 1 30); do
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$url" || true)"
    if [ "$code" = 200 ]; then echo "  ✓ $url → 200"; return 0; fi
    sleep 2
  done
  echo "  ✗ $url never answered 200 (last: $code)"; return 1
}

deploy() {
  backup
  trap 'restore; die "deploy failed — previous version restored"' ERR
  local app live
  for app in "${APPS[@]}"; do
    live="${LIVE[$app]}"
    log "$app: sync code"
    sync_app "$app"
    if [ "${SKIP_BUILD:-0}" = 1 ]; then continue; fi
    log "$app: install + build"
    (
      cd "$live"
      npm ci --no-audit --no-fund --loglevel=error
      if [ -f prisma/schema.prisma ]; then
        # refuses changes that would drop data — then the deploy stops and rolls back
        npx prisma db push
      fi
      npm run build
    )
  done
  if [ "${SKIP_BUILD:-0}" != 1 ]; then
    log "lab compiler"
    lab_toolchain || echo "  ⚠ lab toolchain setup failed — the lab keeps the simple compiler"
  fi
  ensure_env
  for app in "${APPS[@]}"; do
    [ -n "${UNIT[$app]}" ] || continue
    log "${UNIT[$app]}: restart"
    "$SYSTEMCTL" restart "${UNIT[$app]}"
    health "$app"
  done
  trap - ERR
  echo "$SHA" >"$ROOT/DEPLOYED_SHA"
  log "deployed $SHA ✓ (backup kept in $BACKUP_DIR)"
}

command -v rsync >/dev/null || die "rsync is required on the server (apt install rsync)"
exec 9>"$ROOT/.deploy.lock"
flock -n 9 || die "another deploy is running"

fetch_commit
case "$MODE" in
  diff) report_diff ;;
  deploy) deploy ;;
  *) die "unknown mode $MODE" ;;
esac
