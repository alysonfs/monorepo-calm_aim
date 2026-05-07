export class ModoInvalidoError extends Error {}

export interface CreateSessaoRepo {
  criar(userId: string, modo: "livre" | "guiado"): Promise<unknown>;
}

export async function createSessao(
  userId: string,
  modo: unknown,
  repo: CreateSessaoRepo,
): Promise<unknown> {
  if (modo !== "livre" && modo !== "guiado") throw new ModoInvalidoError();
  return repo.criar(userId, modo);
}
