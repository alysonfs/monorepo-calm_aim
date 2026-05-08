export interface ListSessoesRepo {
  findByUserId(userId: string): Promise<unknown[]>;
}

export async function listSessoes(
  userId: string,
  repo: ListSessoesRepo,
): Promise<unknown[]> {
  return repo.findByUserId(userId);
}
