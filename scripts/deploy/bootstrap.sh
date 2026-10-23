#!/usr/bin/env bash
# One-time setup of a server for the PushRSP suite, fully self-contained under ROOT so it can
# share a box with other projects:
#   - Node 22 inside ROOT (no system Node / apt),
#   - .env files with fresh secrets (only when missing — never overwritten),
#   - systemd units pushrsp-market / pushrsp-portfolio on 127.0.0.1 (refuses to replace a
#     unit that points somewhere else),
#   - its own nginx in a Docker container on one public port (no host nginx, never 80/443).
# The code itself arrives with the first deploy (server-deploy.sh via GitHub Actions).
#
#   ssh user@server 'bash -s -- <root> <public-origin> <public-port>' < scripts/deploy/bootstrap.sh
#   e.g.            'bash -s -- /opt/venv http://95.38.189.20:8088 8088'
#
# Firewall is left alone: open <public-port> yourself (e.g. `ufw allow 8088/tcp`).
set -euo pipefail

ROOT="${1:?root dir}"
ORIGIN="${2:?public origin, e.g. http://1.2.3.4:8088}"
PORT="${3:?public port}"
MARKET_PORT="${MARKET_PORT:-13010}"
PORTFOLIO_PORT="${PORTFOLIO_PORT:-13020}"
NODE_VERSION="v22.20.0"
PROXY="pushrsp-proxy"
USER_NAME="$(id -un)"

log() { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }
SUDO=""; [ "$(id -u)" = 0 ] || SUDO="sudo -n"

# ---- refuse to collide with anything already there
port_used() { $SUDO ss -tlnH "sport = :$1" | grep -q .; }
# re-running on an existing install of ours: its own services hold these ports
ours=0; [ -f "$ROOT/deploy.env" ] && ours=1
for p in "$PORT" "$MARKET_PORT" "$PORTFOLIO_PORT"; do
  if port_used "$p" && [ "$ours" = 0 ]; then die "port $p is already in use by something else"; fi
done
for unit in pushrsp-market pushrsp-portfolio; do
  f="/etc/systemd/system/$unit.service"
  if [ -f "$f" ] && ! grep -q "WorkingDirectory=$ROOT/" "$f"; then die "$f exists and belongs to another install"; fi
done
if $SUDO docker ps -a --format '{{.Names}}' | grep -qx "$PROXY"; then
  $SUDO docker inspect "$PROXY" --format '{{range .Mounts}}{{.Source}}{{println}}{{end}}' | grep -q "^$ROOT" \
    || die "a container named $PROXY already exists for something else"
fi

log "layout in $ROOT"
$SUDO mkdir -p "$ROOT"
$SUDO chown "$USER_NAME:$USER_NAME" "$ROOT"
mkdir -p "$ROOT"/{app,portfolio-web,portfolio-admin,backups,nginx}

log "Node $NODE_VERSION in $ROOT/node"
if [ "$("$ROOT/node/bin/node" -v 2>/dev/null || true)" != "$NODE_VERSION" ]; then
  tmp="$(mktemp -d)"
  file="node-$NODE_VERSION-linux-x64.tar.xz"
  curl -fsSL --retry 4 -o "$tmp/$file" "https://nodejs.org/dist/$NODE_VERSION/$file"
  curl -fsSL --retry 4 -o "$tmp/SHASUMS256.txt" "https://nodejs.org/dist/$NODE_VERSION/SHASUMS256.txt"
  (cd "$tmp" && grep " $file\$" SHASUMS256.txt | sha256sum -c -) || die "Node checksum mismatch"
  rm -rf "$ROOT/node" && mkdir -p "$ROOT/node"
  tar -xJf "$tmp/$file" -C "$ROOT/node" --strip-components=1
  rm -rf "$tmp"
fi
"$ROOT/node/bin/node" -v

log "deploy settings → $ROOT/deploy.env"
cat >"$ROOT/deploy.env" <<EOF
# read by scripts/deploy/server-deploy.sh
NODE_DIR=$ROOT/node
MARKET_PORT=$MARKET_PORT
PORTFOLIO_PORT=$PORTFOLIO_PORT
# builds run at low CPU/IO priority with a bounded heap (other services share this box)
BUILD_NICE=1
BUILD_HEAP_MB=1536
# a private avr-gcc for the lab compiler (nothing installed system-wide)
LAB_AVR_GCC=download
EOF

secret() { head -c 48 /dev/urandom | base64 | tr -d '\n/+=' | head -c 48; }
write_env() { # file, content — only when the file does not exist yet
  if [ -f "$1" ]; then echo "  keep existing $1"; return; fi
  umask 077
  printf '%s\n' "$2" >"$1"
  echo "  + $1"
}

