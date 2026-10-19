#!/usr/bin/env bash
# CI self-test for server-deploy.sh against a fake /opt/pushrsp (no network to the real server):
# diff reports server-only files, deploy syncs code but keeps .env / databases / uploads,
# and a failing restart rolls everything back.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$here/../.." && pwd)"
sha="$(git -C "$repo" rev-parse HEAD)"
fake="$(mktemp -d)"
trap 'rm -rf "$fake"' EXIT

# the script fetches by sha: let a local clone do what GitHub allows
git -C "$repo" config uploadpack.allowAnySHA1InWant true

export PUSHRSP_ROOT="$fake" PUSHRSP_REPO="file://$repo" SKIP_BUILD=1 HEALTH=0 SYSTEMCTL=true

# a "live" server: an older copy with a server-only patch and runtime data
for app in market portfolio-web portfolio-admin; do
  live="$fake/$([ "$app" = market ] && echo app || echo "$app")"
  mkdir -p "$live"
  cp -r "$repo/$app/." "$live/"
  echo "SECRET=keep-me" >"$live/.env"
  echo "server-only hotfix" >"$live/SERVER_PATCH.md"
done
sqlite3 "$fake/app/prod.db" "create table orders(id int); insert into orders values (42);"
mkdir -p "$fake/app/public/uploads/products" "$fake/portfolio-web/data/uploads"
echo "img" >"$fake/app/public/uploads/products/a.png"
echo "cover" >"$fake/portfolio-web/data/uploads/c1"
echo "// edited on the server" >>"$fake/app/next.config.ts"

fail() { echo "SELFTEST FAILED: $*" >&2; exit 1; }

echo "== diff"
out="$(bash "$here/server-deploy.sh" diff "$sha" 2>&1)" || { echo "$out"; fail "diff exited with an error"; }
echo "$out"
grep -q "SERVER_PATCH.md" <<<"$out" || fail "diff did not list the server-only file"
grep -q "next.config.ts" <<<"$out" || fail "diff did not list the changed file"
[ -f "$fake/app/SERVER_PATCH.md" ] || fail "diff changed the server"

echo "== deploy"
bash "$here/server-deploy.sh" deploy "$sha"
[ ! -f "$fake/app/SERVER_PATCH.md" ] || fail "server-only file not removed"
cmp -s "$repo/market/next.config.ts" "$fake/app/next.config.ts" || fail "code not synced"
grep -q "SECRET=keep-me" "$fake/app/.env" || fail ".env was touched"
grep -q "LAB_TOOLCHAIN_DIR=" "$fake/app/.env" || fail "LAB_TOOLCHAIN_DIR not added"
[ "$(sqlite3 "$fake/app/prod.db" "select id from orders")" = 42 ] || fail "database was touched"
[ "$(sqlite3 "$(find "$fake/backups" -name 'market-prod.db' | head -1)" "select id from orders")" = 42 ] || fail "database backup unusable"
[ -f "$fake/app/public/uploads/products/a.png" ] || fail "shop uploads deleted"
[ -f "$fake/portfolio-web/data/uploads/c1" ] || fail "portfolio uploads deleted"
[ "$(cat "$fake/DEPLOYED_SHA")" = "$sha" ] || fail "DEPLOYED_SHA not written"
backup="$(find "$fake/backups" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2-)"
# list to a file first: `tar | grep -q` would SIGPIPE tar and trip pipefail
tar -tzf "$backup/market.tgz" >"$fake/backup-list"
grep -q "SERVER_PATCH.md" "$fake/backup-list" || fail "backup lacks the pre-deploy state"

echo "== rollback on a failed restart"
echo "patched again" >"$fake/app/SERVER_PATCH.md"
if SYSTEMCTL=false bash "$here/server-deploy.sh" deploy "$sha"; then fail "deploy should have failed"; fi
[ -f "$fake/app/SERVER_PATCH.md" ] || fail "rollback did not restore the previous code"
grep -q "SECRET=keep-me" "$fake/app/.env" || fail "rollback lost .env"

echo "SELFTEST OK"
