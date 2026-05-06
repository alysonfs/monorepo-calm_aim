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

## [2026-05-06] Estrutura de documentação em `docs/`

**Contexto:** Projeto no início, necessidade de manter contexto organizado entre sessões sem desperdiçar tokens repetindo informações já conhecidas.

**Decisão:** Adotar `docs/` estruturado em quatro contextos: `planning/`, `requirements/`, `diagrams/`, `wiki/`. O Copilot lê os arquivos relevantes ao invés de perguntar ao usuário ou inferir.

**Consequência:** Contexto persistente e reutilizável entre conversas. Custo de manutenção: manter os arquivos atualizados conforme o projeto evolui.
