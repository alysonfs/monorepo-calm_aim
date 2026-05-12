# Decisões Técnicas

> ADRs simplificados. Para cada decisão relevante: o contexto que levou a ela, a decisão tomada e as consequências esperadas.

---

## [2026-05-06] Turborepo como estratégia de monorepo

**Contexto:** Projeto com múltiplos apps (web, api, collector) e packages compartilhados (types, eslint-config, typescript-config). Precisamos de build pipeline com cache compartilhado e lint/typecheck/test paralelos para não desperdiçar tempo em CI.

**Decisão:** Turborepo. Permite definir pipeline de tarefas com dependências entre packages, cache local e remoto, e execução paralela nativa. Alternativas descartadas: npm workspaces puro (sem cache de pipeline), Nx (overhead de configuração desnecessário para o tamanho do projeto).

**Consequência:** CI executa apenas o que mudou. `turbo run build` na raiz compila todos os apps respeitando dependências. Custo: requer que cada package exponha os scripts (`build`, `lint`, `typecheck`, `test`) de forma padronizada.

---

## [2026-05-06] MongoDB + Cassandra + Redis como stack de banco

**Contexto:** O projeto tem dois padrões de acesso distintos: (1) dados de usuário e sessões — esquema flexível, leitura por ID ou userId; (2) eventos de sensor (acelerômetro, giroscópio, botões) — altíssimo volume, escrita intensiva, análise por janelas de tempo.

**Decisão:** MongoDB para dados de usuário/sessão (esquema flexível, ODM Mongoose); Cassandra para séries temporais de sensores (otimizado para escrita em massa e range queries por tempo); Redis para cache de sessão ativa e dados de tempo real.

**Consequência:** Dois bancos para manter. Cassandra tem curva de operação mais alta. Compensa porque o modelo de dados de séries temporais em Cassandra é fundamentalmente diferente do relacional — forçar esses dados em MongoDB seria ineficiente. O arquivo `architecture.md` reflete essa decisão.

> **Nota:** `architecture.md` foi criado inicialmente com PostgreSQL + Redis, o que estava incorreto. Corrigido em 2026-05-06.

---

## [2026-05-07] Metodologia de desenvolvimento: TDD + LLM + SOLID

**Contexto:** O projeto usa LLMs (GitHub Copilot) para gerar código e acelerar o desenvolvimento. Sem disciplina, a geração de código por IA tende a produzir handlers monolíticos, lógica acoplada ao framework, e zero testabilidade — o oposto do que queremos.

**Decisão:** Adotar **TDD + SOLID como contrato inegociável** para qualquer código gerado, humano ou por IA. O fluxo padrão é:

1. **Interface primeiro** — defina o contrato do repositório ou serviço antes da implementação.
2. **Use case puro** — lógica de negócio em funções ou classes que recebem dependências por parâmetro/injeção. Sem `import` de Mongoose, Express ou banco dentro do use case.
3. **Teste antes (ou junto)** — escreva o teste unitário no mesmo momento que o use case. O teste usa mocks simples do repositório. Nenhum use case existe sem teste.
4. **Repositório como adapter** — a implementação concreta (Mongoose, Redis) fica isolada em `repositories/`. Testada separadamente com mocks dos models.
5. **Route como thin handler** — controller só faz: parse do body → resolve dependência → chama use case → mapeia erro para status HTTP.

**Princípios SOLID aplicados:**
- **S** — cada use case tem uma única responsabilidade (ex.: `registerUsuario` só registra).
- **O** — novos comportamentos = novos use cases, sem modificar os existentes.
- **L** — repositórios implementam interfaces; qualquer impl substitui outra sem quebrar o use case.
- **I** — interfaces de repositório são segregadas por use case (`RegisterUsuarioRepo`, `LoginUsuarioRepo`).
- **D** — use cases dependem de interfaces, nunca de classes concretas ou ORMs.

