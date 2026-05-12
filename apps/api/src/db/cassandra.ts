import cassandra from "cassandra-driver";

let client: cassandra.Client | null = null;

export function getCassandraClient(): cassandra.Client {
  if (client) return client;

  const contactPoints = (process.env["CASSANDRA_HOST"] ?? "localhost").split(
    ",",
  );
  const localDataCenter = process.env["CASSANDRA_DATACENTER"] ?? "datacenter1";

  client = new cassandra.Client({
    contactPoints,
    localDataCenter,
  });

  return client;
}

const KEYSPACE = process.env["CASSANDRA_KEYSPACE"] ?? "calm_aim";

const DDL = [
  `CREATE KEYSPACE IF NOT EXISTS ${KEYSPACE}
     WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}`,

  `CREATE TABLE IF NOT EXISTS ${KEYSPACE}.eventos_sessao (
     sessao_id    TEXT,
     evento_id    TIMEUUID,
     tipo         TEXT,
     reacao_ms    INT,
     dificuldade  FLOAT,
     criado_em    TIMESTAMP,
     PRIMARY KEY (sessao_id, evento_id)
   ) WITH CLUSTERING ORDER BY (evento_id DESC)`,

  `CREATE TABLE IF NOT EXISTS ${KEYSPACE}.estado_emocional (
     sessao_id  TEXT,
     lido_em    TIMEUUID,
     nivel      FLOAT,
     PRIMARY KEY (sessao_id, lido_em)
   ) WITH CLUSTERING ORDER BY (lido_em DESC)`,

  `CREATE TABLE IF NOT EXISTS ${KEYSPACE}.metricas_dificuldade (
     sessao_id    TEXT,
     calculado_em TIMEUUID,
     dificuldade  FLOAT,
     PRIMARY KEY (sessao_id, calculado_em)
   ) WITH CLUSTERING ORDER BY (calculado_em DESC)`,
];

export async function connectCassandra(): Promise<void> {
  const c = getCassandraClient();
  await c.connect();
  for (const stmt of DDL) {
    await c.execute(stmt);
  }
  console.log("[api] Cassandra conectado e schema aplicado");
}

export async function disconnectCassandra(): Promise<void> {
  if (client) {
    await client.shutdown();
    client = null;
  }
}
