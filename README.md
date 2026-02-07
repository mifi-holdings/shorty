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

**Option A — Registry + webhook (recommended for CI/CD)**  
Use prebuilt images and redeploy on push via webhook:

1. In Portainer: **Stacks → Add stack**. Use **docker-compose.portainer.yml** (paste or pull from repo).
2. Set env vars:
   - **Required:** `DB_PASSWORD`, `JWT_SECRET`
   - **Optional:** `REGISTRY` (default `git.mifi.dev`), `IMAGE_TAG` (default `latest`), `KUTT_API_KEY`
3. Deploy. Then in the stack: **Webhooks** → add webhook. Copy the URL and add it as secret `portainer_webhook_url` in Woodpecker (repo secrets). On each push to `main`, the pipeline builds multi-arch images, pushes to the registry, and triggers this webhook to redeploy the stack.

**Option B — Build from source**  
For one-off or local deploys without CI:

1. In Portainer: **Stacks → Add stack**. Use **docker-compose.yml** (builds qr-api and qr-web from Dockerfiles).
2. Set required env vars: `DB_PASSWORD`, `JWT_SECRET`, and optionally `KUTT_API_KEY`.
3. Deploy. No ports are exposed; Traefik handles ingress.

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

- `docker-compose.yml` — Compose that builds qr-api and qr-web from source (local or one-off Portainer).
- `docker-compose.portainer.yml` — Compose that uses registry images; for Portainer + CI/CD webhook redeploys.
- `qr-api/` — Node/TS Express API: SQLite projects, uploads, shorten proxy to Kutt. Not exposed via Traefik.
- `qr-web/` — Next.js (App Router) + Mantine QR designer; proxies all API calls to qr-api server-side.
- `.woodpecker/ci.yml` — CI: install, format check, lint, test, build on PR/push/tag.
- `.woodpecker/deploy.yml` — Deploy: build qr-api and qr-web (multi-arch amd64/arm64), push to registry, trigger Portainer webhook. Runs on push/tag to `main` after CI.
- `.devcontainer/` — Devcontainer for local dev.

## Security

- **qr-api** is only on the `backend` network; only qr-web (and other backend services) can reach it. No Traefik router for qr-api.
- **qr-web** is exposed at `qr.mifi.dev` with Traefik BasicAuth (htpasswd user `mifi`). Set your own password and update the middleware label if needed.
- **Kutt** is public at `mifi.me` and `link.mifi.me`; use Kutt’s own auth (admin account, API keys).

## qr-border-plugin (optional)

The QR designer uses **qr-code-styling** for dots, corners, colors, and error correction. The optional **qr-border-plugin** (from [lefe.dev marketplace](https://lefe.dev/marketplace/qr-border-plugin)) adds border styling but depends on `@lefe-dev/lefe-verify-license`, which may involve licensing/watermark behavior. This stack uses qr-code-styling only by default; you can add qr-border-plugin from npm or GitHub if desired and document any license terms.

## CI/CD (Woodpecker)

- **CI** (`.woodpecker/ci.yml`): on every PR/push to `main`/tag — `pnpm install --frozen-lockfile`, format check, lint, test, build. Requires `pnpm-lock.yaml` committed.
- **Deploy** (`.woodpecker/deploy.yml`): on push/tag to `main` after CI — builds `shorty-qr-api` and `shorty-qr-web` as multi-arch (linux/amd64, linux/arm64), pushes to `git.mifi.dev/mifi-holdings/shorty-qr-api` and `shorty-qr-web`, then POSTs the Portainer webhook to redeploy the stack.

**Secrets** (repo or org): `gitea_registry_username`, `gitea_package_token`, `portainer_webhook_url`.

**Local build/push test (before committing):**  
From repo root: build with buildx and push to your registry, or run `docker compose -f docker-compose.yml build` to verify builds.

## Code style and tooling

- **TypeScript** everywhere.
- **Prettier:** tabWidth 4, spaces (no tabs), singleQuote, trailingComma all, semi.
- **ESLint** for TS/React/Next in qr-web; shared root config for qr-api.
- **pnpm** only; `pnpm-lock.yaml` is committed and is the single lockfile (no package-lock.json or yarn.lock).
- **Tests:** Vitest (qr-api and qr-web).
