# Copilot Instructions

Estas diretrizes se aplicam a **todo o workspace** e definem como o GitHub Copilot deve se comportar neste projeto.

---

## Raiz do Projeto

**CRÍTICO — leia antes de qualquer operação de arquivo ou terminal:**

> O diretório raiz do projeto é **`/Users/alysonfs/workspace/Software/calm_aim`**.

- Todos os agentes e subagentes **devem operar neste diretório**.
- Nunca use worktrees (`calm_aim.worktrees/…`) como destino de criação de arquivos ou commits.
- Quando receber um caminho relativo (ex.: `apps/api`), resolva-o como `/Users/alysonfs/workspace/Software/calm_aim/apps/api`.
- Antes de criar, editar ou executar qualquer comando, confirme que o `pwd` é `/Users/alysonfs/workspace/Software/calm_aim`.

---

## Princípios Fundamentais

Todo código produzido neste projeto deve seguir quatro pilares inegociáveis:

1. **Limpo** — nomes autoexplicativos, funções com responsabilidade única, sem código morto.
2. **Seguro** — validação de entradas externas, sem segredos hardcoded, proteção contra OWASP Top 10.
3. **Simples** — KISS e YAGNI. Implemente somente o que foi pedido. Sem abstrações prematuras.
4. **Desacoplado** — separação de camadas, dependência de abstrações, domínio livre de frameworks.

---

## Comportamento Padrão

- **Leia antes de editar.** Nunca proponha alterações sem antes entender o contexto do arquivo.
- **Escopo mínimo.** Não refatore código fora do escopo da tarefa. Não adicione features especulativas.
- **Sem documentação automática.** Não gere docstrings, comentários ou arquivos de resumo onde o código é autoexplicativo.
- **Sem dependências desnecessárias.** Verifique se o problema pode ser resolvido com o que já existe antes de sugerir novas bibliotecas.
- **Português no domínio.** Nomes de conceitos de negócio podem ser em português se refletirem a linguagem do domínio. Código técnico (funções utilitárias, infra) em inglês.

---

## Economia de Contexto e Tokens

Contexto é recurso finito. Trate-o com frugalidade:

- **Respostas diretas.** Vá ao ponto. Sem introduções, recapitulações ou conclusões desnecessárias.
- **Sem repetição de código já visível.** Não reproduza trechos que o usuário acabou de mostrar, apenas referencie-os.
- **Leia seletivamente.** Antes de ler um arquivo inteiro, busque a seção relevante. Use buscas pontuais.
- **Contexto explícito é melhor que contexto inferido.** Quando precisar de informação que está documentada em `docs/`, leia o arquivo correspondente ao invés de perguntar ao usuário.
- **Atualize a documentação ao invés de reexplicar.** Se uma decisão ou aprendizado novo surgir na conversa, registre em `docs/` e referencie — não repita nas próximas iterações.

---

## Arquitetura

Seguimos separação em camadas. A regra de dependência sempre aponta para o domínio:

```
Presentation  →  Application (Use Cases)  →  Domain  ←  Infrastructure
```

- **Domain**: entidades, value objects, contratos de repositório. Sem imports de frameworks, ORMs ou libs externas.
- **Application**: casos de uso, orquestração. Sem acesso direto a banco ou HTTP.
- **Infrastructure**: implementações concretas (banco, cache, email, storage). Depende do domínio via inversão.
- **Presentation**: controllers, resolvers, handlers. Apenas recebe input, delega ao use case, retorna output.

---

## Segurança

- Variáveis de ambiente para **todos** os segredos. Nunca hardcode tokens, senhas ou chaves.
- Valide e sanitize toda entrada externa antes de qualquer processamento.
- Hash de senhas com bcrypt ou argon2. JWTs com expiração curta + refresh token.
- Logs nunca devem expor stack traces completos, PII ou dados sensíveis em produção.
- Aplique princípio do menor privilégio em permissões de banco, roles e APIs externas.

---

## Testes

- Testes unitários cobrem domínio e casos de uso. Sem dependências reais (mocks/stubs).
- Testes de integração cobrem a camada de infraestrutura.
- Testes E2E cobrem os fluxos críticos da aplicação.
- Nomes de testes descrevem comportamento: `deve retornar erro ao criar usuário com email duplicado`.

---

## Stack do Projeto

- **Linguagem:** TypeScript (todos os apps e packages)
- **Frontend:** React + Vite + Three.js; Web Audio API (análise de voz local)
- **Backend:** Node.js + Express
- **Banco de dados:** MongoDB (usuários/sessões) + Cassandra (séries temporais de sensores) + Redis (cache/tempo real)
- **ODM / Drivers:** Mongoose (MongoDB), cassandra-driver DataStax (Cassandra), ioredis (Redis)
- **Autenticação:** JWT — access token (15min) + refresh token (7d) com rotação
- **Monorepo:** Turborepo com npm workspaces
- **Collector:** Node.js + hidapi/dualsense-ts + ws (roda fora do Docker)
- **Infraestrutura local:** Docker Compose (web, api, mongo, cassandra, redis)
- **CI/CD:** GitHub Actions com cache do Turborepo
- **Deploy produção:** não definido (backlog)

---

## Estrutura de Documentação (`docs/`)

Toda documentação do projeto vive em `docs/`, organizada por contexto. Mantenha os arquivos objetivos e atualizados. Nunca duplique informação entre seções.

```
docs/
├── planning/        # Visão de produto, roadmap, decisões de negócio
│   └── roadmap.md
├── requirements/    # Requisitos funcionais e não-funcionais por feature
│   └── <feature>.md
├── diagrams/        # Diagramas de arquitetura, fluxo, sequência (Mermaid ou imagem)
│   └── <contexto>.md
└── wiki/            # Dicionário de domínio, decisões técnicas, aprendizados
    ├── glossario.md # Termos do domínio e seus significados
    └── decisoes.md  # ADRs simplificados: contexto → decisão → consequência
```

### Regras de uso

- **`planning/`** — O que construímos e por quê. Escopo, prioridades, marcos.
- **`requirements/`** — Um arquivo por feature ou módulo. Descreve o comportamento esperado, não a solução técnica.
- **`diagrams/`** — Diagramas em Mermaid sempre que possível (versionável, legível). Um arquivo por contexto.
- **`wiki/`** — O que aprendemos. Termos do domínio, decisões técnicas (ADR leve), padrões adotados e por quê.

> Sempre que uma decisão relevante surgir em conversa, registre em `docs/wiki/decisoes.md`. Não deixe o conhecimento preso no histórico do chat.

---

## Agentes Disponíveis

| Agente | Quando usar |
|--------|-------------|
| `@backend` | Código de API, serviços, domínio, banco de dados, autenticação |
| `@front` | Interface, componentes, rotas client-side |
