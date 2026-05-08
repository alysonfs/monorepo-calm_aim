# Banco de Dados

## MongoDB

### Connection string (local / Docker)

```
mongodb://localhost:27017
```

Database: `calm_aim`

### MongoDB Compass

1. Abrir o Compass
2. Clicar em **"Add new connection"**
3. Colar a URI: `mongodb://localhost:27017`
4. Clicar em **Connect**
5. Navegar até a database `calm_aim`

> O container `mongo` precisa estar rodando: `docker compose up -d mongo`

### Collections

| Collection | Conteúdo |
|------------|----------|
| `users`    | Usuários cadastrados (email, hash da senha, timestamps) |
| `sessions` | Sessões de treino (modo, status, timestamps) |

### Inspecionar via terminal

```bash
# Entrar no shell do mongo
docker exec -it calm_aim-mongo-1 mongosh

# Listar databases
show dbs

# Usar o banco do projeto
use calm_aim

# Ver usuários
db.users.find().pretty()

# Ver sessões
db.sessions.find().pretty()
```

## Redis

### Connection string

```
redis://localhost:6379
```

Inspecionar via terminal:

```bash
docker exec -it calm_aim-redis-1 redis-cli
```

## Cassandra

### Endpoint

```
localhost:9042
```

Inspecionar via terminal:

```bash
docker exec -it calm_aim-cassandra-1 cqlsh
```
