import { getCassandraClient } from "../db/cassandra.js";

const KS = process.env["CASSANDRA_KEYSPACE"] ?? "calm_aim";

export interface EventoSessao {
  sessaoId: string;
  tipo: "tiro" | "acerto" | "miss";
  reacaoMs: number;
  dificuldade: number;
  distanciaM: number;
  criadoEm: Date;
}

export interface LeituraEmocional {
  sessaoId: string;
  nivel: number;
}

export interface EventoSessaoRepoContract {
  registrarEvento(evento: Omit<EventoSessao, "criadoEm">): Promise<void>;
  listarUltimosEventos(
    sessaoId: string,
    limite: number,
  ): Promise<EventoSessao[]>;
  registrarEmocao(leitura: LeituraEmocional): Promise<void>;
  registrarDificuldade(sessaoId: string, dificuldade: number): Promise<void>;
}

export class EventoSessaoCassandraRepo implements EventoSessaoRepoContract {
  async registrarEvento(evento: Omit<EventoSessao, "criadoEm">): Promise<void> {
    const client = getCassandraClient();
    await client.execute(
      `INSERT INTO ${KS}.eventos_sessao (sessao_id, evento_id, tipo, reacao_ms, dificuldade, distancia_m, criado_em)
       VALUES (?, now(), ?, ?, ?, ?, toTimestamp(now()))`,

      [
        evento.sessaoId,
        evento.tipo,
        evento.reacaoMs,
        evento.dificuldade,
        evento.distanciaM,
      ],
      { prepare: true },
    );
  }

  async listarUltimosEventos(
    sessaoId: string,
    limite: number,
  ): Promise<EventoSessao[]> {
    const client = getCassandraClient();
    const result = await client.execute(
      `SELECT sessao_id, tipo, reacao_ms, dificuldade, criado_em
       FROM ${KS}.eventos_sessao WHERE sessao_id = ? LIMIT ?`,

      [sessaoId, limite],
      { prepare: true },
    );
    return result.rows.map((row) => ({
      sessaoId: row["sessao_id"] as string,
      tipo: row["tipo"] as "tiro" | "acerto" | "miss",
      reacaoMs: row["reacao_ms"] as number,
      dificuldade: row["dificuldade"] as number,
      distanciaM: (row["distancia_m"] as number | null) ?? 0,
      criadoEm: row["criado_em"] as Date,
    }));
  }

  async registrarEmocao(leitura: LeituraEmocional): Promise<void> {
    const client = getCassandraClient();
    await client.execute(
      `INSERT INTO ${KS}.estado_emocional (sessao_id, lido_em, nivel)
       VALUES (?, now(), ?)`,

      [leitura.sessaoId, leitura.nivel],
      { prepare: true },
    );
  }

  async registrarDificuldade(
    sessaoId: string,
    dificuldade: number,
  ): Promise<void> {
    const client = getCassandraClient();
    await client.execute(
      `INSERT INTO ${KS}.metricas_dificuldade (sessao_id, calculado_em, dificuldade)
       VALUES (?, now(), ?)`,

      [sessaoId, dificuldade],
      { prepare: true },
    );
  }
}

// Singleton para uso no container DI
let _instance: EventoSessaoCassandraRepo | null = null;
export function getEventoSessaoRepo(): EventoSessaoCassandraRepo {
  if (!_instance) _instance = new EventoSessaoCassandraRepo();
  return _instance;
}
