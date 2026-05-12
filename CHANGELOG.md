# Changelog

Todas as mudanças notáveis deste projeto serão documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [Unreleased]

---

## [0.4.1] - 2025-05-12

### Fixed
- Corrigido drift constante do stick direito (R3): adicionada zona morta de 15% com remapeamento suave e sensibilidade em rad/s escalada por delta time.
- Corrigido motor adaptativo nunca aumentar dificuldade: `LIMIAR_REACAO_LENTA` ajustado de 600 ms para 2500 ms (medição parte do spawn do alvo, não da visão do jogador).
- Corrigida contaminação de dificuldade zero: sessões antigas com `dificuldade=0` no Cassandra não afetam mais novas sessões (fallback para 0.3).

### Added
- Campo `distancia_m` em `eventos_sessao` no Cassandra para análise de desempenho por faixa de alcance.
- Painel de debug Cassandra no HUD (canto superior direito) mostrando os últimos 10 eventos gravados.
- Timer de sessão ao vivo no HUD em formato MM:SS.
- Indicador de nível adaptativo com tiers nomeados: INICIANTE / MÉDIO / AVANÇADO / ELITE.
- Indicador de tensão emocional separado da barra de dificuldade.

### Changed
- Lógica do motor adaptativo: precisão e reação agora são condições independentes — alta precisão sobe a dificuldade por conta própria; reação lenta reduz separadamente.
- `dev:local` inclui `cassandra` e `cassandra-init` no `docker compose up`.

### Removed
- Serviço `cassandra-web` removido do docker-compose (imagem não existe mais no Docker Hub).

---

## [0.5.0] - 2026-05-12

> M3 concluído: motor adaptativo de dificuldade e análise emocional por voz.
> A dificuldade dos alvos ajusta-se automaticamente ao desempenho do jogador
> em tempo real; sinais de estresse captados pelo microfone enriquecem o
> perfil da sessão sem enviar áudio ao servidor.

### Added
- Conexão ao Cassandra com graceful degradation — API sobe mesmo sem o banco disponível.
- Schema CQL automático via `cassandra-init` no `docker compose up` (tabelas `eventos_sessao`, `estado_emocional`, `metricas_dificuldade`).
- `EventoSessaoCassandraRepo`: registra eventos, emoção e dificuldade em série temporal.
- Use case `calcularDificuldade`: janela de 10 eventos, ajuste ±0.05/0.08, clamp [0, 1].
- Use case `registrarEventoSessao`: persiste evento e devolve nova dificuldade calculada.
- Use case `getDificuldadeAtual`: retorna dificuldade da sessão (padrão 0.3 se sem histórico).
- Use case `registrarEmocao`: persiste nível emocional [0, 1] com validação de range.
- Rotas `GET /sessions/:id/dificuldade`, `POST /sessions/:id/eventos`, `POST /sessions/:id/emocao`.
- `VozAnalyzer`: heurística RMS + FFT >300 Hz para estimativa de estresse, 100% local (Web Audio API).
- Hook `useMicrofone`: solicita permissão de microfone e inicia análise automática com cleanup.
- `TargetSystem.setDificuldade(d)`: velocidade, raio e spawn interval escalados por lerp [0, 1].
- HUD do treino: barra de dificuldade colorida (verde → vermelho) e ícone emocional.
- Variáveis `CASSANDRA_HOST`, `CASSANDRA_DATACENTER`, `CASSANDRA_KEYSPACE` no `.env.example`.
- 15 novos testes unitários (8 `calcularDificuldade`, 3 `registrarEventoSessao`, 4 `registrarEmocao`; 6 `VozAnalyzer`).

### Changed
- `Treino.tsx`: busca dificuldade inicial ao entrar, envia evento a cada tiro, leitura emocional a cada 5 s.
- `apps/api/src/index.ts`: refatorado para `async start()` com `connectCassandra()` em try/catch.

