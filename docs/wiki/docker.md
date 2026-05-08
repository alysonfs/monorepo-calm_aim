# Docker — Comandos do Projeto

Referência rápida dos comandos Docker e Docker Compose usados neste projeto.

> macOS: o daemon Docker é o **Colima**. Sempre inicie com `colima start` antes de usar Docker.

---

## Colima (macOS)

```bash
colima start          # inicia o daemon Docker
colima stop           # para o daemon
colima restart        # reinicia (útil se o Docker travar)
colima status         # verifica se está rodando
```

---

## Subir e parar serviços

```bash
# Subir todos os serviços em background
docker compose up -d

# Subir apenas um serviço
docker compose up -d api
docker compose up -d web

# Parar todos os serviços
docker compose down

# Parar e remover volumes (apaga dados do banco!)
docker compose down -v
```

---

## Rebuild

```bash
# Reconstruir e reiniciar tudo
docker compose up -d --build

# Reconstruir apenas um serviço
docker compose up -d --build api
docker compose up -d --build web
```

Use `--build` sempre que alterar código ou dependências da API/Web.

---

## Status e saúde

```bash
# Ver todos os containers do projeto
docker compose ps

# Ver todos os containers rodando no sistema
docker ps

# Aguardar serviços ficarem healthy
watch docker compose ps
```

Estados possíveis: `Up`, `Up (healthy)`, `Up (unhealthy)`, `Exited`.

---

## Logs

```bash
# Logs de um serviço (últimas linhas)
docker compose logs api
docker compose logs web
docker compose logs mongo

# Logs em tempo real (follow)
docker compose logs -f api

# Últimas 50 linhas
docker compose logs --tail 50 api
```

---

## Executar comandos dentro de containers

```bash
# Shell no container mongo
docker exec -it calm_aim-mongo-1 mongosh

# Shell no container redis
docker exec -it calm_aim-redis-1 redis-cli

# Shell no container cassandra
docker exec -it calm_aim-cassandra-1 cqlsh
```

> O container da API usa imagem distroless — não tem shell disponível.

---

## Limpeza

```bash
# Remover containers parados
docker container prune

# Remover imagens não utilizadas
docker image prune

# Remover tudo (containers, imagens, volumes, redes não utilizados)
docker system prune -a

# Remover um container específico pelo nome
docker rm nice_pascal
```

---

## Inspecionar

```bash
# Ver detalhes de um container (env vars, mounts, etc.)
docker inspect calm_aim-api-1

# Ver uso de recursos em tempo real
docker stats
```

---

## Fluxo típico do dia a dia

```bash
# Manhã: iniciar tudo
colima start
docker compose up -d

# Depois de alterar código da API ou Web
docker compose up -d --build api
docker compose up -d --build web

# Ver se está tudo ok
docker compose ps

# Fim do dia (opcional)
docker compose down
colima stop
```