**Regras para o LLM (Copilot):**
- Nunca gerar handler com lógica de negócio embutida. Se o handler tem `bcrypt` ou `jwt`, está errado.
- Toda instrução para o agente `@backend` deve exigir: use case separado + teste unitário + repositório como interface.
- O agente deve rodar `typecheck`, `lint` e `test` antes de reportar como concluído.
- Nenhum código novo entra no repositório sem testes passando no CI.

**Consequência:** Velocidade inicial ligeiramente menor, mas cada incremento é seguro. O Copilot passa a ser um acelerador dentro de um sistema com invariantes testadas — não uma fonte de débito técnico.

---

## [2026-05-07] tsyringe como container de injeção de dependência

**Contexto:** Com use cases puros e repositórios como interfaces, precisamos de um mecanismo para resolver dependências nas routes sem acoplamento direto às implementações concretas. Passar o repo manualmente em cada route é verboso e dificulta a troca de implementações.

**Decisão:** `tsyringe` como DI container. Repositórios registrados com tokens de interface; routes resolvem via `container.resolve(TOKEN)`. Em testes, o container é reconfigurado com mocks.

**Alternativas descartadas:** InversifyJS (mais pesado, API mais verbosa); DI manual nas routes (funciona, mas não escala); NestJS (framework completo, muda demais o shape do projeto).

**Consequência:** `experimentalDecorators` e `emitDecoratorMetadata` habilitados no tsconfig. `reflect-metadata` importado no entry point antes de qualquer outro import. Classes de repositório decoradas com `@injectable()`. Custo: decoradores são Stage 3 no TC39 mas não Stage 4 — risco gerenciável com lock de versão do TypeScript.

---

## [2026-05-06] Estrutura de documentação em `docs/`

**Contexto:** Projeto no início, necessidade de manter contexto organizado entre sessões sem desperdiçar tokens repetindo informações já conhecidas.

**Decisão:** Adotar `docs/` estruturado em quatro contextos: `planning/`, `requirements/`, `diagrams/`, `wiki/`. O Copilot lê os arquivos relevantes ao invés de perguntar ao usuário ou inferir.

**Consequência:** Contexto persistente e reutilizável entre conversas. Custo de manutenção: manter os arquivos atualizados conforme o projeto evolui.

---

## [2026-05-12] Calibração de sticks do DualSense: software, não firmware

**Contexto:** Controles DualSense usam potenciômetros ALPS que degradam com o uso, causando dois problemas mensuráveis: (1) **drift** — o stick reporta valor diferente de zero em repouso (ex.: LY = -0.01961, RY = -0.00392 medidos via Gamepad API); (2) **erro de circularidade** — a trajetória ao girar o stick descreve uma elipse em vez de um círculo, indicando desgaste mecânico assimétrico do potenciômetro (Avg Error % como exibido pelo GuliKit controller test). Controles com uso intenso apresentam erro de circularidade de 8–12%. Isso afeta diretamente a precisão de mira em FPS.

**O que aprendemos:**
- Drift é detectável automaticamente: coletar ~200 amostras em repouso e calcular `offsetX`/`offsetY` médios por stick. Esses são os valores AXIS 0/1/2/3 que ferramentas como GuliKit e dualshock-tools expõem.
- Erro de circularidade é detectável: registrar a trajetória de um giro completo do stick e calcular o desvio padrão do raio em relação ao raio médio. Indica desgaste mecânico — não corrigível por software.
- A deadzone atual do projeto (`STICK_DEADZONE = 0.15` axial em `FpsControls.ts`) é o tipo mais inadequado para FPS: cria zona morta em forma de cruz por eixo. O stick direito (mira) não tem deadzone alguma.
- A deadzone ideal para FPS é **radial escalada**: (1) testa a magnitude do vetor `(x,y)` em vez de cada eixo separado; (2) remapeia o intervalo `[dz..1] → [0..1]`, eliminando o salto de velocidade ao cruzar o limiar.
- A deadzone ótima para cada controle é calculada como `max(|offsetX|, |offsetY|) × 1.5 + margem_segurança` — não um valor fixo global.

