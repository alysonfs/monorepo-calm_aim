# syntax=docker/dockerfile:1

# ---- builder ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/typescript-config/package*.json ./packages/typescript-config/
COPY packages/eslint-config/package*.json ./packages/eslint-config/
COPY packages/core/package*.json ./packages/core/

RUN npm ci --workspace=apps/web --include-workspace-root

COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

WORKDIR /app/apps/web
RUN npm run build

# ---- runner ----
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser && \
    chown -R appuser:appgroup /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
