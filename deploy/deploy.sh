#!/usr/bin/env bash
# Deploy Headliner to Carson's VPS behind the shared Caddy.
#   SSH_HOST=root@200.141.0.13 ./deploy/deploy.sh
#
# The image is built HERE and shipped as a tarball. Never build on the VPS: it also runs Amorelle and other
# Supabase stacks with little RAM to spare, and a Next.js build needs one to two GiB at its peak.
# Prerequisites on the server (one-time): the headliner Supabase stack (headliner_default network), the Caddy
# blocks from deploy/Caddyfile.snippet, and /opt/headliner/.env filled from .env.example.
set -euo pipefail
: "${SSH_HOST:?SSH_HOST is required, e.g. root@200.141.0.13}"
REMOTE_DIR="${REMOTE_DIR:-/opt/headliner}"
DOMAIN="${DOMAIN:-headliner.carsonrodrigues.com}"
TAG="$(git rev-parse --short HEAD)$(git diff --quiet || echo -dirty)"

# One multiplexed SSH connection for the whole deploy. The server rate-limits bursts of new SSH connections,
# and a deploy used to open about eight; a refused connection then looked like a missing stack.
CTL="/tmp/hl-%C"  # short: macOS caps Unix socket paths near 104 characters
SSH_OPTS=(-o ControlMaster=auto -o "ControlPath=$CTL" -o ControlPersist=120 -o ConnectTimeout=20)
rsh() { ssh "${SSH_OPTS[@]}" "$SSH_HOST" "$@"; }
for attempt in 1 2 3 4 5 6; do
  rsh true 2>/dev/null && break
  [ "$attempt" = 6 ] && { echo "Cannot reach $SSH_HOST over SSH." >&2; exit 1; }
  echo "SSH not accepting connections yet; retrying in 20s"
  sleep 20
done
IMAGE="headliner-app:$TAG"

rsh "test -f $REMOTE_DIR/.env" || {
  echo "No .env on the server at $REMOTE_DIR/.env. Fill it from .env.example first." >&2
  exit 1
}
rsh "docker network inspect headliner_default >/dev/null 2>&1" || {
  echo "The headliner Supabase stack (network headliner_default) does not exist yet." >&2
  exit 1
}

ARCH="$(rsh uname -m)"
case "$ARCH" in
  x86_64) PLATFORM=linux/amd64 ;;
  aarch64 | arm64) PLATFORM=linux/arm64 ;;
  *) echo "Unknown server architecture: $ARCH" >&2; exit 1 ;;
esac

echo "Building $IMAGE for $PLATFORM on this machine"
docker buildx build --platform "$PLATFORM" -t "$IMAGE" -t headliner-app:latest --load .

echo "Shipping the image ($(docker image inspect "$IMAGE" --format '{{.Size}}' | awk '{printf "%.0f MB", $1/1e6}'))"
docker save "$IMAGE" headliner-app:latest | gzip -1 | rsh "gunzip | docker load"

echo "Syncing compose and Caddy files"
rsh "mkdir -p $REMOTE_DIR/deploy"
rsync -az -e "ssh ${SSH_OPTS[*]}" deploy/ "$SSH_HOST:$REMOTE_DIR/deploy/"

echo "Restarting the app container"
rsh "cd $REMOTE_DIR && HEADLINER_IMAGE=$IMAGE docker compose -f deploy/compose.yml up -d --no-build --remove-orphans"

echo "Post-check"
for i in 1 2 3 4 5 6; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "https://$DOMAIN/robots.txt" || true)"
  [ "$code" = "200" ] && break
  sleep 5
done
echo "https://$DOMAIN/robots.txt -> $code"
rsh "free -m | sed -n 1,2p; docker image prune -f --filter 'until=72h' >/dev/null"
