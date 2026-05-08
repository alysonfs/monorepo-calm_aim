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
# Lembrar que nosso docker server é o Colima
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

## Como Testar

Guia passo a passo para subir tudo e ver funcionando (infra, seed, web, API):
[docs/wiki/como-testar.md](docs/wiki/como-testar.md)

## Testes

```bash
# Unitários
npx turbo run test

# Integração (requer MongoMemoryServer)
npx turbo run test:integration --filter=@calm-aim/api
```

> Documentação completa: [docs/wiki/testes.md](docs/wiki/testes.md)

## Versões e Compatibilidade

Versões exatas de todas as dependências, imagens Docker, binários e matriz de suporte por plataforma:
[docs/wiki/versoes-e-compatibilidade.md](docs/wiki/versoes-e-compatibilidade.md)

## Banco de Dados

Connection strings, collections e como inspecionar MongoDB, Redis e Cassandra:
[docs/wiki/banco-de-dados.md](docs/wiki/banco-de-dados.md)

## Docker

Referência de comandos Docker e Docker Compose (Colima, rebuild, logs, limpeza):
[docs/wiki/docker.md](docs/wiki/docker.md)

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