### Fixed
- ADR registrado: dificuldade afeta **somente** `TargetSystem`; `FpsControls` e `FpsCamera` são imutáveis.

---

## [0.4.0] - 2026-05-11

> Suporte completo ao DualSense no treino FPS. Sticks analógicos controlam
> movimento e câmera; R2 dispara; X pula. Collector conecta ao controle via
> dualsense-ts e transmite eventos ao vivo via WebSocket.

### Added
- `EventoDualSense` expandido com sticks analógicos (esquerdo/direito, x/y) e triggers analógicos (l2/r2).
- `apps/collector`: detecta DualSense via `dualsense-ts` e faz broadcast de sticks, triggers e botões via WebSocket.
- Hook `useDualSense` no frontend — consome collector via WebSocket sem causar re-renders (useRef).
- `FpsCamera.applyControllerLook` — stick direito controla câmera com sensibilidade configurável.
- `FpsControls.update` aceita evento do DualSense — stick esquerdo move personagem, X pula.
- Disparo por R2 no loop de jogo (gatilho analógico > 0.5 com cooldown e estado de borda).
- Vitest como test runner no `apps/web`; 12 novos testes unitários (`MetricasTracker`, `getLookFromEvent`).

### Fixed
- Eixo Y dos sticks invertido: corrigido para convenção matemática da `dualsense-ts` (cima = +1).
- Collector usava `on("input")` que não borbulha até o pai — corrigido para `on("change")`.

---

## [0.3.0] - 2026-05-11

> M2 concluído: primeiro treino FPS jogável no browser. Jogador controla
> personagem com câmera Pointer Lock, acerta alvos em movimento e tem
> métricas de precisão e tempo de reação salvas no MongoDB ao fim da sessão.

### Added
- Cena FPS jogável em `apps/web`: câmera com Pointer Lock, movimentação WASD + salto e gravidade.
- Sistema de alvos esféricos com spawn, trajetória e detecção de hit via raycaster.
- `FpsRig`: carrega `FpsAKM.glb` via GLTFLoader com animações `Idle`, `Shoot` e `Reload`.
- `MetricasTracker`: rastreia tiros, acertos e tempo médio de reação por sessão.
- `PATCH /sessions/:id` — encerra sessão e persiste métricas no MongoDB.
- Use case `encerrarSessao` com validação de ownership e status.
- Campo `metricas` no modelo `Sessao` (`totalTiros`, `acertos`, `precisao`, `tempoMedioReacaoMs`).
- 4 testes unitários para `encerrarSessao`; 4 novos testes de integração para `PATCH /sessions/:id`.
- `apps/web/public/models/FpsAKM.glb` — modelo reexportado do Blender com orientação correta.
- `CREDITS.md` com crédito CC-BY 3.0: "Fps Rig AKM" por J-Toastie via Poly Pizza.
- Script `dev:local` na raiz: sobe mongo+redis via Docker e roda `turbo run dev` com hot-reload.
- `apps/api/.env.local` (gitignored) com URLs `localhost` para dev sem Docker build.

### Changed
- `Dashboard.tsx`: `handleNovaSessao` navega para `/treino?sessaoId=:id`; cards de sessão exibem métricas quando disponíveis.
- `Treino.tsx` reescrito como orquestrador da cena FPS (substituiu placeholder de cubo girando).
- `apps/api/src/index.ts`: carrega `.env.local` antes de `.env` para sobrescrever hostnames Docker localmente.

### Fixed
- Orientação da arma FPS: modelo GLB reexportado do Blender com cano apontando para -Z; `FpsRig.ts` usa `rotation.y = Math.PI` para alinhar com a câmera.
- Near clipping plane reduzido de 0.1 para 0.02, eliminando artefatos de clipping no viewmodel.
- CORS ao rodar localmente: `ALLOWED_ORIGIN=http://localhost:5173` adicionado ao `apps/api/.env.local`.

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
