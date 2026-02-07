# Build stage: TypeScript only (no native deps in this stage).
FROM node:20-bookworm-slim AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install
COPY . .
RUN pnpm run build

# Runtime: install deps here so better-sqlite3 is compiled for this exact image/platform.
FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
# Install build deps needed to compile better-sqlite3; remove after install to keep image small.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod \
    && apt-get purge -y python3 make g++ \
    && apt-get autoremove -y --purge \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/dist ./dist
EXPOSE 8080
CMD ["node", "dist/index.js"]
