# Shorty — URL shortener + QR designer stack

Production-ready, self-hosted stack:

- **Kutt** for link shortening: short links at `https://mifi.me`, admin UI at `https://link.mifi.me`
- **QR Designer** at `https://qr.mifi.dev`: styled QR codes with optional Kutt shortening, logo upload, export (SVG, PNG, PDF). Protected by Traefik BasicAuth.

Designed for Docker/Portainer with Traefik. Uses **pnpm** everywhere; no Tailwind.

## Prerequisites

- **Traefik** with:
  - External network `marina-net` (create with `docker network create marina-net` if needed)
  - Cert resolver (e.g. `letsencrypt` or `lets-encrypt` — adjust labels in `docker-compose.yml` to match your Traefik)
- **DNS**: A records for `mifi.me`, `link.mifi.me`, `qr.mifi.dev` pointing to the host running Traefik
- **Bind mount paths** on the host (create if missing):
  - `/mnt/config/docker/kutt/postgres` — Kutt Postgres data
  - `/mnt/config/docker/kutt/redis` — Kutt Redis data
  - `/mnt/config/docker/qr/db` — qr-api SQLite directory
  - `/mnt/config/docker/qr/uploads` — qr-api uploads (logos)

## Kutt setup

1. Deploy the stack (see below). On first run, open `https://link.mifi.me` and create an admin account.
2. In Kutt admin: **Settings → API** (or **Account → API**), create an API key.
3. Set `KUTT_API_KEY` in the environment for **qr-api** (and optionally for local dev). The QR app uses this to shorten URLs via the backend; qr-api is not exposed publicly.

## Deploy (Portainer)

1. In Portainer: **Stacks → Add stack**.
2. Use the repo root `docker-compose.yml` (clone repo or paste content).
3. Set required env vars (at least):
   - `DB_PASSWORD` — Postgres password for Kutt
   - `JWT_SECRET` — Kutt JWT secret (generate a random string)
   - `KUTT_API_KEY` — Kutt API key for qr-api (after creating it in Kutt UI)
4. Deploy. No ports are exposed; Traefik handles ingress.

## Env vars and .env.example

Copy `.env.example` to `.env` and set values for Docker Compose / production:

- **DB_PASSWORD** (required) — Postgres password for Kutt
- **JWT_SECRET** (required) — Kutt JWT secret (use a long random string)
- **KUTT_API_KEY** (optional) — Kutt API key for qr-api shorten feature (create in Kutt UI first)

For local dev inside the devcontainer, env vars for qr-api (`DB_PATH`, `UPLOADS_PATH`, `KUTT_API_KEY`, `QR_API_URL`) are set in `.devcontainer/devcontainer.json` so you don’t need a `.env` file to run qr-api and qr-web with pnpm.

## Local run (Docker Compose)

From repo root, after copying `.env.example` to `.env` and setting values:

```bash
docker compose up -d
```

For local dev without Traefik, you can add a `ports` override for qr_web (e.g. `3000:3000`) and access the QR app at `http://localhost:3000`. Kutt would need its own ports if you want to test shortening locally.

## Development with Devcontainer

**Yes — run locally inside the devcontainer.** The devcontainer is the intended environment for development and testing.

1. Open the repo in VS Code/Cursor and use **Dev Containers: Reopen in Container** (or Codespaces).
2. `pnpm install` runs automatically. Env vars for qr-api are set in `devcontainer.json` (`DB_PATH`, `UPLOADS_PATH`, `KUTT_API_KEY`, `QR_API_URL`) so you can run qr-api and qr-web without a `.env` file.
3. In the container, start the apps:
   - **qr-api:** `pnpm --filter qr-api dev` (listens on 8080)
   - **qr-web:** `pnpm --filter qr-web dev` (listens on 3000)
4. Open the forwarded ports (3000 = qr-web, 8080 = qr-api). Data and uploads are stored under `.data/` in the repo (gitignored).
5. For full stack (Kutt + qr-api + qr-web in Docker), run `docker compose up` from the **host** (or from inside the container if Docker-in-Docker is enabled). Set `DB_PASSWORD`, `JWT_SECRET`, and optionally `KUTT_API_KEY` in `.env` for that.

Ports 3000 and 8080 are forwarded by the devcontainer.

## Repo structure

- `docker-compose.yml` — Root compose for Portainer (Kutt + qr-api + qr-web, Traefik labels).
- `qr-api/` — Node/TS Express API: SQLite projects, uploads, shorten proxy to Kutt. Not exposed via Traefik.
- `qr-web/` — Next.js (App Router) + Mantine QR designer; proxies all API calls to qr-api server-side.
- `.woodpecker.yml` — CI: lint-and-test on PR/push to main; manual deploy with `depends_on` lint-and-test.
- `.devcontainer/` — Devcontainer for local dev.

## Security

- **qr-api** is only on the `backend` network; only qr-web (and other backend services) can reach it. No Traefik router for qr-api.
- **qr-web** is exposed at `qr.mifi.dev` with Traefik BasicAuth (htpasswd user `mifi`). Set your own password and update the middleware label if needed.
- **Kutt** is public at `mifi.me` and `link.mifi.me`; use Kutt’s own auth (admin account, API keys).

## qr-border-plugin (optional)

The QR designer uses **qr-code-styling** for dots, corners, colors, and error correction. The optional **qr-border-plugin** (from [lefe.dev marketplace](https://lefe.dev/marketplace/qr-border-plugin)) adds border styling but depends on `@lefe-dev/lefe-verify-license`, which may involve licensing/watermark behavior. This stack uses qr-code-styling only by default; you can add qr-border-plugin from npm or GitHub if desired and document any license terms.

## Switching to prebuilt images (CI/CD)

In `.woodpecker.yml`, the deploy pipeline has placeholder steps. To use prebuilt images:

1. Build `qr-api` and `qr-web` in CI (e.g. `docker build -t $REGISTRY/shorty/qr-api:$CI_COMMIT_SHA ./qr-api`).
2. Push to your registry; set `REGISTRY` and `IMAGE_PREFIX` (or equivalent) as secrets.
3. In `docker-compose.yml`, replace `build: context: ./qr-api` with `image: $REGISTRY/shorty/qr-api:$TAG` (use env or a compose override for TAG).

## Code style and tooling

- **TypeScript** everywhere.
- **Prettier:** tabWidth 4, spaces (no tabs), singleQuote, trailingComma all, semi.
- **ESLint** for TS/React/Next in qr-web; shared root config for qr-api.
- **pnpm** only; `pnpm-lock.yaml` is the single lockfile (no package-lock.json or yarn.lock).
- **Tests:** Vitest (qr-api and qr-web).
