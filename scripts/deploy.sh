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
# CI passes its secrets on stdin with --secrets-from-stdin, one per line, so
# they never appear on a command line. Today there is one line: LYABAH_KEY.
# Add any new secret as a new line at the end.
#
set -euo pipefail
cd "$(dirname "$0")/.."

if [ "${1:-}" = "--secrets-from-stdin" ]; then
  IFS= read -r stdin_lyabah_key || true
  [ -n "${stdin_lyabah_key:-}" ] && export LYABAH_KEY="$stdin_lyabah_key"
  exec 0</dev/null
fi

chmod +x scripts/*.sh

# ─── The API key ─────────────────────────────────────────────────────────────
# LYABAH_KEY is the bearer key of every protected API call to this service:
# the one key shared by all the lyabah services, which lyabah-service sends
# when it calls this one. It comes from the LYABAH_KEY repository secret
# (lyabah-service's share-lyabah-key workflow sets it), then from the .env
# already on the box, so a deploy by hand keeps it. Without it the protected
# endpoints answer 503: nothing is open by accident.
#
# Only the LYABAH_KEY line of .env is touched. Every other line in it is a
# hand-made override and stays exactly as it is.
env_key=""
if [ -f .env ]; then
  env_key="$(sed -n 's/^LYABAH_KEY=//p' .env | tail -n1)"
fi
LYABAH_KEY="${LYABAH_KEY:-$env_key}"
case ${LYABAH_KEY} in
  '') echo "  LYABAH_KEY is not set: the protected API answers 503 until the repository secret exists" ;;
  *[!A-Za-z0-9._~+/=:-]*) echo "LYABAH_KEY has characters that would need escaping in .env" >&2; exit 1 ;;
  *)
    if [ "${LYABAH_KEY}" != "${env_key}" ]; then
      echo "Writing LYABAH_KEY to .env"
      ( umask 077
        { if [ -f .env ]; then grep -v '^LYABAH_KEY=' .env || true; fi
          printf 'LYABAH_KEY=%s\n' "${LYABAH_KEY}"
        } > .env.new )
      mv .env.new .env
    fi
    ;;
esac
export LYABAH_KEY

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
