#!/usr/bin/env bash
#
# Deploy on the server. Runs as `deploy` — invoked by CI (after it ships the
# source here) or by hand when editing on the box. Provisions the DB (idempotent)
# and builds + brings the app up from the LOCAL source (no registry). Never
# installs anything.
#
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env ] || { echo ".env missing in $(pwd) — create it from .env.example"; exit 1; }
chmod +x scripts/*.sh

./scripts/provision-db.sh
docker compose up -d --build --remove-orphans
docker compose ps
