#!/usr/bin/env bash
# One-command deploy of the Finwise backend to a VPS over SSH.
#
#   SSH_HOST=root@84.247.139.75 ./deploy/deploy.sh
#
# Optional:
#   REMOTE_DIR=/opt/finwise   (default)
#
# Requires: ssh + rsync locally; the remote .env must already exist (the script
# refuses to start without it, so secrets are never sent from this machine).
set -euo pipefail

SSH_HOST="${SSH_HOST:?Set SSH_HOST, e.g. SSH_HOST=root@84.247.139.75}"
REMOTE_DIR="${REMOTE_DIR:-/opt/finwise}"
# On a shared server behind an existing reverse proxy, set:
#   COMPOSE_FILE=docker-compose.behind-proxy.yml
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> [1/5] Ensuring Docker is installed on $SSH_HOST"
ssh "$SSH_HOST" 'command -v docker >/dev/null 2>&1 || (curl -fsSL https://get.docker.com | sh)'

echo "==> [2/5] Syncing backend to $SSH_HOST:$REMOTE_DIR"
ssh "$SSH_HOST" "mkdir -p $REMOTE_DIR"
rsync -az --delete \
  --exclude node_modules --exclude dist --exclude .git --exclude .env \
  "$HERE/" "$SSH_HOST:$REMOTE_DIR/"

echo "==> [3/5] Verifying remote .env exists"
ssh "$SSH_HOST" "test -f $REMOTE_DIR/.env" || {
  echo "ERROR: $REMOTE_DIR/.env is missing on the server."
  echo "       Copy .env.example to .env there and fill MONGO_URI + JWT_SECRET + SITE_ADDRESS."
  exit 1
}

echo "==> [4/5] Building and starting containers ($COMPOSE_FILE)"
ssh "$SSH_HOST" "cd $REMOTE_DIR && docker compose -f $COMPOSE_FILE up -d --build"

echo "==> [5/5] Status"
ssh "$SSH_HOST" "cd $REMOTE_DIR && docker compose -f $COMPOSE_FILE ps"
echo "Done. Health: curl http://$(echo "$SSH_HOST" | sed 's/.*@//')/health"
