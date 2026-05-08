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

## [2026-05-08] Contrato de campos HTTP definido pelo package `@calm-aim/core`

**Contexto:** O frontend enviava `{ email, senha }` no body do login/register enquanto a API esperava `{ email, password }`. O erro passou despercebido porque os dois lados foram desenvolvidos de forma independente, sem um contrato compartilhado entre eles.

**Decisão:** Todos os tipos de request/response HTTP que cruzam a fronteira frontend↔API **devem ser definidos em `packages/core/`** e importados pelos dois lados. Nenhum campo de body de request pode ser inferido por convenção — ele precisa estar tipado em uma interface compartilhada (ex.: `LoginRequest`, `RegisterRequest`, `AuthResponse`).

O package `@calm-aim/core` centraliza também entidades de domínio, enums, value objects e qualquer conceito central da aplicação compartilhado entre apps.

O agente `@backend` ao criar um endpoint e o agente `@front` ao consumir um endpoint devem, ambos, referenciar o tipo de `@calm-aim/core`. Se o tipo não existir, criá-lo antes de implementar.

**Consequência:** Qualquer divergência de campo vira erro de compilação TypeScript em ambos os apps, antes de qualquer teste ou build Docker. Custo: disciplina de manter `packages/core/` atualizado a cada novo endpoint.
