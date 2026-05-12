# Cassandra — Guia de Uso no Calm Aim

> Por que Cassandra? MongoDB armazena documentos (usuários, sessões). Cassandra armazena séries temporais — eventos de treino (tiros, acertos, emoções) que chegam em alta frequência e precisam de leituras rápidas por intervalo de tempo.

---

## Conceitos Fundamentais

### Comparação com SQL

| SQL (MySQL/Postgres) | Cassandra (CQL) |
|---------------------|-----------------|
| Database | Keyspace |
| Table | Table |
| Primary Key | Partition Key + Clustering Columns |
| Row | Row |
| Index | Materialized View / Secondary Index |
| JOIN | Não existe — modelo desnormalizado |

### Partition Key vs Clustering Columns

```cql
CREATE TABLE eventos_sessao (
  sessao_id  uuid,          -- partition key: define em qual nó o dado vai
  timestamp  timestamp,     -- clustering column: ordena dentro da partição
  tipo       text,
  valor      float,
  PRIMARY KEY (sessao_id, timestamp)
) WITH CLUSTERING ORDER BY (timestamp DESC);
```

- **Partition Key** (`sessao_id`): determina em qual nó do cluster o dado é armazenado. Todas as linhas com o mesmo `sessao_id` ficam juntas no disco — isso é o que torna a leitura rápida.
- **Clustering Columns** (`timestamp`): ordenam as linhas dentro da partição. `DESC` = mais recente primeiro.

### Regra de ouro: modele pela query, não pelos dados

Em Cassandra, você cria uma tabela para cada query de leitura frequente. É normal ter dados duplicados em múltiplas tabelas — isso é intencional (desnormalização).

---

## Keyspace do Projeto

```cql
CREATE KEYSPACE IF NOT EXISTS calm_aim
WITH replication = {
  'class': 'SimpleStrategy',
  'replication_factor': 1
};
```

> `SimpleStrategy` + `replication_factor: 1` = desenvolvimento local. Em produção usaríamos `NetworkTopologyStrategy`.

---

## Tabelas do Projeto

### `eventos_sessao` — séries temporais de treino

```cql
CREATE TABLE IF NOT EXISTS calm_aim.eventos_sessao (
  sessao_id   TEXT,
  evento_id   TIMEUUID,           -- ID único ordenado por tempo
  tipo        TEXT,               -- 'tiro' | 'acerto' | 'miss'
  reacao_ms   INT,                -- tempo de reação em ms (0 para tiros errados)
  dificuldade FLOAT,              -- nível no momento do evento (0.0 – 1.0)
  distancia_m FLOAT,              -- distância câmera→alvo em unidades de cena (≈ metros)
  criado_em   TIMESTAMP,
  PRIMARY KEY (sessao_id, evento_id)
) WITH CLUSTERING ORDER BY (evento_id DESC);
```

> **`distancia_m`** é preenchido apenas nos acertos (tipo `acerto`). Para tiros errados fica `0`. Use para analisar competência por faixa de alcance: curto (< 5 m), médio (5–10 m), longo (> 10 m).

### `estado_emocional` — leituras de voz por sessão

```cql
CREATE TABLE IF NOT EXISTS calm_aim.estado_emocional (
  sessao_id  uuid,
  ts         timestamp,
  nivel      float,     -- 0.0 (calmo) → 1.0 (estressado)
  confianca  float,     -- confiança da leitura (0.0 – 1.0)
  PRIMARY KEY (sessao_id, ts)
) WITH CLUSTERING ORDER BY (ts DESC);
```

### `metricas_dificuldade` — histórico de ajustes adaptativos

```cql
CREATE TABLE IF NOT EXISTS calm_aim.metricas_dificuldade (
  usuario_id  text,
  ts          timestamp,
  sessao_id   uuid,
  dificuldade float,
  motivo      text,     -- 'performance' | 'emocao' | 'manual'
  PRIMARY KEY (usuario_id, ts)
) WITH CLUSTERING ORDER BY (ts DESC);
```

---

## CQL Básico

### Conectar via cqlsh

```bash
# Via docker exec (já funciona hoje)
docker exec -it calm_aim-cassandra-1 cqlsh

# Via web UI (requer profile tools)
docker compose --profile tools up -d cassandra-web
# Acesse: http://localhost:3200
```

### Comandos essenciais no cqlsh

```cql
-- Listar keyspaces
DESCRIBE KEYSPACES;

-- Usar o keyspace do projeto
USE calm_aim;

-- Listar tabelas
DESCRIBE TABLES;

-- Ver schema de uma tabela
DESCRIBE TABLE eventos_sessao;

-- Inserir (upsert — sem erro se já existir)
INSERT INTO eventos_sessao (sessao_id, ts, tipo, reacao_ms, dificuldade)
VALUES (uuid(), toTimestamp(now()), 'tiro', 312, 0.5);

-- Buscar eventos de uma sessão (precisa do partition key)
SELECT * FROM eventos_sessao
WHERE sessao_id = <uuid>
LIMIT 50;

-- Buscar por intervalo de tempo
SELECT * FROM eventos_sessao
WHERE sessao_id = <uuid>
  AND ts >= '2026-05-11 00:00:00'
  AND ts <= '2026-05-11 23:59:59';

-- Truncar tabela (apaga tudo — cuidado)
TRUNCATE eventos_sessao;
```

