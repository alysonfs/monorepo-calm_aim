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
| M3 | Motor adaptativo + análise emocional por voz | ✅ Concluído |
| M4 | Sub-habilidades de mira, movimentação e reflexo | ⚪ Não iniciado |

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

**Status:** ✅ Concluído
**Critério de conclusão:** dificuldade ajusta automaticamente com base em performance e estado emocional detectado por voz.
**Depende de:** M2 concluído.

### Infraestrutura Cassandra

- [x] Criar script de inicialização do keyspace `calm_aim` e tabelas (`eventos_sessao`, `estado_emocional`, `metricas_dificuldade`)
- [x] Adicionar inicialização automática do schema ao subir o container (`cassandra-init` service no docker-compose)
- [x] Conectar `apps/api` ao Cassandra via `cassandra-driver` (DataStax)
- [x] Variáveis de ambiente: `CASSANDRA_HOST`, `CASSANDRA_DATACENTER`, `CASSANDRA_KEYSPACE`

### Motor Adaptativo (`apps/api`)

- [x] Definir escala de dificuldade: `float` 0.0–1.0 mapeado para velocidade, tamanho e frequência dos alvos
- [x] Use case `calcularDificuldade(historico)` — regras baseadas em precisão e tempo de reação dos últimos N eventos
- [x] Use case `registrarEventoSessao(sessaoId, tipo, reacaoMs, dificuldade)` — grava em `eventos_sessao` no Cassandra
- [x] `GET /sessions/:id/dificuldade` — retorna dificuldade atual da sessão
- [x] `POST /sessions/:id/eventos` — recebe evento do frontend e retorna nova dificuldade calculada
- [x] Testes unitários para `calcularDificuldade`

### Análise Emocional por Voz (`apps/web`)

- [x] Hook `useMicrofone` — solicita permissão, instancia `AudioContext` e `AnalyserNode`
- [x] Módulo `VozAnalyzer` — analisa volume RMS e frequência dominante a cada 500ms
- [x] Heurística local de estresse: volume alto + frequência >300Hz sustentada = sinal de estresse
- [x] Integração no loop de Treino: envia leitura emocional ao backend a cada 5s
- [x] `POST /sessions/:id/emocao` — recebe leitura e persiste em `estado_emocional` no Cassandra

### Integração Frontend ↔ Motor Adaptativo

- [x] Frontend consulta `GET /sessions/:id/dificuldade` ao iniciar sessão
- [x] Motor envia nova dificuldade como resposta ao `POST /sessions/:id/eventos` quando há ajuste
- [x] `TargetSystem` consome dificuldade via `setDificuldade(d)`: velocidade, tamanho e intervalo de spawn dos alvos. Controles do jogador (`FpsControls`, `FpsCamera`) são invariáveis — ver ADR [2026-05-12]
- [x] HUD exibe barra de dificuldade (verde/amarelo/vermelho) e ícone de estado emocional

### Testes

- [x] Testes unitários para `calcularDificuldade` (cenários: melhora contínua, queda brusca, estável, limites)
- [x] Testes unitários para `registrarEventoSessao` e `registrarEmocao`
- [x] Testes unitários para `VozAnalyzer` (mocks de AudioContext/AnalyserNode)

---

---

## M4 — Sub-habilidades de Mira, Movimentação e Reflexo

**Status:** ⚪ Não iniciado  
**Critério de conclusão:** o jogador consegue escolher um foco de treino (flick, tracking, reativo ou switching), o motor adapta a dificuldade por dimensão independente, e ao fim da sessão recebe um resumo com proficiência por sub-habilidade e p50/p90 de reação.  
**Depende de:** M3 concluído.

**Por quê:** Mira não é uma habilidade única. O AimLabs (referência principal do setor) demonstra que flicking, tracking, tempo reativo e switching de alvo evoluem de forma independente. Treinar sem distinguir esses eixos é o equivalente a ir à academia e fazer exercícios aleatórios — volume sem direção. O M4 transforma o Calm Aim num treinador com prática dirigida, respeitando o princípio de sobrecarga progressiva por sub-habilidade.

### Tipos de alvo e modo híbrido

