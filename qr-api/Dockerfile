# Build stage: use npm (not pnpm) to avoid workspace issues with better-sqlite3.
FROM node:20-bookworm-slim AS builder
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
RUN npm install
# Verify better-sqlite3 was compiled; fail build if not.
RUN test -f node_modules/better-sqlite3/build/Release/better_sqlite3.node || \
    (echo "ERROR: better-sqlite3.node not found after npm install" && exit 1)
COPY . .
RUN npm run build
RUN npm prune --production

# Runtime: copy pre-built node_modules from builder.
FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
EXPOSE 8080
CMD ["node", "dist/index.js"]
