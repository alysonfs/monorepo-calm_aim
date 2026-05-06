# Decisões Técnicas

> ADRs simplificados. Para cada decisão relevante: o contexto que levou a ela, a decisão tomada e as consequências esperadas.

---

## [2026-05-06] Estrutura de documentação em `docs/`

**Contexto:** Projeto no início, necessidade de manter contexto organizado entre sessões sem desperdiçar tokens repetindo informações já conhecidas.

**Decisão:** Adotar `docs/` estruturado em quatro contextos: `planning/`, `requirements/`, `diagrams/`, `wiki/`. O Copilot lê os arquivos relevantes ao invés de perguntar ao usuário ou inferir.

**Consequência:** Contexto persistente e reutilizável entre conversas. Custo de manutenção: manter os arquivos atualizados conforme o projeto evolui.
