import type { EventoSessaoRepoContract } from "../../repositories/evento-sessao-cassandra-repo.js";

export interface RegistrarEmocaoInput {
  sessaoId: string;
  nivel: number;
}

export async function registrarEmocao(
  input: RegistrarEmocaoInput,
  repo: EventoSessaoRepoContract,
): Promise<void> {
  if (input.nivel < 0 || input.nivel > 1) {
    throw new RangeError("nivel deve ser entre 0 e 1");
  }
  await repo.registrarEmocao({ sessaoId: input.sessaoId, nivel: input.nivel });
}
