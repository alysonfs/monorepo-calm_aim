# syntax=docker/dockerfile:1

# ---- builder ----
# hadolint ignore=DL3007
FROM node:22-alpine AS builder
WORKDIR /app

# Copia manifests para aproveitar cache de camadas
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/typescript-config/package*.json ./packages/typescript-config/
COPY packages/eslint-config/package*.json ./packages/eslint-config/
COPY packages/core/package*.json ./packages/core/

RUN npm ci --workspace=apps/api --include-workspace-root

# Copia fontes
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

WORKDIR /app/apps/api
RUN npm run build

# Remove devDependencies antes de copiar para o runner
WORKDIR /app
RUN npm prune --omit=dev

# ---- runner ----
FROM gcr.io/distroless/nodejs22-debian12 AS runner
WORKDIR /app

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

USER nonroot:nonroot

EXPOSE 3001
ENTRYPOINT ["/nodejs/bin/node", "dist/index.js"]
