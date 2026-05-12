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

export async function connectCassandra(): Promise<void> {
  const c = getCassandraClient();
  await c.connect();
  console.log("[api] Cassandra conectado");
}

export async function disconnectCassandra(): Promise<void> {
  if (client) {
    await client.shutdown();
    client = null;
  }
}
