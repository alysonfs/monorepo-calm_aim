# Versões e Compatibilidade

Este documento registra as versões exatas de todas as dependências críticas do projeto.
Serve como referência para onboarding, reprodução de ambientes e auditoria de segurança.

---

## Runtime

| Recurso | Versão mínima | Versão em uso |
|---------|--------------|---------------|
| Node.js | ≥ 20 | 23.9.0 |
| npm | ≥ 10 | 10.9.2 |

---

## Infraestrutura (Docker)

| Serviço | Imagem | Tag usada | Versão estável recomendada |
|---------|--------|-----------|---------------------------|
| MongoDB | `mongo` | `7` | 7.0.x (LTS) |
| Redis | `redis` | `7-alpine` | 7.x |
| Cassandra | `cassandra` | `4.1` | 4.1.x |

### Imagens do Dockerfile (API)

| Estágio | Imagem | Notas |
|---------|--------|-------|
| builder | `node:22-alpine` | Apenas para build, não vai para produção |
| runner | `gcr.io/distroless/nodejs22-debian12` | Imagem de produção, sem shell, sem root |

---

## Dependências de Produção (`apps/api`)

| Pacote | Versão declarada | Versão resolvida |
|--------|-----------------|-----------------|
| express | ^4.21.2 | 4.22.1 |
| mongoose | ^9.6.1 | 9.6.1 |
| jsonwebtoken | ^9.0.3 | 9.0.3 |
| bcrypt | ^6.0.0 | 6.0.0 |
| dotenv | ^16.5.0 | 16.6.1 |
| tsyringe | ^4.10.0 | 4.10.0 |
| reflect-metadata | ^0.2.2 | 0.2.2 |

---

## Dependências de Desenvolvimento

| Pacote | Versão declarada | Versão resolvida |
|--------|-----------------|-----------------|
| typescript | ^5.7.3 | 5.9.3 |
| ts-jest | ^29.4.9 | 29.4.9 |
| jest | ^29.7.0 | 29.7.0 |
| supertest | ^7.2.2 | 7.2.2 |
| mongodb-memory-server | ^11.1.0 | 11.1.0 |
| tsx | ^4.19.2 | 4.21.0 |
| turbo | ^2.3.3 | 2.9.9 |
| husky | ^9.1.7 | 9.1.7 |

---

## MongoDB para Testes (MongoMemoryServer)

O `mongodb-memory-server` baixa um binário do MongoDB na primeira execução.

| Plataforma | Versão compatível | Status |
|------------|-------------------|--------|
| macOS x64 (Intel) | `6.0.9` | ✅ Testado |
| macOS arm64 (M1/M2) | A confirmar | ⚠️ Requer teste |
| Linux x64 | `7.0.x` | A confirmar |
| Windows x64 | A confirmar | A confirmar |

**Variável de ambiente usada nos scripts:**
```
MONGOMS_VERSION=6.0.9
```

O binário é cacheado em `~/.cache/mongodb-binaries/` (macOS/Linux) ou `%LOCALAPPDATA%\mongodb-binaries\` (Windows).

> **Nota:** A versão 8.x causou `SIGABRT` no macOS Intel neste ambiente. Fixado em 6.0.9 nos scripts `test:integration` e `test:coverage`.

---

## Compatibilidade de Plataformas

| Recurso | macOS | Linux | Windows |
|---------|-------|-------|---------|
| Node.js 20+ | ✅ | ✅ | ✅ |
| Docker + Compose | ✅ (Colima ou Docker Desktop) | ✅ | ✅ (WSL2 recomendado) |
| `mongodb-memory-server` | ✅ (6.0.9 Intel) | A validar | A validar |
| Husky hooks | ✅ | ✅ | ⚠️ Git Bash ou WSL2 |
| `tsx` / `ts-jest` | ✅ | ✅ | ✅ |

### Notas por plataforma

**macOS (Colima):**
- Docker via Colima. Porta 5173 ocupada pelo Colima SSH → web usa `5174:80`.
- `mongod` binários x64 rodam via Rosetta em M1/M2 — ainda não validado.

**Windows:**
- Husky requer Git Bash ou WSL2. Scripts com `#!/usr/bin/env sh` não funcionam no CMD/PowerShell nativos.
- `MONGOMS_VERSION` no script pode precisar de sintaxe diferente (`set MONGOMS_VERSION=6.0.9 &&`). Considerar mover para `.env.test`.

**Linux:**
- Sem restrições conhecidas. Docker Engine nativo.

---

## Como manter este documento atualizado

1. Ao atualizar uma dependência, atualizar a coluna "Versão resolvida" com o valor de `package-lock.json`.
2. Ao trocar uma imagem Docker, atualizar a tabela de infraestrutura.
3. Ao validar em nova plataforma, preencher a tabela de compatibilidade.
4. Ao encontrar vulnerabilidade, registrar em `docs/wiki/decisoes.md` com o CVE e a decisão tomada.
