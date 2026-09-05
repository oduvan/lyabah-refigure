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

chmod +x scripts/*.sh

# `.env` is optional: docker-compose.yml defaults every value this service
# needs. One is only required to override something — a download link, the
# hostname, or to give the service a database.
if [ -f .env ]; then
  DB_NAME="$(sed -n 's/^[[:space:]]*DB_NAME[[:space:]]*=[[:space:]]*//p' .env | tail -n1)"
else
  echo "No .env in $(pwd) — using the defaults in docker-compose.yml."
  DB_NAME=""
fi
if [ -n "${DB_NAME}" ]; then
  ./scripts/provision-db.sh
else
  echo "No DB_NAME in .env — skipping database provisioning (this service has no database)."
fi

docker compose up -d --build --remove-orphans
docker compose ps
