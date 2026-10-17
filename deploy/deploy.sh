#!/usr/bin/env bash
# Deploy Headliner to Carson's VPS behind the shared Caddy.
#   SSH_HOST=root@200.141.0.13 ./deploy/deploy.sh
# Prerequisites on the server (one-time): the headliner Supabase stack (headliner_default network),
# the Caddy blocks from deploy/Caddyfile.snippet, and /opt/headliner/.env filled from .env.example.
set -euo pipefail
: "${SSH_HOST:?SSH_HOST is required, e.g. root@200.141.0.13}"
REMOTE_DIR="${REMOTE_DIR:-/opt/headliner}"
DOMAIN="${DOMAIN:-headliner.carsonrodrigues.com}"

echo "Syncing source to $SSH_HOST:$REMOTE_DIR"
ssh "$SSH_HOST" "mkdir -p $REMOTE_DIR"
rsync -az --delete \
  --exclude node_modules --exclude .next --exclude .cache --exclude .impeccable --exclude .git \
  ./ "$SSH_HOST:$REMOTE_DIR/"

if ! ssh "$SSH_HOST" "test -f $REMOTE_DIR/.env"; then
  echo "No .env on the server. Copy .env.example to $REMOTE_DIR/.env there, fill it in, and run again." >&2
  exit 1
fi
if ! ssh "$SSH_HOST" "docker network inspect headliner_default >/dev/null 2>&1"; then
  echo "The headliner Supabase stack (network headliner_default) does not exist yet." >&2
  exit 1
fi

echo "Building and starting the app container"
ssh "$SSH_HOST" "cd $REMOTE_DIR && docker compose -f deploy/compose.yml up -d --build --remove-orphans"
echo "Post-check"
sleep 5
curl -fsS -o /dev/null -w "https://$DOMAIN -> %{http_code}\n" "https://$DOMAIN/robots.txt"
