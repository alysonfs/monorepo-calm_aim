# Changelog

Todas as mudanças notáveis deste projeto serão documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [Unreleased]

### Added
- Modelos Mongoose `Usuario` (email, passwordHash, role, refreshToken, preferences) e `Sessao` (userId, modo, status, timestamps).
- Use cases de autenticação: `registerUsuario`, `loginUsuario`, `refreshToken` — lógica pura sem acoplamento ao framework.
- Use cases de sessão: `createSessao`, `getSessao` — com erros de domínio tipados.
- Repositórios Mongoose `UsuarioMongoRepo` e `SessaoMongoRepo` como classes `@injectable()` via tsyringe.
- Container de injeção de dependência em `apps/api/src/container/` com tokens simbólicos.
- Endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `POST /sessions`, `GET /sessions/:id`.
- Middleware `requireAuth` — extrai e valida Bearer JWT, injeta `req.userId`.
- Script `seed` — cria usuário root via variáveis de ambiente, idempotente.
- 31 testes unitários cobrindo use cases, repositórios e middleware (Jest + ts-jest).
- Frontend: tela de login/cadastro com toggle, dashboard com criação de sessão, canvas Three.js, tela de debug ao vivo.
- HTTP client Axios com interceptor de refresh automático de token.
- `AuthContext` React para estado global de autenticação.
- Rota `/debug` (sem autenticação) para visualizar dados do DualSense em tempo real.
- Collector: integração real com DualSense via `dualsense-ts` — acelerômetro e giroscópio a ~60fps via WebSocket.
- Fallback gracioso no collector: emite zeros com `conectado: false` quando controle ausente, retenta a cada 5s.

### Changed
- `EventoDualSense` em `packages/types` recebe campo `conectado: boolean`.
- `turbo.json`: chave `pipeline` migrada para `tasks` (Turborepo v2.x).
- Routes da API refatoradas para thin handlers — toda lógica delegada para use cases.

### Added (infraestrutura)
- Husky pre-commit hook: bloqueia commit se `turbo run lint test` falhar.
- `experimentalDecorators` e `emitDecoratorMetadata` habilitados no tsconfig da API.

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
