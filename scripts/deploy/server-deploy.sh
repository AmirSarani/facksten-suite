#!/usr/bin/env bash
# PushRSP suite — deploy on the server, run by .github/workflows/deploy.yml over SSH:
#
#   ssh deploy@server 'bash -s' -- <mode> <git-sha> [root] < scripts/deploy/server-deploy.sh
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

MODE="${1:?usage: server-deploy.sh diff|deploy <git-sha> [root]}"
SHA="${2:?missing git sha}"
ROOT="${PUSHRSP_ROOT:-${3:-/opt/pushrsp}}"
REPO_URL="${PUSHRSP_REPO:-https://github.com/AmirSarani/facksten-suite.git}"
SUITE="$ROOT/suite"
BACKUPS="$ROOT/backups"
TOOLCHAIN="$ROOT/lab-toolchain"
KEEP_BACKUPS=8

# Per-server settings written by bootstrap.sh (Node location, ports, build limits…).
NODE_DIR="" BUILD_NICE=1 BUILD_HEAP_MB=1536 LAB_AVR_GCC=""
MARKET_PORT=13010 PORTFOLIO_PORT=13020 PROXY_PORT=""
# shellcheck source=/dev/null
if [ -f "$ROOT/deploy.env" ]; then . "$ROOT/deploy.env"; fi
if [ -n "$NODE_DIR" ]; then PATH="$NODE_DIR/bin:$PATH"; fi

# app name → live dir, systemd unit (empty = static build only), health URL
APPS=(market portfolio-web portfolio-admin)
declare -A LIVE=([market]="$ROOT/app" [portfolio-web]="$ROOT/portfolio-web" [portfolio-admin]="$ROOT/portfolio-admin")
declare -A UNIT=([market]="pushrsp-market" [portfolio-web]="pushrsp-portfolio" [portfolio-admin]="")
declare -A HEALTH_URL=([market]="http://127.0.0.1:$MARKET_PORT/pushrsp" [portfolio-web]="http://127.0.0.1:$PORTFOLIO_PORT/portfolio" [portfolio-admin]="")

# systemctl as root, through sudo otherwise; SYSTEMCTL overrides it (CI self-test)
svc() {
  if [ -n "${SYSTEMCTL:-}" ]; then "$SYSTEMCTL" "$@"
  elif [ "$(id -u)" = 0 ]; then systemctl "$@"
  else sudo -n systemctl "$@"; fi
}

# Builds yield to whatever else runs on the box (CPU/IO priority, bounded Node heap).
build_run() {
  if [ "$BUILD_NICE" = 1 ]; then NODE_OPTIONS="--max-old-space-size=$BUILD_HEAP_MB" nice -n 15 ionice -c3 "$@"
  else "$@"; fi
}

