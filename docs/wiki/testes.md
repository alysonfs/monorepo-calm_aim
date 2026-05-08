# Testes

## Visão geral

Os testes são divididos em dois tipos:

| Tipo | Padrão de arquivo | Config Jest | O que cobre |
|------|-------------------|-------------|-------------|
| **Unitário** | `*.test.ts` | `jest.config.ts` | Domínio e casos de uso (sem I/O real) |
| **Integração** | `*.spec.ts` | `jest.config.integration.ts` | Rotas HTTP + MongoDB em memória |

Os arquivos vivem em `apps/api/tests/`:

```
tests/
├── unit/
│   ├── db/
│   ├── middleware/
│   ├── repositories/
│   └── use-cases/
└── integration/
    ├── setup.ts          # sobe MongoMemoryServer
    ├── teardown.ts       # derruba MongoMemoryServer
    ├── app-helper.ts     # monta Express sem chamar listen()
    └── routes/
        ├── auth.spec.ts
        └── sessions.spec.ts
```

---

## Comandos

### Testes unitários

```bash
# pela raiz do monorepo
npx turbo run test --filter=@calm-aim/api

# direto
cd apps/api && npx jest
```

### Testes de integração

```bash
# pela raiz do monorepo
npx turbo run test:integration --filter=@calm-aim/api

# direto (mais rápido durante desenvolvimento)
cd apps/api && npx jest --config jest.config.integration.ts
```

Os testes de integração sobem um MongoDB em memória via `mongodb-memory-server`. O binário é baixado automaticamente na primeira execução e fica em cache em `~/.cache/mongodb-binaries`.

### Todos os testes

```bash
npx turbo run test test:integration --filter=@calm-aim/api
```

---

## Cobertura

A cobertura é coletada automaticamente ao rodar os testes de integração. O limiar mínimo é **80%** em linhas, funções, branches e statements.

Se a cobertura cair abaixo do limiar, o Jest falha com exit code 1 e o push é bloqueado.

Para ver o relatório:

```bash
cd apps/api && npx jest --config jest.config.integration.ts --coverageReporters=text
```

---

## Hooks do Husky

### `pre-commit`

Roda antes de cada commit. Executa lint e testes unitários em todos os pacotes:

```sh
npx turbo run lint test
```

O commit é bloqueado se lint ou algum teste unitário falhar.

### `pre-push`

Roda antes de cada `git push`. Executa os testes de integração com verificação de cobertura:

```sh
npx turbo run test:integration --filter=@calm-aim/api
```

O push é bloqueado se:
- Algum teste de integração falhar
- A cobertura de qualquer métrica cair abaixo de 80%
