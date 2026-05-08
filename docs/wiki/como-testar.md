# Como Testar Localmente

Guia completo para subir a aplicação do zero e ver tudo funcionando.

---

## Pré-requisitos

- Node.js ≥ 20 e npm ≥ 10
- Docker + Docker Compose (macOS: [Colima](https://github.com/abiosoft/colima) ou Docker Desktop)
- Git

---

## 1. Clonar e instalar dependências

```bash
git clone <repo-url> calm_aim
cd calm_aim
npm install
```

---

## 2. Subir a infraestrutura

```bash
# macOS com Colima — iniciar o daemon Docker primeiro:
colima start

# Subir MongoDB, Redis, Cassandra, API e Web em background:
docker compose up -d
```

Aguardar todos os serviços ficarem healthy (pode levar ~30s na primeira vez):

```bash
docker compose ps
```

Saída esperada:

```
NAME                   IMAGE            STATUS
calm_aim-api-1         calm_aim-api     Up (healthy)
calm_aim-web-1         calm_aim-web     Up
calm_aim-mongo-1       mongo:7          Up (healthy)
calm_aim-redis-1       redis:7-alpine   Up (healthy)
calm_aim-cassandra-1   cassandra:4.1    Up (healthy)
```

---

## 3. Popular o banco (primeira vez)

O seed cria o usuário root definido em `apps/api/.env`.

> **Atenção:** o seed roda **fora** do Docker, então a `MONGO_URI` precisa apontar para `localhost`:

```bash
MONGO_URI=mongodb://localhost:27017/calm_aim npm run seed --workspace=apps/api
```

Saída esperada:
```
Usuário root criado: alysonforever@gmail.com
```

Credenciais padrão (configuradas em `apps/api/.env`):
- Email: `alysonforever@gmail.com`
- Senha: `asdqwe123`

> Para usar credenciais diferentes, edite `SEED_ROOT_EMAIL` e `SEED_ROOT_PASSWORD` em `apps/api/.env` antes de rodar o seed.

---

## 4. Verificar que a API está respondendo

```bash
curl http://localhost:3001/health
# {"status":"ok","timestamp":...}
```

---

## 5. Acessar a interface web

Abrir no navegador: **http://localhost:5174**

> Porta 5174 (e não 5173) porque o Colima ocupa a 5173.

Fazer login com as credenciais do seed.

---

## 6. Testar a API manualmente (opcional)

### Registrar usuário

```bash
curl -s -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@calm.com","password":"senha123"}'
# {"message":"Usuário criado"}
```

### Login

```bash
LOGIN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@calm.com","password":"senha123"}')
echo $LOGIN
# {"accessToken":"...","refreshToken":"..."}
```

### Criar sessão (autenticado)

```bash
TOKEN=$(echo $LOGIN | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

curl -s -X POST http://localhost:3001/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"modo":"livre"}'
# {"userId":"...","modo":"livre","status":"ativa",...}
```

---

## 7. Rodar os testes automatizados

### Testes unitários

```bash
npx turbo run test
# 31/31 passing
```

### Testes de integração

```bash
npx turbo run test:integration --filter=@calm-aim/api
# 17/17 passing, cobertura ≥ 80%
```

> Ver [docs/wiki/testes.md](testes.md) para detalhes sobre a configuração dos testes.

---

## Problemas comuns

### `docker compose up` falha — daemon não está rodando

```bash
colima start   # macOS
```

### Seed trava sem output

O seed usa a `MONGO_URI` do `.env` que aponta para o hostname `mongo` (dentro do Docker). Rodar sempre com a variável sobrescrita:

```bash
MONGO_URI=mongodb://localhost:27017/calm_aim npm run seed --workspace=apps/api
```

### API aparece como `unhealthy` no `docker compose ps`

A imagem distroless não tem `wget`. O healthcheck correto usa `node` diretamente. Se ainda aparecer unhealthy após atualizar o `docker-compose.yml`, recriar o container:

```bash
docker compose up -d --force-recreate api
```

### Porta 5174 já em uso

```bash
lsof -i :5174   # identificar o processo
# ou mudar a porta no docker-compose.yml
```