# sqlite file of an app, from its .env DATABASE_URL (file:…), relative paths from the app dir.
db_file() {
  local url
  url="$(grep -E '^DATABASE_URL=' "$1/.env" 2>/dev/null | head -1 | cut -d= -f2- | tr -d '"' || true)"
  url="${url#file:}"
  case "$url" in "") echo "" ;; /*) echo "$url" ;; *) echo "$1/${url#./}" ;; esac
}

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
    # dependencies of the restored code (nothing to install when the backup was an empty first install)
    if [ "${SKIP_BUILD:-0}" != 1 ] && [ -f "$live/package-lock.json" ]; then
      (cd "$live" && npm ci --no-audit --no-fund --loglevel=error) || true
    fi
    if [ -n "${UNIT[$app]}" ]; then svc restart "${UNIT[$app]}" || true; fi
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
  local gcc_args=()
  if [ "$LAB_AVR_GCC" = download ]; then
    # a private avr-gcc inside $TOOLCHAIN — nothing installed system-wide
    gcc_args=(--download-avr-gcc)
  elif ! command -v avr-gcc >/dev/null; then
    if [ "$(id -u)" = 0 ] && command -v apt-get >/dev/null; then
      DEBIAN_FRONTEND=noninteractive apt-get install -y -qq gcc-avr avr-libc >/dev/null
    else
      echo "  ⚠ avr-gcc missing and can't install it (not root) — lab keeps the simple compiler"; return 0
    fi
  fi
  (cd "${LIVE[market]}" && npx --yes tsx scripts/lab-toolchain/setup.ts --dir "$TOOLCHAIN" "${gcc_args[@]}") && echo "$want" >"$stamp"
}

# docker as root, through sudo otherwise; DOCKER overrides it (CI self-test)
dock() {
  if [ -n "${DOCKER:-}" ]; then "$DOCKER" "$@"
  elif [ "$(id -u)" = 0 ]; then docker "$@"
  else sudo -n docker "$@"; fi
}

proxy_config() {
  # Install scripts/deploy/nginx.conf into the pushrsp-proxy container made by bootstrap.sh.
  # The new config must pass `nginx -t` and serve the shop through the proxy, else the previous
  # one is put back (the container itself is never recreated here).
  local conf="$ROOT/nginx/pushrsp.conf" proxy=pushrsp-proxy port="$PROXY_PORT"
  [ -f "$conf" ] || { echo "  no $conf — proxy not set up by bootstrap.sh, skipped"; return 0; }
  dock inspect "$proxy" >/dev/null 2>&1 || { echo "  no $proxy container, skipped"; return 0; }
  [ -n "$port" ] || port="$(grep -oE 'listen +[0-9]+' "$conf" | head -1 | grep -oE '[0-9]+$' || true)"
  [ -n "$port" ] || { echo "  ✗ can't tell the proxy port (set PROXY_PORT in deploy.env)"; return 1; }
  local want
  want="$(sed -e "s/__PORT__/$port/g" -e "s/__MARKET_PORT__/$MARKET_PORT/g" -e "s/__PORTFOLIO_PORT__/$PORTFOLIO_PORT/g" \
    "$SUITE/scripts/deploy/nginx.conf")"
  if [ "$want" = "$(cat "$conf")" ]; then echo "  proxy config up to date"; return 0; fi
  cp "$conf" "$conf.prev"
  # rewrite in place: the container bind-mounts this file, a new inode (mv) would not reach it
  printf '%s\n' "$want" >"$conf"
  if dock exec "$proxy" nginx -t >/dev/null 2>&1; then
    # a reload hands over to new workers asynchronously; if it still serves the old config, restart
    # the container (ours alone: nothing else listens through it)
    if { dock exec "$proxy" nginx -s reload >/dev/null 2>&1 && proxy_check "$port"; } \
       || { echo "  reload not picked up — restarting $proxy"; dock restart "$proxy" >/dev/null && proxy_check "$port"; }; then
      echo "  ✓ proxy config installed (previous kept as $conf.prev)"
      return 0
    fi
  else
    dock exec "$proxy" nginx -t 2>&1 | tail -3 | sed 's/^/    /' || true
  fi
  echo "  ✗ new proxy config failed — putting the previous one back"
  cat "$conf.prev" >"$conf"
  dock exec "$proxy" nginx -s reload >/dev/null 2>&1 || dock restart "$proxy" >/dev/null 2>&1 || true
  return 1
}

proxy_check() {
  # the page and one of its scripts through the proxy, under the renamed path (up to ~15 s)
  [ "${HEALTH:-1}" = 1 ] || return 0
  local base="http://127.0.0.1:$1" page script="" code=""
  for _ in $(seq 1 15); do
    sleep 1
    page="$(curl -s --max-time 10 "$base/pushrsp" || true)"
    script="$(grep -oE '/pushrsp/_next/static/c/[A-Za-z0-9._~-]+\.js' <<<"$page" | head -1 || true)"
    [ -n "$script" ] || continue
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$base$script" || true)"
    if [ "$code" = 200 ]; then echo "  ✓ proxy: /pushrsp and $script → 200"; return 0; fi
  done
  if [ -z "$script" ]; then echo "  ✗ proxy: no rewritten script URL in /pushrsp"; else echo "  ✗ proxy: $script → $code"; fi
  return 1
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
      # the parent's ERR trap rolls back once; don't run it again inside this subshell
      trap - ERR
      cd "$live"
      build_run npm ci --no-audit --no-fund --loglevel=error
      if [ -f prisma/schema.prisma ]; then
        # the seed and the build both import the generated client
        npx prisma generate
        local db fresh=0
        db="$(db_file "$live")"
        if [ -n "$db" ] && [ ! -s "$db" ]; then fresh=1; fi
        # refuses changes that would drop data — then the deploy stops and rolls back
        npx prisma db push
        # first install only: seed the empty database (the seed wipes, so never on a live one)
        if [ "$fresh" = 1 ]; then
          log "$app: first install — seeding the new database"
          SEED_ALLOW_WIPE=1 npm run db:seed
        fi
      fi
      build_run npm run build
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
    svc restart "${UNIT[$app]}"
    health "$app"
  done
  trap - ERR
  # the apps are fine at this point; a rejected proxy config only keeps the previous one
  log "proxy (nginx)"
  proxy_config || die "proxy config not installed — the previous one is still serving"
  echo "$SHA" >"$ROOT/DEPLOYED_SHA"
  log "deployed $SHA ✓ (backup kept in $BACKUP_DIR)"
}

command -v rsync >/dev/null || die "rsync is required on the server (apt install rsync)"
[ -d "$ROOT" ] || die "$ROOT does not exist — run scripts/deploy/bootstrap.sh on this server first"
exec 9>"$ROOT/.deploy.lock"
flock -n 9 || die "another deploy is running"

fetch_commit
case "$MODE" in
  diff) report_diff ;;
  deploy) deploy ;;
  *) die "unknown mode $MODE" ;;
esac
