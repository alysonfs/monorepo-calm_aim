# Roadmap

> **Regra:** registre aqui o que construímos e por quê. Escopo, prioridades e marcos. Sem soluções técnicas — isso vai em `requirements/`.

## Visão do Produto

Adultos que amam jogar FPS perdem performance com o tempo e consideram abandonar o hobby. O Calm Aim é um aim trainer web adaptativo com suporte nativo ao DualSense que transforma o treino numa prática acolhedora, respeitando o ritmo do jogador adulto.

---

## Visão dos Marcos

| Marco | Descrição | Status |
|-------|-----------|--------|
| M0 | Monorepo + infra local rodando | ✅ Concluído |
| M1 | Login + sessão de treino registrada no banco | 🔵 Em andamento |
| M2 | Primeiro treino jogável + dados do DualSense ao vivo | ⚪ Não iniciado |
| M3 | Motor adaptativo + análise emocional por voz | ⚪ Não iniciado |

---

## M0 — Setup do Monorepo

**Status:** ✅ Concluído
**Critério de conclusão:** `docker compose up` sobe todos os serviços sem erros; `turbo run build` compila sem erros de tipo; `turbo run lint` passa; CI executa em push.

### Tarefas

- [x] Inicializar Turborepo (`npx create-turbo@latest`) e adaptar estrutura ao projeto
- [x] Criar `apps/web` — React + Vite + TypeScript + Three.js (placeholder de tela)
- [x] Criar `apps/api` — Node.js + Express + TypeScript (health check endpoint)
- [x] Criar `apps/collector` — Node.js + ws + TypeScript (WebSocket placeholder, sem HID ainda)
- [x] Criar `packages/typescript-config` — tsconfigs base: `base`, `react`, `node`
- [x] Criar `packages/eslint-config` — ESLint + Prettier compartilhado
- [x] Criar `packages/types` — contratos compartilhados: `EventoDualSense`, `SessaoTreino`, `EstadoEmocional`
- [x] Docker Compose — services `web`, `api`, `mongo`, `cassandra`, `redis` com volumes e health checks
- [x] `.env.example` por app (sem segredos hardcoded)
- [x] GitHub Actions — pipeline com `lint → typecheck → build → test` usando cache do Turborepo
- [x] `README.md` raiz — pré-requisitos, `docker compose up`, como rodar o collector manualmente

---

## M1 — Primeiro Protótipo Vivo

**Status:** 🔵 Em andamento
**Critério de conclusão:** usuário consegue criar conta, fazer login e ter uma sessão de treino registrada no MongoDB via frontend.
**Depende de:** M0 concluído.

### Backend (`apps/api`)

- [ ] Modelo `Usuario` — email, passwordHash, refreshToken, preferences
- [ ] Modelo `Sessao` — userId, startedAt, endedAt, modo, status
- [ ] `POST /auth/register` — cria usuário com senha hasheada (bcrypt)
- [ ] `POST /auth/login` — retorna access token (15min) + refresh token (7d)
- [ ] `POST /auth/refresh` — rotaciona refresh token
- [ ] `POST /sessions` — cria sessão vinculada ao usuário autenticado
- [ ] `GET /sessions/:id` — retorna sessão por ID

### Frontend (`apps/web`)

- [ ] Tela de login e cadastro
- [ ] Dashboard com lista de sessões do usuário
- [ ] Canvas Three.js (cenário placeholder — cubo girando é suficiente)
- [ ] HTTP client com interceptor de refresh automático de token

### Collector (`apps/collector`)

- [ ] Detectar DualSense via HID e emitir eventos brutos via WebSocket
- [ ] Frontend exibe leituras de acelerômetro/giroscópio em tempo real (tela de debug)

---

## M2 — Primeiro Treino Jogável

**Status:** ⚪ Não iniciado
**Critério de conclusão:** usuário completa uma sessão de treino com alvos em movimento e tem métricas básicas (precisão, reação) salvas no banco.
**Depende de:** M1 concluído.

> Detalhamento de tarefas a ser feito quando M1 for concluído.

---

## M3 — Motor Adaptativo + Análise Emocional

**Status:** ⚪ Não iniciado
**Critério de conclusão:** dificuldade ajusta automaticamente com base em performance e estado emocional detectado por voz.
**Depende de:** M2 concluído.

> Detalhamento de tarefas a ser feito quando M2 for concluído.

---

## Fora de escopo (por ora)

- Autenticação social (Google / Discord OAuth) — backlog pós-M1
- Gatilhos adaptativos hápticos do DualSense — backlog pós-M2
- Sugestão de gatilho ideal (R1 vs R2) — backlog pós-M3
- Deploy em produção (Fly.io / Railway / VPS) — backlog
- Aplicativo nativo para PlayStation Store — visão de longo prazo
- Qualquer modo multijogador ou comparação entre usuários
