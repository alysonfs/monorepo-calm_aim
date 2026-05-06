# syntax=docker/dockerfile:1

# ---- builder ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copia manifests para aproveitar cache de camadas
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/typescript-config/package*.json ./packages/typescript-config/
COPY packages/eslint-config/package*.json ./packages/eslint-config/
COPY packages/types/package*.json ./packages/types/

RUN npm ci --workspace=apps/api --include-workspace-root

# Copia fontes
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

WORKDIR /app/apps/api
RUN npm run build

# ---- runner ----
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodejs

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package*.json ./

RUN npm ci --omit=dev

USER nodejs

EXPOSE 3001
CMD ["node", "dist/index.js"]