**Decisão:** Calibração via **software** — offset subtraído em runtime no collector antes do broadcast, sem alterar o firmware. O collector ([`apps/collector/src/index.ts`](../../apps/collector/src/index.ts)) é o ponto correto de aplicação do offset por ser a camada mais baixa: todos os consumidores (jogo, tela de calibração, debug) recebem dados já corrigidos. Perfil de calibração salvo no MongoDB por usuário.

**Ferramentas de referência consultadas:**
- [GuliKit Controller Test](https://test.gulikit.com) — modelo visual para diagnóstico de LX/LY/RX/RY e teste de circularidade com Avg Error %
- [dualshock-tools](https://dualshock-tools.github.io) — referência de interface de calibração guiada para DualSense/DualShock via WebHID

**Consequência:** O M5 implementa tela "Configuração do Controle" com: SVG interativo do DualSense reativo ao input físico (botões acendem, sticks movem o dot, triggers preenchem proporcionalmente); diagnóstico automático em 3 fases (repouso → circularidade → alcance); deadzone radial escalada configurada por perfil; mapeamento de botões com sugestões adaptativas baseadas em dados de sessão (M4+).

---

## [2026-05-08] Contrato de campos HTTP definido pelo package `@calm-aim/core`

**Contexto:** O frontend enviava `{ email, senha }` no body do login/register enquanto a API esperava `{ email, password }`. O erro passou despercebido porque os dois lados foram desenvolvidos de forma independente, sem um contrato compartilhado entre eles.

**Decisão:** Todos os tipos de request/response HTTP que cruzam a fronteira frontend↔API **devem ser definidos em `packages/core/`** e importados pelos dois lados. Nenhum campo de body de request pode ser inferido por convenção — ele precisa estar tipado em uma interface compartilhada (ex.: `LoginRequest`, `RegisterRequest`, `AuthResponse`).

O package `@calm-aim/core` centraliza também entidades de domínio, enums, value objects e qualquer conceito central da aplicação compartilhado entre apps.

O agente `@backend` ao criar um endpoint e o agente `@front` ao consumir um endpoint devem, ambos, referenciar o tipo de `@calm-aim/core`. Se o tipo não existir, criá-lo antes de implementar.

---

## [2026-05-12] Dificuldade adaptativa afeta somente o comportamento dos alvos

**Contexto:** Durante testes iniciais do motor adaptativo (M3), o jogador percebeu que seu "feeling" de mira e movimentação piorava conforme a dificuldade aumentava — uma sensação de estar sendo "sabotado" pelos próprios controles. O motor ajusta velocidade e tamanho dos alvos em resposta à performance, o que naturalmente torna a mira mais difícil; porém, havia risco de o motor influenciar também parâmetros de câmera ou movimento do jogador, o que seria uma experiência degradante e antinatural.

**Decisão:** A escala de dificuldade do motor adaptativo **atua exclusivamente no `TargetSystem`**: velocidade dos alvos, raio (tamanho), intervalo de spawn e, futuramente, padrão de trajetória. Parâmetros do jogador — sensibilidade da câmera, velocidade de movimentação, deadzone dos sticks — são **invariáveis** e pertencem ao perfil do jogador (M5), nunca ao motor adaptativo. `FpsControls` e `FpsCamera` não recebem nem consomem `dificuldade` em nenhuma circunstância.

**Justificativa:** O objetivo do treino é desafiar o jogador com alvos mais difíceis de acertar, não degradar a responsividade dos seus controles. Alterar controles como mecanismo de dificuldade seria equivalente a um academia reduzir a eficiência das máquinas de musculação em vez de aumentar o peso — mina a confiança do atleta no equipamento.

**Consequência:** Qualquer pull request que passe `dificuldade` para `FpsControls`, `FpsCamera` ou `useDualSense` deve ser recusado. O agente `@front` deve verificar essa invariante ao implementar M4+.

**Consequência:** Qualquer divergência de campo vira erro de compilação TypeScript em ambos os apps, antes de qualquer teste ou build Docker. Custo: disciplina de manter `packages/core/` atualizado a cada novo endpoint.
