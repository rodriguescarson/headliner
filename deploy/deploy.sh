#!/usr/bin/env bash
# Deploy Headliner to a VPS over SSH. Requires: docker + compose plugin on the server, DNS A record for $DOMAIN pointing at it.
#   DOMAIN=headliner.carsonrodrigues.com SSH_HOST=hotelclaw-server ./deploy/deploy.sh
set -euo pipefail
: "${DOMAIN:?DOMAIN is required}"
: "${SSH_HOST:?SSH_HOST is required (an alias from ~/.ssh/config)}"
REMOTE_DIR="${REMOTE_DIR:-/opt/headliner}"

echo "Syncing source to $SSH_HOST:$REMOTE_DIR"
ssh "$SSH_HOST" "mkdir -p $REMOTE_DIR"
rsync -az --delete \
  --exclude node_modules --exclude .next --exclude .cache --exclude .impeccable --exclude .git \
  ./ "$SSH_HOST:$REMOTE_DIR/"

if ! ssh "$SSH_HOST" "test -f $REMOTE_DIR/.env"; then
  echo "No .env on the server. Copy .env.example to $REMOTE_DIR/.env there, fill it in, and run again." >&2
  exit 1
fi

echo "Building and starting"
ssh "$SSH_HOST" "cd $REMOTE_DIR && DOMAIN=$DOMAIN docker compose -f deploy/compose.yml up -d --build --remove-orphans"
echo "Post-check"
sleep 5
curl -fsS -o /dev/null -w "https://$DOMAIN -> %{http_code}\n" "https://$DOMAIN/robots.txt"
