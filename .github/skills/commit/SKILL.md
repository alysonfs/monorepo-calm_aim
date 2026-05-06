---
name: commit
description: "Agrupa arquivos por contexto e dependências e cria commits atômicos seguindo Conventional Commits. Mantém CHANGELOG.md com histórico de versões e resumo de entrega. Use para: fazer commit, criar mensagem de commit, commitar alterações, agrupar mudanças, conventional commits, git commit, changelog, versão, release, entrega."
argument-hint: "Opcional: descreva o contexto ou escopo das mudanças a commitar."
---

# Commit

Agrupa arquivos modificados por contexto e dependências, cria um commit atômico por grupo com mensagem no padrão Conventional Commits.

## Quando usar

- Ao commitar qualquer conjunto de alterações
- Quando há arquivos de contextos diferentes (feat + fix + chore na mesma sessão)
- Para garantir histórico limpo, atômico e rastreável
- Para registrar o que foi entregue em uma versão no `CHANGELOG.md`

## Padrão de Mensagem

```
<tipo>(<escopo>): <título imperativo, max 72 chars>

<descrição opcional — máx 4 linhas, máx 80 colunas por linha>
```

### Tipos permitidos

| Tipo | Quando usar |
|------|-------------|
| `feat` | Nova funcionalidade visível ao usuário |
| `fix` | Correção de bug |
| `refactor` | Mudança interna sem alterar comportamento |
| `chore` | Configuração, build, dependências, scripts |
| `test` | Adição ou correção de testes |
| `docs` | Documentação apenas |
| `style` | Formatação, espaços, sem mudança de lógica |
| `perf` | Melhoria de performance |
| `ci` | Pipelines e configuração de CI/CD |

### Regras do título

- Imperativo, sem ponto final: "add user auth" não "added user auth"
- Minúsculas após o tipo/escopo
- Máximo 72 caracteres
- Escopo em inglês ou termo do domínio do projeto

### Regras da descrição

- Máximo 4 linhas
- Máximo 80 colunas por linha
- Explica **o quê** e **por quê**, não o **como**
- Omitir se o título já é suficientemente claro

## Procedimento

1. **Inspecionar mudanças**: rode `git status` e `git diff --stat` para listar todos os arquivos modificados.

2. **Agrupar por contexto**: reúna arquivos que pertencem ao mesmo contexto lógico — mesma feature, mesmo módulo, mesma camada. Exemplos de grupos naturais:
   - Arquivos de domínio alterados juntos (entidade + repositório)
   - Testes de uma mesma unidade
   - Arquivos de configuração/infra sem relação com lógica de negócio
   - Documentação de uma feature

3. **Ordenar por dependência**: commit de infra/config antes de feat, feat antes de test, test antes de docs.

4. **Para cada grupo**:
   a. Adicione apenas os arquivos do grupo: `git add <arquivos>`
   b. Redija o título seguindo o padrão
   c. Se necessário, adicione descrição (máx 4 linhas / 80 colunas)
   d. Execute o commit

5. **Atualizar CHANGELOG.md**: após os commits, atualize `CHANGELOG.md` na raiz do projeto:
   - Se os commits pertencem a uma versão ainda aberta (`## [Unreleased]`), adicione as entradas na seção correspondente.
   - Agrupe por tipo: `### Added`, `### Fixed`, `### Changed`, `### Removed`.
   - Uma linha por entrada, verbo no passado em português: "Adicionado...", "Corrigido...", "Alterado...".
   - Se for um marco de release, renomeie `[Unreleased]` para `[x.y.z] - YYYY-MM-DD` e abra novo `[Unreleased]` vazio acima.
   - Commit do changelog: `docs: update CHANGELOG for <versão ou contexto>`.

6. **Verificar**: após todos os commits, rode `git log --oneline -10` para confirmar o histórico.

## Estrutura do CHANGELOG.md

Seguimos o padrão [Keep a Changelog](https://keepachangelog.com):

```markdown
# Changelog

Todas as mudanças notáveis deste projeto serão documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com).

## [Unreleased]

### Added
- Descrição do que foi adicionado.

### Fixed
- Descrição do que foi corrigido.

### Changed
- Descrição do que foi alterado.

### Removed
- Descrição do que foi removido.

---

## [1.0.0] - YYYY-MM-DD

> Resumo narrativo da entrega em até 3 linhas: o que esta versão
> representa, qual problema resolve e o que o usuário ganha.

### Added
- Entrega inicial do projeto.
```

### Seções do CHANGELOG

| Seção | Quando usar |
|-------|-------------|
| `Added` | Nova feature ou capacidade |
| `Fixed` | Correção de bug |
| `Changed` | Mudança de comportamento existente |
| `Removed` | Feature ou campo removido |
| `Security` | Correção de vulnerabilidade |
| `Deprecated` | Algo que será removido em breve |

### Resumo de entrega (release notes)

Ao fechar uma versão, adicione um parágrafo de resumo logo abaixo do cabeçalho:

```markdown
## [1.2.0] - 2026-06-01

> Foco desta versão: autenticação de usuários e gestão de sessão.
> Inclui refresh token com rotação automática e bloqueio por
> tentativas excessivas de login.

### Added
...
```



```
feat(auth): add JWT refresh token rotation
```

```
fix(pedido): prevent duplicate submission on slow connection

Adds idempotency check using a client-generated request ID.
Server rejects requests with the same ID within a 60s window.
```

```
chore: add eslint and prettier config
```

```
refactor(usuario): extract password hashing to value object

Moves bcrypt logic out of the entity into a dedicated
PasswordHash value object, keeping the domain layer pure.
```

## Anti-padrões a evitar

- `git add .` seguido de um único commit com múltiplos contextos
- Títulos vagos: "fix bug", "update files", "WIP"
- Descrições que repetem o título ou descrevem o **como** ao invés do **porquê**
- Títulos no passado: "added", "fixed", "updated"
