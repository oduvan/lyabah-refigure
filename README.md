# refigure.lyabah.com

The marketing site for **Refigure**, the desktop app that keeps tutorial
screenshots current. A Go binary with a React + Tailwind single-page app
compiled into it, deployed to the shared server
([`lyabah-shared-server`](https://github.com/oduvan/lyabah-shared-server))
behind the shared Traefik proxy.

- **Landing page** — the ten sections of the design, rebuilt as components.
- **Theme switcher** — light, dark or follow the system, with no flash on load.
- **Two languages** — English at `/`, Ukrainian at `/uk`, each with its own URL.
- **Privacy policy** — `/privacy` and `/uk/privacy`.

One container, no database, no Redis, no mail relay: the site keeps no state.

## Layout

| Path | What it is |
|------|-----------|
| `cmd/server/` | the binary's entry point |
| `internal/config/` | environment configuration, with working defaults |
| `internal/server/` | routing, middleware (gzip, CSP, logging), static serving |
| `web/` | the React app; `web/embed.go` compiles `web/dist` into the binary |
| `web/src/i18n/` | `en.ts` is the reference dictionary, `uk.ts` is typed against it |
| `Dockerfile` | three stages: build the site, build the binary, ship ~20 MB |
| `docker-compose.yml` | one service on the shared network, Traefik labels, no host ports |
| `scripts/` | server-side provision + deploy (unchanged from the template, bar one note below) |

## Running it locally

The frontend and the backend can be run together or separately.

```bash
# Everything in one process, exactly as it is deployed:
npm --prefix web ci
npm --prefix web run build      # writes web/dist, which the binary embeds
go run ./cmd/server             # http://localhost:8080

# Or, while working on the frontend — Vite with hot reload, proxying /api:
go run ./cmd/server &           # serves the API on :8080
npm --prefix web run dev        # http://localhost:5173
```

`REFIGURE_STATIC_DIR=web/dist go run ./cmd/server` serves the site from disk
instead of the embedded copy, so a rebuild of the frontend shows up without
recompiling Go.

### Checks

```bash
go test ./...                   # server behaviour: routing, headers, the API
go vet ./...
npm --prefix web run build      # type-checks (tsc -b) and builds
```

## Configuration

Everything has a default, so the binary runs with no configuration at all and
the deploy needs no `.env`. To override something in production, place one
beside `docker-compose.yml` on the server — see `.env.example`.

| Variable | Default | What it does |
|----------|---------|--------------|
| `PORT` | `8080` | listen port (the compose healthcheck and Traefik label both assume 8080) |
| `REFIGURE_ADDR` | `:8080` | full listen address, if a port alone is not enough |
| `REFIGURE_VERSION` | `1.0.0` | version shown next to the download buttons |
| `REFIGURE_{MAC,WINDOWS,LINUX}_URL` | the v1.0.0 links | where each download button points |
| `REFIGURE_{MAC,WINDOWS,LINUX}_SIZE` | `94 MB`, ``, `108 MB` | size shown under each button; may be empty |
| `REFIGURE_CANONICAL_HOST` | *(unset)* | when set, every other hostname is 301'd here |
| `REFIGURE_STATIC_DIR` | *(unset)* | serve the site from this directory instead of the embedded build |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn` or `error` |

**Shipping a new desktop release** is an `.env` edit and `./scripts/deploy.sh`
on the server — the version and links are read at startup, so the site itself
does not need rebuilding.

## HTTP surface

| Route | Response |
|-------|----------|
| `/`, `/uk`, `/privacy`, `/uk/privacy` | the app shell, `200` |
| any other path with no matching file | the app shell, `404` — so the client draws its "not found" page and crawlers are told the truth |
| `/assets/*` | fingerprinted bundles, `immutable` for a year |
| `/favicon.svg`, `/robots.txt`, `/sitemap.xml`, `/site.webmanifest`, icons | one hour |
| `/health` | `healthy`, `no-store` — what the container healthcheck polls |
| `/api/v1/releases` | `{"version":…,"downloads":[…]}`, cached five minutes |

Responses carry a CSP whose `script-src` is `'self'` plus a **hash of the inline
theme script**, computed from `index.html` at startup — so the no-flash boot
script needs no `'unsafe-inline'` and nothing has to be kept in sync by hand.
Text responses are gzipped in-process; fonts and images are left alone.

## How the two languages work

The URL is the source of truth: `/privacy` is English, `/uk/privacy` is
Ukrainian, and the switcher in the header is a pair of links, so a language is
shareable and indexable. Each page emits its own `<title>`, description,
`<html lang>`, canonical link and `hreflang` alternates.

A visitor who lands on an **unprefixed** URL without having chosen a language
before is sent to the language their browser asks for. A prefixed URL is an
explicit request and is never redirected, and neither is anyone who has used
the switcher (the choice is remembered in `localStorage`).

`web/src/i18n/en.ts` is the reference dictionary and exports the `Dictionary`
type; `uk.ts` is declared as that type, so a missing or misspelt key fails
`npm run build` rather than showing up as a blank on the page.

Copy that needs emphasis, inline code or a link is written as
`**bold**`, `` `code` `` and `[label](href)` and rendered by
`web/src/components/Rich.tsx` — no markdown dependency, and the translations
stay readable as plain strings.

## How the theme works

Three states — light, dark, system — kept in `localStorage` under
`refigure:theme`. An inline script in `index.html` applies the class before
first paint, so a dark-theme visitor never sees a white flash; it is the only
inline script on the page and the CSP hashes it.

Colours are semantic custom properties (`--c-bg`, `--c-ink`, `--c-accent` …)
defined once for light and once for `.dark`, and exposed to Tailwind through
`@theme inline`. Components name roles, never hex values, which is why the mock
application screenshots on the landing page flip with the rest of the site.

## Deploying

Push to `master`; CI ships the source to the server over ssh and runs
`scripts/deploy.sh`, which builds the image there and brings the service up. The
job then waits for the container's healthcheck, so a red run means the service
is actually down rather than merely un-deployed.

**Server setup:** none. CI creates the service directory itself, and
`docker-compose.yml` defaults every value, so there is no `.env` to place by
hand — see `.env.example` for the overrides one can carry if you ever want it.

The only prerequisite outside this repo is DNS: `refigure.lyabah.com` must
resolve to `172.238.109.66` before the first deploy, so ACME can issue the
certificate.

**GitHub setup** — one secret, under Settings → Secrets and variables → Actions
→ **Secrets**:

| Name | Value |
|------|-------|
| `SSH_PRIVATE_KEY` | the shared CI private key |

The connection details are not secret — they are this server's, and they are in
the table above — so the workflow defaults them:
`SSH_HOST=172.238.109.66`, `SSH_USER=deploy`, `SSH_PORT=22`,
`APP_DIR=/home/deploy/services/refigure`. Setting an Actions **variable** of the
same name overrides the default, which is how you would point a fork at another
box; nothing needs setting for the normal case.

### The one change to the template's scripts

`scripts/deploy.sh` runs `provision-db.sh` **only when `.env` sets `DB_NAME`**.
This service has no database, so its `.env` carries no Postgres admin
credentials; set `DB_NAME`, `DB_ROLE`, `DB_PASSWORD` and `PG_ADMIN_*` there and
provisioning resumes with no further edits.

### The shared-server contract, unchanged

`shared` is declared `external`, no host ports are published,
`traefik.enable=true`, and the app listens on `8080` — matching both the compose
healthcheck and the Traefik service label.
