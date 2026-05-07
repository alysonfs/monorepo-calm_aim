# Changelog

Todas as mudanças notáveis deste projeto serão documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [Unreleased]

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
