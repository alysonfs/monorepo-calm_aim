import type { EventoSessaoRepoContract } from "../../repositories/evento-sessao-cassandra-repo.js";
import { calcularDificuldade } from "./calcular-dificuldade.js";

export interface RegistrarEventoInput {
  sessaoId: string;
  tipo: "tiro" | "acerto" | "miss";
  reacaoMs: number;
  distanciaM: number;
}

export interface RegistrarEventoOutput {
  dificuldade: number;
}

export async function registrarEventoSessao(
  input: RegistrarEventoInput,
  repo: EventoSessaoRepoContract,
  dificuldadeAtual: number,
): Promise<RegistrarEventoOutput> {
  await repo.registrarEvento({
    sessaoId: input.sessaoId,
    tipo: input.tipo,
    reacaoMs: input.reacaoMs,
    distanciaM: input.distanciaM,
    dificuldade: dificuldadeAtual,
  });

  const historico = await repo.listarUltimosEventos(input.sessaoId, 20);
  const novaDificuldade = calcularDificuldade(
    { eventos: historico },
    dificuldadeAtual,
  );

  if (novaDificuldade !== dificuldadeAtual) {
    await repo.registrarDificuldade(input.sessaoId, novaDificuldade);
  }

  return { dificuldade: novaDificuldade };
}
