# lyabah-template

A starter for a web service that runs on the shared server
([`lyabah-shared-server`](https://github.com/oduvan/lyabah-shared-server)). It
attaches to the shared Traefik proxy (HTTPS via Let's Encrypt), the shared
Postgres, the shared Redis/Valkey, and the shared outbound mail relay — and runs
none of those itself.

> **This is a GitHub _template repository_.** Click **“Use this template” →
> Create a new repository**, name it after your service, and you get your own repo
> with these files. There is **nothing to stamp or find-and-replace** in the
> configuration: every per-service value lives in `.env` on the server, and the
> compose file reads it from there at deploy time. What you *do* edit is your own
> app — see [What to change in your new repo](#what-to-change-in-your-new-repo).
>
> The bundled `Dockerfile` is a placeholder app that listens on **8080** and serves
> `/health`, so you can verify the pipeline before writing real code.

## Create a service — step by step

1. **Use this template** → create your new repo (e.g. `oduvan/blog`).
2. **Add the GitHub Actions credentials** to the new repo
   (Settings → Secrets and variables → Actions) — see [GitHub setup](#github-setup).
3. **On the server**, create the service dir and its `.env` (holds secrets, so by
   hand) — see [One-time server setup](#one-time-server-setup-as-the-deploy-user--no-root).
4. **Point DNS**: an A record for your `SERVICE_HOST` → the server, so ACME can
   issue the cert.
5. **Push to `master`** (or run the workflow manually). First deploy provisions the
   DB, builds the image on the server, brings the app up, and Traefik issues the cert.

No copying, no generator script — `.env` is the single place you configure a service.

## What to change in your new repo

None of the shared-server wiring needs editing — the per-service values live in `.env`
on the server. These files are yours:

| File | Change it? |
|------|-----------|
| `Dockerfile` | **Yes, required.** It is a placeholder nginx app. Replace it with your real build. |
| `README.md` | **Yes.** It still describes the template — write your service's own. |
| `docker-compose.yml` | Only if the app needs more: extra env vars, volumes, an extra container, or the www→apex redirect (commented at the bottom of the file). |
| `.env.example` | Only if you added env vars — keep it in sync so the server-side `.env` stays documented. |
| `.github/workflows/deploy.yml` | Normally nothing — but see the branch note below. |
| `scripts/*.sh` | Normally nothing. |

**Never change** (this is the [integration contract](#integration-contract-the-shared-server--do-not-change)):
`shared` declared `external`, no published host ports, `traefik.enable=true`, the app
on port `8080`, and connecting as `DB_ROLE` rather than `provisioner`.

Three edits that touch more than one file — miss a place and the deploy silently
does the wrong thing:

- **Branch.** The workflow runs on `push` to **`master`**. If your new repo's default
  branch is `main`, either rename it to `master` or change the `branches:` line in
  `.github/workflows/deploy.yml` — otherwise nothing ever deploys.
- **A different app port.** Change it in **three** places together: what the app
  listens on (`Dockerfile`), the compose `healthcheck`, and the
  `traefik.http.services.…loadbalancer.server.port` label. Staying on `8080` is easier.
- **A new env var for the app.** Add it in **two** places: the `environment:` block of
  `docker-compose.yml` (compose does not pass the whole `.env` into the container — on
  purpose, so the Postgres admin creds stay out of it) and the `.env` on the server.
  Add it to `.env.example` too.

Tip: deploy once **before** replacing the `Dockerfile`. The placeholder answers on
`/health`, so a green deploy proves DNS, the cert, Traefik, and the DB provisioning all
work — then you only have your own app left to debug.

## Integration contract (the shared server — do not change)

| Thing | Value |
|------|-------|
| Server IP | `172.238.109.66` |
| Deploy SSH user | `deploy` (unprivileged, in the `docker` group) |
| Shared external network | `shared` (declared `external`; the infra owns it) |
| Postgres | host `postgres`, port `5432`, admin user `provisioner`, admin db `postgres` |
| Redis/Valkey | host `redis`, port `6379` (use `redis://` URLs) |
| Mail/SMTP | host `mail`, port `587`, **no auth** (send-only); injected as `SMTP_URL`/`SMTP_HOST`/`SMTP_PORT`/`SMTP_FROM` |
| Traefik | HTTPS entrypoint `websecure`, cert resolver `letsencrypt`, `exposedbydefault=false` |

**Isolation:** this service owns its own Postgres database + least-privilege role
(name from `DB_NAME`/`DB_ROLE` in `.env`, created by `scripts/provision-db.sh` with
the shared admin creds, once, idempotently) and its own Redis logical DB (the number
in `REDIS_URL`).

## What's here

| File | Purpose |
|------|---------|
| `Dockerfile` | builds the app image (placeholder — replace) |
| `docker-compose.yml` | the app; attaches to `shared`, Traefik labels, no host ports. Reads all per-service values from `.env` (`SERVICE_NAME`, `SERVICE_HOST`, …) |
| `.env.example` | documents the server-side `.env` (placed by hand, mode 600) — the one place per-service values are set |
| `scripts/provision-db.sh` | create this service's DB + scoped role (idempotent) |
| `scripts/deploy.sh` | provision + build from local source + up (no registry) |
| `.github/workflows/deploy.yml` | ship source to the server (tar/ssh) + run `deploy.sh`, on push to `master` |

## GitHub setup

Add these to the new repo under **Settings → Secrets and variables → Actions**. They
are the same for every service (the CI key's public half is already authorized on the
`deploy` user); only `APP_DIR` is per-service.

**Actions variables** (→ Variables tab):

| Variable | Value |
|----------|-------|
| `SSH_HOST` | `172.238.109.66` |
| `SSH_USER` | `deploy` |
| `SSH_PORT` | `22` |
| `APP_DIR`  | `/home/deploy/services/<your-service-name>` |

**Actions secret** (→ Secrets tab): `SSH_PRIVATE_KEY` — the shared CI private key.

No registry is used: CI ships the source to the server and the image is built there,
so there is no GHCR package to configure.

## One-time server setup (as the `deploy` user — no root)

```bash
ssh deploy@172.238.109.66 'mkdir -p /home/deploy/services/<your-service-name>'
# Create .env from .env.example and fill it in: SERVICE_NAME, SERVICE_HOST, the DB
# password, the shared Postgres admin password, the shared Redis password, and a
# unique Redis DB number. It is never committed or generated — copy it up by hand:
scp .env deploy@172.238.109.66:/home/deploy/services/<your-service-name>/.env
# DNS: point SERVICE_HOST's A record → 172.238.109.66 (so ACME can issue the cert)
```

## Deploying

- **Normal:** push to `master` → CI ships the source and runs `deploy.sh` (which
  builds + brings up).
- **Editing on the server:** `ssh deploy@…`, `cd /home/deploy/services/<your-service-name>`,
  edit, then `./scripts/deploy.sh` (rebuilds from local source). Commit & push when
  done so the repo and the server stay in sync.

## Sending mail

Connect to `mail:587` with **no auth and no TLS** — the relay is internal to the
`shared` network, and it handles TLS and authentication on the way out to SES.

**Always set `Date` and `Message-ID` yourself.** A message without them is accepted
by the relay and by SES, delivered onward — and then silently discarded by Gmail as
spam, with no bounce and nothing in any log. Many SMTP libraries (Python's
`smtplib` included) do *not* add these headers for you. A well-formed `From` display
name and a real body help too.

```python
import smtplib, email.utils, os
from email.message import EmailMessage

m = EmailMessage()
m["From"]       = f"My Service <{os.environ['SMTP_FROM']}>"
m["To"]         = "someone@example.com"
m["Subject"]    = "Hello"
m["Date"]       = email.utils.formatdate(localtime=True)      # required
m["Message-ID"] = email.utils.make_msgid(domain="lyabah.com") # required
m.set_content("Body text.")

with smtplib.SMTP(os.environ["SMTP_HOST"], int(os.environ["SMTP_PORT"])) as s:
    s.send_message(m)
```

Most frameworks (Django, Rails, Nodemailer…) add both headers automatically — this
mainly bites hand-rolled `smtplib`/`net/smtp` code. To check, look for
`message-id=<...>` rather than `message-id=<>` in `docker logs shared-infra-mail-1`.

## Rules that keep integration smooth

1. Attach to `shared` as `external` — never create it here.
2. No published host ports — Traefik is the only ingress.
3. `traefik.enable=true` is mandatory (`exposedbydefault=false`).
4. The app listens on `8080` (matches the compose healthcheck + Traefik label).
5. DNS for `SERVICE_HOST` must resolve to the server before deploy (ACME).
6. Keep the `REDIS_URL` logical DB number unique across services.
7. The app uses role `DB_ROLE`, never `provisioner`.
8. Pin client images to the shared majors (`postgres:18`).
9. Send mail via `mail:587` (no auth); set a real `SMTP_FROM` under a domain
   listed in the infra's `MAIL_SENDER_DOMAINS`, and always set `Date` +
   `Message-ID` — see [Sending mail](#sending-mail).