log ".env files (existing ones are kept)"
SEED_PW="$(secret | head -c 16)"
write_env "$ROOT/app/.env" "DATABASE_URL=file:$ROOT/app/prod.db
SESSION_SECRET=$(secret)
NEXT_PUBLIC_SITE_URL=$ORIGIN/pushrsp
NEXT_PUBLIC_PORTFOLIO_URL=$ORIGIN/portfolio
COOKIE_SECURE=false
SEED_PASSWORD=$SEED_PW
LAB_TOOLCHAIN_DIR=$ROOT/lab-toolchain"
write_env "$ROOT/portfolio-web/.env" "DATABASE_URL=file:$ROOT/portfolio-web/prod.db
SESSION_SECRET=$(secret)
NEXT_PUBLIC_SITE_URL=$ORIGIN/portfolio
NEXT_PUBLIC_BASE_PATH=/portfolio
NEXT_PUBLIC_MARKET_URL=$ORIGIN/pushrsp
ADMIN_ORIGIN=$ORIGIN
COOKIE_SECURE=false
SESSION_SAMESITE=lax
SEED_ADMIN_PASSWORD=$SEED_PW"
write_env "$ROOT/portfolio-admin/.env" "VITE_API_BASE=/portfolio
VITE_SITE_URL=$ORIGIN/portfolio"

log "systemd units"
unit() { # name, app dir, port
  $SUDO tee "/etc/systemd/system/$1.service" >/dev/null <<EOF
[Unit]
Description=PushRSP $1 (Next.js, $ROOT)
After=network.target
# not started until the first deploy has built the app
ConditionPathExists=$2/.next/BUILD_ID

[Service]
User=$USER_NAME
WorkingDirectory=$2
Environment=NODE_ENV=production
Environment=PATH=$ROOT/node/bin:/usr/bin:/bin
ExecStart=$ROOT/node/bin/node node_modules/next/dist/bin/next start -H 127.0.0.1 -p $3
Restart=on-failure
RestartSec=3
# share the box politely with the other services
Nice=5
MemoryMax=700M

[Install]
WantedBy=multi-user.target
EOF
}
unit pushrsp-market "$ROOT/app" "$MARKET_PORT"
unit pushrsp-portfolio "$ROOT/portfolio-web" "$PORTFOLIO_PORT"
$SUDO systemctl daemon-reload
$SUDO systemctl enable pushrsp-market pushrsp-portfolio >/dev/null 2>&1

log "nginx (container $PROXY on :$PORT only)"
cat >"$ROOT/nginx/pushrsp.conf" <<EOF
# PushRSP suite — the only thing this container serves (no default :80 server)
server {
    listen $PORT;
    server_name _;
    client_max_body_size 25m;

    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection "upgrade";

    location = / { return 302 /pushrsp; }

    location /pushrsp { proxy_pass http://127.0.0.1:$MARKET_PORT; }
    location = /portfolio-admin { return 301 /portfolio-admin/; }
    location /portfolio-admin/ {
        alias /srv/portfolio-admin/dist/;
        try_files \$uri \$uri/ /portfolio-admin/index.html;
    }
    location /portfolio { proxy_pass http://127.0.0.1:$PORTFOLIO_PORT; }

    # static files served without the apps' basePath (as on the original server)
    location /images/ { alias /srv/app/public/images/; }
    location /downloads/ { alias /srv/app/public/downloads/; }
    location /covers/ { alias /srv/portfolio-web/public/covers/; }
    location /avatars/ { alias /srv/portfolio-web/public/avatars/; }
}
EOF
if $SUDO docker ps -a --format '{{.Names}}' | grep -qx "$PROXY"; then $SUDO docker rm -f "$PROXY" >/dev/null; fi
$SUDO docker run -d --name "$PROXY" --restart unless-stopped --network host \
  -v "$ROOT/nginx/pushrsp.conf:/etc/nginx/conf.d/default.conf:ro" \
  -v "$ROOT:/srv:ro" \
  --memory 128m nginx:alpine >/dev/null
sleep 2
$SUDO docker exec "$PROXY" nginx -t 2>&1 | tail -1

log "done"
echo "  root:      $ROOT"
echo "  site:      $ORIGIN/pushrsp  ·  $ORIGIN/portfolio  ·  $ORIGIN/portfolio-admin/"
echo "  seed login password is SEED_PASSWORD in $ROOT/app/.env (change it after the first login)"
echo "  next: open port $PORT in the firewall yourself, then run the Deploy workflow"
