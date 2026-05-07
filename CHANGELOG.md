# Changelog

Todas as mudanças notáveis deste projeto serão documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [Unreleased]

### Added
- Setup inicial do projeto: estrutura de agentes, skills e documentação.
- Adicionadas definições completas dos agentes `front` e `workspace` em `.github/agents/`.
- Definido roadmap do produto com marcos M0–M3, critérios de conclusão e checklists de tarefas.
- Registrados ADRs para Turborepo e estratégia de banco MongoDB + Cassandra + Redis.

### Fixed
- `apps/api/Dockerfile`: substituído `npm ci` no runner stage por `node_modules` copiado do builder (lockfile está na raiz do monorepo, não no package isolado).
- `docker-compose.yml`: health check da API trocado de `curl` para `wget` (imagem Alpine não inclui curl).
- `docker-compose.yml`: porta do `web` alterada de `5173` para `5174` no host para evitar conflito com port forwarding residual do Colima.

### Changed
- Stack do Copilot preenchida em `copilot-instructions.md` com todas as tecnologias confirmadas.
- `architecture.md` corrigido: PostgreSQL substituído por MongoDB + Cassandra + Redis.
- Decisões pendentes em `tech-stack.md` marcadas como confirmadas (Express, Mongoose, rule-based classifier).
- Atributo `version` obsoleto removido do `docker-compose.yml`.
