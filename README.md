# Calm Aim

Aim trainer web adaptativo com suporte ao DualSense — treina foco, precisão e controle emocional.

## Pré-requisitos

- Node 20+
- npm 10+
- Docker
- Docker Compose

## Setup

```bash
npm install
```

## Infraestrutura (MongoDB + Cassandra + Redis)

```bash
docker compose up -d
```

> O serviço `collector` não é gerenciado pelo Compose — rode-o separadamente (veja abaixo).

## Collector (local)

```bash
cd apps/collector && npm run dev
```

## Dev (sem Docker)

```bash
npm run dev
```

O Turborepo executa `web`, `api` e `collector` em paralelo.

## Build

```bash
npm run build
```

## Lint e Typecheck

```bash
npm run lint && npm run typecheck
```

## Estrutura

```
apps/
├── web/        # React + Vite + Three.js
├── api/        # Node.js + Express
└── collector/  # WebSocket server (eventos DualSense)

packages/
├── typescript-config/  # tsconfigs base compartilhados
├── eslint-config/      # ESLint + Prettier compartilhado
└── types/              # Contratos TypeScript compartilhados
```
