# Roadmap

> **Regra:** registre aqui o que construímos e por quê. Escopo, prioridades e marcos. Sem soluções técnicas — isso vai em `requirements/`.

## Visão do Produto

Adultos que amam jogar FPS perdem performance com o tempo e consideram abandonar o hobby. O Calm Aim é um aim trainer web adaptativo com suporte nativo ao DualSense que transforma o treino numa prática acolhedora, respeitando o ritmo do jogador adulto.

---

## Visão dos Marcos

| Marco | Descrição | Status |
|-------|-----------|--------|
| M0 | Monorepo + infra local rodando | ✅ Concluído |
| M1 | Login + sessão de treino registrada no banco | ✅ Concluído |
| M2 | Primeiro treino jogável + dados do DualSense ao vivo | ✅ Concluído |
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

**Status:** ✅ Concluído
**Critério de conclusão:** usuário consegue criar conta, fazer login e ter uma sessão de treino registrada no MongoDB via frontend.
**Depende de:** M0 concluído.

### Backend (`apps/api`)

- [x] Modelo `Usuario` — email, passwordHash, refreshToken, preferences
- [x] Modelo `Sessao` — userId, startedAt, endedAt, modo, status
- [x] `POST /auth/register` — cria usuário com senha hasheada (bcrypt)
- [x] `POST /auth/login` — retorna access token (15min) + refresh token (7d)
- [x] `POST /auth/refresh` — rotaciona refresh token
- [x] `POST /sessions` — cria sessão vinculada ao usuário autenticado
- [x] `GET /sessions/:id` — retorna sessão por ID
- [x] `GET /sessions` — lista sessões do usuário autenticado

### Frontend (`apps/web`)

- [x] Tela de login e cadastro
- [x] Dashboard com lista de sessões do usuário
- [x] Canvas Three.js (cenário placeholder — cubo girando é suficiente)
- [x] HTTP client com interceptor de refresh automático de token

### Collector (`apps/collector`)

> Tarefas do Collector foram diferidas para o M2 — o critério de conclusão do M1 não as exigia.

---

## M2 — Primeiro Treino Jogável

**Status:** ✅ Concluído
**Critério de conclusão:** usuário completa uma sessão de treino com alvos em movimento e tem métricas básicas (precisão, reação) salvas no banco.
**Depende de:** M1 concluído.

### Assets 3D

- [x] Converter `FpsAKM.fbx` para `.glb` via assimp (Blender não disponível; resultado equivalente)
- [ ] Comprimir e gerar componente com `npx gltfjsx FpsAKM.glb -S -T -t`
- [x] Publicar em `apps/web/public/models/FpsAKM.glb`
- [x] Adicionar crédito CC-BY obrigatório em `CREDITS.md`: *"Fps Rig AKM" by J-Toastie [CC-BY] via Poly Pizza*

> Outros assets disponíveis no FPS Pack (uso futuro): FpsGlock, RiggedFpsArms, AKM estático, Grenade, CombatKnife, Mossberg590A1, GunCase, cartuchos 7.62×39mm e 9×19mm — todos em `/Users/alysonfs/Downloads/FPS Pack J-Toastie/`.

### Frontend (`apps/web`) — Cena FPS

- [x] Criar componente `FpsRig` que carrega `FpsAKM.glb`, inicializa `AnimationMixer` e expõe `play(clipName)` — nomes esperados: `Armature|Idle`, `Armature|Shoot`, `Armature|Reload`
- [x] Montar `gunHolder` como `Object3D` filho da câmera (`position.set(0, -0.2, -0.5)`)
- [x] Configurar câmera FPS: `PerspectiveCamera(70)`, `rotation.order = "YXZ"`, Pointer Lock API para mouse look
- [x] Movimentação WASD + jump (baseado em `ThreeJS_FPS_2.0` como referência)
- [x] Criar sistema de alvos esféricos em movimento na cena (spawn, trajetória e despawn ao ser acertado)
- [x] Raycast / "throw sphere" para detecção de hit
- [x] Animação de disparo ao clicar (`Armature|Shoot` → volta para `Armature|Idle`)
- [x] Animação de reload automático após N disparos
- [x] Otimizações de cena:
  - DPR limitado a `Math.min(1, window.devicePixelRatio)`
  - `frameloop="demand"` ou pausar quando aba oculta
  - `gl={{ powerPreference: "high-performance", antialias: false }}`

### Backend (`apps/api`)

- [x] Campo `metricas` no modelo `Sessao`: `{ precisao: number, tempoMedioReacao: number, totalTiros: number, acertos: number }`
- [x] `PATCH /sessions/:id` — atualiza status e métricas ao encerrar sessão
- [x] Use case `encerrarSessao(id, metricas)`
- [x] Testes unitários para `encerrarSessao`
- [x] Testes de integração para `PATCH /sessions/:id`

### Collector (`apps/collector`)

- [x] Detectar DualSense via `dualsense-ts` e emitir `EventoDualSense` via WebSocket
- [x] Frontend conecta ao WebSocket e consome dados ao vivo no loop FPS (sticks, triggers, giroscópio)

### Persistência de métricas

- [x] Frontend envia `PATCH /sessions/:id` com métricas ao fim da sessão
- [x] Dashboard exibe precisão e tempo de reação por sessão na lista

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
