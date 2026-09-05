#!/usr/bin/env bash
#
# Deploy on the server. Runs as `deploy` — invoked by CI (after it ships the
# source here) or by hand when editing on the box. Builds and brings the app up
# from the LOCAL source (no registry). Never installs anything.
#
# This service keeps no state, so it owns no database. Provisioning runs only
# when `.env` sets DB_NAME, which keeps the shared Postgres admin credentials
# out of an .env that has no use for them.
#
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env ] || { echo ".env missing in $(pwd) — create it from .env.example"; exit 1; }
chmod +x scripts/*.sh

DB_NAME="$(sed -n 's/^[[:space:]]*DB_NAME[[:space:]]*=[[:space:]]*//p' .env | tail -n1)"
if [ -n "${DB_NAME}" ]; then
  ./scripts/provision-db.sh
else
  echo "No DB_NAME in .env — skipping database provisioning (this service has no database)."
fi

docker compose up -d --build --remove-orphans
docker compose ps
