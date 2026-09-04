#!/usr/bin/env bash
#
# Idempotently create this service's OWN Postgres database + least-privilege role
# on the SHARED Postgres, using the shared admin creds. Safe to run every deploy.
# Runs psql in a one-shot postgres:18 container so the app image needs no client.
#
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a   # PG_ADMIN_*, DB_*, SHARED_NETWORK

docker run --rm -i --network "${SHARED_NETWORK:-shared}" \
  -e PGPASSWORD="$PG_ADMIN_PASSWORD" postgres:18 \
  psql -v ON_ERROR_STOP=1 -h postgres -U "$PG_ADMIN_USER" -d postgres <<SQL
DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='${DB_ROLE}') THEN
    CREATE ROLE ${DB_ROLE} LOGIN PASSWORD '${DB_PASSWORD}';
  END IF;
END \$\$;
SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_ROLE}'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname='${DB_NAME}')\gexec
REVOKE ALL ON DATABASE ${DB_NAME} FROM PUBLIC;
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_ROLE};
SQL
echo "OK: database '${DB_NAME}' owned by least-privilege role '${DB_ROLE}'."
