# Shorty — Agent-oriented project guide

This file describes the repository layout, conventions, and workflows so LLM agents and humans can work in it accurately and efficiently.

## What this repo is

- **Shorty** is a self-hosted stack: **Kutt** (URL shortener) + **QR Designer** (qr-api + qr-web).
- **Kutt**: short links at `mifi.me`, admin at `link.mifi.me` (Postgres + Redis).
- **QR Designer**: Next.js app at `qr.mifi.dev` (BasicAuth); backend **qr-api** (Express, SQLite, uploads, shorten proxy to Kutt). qr-api is internal-only (backend network).

## Repo layout (monorepo, pnpm workspace)

```
shorty/
├── package.json              # Root: scripts lint, format, format:check, test, build (all delegate to workspaces)
├── pnpm-workspace.yaml       # packages: qr-api, qr-web
├── docker-compose.yml       # Full stack with build (Kutt + qr-api + qr-web from Dockerfiles)
├── docker-compose.portainer.yml  # Same stack using registry images; for Portainer + webhook redeploy
├── .woodpecker/
│   ├── ci.yml               # CI: install → format → lint → test → build
│   └── deploy.yml           # Deploy: buildx qr-api + qr-web (multi-arch), push, Portainer webhook
├── qr-api/                  # Express API (TS), SQLite, multer uploads, Kutt proxy
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── src/
│   └── package.json
└── qr-web/                  # Next.js 15 (App Router), Mantine, qr-code-styling
    ├── Dockerfile
    ├── .dockerignore
    ├── next.config.ts       # output: 'standalone'
    ├── src/
    └── package.json
```

- **No root Dockerfile.** Images are built from `qr-api/` and `qr-web/` only.
- **Lockfile:** `pnpm-lock.yaml` is committed; CI uses `pnpm install --frozen-lockfile`.

## Key scripts (from repo root)

| Command                 | Effect                                     |
| ----------------------- | ------------------------------------------ |
| `pnpm install`          | Install deps for all workspaces            |
| `pnpm run lint`         | ESLint in qr-api and qr-web                |
| `pnpm run format:check` | Prettier check (no write)                  |
| `pnpm run format`       | Prettier write                             |
| `pnpm run test`         | Vitest in qr-api and qr-web                |
| `pnpm run build`        | Build qr-api (tsc) and qr-web (next build) |

Per-package: `pnpm --filter qr-api dev`, `pnpm --filter qr-web dev` (dev servers).

## Environment and config

- **Root:** `.env.example` documents vars; copy to `.env` for Docker Compose. `.env` is gitignored.
- **Devcontainer:** `.devcontainer/devcontainer.json` sets `DB_PATH`, `UPLOADS_PATH`, `KUTT_API_KEY`, `QR_API_URL` for in-container dev; no `.env` required for qr-api/qr-web dev.
- **Compose:** Kutt needs `DB_PASSWORD`, `JWT_SECRET`; qr-api optionally `KUTT_API_KEY`. Portainer stack can set `REGISTRY`, `IMAGE_TAG` for registry-based compose.

## CI/CD (Woodpecker)

- **CI** (runs on PR, push to main, tag, manual): Node 22, pnpm, then `format:check` → `lint` → `test` → `build`. No Docker in CI.
- **Deploy** (runs on main push/tag/manual after CI): Uses `docker buildx` to build **two** images from `./qr-api` and `./qr-web` with `--platform linux/amd64,linux/arm64`, tags `:latest` and `:${CI_COMMIT_SHA}`, pushes to `git.mifi.dev/mifi-holdings/shorty-qr-api` and `shorty-qr-web`, then POSTs `portainer_webhook_url` to trigger Portainer stack redeploy.
- **Secrets:** `gitea_registry_username`, `gitea_package_token`, `portainer_webhook_url`.

## Portainer (production)

- **Registry-based stack:** Use `docker-compose.portainer.yml`. Images: `${REGISTRY}/mifi-holdings/shorty-qr-api:${IMAGE_TAG}`, same for `shorty-qr-web`. Add stack webhook in Portainer and set that URL as `portainer_webhook_url` in Woodpecker.
- **Build-from-source:** Use `docker-compose.yml`; no registry, no webhook.

## Code style and tooling

- **TypeScript** only (qr-api and qr-web).
- **Prettier:** 4 spaces, single quotes, trailing comma all, semicolons (see `.prettierrc`). Check with `pnpm run format:check`.
- **ESLint:** Root `.eslintrc.cjs` for qr-api; qr-web has its own `.eslintrc.cjs` (Next + Prettier). No TSLint.
- **Ignores:** `.gitignore` (e.g. node_modules, .pnpm-store, .next, dist, .env, \*.tsbuildinfo); `.prettierignore` and ESLint `ignorePatterns` aligned (coverage, build dirs, .pnpm-store). Each app has `.dockerignore` to keep build context small.

## Where to change what

- **API routes (qr-api):** `qr-api/src/routes/`, `qr-api/src/index.ts`.
- **Web app (qr-web):** `qr-web/src/app/` (App Router), `qr-web/src/components/`, `qr-web/src/contexts/`.
- **Shared types:** Defined in each package; no shared package.
- **Compose:** Kutt + qr services in `docker-compose.yml`; registry-only variant in `docker-compose.portainer.yml`.
- **Pipelines:** `.woodpecker/ci.yml`, `.woodpecker/deploy.yml`. Image names and registry are in `deploy.yml` env.

## Testing and building locally

- **Unit tests:** `pnpm run test` (Vitest in both packages).
- **Dev:** `pnpm --filter qr-api dev` and `pnpm --filter qr-web dev` (ports 8080 and 3000); devcontainer forwards them.
- **Full stack (Docker):** `docker compose up -d` (uses `docker-compose.yml`; needs `.env` with `DB_PASSWORD`, `JWT_SECRET`).
- **Multi-arch build (local):** Use `docker buildx build --platform linux/amd64,linux/arm64 -t <repo>:<tag> --push ./qr-api` (and same for `./qr-web`) after logging into the registry.

This layout and these scripts are the source of truth for automation and agent-driven edits.
