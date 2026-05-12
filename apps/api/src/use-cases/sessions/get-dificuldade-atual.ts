import type { EventoSessaoRepoContract } from "../../repositories/evento-sessao-cassandra-repo.js";

const DIFICULDADE_INICIAL = 0.3;

export interface DificuldadeAtualOutput {
  sessaoId: string;
  dificuldade: number;
}

export async function getDificuldadeAtual(
  sessaoId: string,
  repo: EventoSessaoRepoContract,
): Promise<DificuldadeAtualOutput> {
  const eventos = await repo.listarUltimosEventos(sessaoId, 1);
  const dificuldade =
    eventos.length > 0 ? eventos[0]!.dificuldade : DIFICULDADE_INICIAL;
  return { sessaoId, dificuldade };
}
