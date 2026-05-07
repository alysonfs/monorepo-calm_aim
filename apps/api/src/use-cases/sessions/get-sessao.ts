export class SessaoNaoEncontradaError extends Error {}
export class AcessoNegadoError extends Error {}

export interface GetSessaoRepo {
  findById(
    id: string,
  ): Promise<{ userId: string; [key: string]: unknown } | null>;
}

export async function getSessao(
  id: string,
  userId: string,
  repo: GetSessaoRepo,
): Promise<unknown> {
  const sessao = await repo.findById(id);
  if (!sessao) throw new SessaoNaoEncontradaError();
  if (sessao.userId.toString() !== userId) throw new AcessoNegadoError();
  return sessao;
}
