# syntax=docker/dockerfile:1.7
# One Dockerfile, three targets:  docker build --target api|worker|web .
# Build context is the monorepo root (see .dockerignore).

ARG NODE_VERSION=22

# ---------- base ----------
FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=true
RUN corepack enable
WORKDIR /repo

# ---------- deps: download packages using only the lockfile (best layer caching) ----------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm fetch --frozen-lockfile

# ---------- build ----------
FROM deps AS build
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --offline
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN pnpm build:packages \
 && pnpm --filter @app/api prisma:generate \
 && pnpm --filter @app/api --filter @app/worker --filter @app/web build
# `pnpm deploy` = isolated production node_modules per app (no dev deps, no workspace symlinks).
# --legacy: workspace packages stay symlinked in dev (no injectWorkspacePackages needed).
# The app's package.json "files" field decides what is copied (dist is gitignored otherwise).
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm deploy --legacy --filter @app/api --prod /out/api \
 && pnpm deploy --legacy --filter @app/worker --prod /out/worker \
 && cd /out/api && ./node_modules/.bin/prisma generate --schema prisma/schema.prisma

# ---------- api ----------
FROM node:${NODE_VERSION}-bookworm-slim AS api
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /out/api ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.API_PORT||3000)+'/api/v1/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Migrations run as a separate release step with the same image (see docker-compose.prod.yml).
CMD ["node", "dist/main.js"]

# ---------- worker ----------
FROM node:${NODE_VERSION}-bookworm-slim AS worker
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=node:node /out/worker ./
USER node
CMD ["node", "dist/main.js"]

# ---------- web: static SPA served by unprivileged nginx (port 8080) ----------
FROM nginxinc/nginx-unprivileged:1.31-alpine AS web
COPY infra/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
