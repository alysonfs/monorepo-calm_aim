# Changelog

Todas as mudanças notáveis deste projeto serão documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [Unreleased]

---

## [0.2.0] - 2026-05-08

> M1 concluído: usuário consegue criar conta, fazer login e ter sessões de
> treino registradas no MongoDB via frontend. Inclui CORS, roteamento SPA
> correto no nginx, suite de testes de integração e @calm-aim/core unificado.

### Added
- `GET /sessions` — lista sessões do usuário autenticado, ordenadas por data.
- Use case `listSessoes` e método `findByUserId` no `SessaoMongoRepo`.
- Suite de testes de integração com `mongodb-memory-server` (19 testes, ≥80% de cobertura).
- 2 testes unitários para `listSessoes`.
- `packages/core` — substitui `packages/types`; contém tipos de domínio e contratos HTTP.
- CORS middleware na API com `ALLOWED_ORIGIN` configurável via variável de ambiente.
- Dashboard carrega a lista de sessões do usuário via `GET /sessions` ao montar.
- `apps/web/nginx.conf` com `try_files` para roteamento SPA (corrige 404 em `/login`).
- Scripts `test:integration` e `test:coverage` no `package.json` da API.
- `jest.config.integration.ts` com threshold de cobertura de 80%.
- `tsconfig.build.json` separado para excluir testes do build de produção.
- Pre-push hook no Husky (lint + test obrigatórios antes do push).
- Novos documentos em `docs/wiki/`: `banco-de-dados.md`, `como-testar.md`, `docker.md`, `testes.md`, `versoes-e-compatibilidade.md`.

### Fixed
- Campo `password` no formulário de login/cadastro alinhado com o contrato da API (era `senha`).
- Dockerfiles da API e web atualizados: caminho `packages/types` corrigido para `packages/core`.

### Changed
- Testes unitários movidos de `src/` para `tests/unit/` seguindo convenção Jest.
- `turbo.json` recebe task `test:integration`.

### Removed
- `packages/types` substituído por `packages/core`.

---

## [0.1.0] - 2026-05-07

> M0 concluído: monorepo Turborepo com três apps (web, api, collector) e
> infraestrutura local completa (MongoDB, Cassandra, Redis) rodando via
> Docker Compose. Base sólida para iniciar o M1.

### Added
- Setup inicial do projeto: estrutura de agentes, skills e documentação.
- Adicionadas definições completas dos agentes `front` e `workspace` em `.github/agents/`.
- Definido roadmap do produto com marcos M0–M3, critérios de conclusão e checklists de tarefas.
- Registrados ADRs para Turborepo e estratégia de banco MongoDB + Cassandra + Redis.
- `turbo.json` com pipeline de build, lint, typecheck e test para todos os apps.
- `packages/eslint-config` com flat config (ESLint v10) compartilhado entre todos os apps.

### Fixed
- `apps/api/Dockerfile`: substituído `npm ci` no runner stage por `node_modules` copiado do builder (lockfile está na raiz do monorepo, não no package isolado).
- `docker-compose.yml`: health check da API trocado de `curl` para `wget` (imagem Alpine não inclui curl).
- `docker-compose.yml`: porta do `web` alterada de `5173` para `5174` no host para evitar conflito com port forwarding residual do Colima.
- `turbo.json`: chave `tasks` corrigida para `pipeline` (compatível com Turborepo v1.x instalado).
- Migração dos `.eslintrc.*` legados para flat config — ESLint v10 não suporta o formato antigo.

### Changed
- Stack do Copilot preenchida em `copilot-instructions.md` com todas as tecnologias confirmadas.
- `architecture.md` corrigido: PostgreSQL substituído por MongoDB + Cassandra + Redis.
- Decisões pendentes em `tech-stack.md` marcadas como confirmadas (Express, Mongoose, rule-based classifier).
- Atributo `version` obsoleto removido do `docker-compose.yml`.

### Removed
- Arquivos `.eslintrc.js` legados de todos os apps substituídos por `eslint.config.(js|cjs)`.