### Diferenças importantes do SQL

```cql
-- ❌ NÃO EXISTE em Cassandra
SELECT * FROM eventos_sessao WHERE tipo = 'tiro';  -- sem partition key = full scan

-- ✅ CORRETO — sempre filtre pelo partition key primeiro
SELECT * FROM eventos_sessao
WHERE sessao_id = <uuid> AND tipo = 'tiro'
ALLOW FILTERING;  -- evite ALLOW FILTERING em produção, crie tabela separada

-- ❌ NÃO EXISTE
SELECT * FROM a JOIN b ON a.id = b.id;

-- ❌ NÃO EXISTE
UPDATE eventos_sessao SET tipo = 'acerto' WHERE ts > '2026-01-01';  -- sem partition key
```

---

## Ferramentas de Visualização

### 1. cqlsh via docker exec (imediato, zero setup)

```bash
docker exec -it calm_aim-cassandra-1 cqlsh
```

### 2. Cassandra Web UI via docker-compose

> A imagem `nicholasmoen/cassandra-web` foi removida do Docker Hub. Use as opções abaixo.

### 3. TablePlus (melhor UX para macOS — free tier)

- Download: tableplus.com
- Free tier: 2 conexões, 2 abas — suficiente para desenvolvimento
- Suporte nativo ao Cassandra: **Connection → Cassandra → host: localhost, port: 9042**

### 4. DBeaver Community Edition (gratuito, cross-platform)

O suporte ao Cassandra via driver JDBC está disponível na CE:
1. Baixe DBeaver CE em dbeaver.io
2. File → New Database Connection → Cassandra
3. Configure o driver DataStax (download automático pelo DBeaver)
4. Host: `localhost`, Port: `9042`

---

## Comandos DDL de Manutenção

Use esses comandos quando o schema do projeto evoluir e o container Cassandra já tiver dados (o `CREATE TABLE IF NOT EXISTS` no init não altera tabelas existentes).

### Executar sem abrir shell interativo

```bash
# Sintaxe geral
docker exec calm_aim-cassandra-1 cqlsh -e "<CQL>"

# Verificar schema atual de uma tabela
docker exec calm_aim-cassandra-1 cqlsh -e "DESCRIBE TABLE calm_aim.eventos_sessao;"

# Listar todas as tabelas do keyspace
docker exec calm_aim-cassandra-1 cqlsh -e "DESCRIBE TABLES;" calm_aim

# Verificar dados recentes
docker exec calm_aim-cassandra-1 cqlsh -e "SELECT * FROM calm_aim.eventos_sessao LIMIT 5;"
```

### Adicionar coluna a tabela existente

```bash
docker exec calm_aim-cassandra-1 cqlsh -e \
  "ALTER TABLE calm_aim.eventos_sessao ADD distancia_m float;"
```

> **Limitações do `ALTER TABLE` no Cassandra:**
> - Pode **adicionar** colunas normais.
> - **Não pode** remover, renomear ou alterar tipo de colunas existentes.
> - **Não pode** alterar a `PRIMARY KEY` (partition key ou clustering columns).
> - Se precisar mudar a PK, é necessário criar uma tabela nova e migrar os dados.

### Remover uma coluna

```bash
# Cuidado: apaga todos os dados da coluna
docker exec calm_aim-cassandra-1 cqlsh -e \
  "ALTER TABLE calm_aim.eventos_sessao DROP nome_da_coluna;"
```

### Resetar schema completo (dev local — apaga tudo)

```bash
# 1. Apaga o keyspace inteiro
docker exec calm_aim-cassandra-1 cqlsh -e "DROP KEYSPACE IF EXISTS calm_aim;"

# 2. Recria a partir do arquivo de schema
docker exec -i calm_aim-cassandra-1 cqlsh < apps/api/src/db/cassandra-schema.cql
```

### Shell interativo (para sessões longas de exploração)

```bash
docker exec -it calm_aim-cassandra-1 cqlsh
# dentro do cqlsh:
USE calm_aim;
DESCRIBE TABLES;
SELECT * FROM eventos_sessao LIMIT 10;
exit
```

---

## Driver no Node.js (`apps/api`)

O projeto usa `cassandra-driver` da DataStax:

```ts
import { Client } from "cassandra-driver";

const client = new Client({
  contactPoints: [process.env.CASSANDRA_HOST ?? "localhost"],
  localDataCenter: "datacenter1",
  keyspace: "calm_aim",
});

await client.connect();

// Prepared statement (evita injection, melhor performance)
const query = "INSERT INTO eventos_sessao (sessao_id, ts, tipo) VALUES (?, ?, ?)";
await client.execute(query, [sessaoId, new Date(), "tiro"], { prepare: true });
```

### UUID no Node.js

```ts
import { types } from "cassandra-driver";

const sessaoId = types.Uuid.fromString("550e8400-e29b-41d4-a716-446655440000");
// ou gerar novo:
const novoId = types.TimeUuid.now();
```

---

## Diferenças de Consistência

```ts
// Leitura mais rápida (padrão local dev)
await client.execute(query, params, { consistency: types.consistencies.one });

// Escrita garantida (padrão recomendado)
await client.execute(query, params, { consistency: types.consistencies.local_quorum });
```

Em desenvolvimento com `replication_factor: 1`, `ONE` e `QUORUM` são equivalentes.