- [ ] `flick` — alvo estacionário em posição aleatória, sem movimento. Treina deslocamento rápido e preciso da mira para ponto fixo
- [ ] `tracking` — alvo com trajetória suave e contínua. Treina manter crosshair em alvo móvel
- [ ] `reativo` — alvo estacionário com janela curta (configurável) antes de sumir. Treina tempo de reação puro
- [ ] `switching` — 2–3 alvos simultâneos; acerto elimina um e spawna outro em posição diferente. Treina troca rápida de alvo
- [ ] Seleção de foco pelo jogador antes da sessão (`flick | tracking | reativo | switching | automático`)
- [ ] Motor híbrido: peso base definido pelo foco + sobre-representação do subtipo com menor proficiência detectada

### Métricas refinadas de mira

- [ ] Capturar `distanciaMiss` e `direcaoMiss` (`overshoot | undershoot | lateral`) por cada tiro que erra
- [ ] `MetricasTracker` rastreia precisão separada por subtipo de alvo
- [ ] Distribuição de reação: `p50`, `p90`, desvio padrão (substituindo só a média)
- [ ] `tendenciaReacao`: slope linear dos últimos 10 acertos — crescente indica fadiga

### Métricas de movimentação

- [ ] `FpsControls` expõe `velocidadeAtual` normalizada (0–1) ao `MetricasTracker`
- [ ] Distinguir `precisaoParado` vs `precisaoEmMovimento` por sessão
- [ ] Motor reduz dificuldade de tracking quando `precisaoEmMovimento < precisaoParado × 0.6`

### Motor adaptativo multi-dimensional

- [ ] `dificuldade` vira objeto com dimensões independentes: `velocidadeAlvo`, `tamanhoAlvo`, `janelaReacaoMs`, `qtdSimultaneos`
- [ ] Regras de ajuste por sub-habilidade (últimos 15 eventos por tipo):
  - `precisaoFlick > 80%` → reduz `tamanhoAlvo`
  - `precisaoTracking < 40%` → reduz `velocidadeAlvo`
  - `p90Reacao > 700ms` → aumenta `janelaReacaoMs` e enfatiza tipo reativo
  - `taxaOvershoot > 50%` → reduz `velocidadeAlvo` + `tamanhoAlvo` (mira agressiva demais)
  - Fadiga detectada (`tendenciaReacao` crescente por 20s) → reduz todas as dimensões
- [ ] Resposta da API inclui `subHabilidadeFoco` para o frontend biesar o spawn

### HUD e feedback visual

- [ ] Anel de proximidade no alvo mais próximo quando `distanciaMiss < limiar` — feedback imediato de "quase acertou"
- [ ] Barras de proficiência por sub-habilidade atualizando ao vivo na sessão
- [ ] Indicador de `p50` de reação ao vivo (atualiza a cada 5 acertos)
- [ ] Ícone de tendência de reação: seta para cima = fadiga, seta estável = OK

### Modelo de dados e API (Cassandra)

- [ ] Expandir `eventos_sessao`: novos campos `subtipo`, `velocidade_jogador`, `distancia_miss`, `direcao_miss`
- [ ] Nova tabela `metricas_sessao_final`: `p50_reacao`, `p90_reacao`, `desvio_reacao`, `precisao_flick`, `precisao_tracking`, `precisao_reativo`, `precisao_switching`, `precisao_parado`, `precisao_em_movimento`
- [ ] `POST /sessions/:id/finalizar` — calcula e persiste `metricas_sessao_final`
- [ ] `GET /sessions/:id/metricas` — retorna resumo da sessão para tela de resultado
- [ ] Atualizar `POST /sessions/:id/eventos`: corpo inclui `subtipo`, `velocidadeJogador`, `distanciaMiss`, `direcaoMiss`; resposta inclui objeto `dificuldade` multi-dimensional + `subHabilidadeFoco`

### Testes

- [ ] Unitários para motor M4: cada regra de ajuste por sub-habilidade
- [ ] Unitários para cálculo de distribuição de reação (`p50`, `p90`, tendência)
- [ ] Integração para `POST /sessions/:id/eventos` com campos M4 e `POST /sessions/:id/finalizar`

---

## Fora de escopo (por ora)

- Autenticação social (Google / Discord OAuth) — backlog pós-M1
- Gatilhos adaptativos hápticos do DualSense — backlog pós-M2
- Sugestão de gatilho ideal (R1 vs R2) — backlog pós-M3
- Modelo de ML para classificação de emoção — backlog pós-M4
- Múltiplos perfis de dificuldade por usuário — backlog pós-M4
- Deploy em produção (Fly.io / Railway / VPS) — backlog
- Aplicativo nativo para PlayStation Store — visão de longo prazo
- Qualquer modo multijogador ou comparação entre usuários
