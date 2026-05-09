export class SessaoNaoEncontradaError extends Error {}
export class AcessoNegadoError extends Error {}
export class SessaoJaEncerradaError extends Error {}

export interface Metricas {
  totalTiros: number;
  acertos: number;
  precisao: number;
  tempoMedioReacaoMs: number;
}

export interface EncerrarSessaoRepo {
  findById(
    id: string,
  ): Promise<{ userId: string; status: string; [key: string]: unknown } | null>;
  encerrar(id: string, metricas: Metricas): Promise<unknown>;
}

export async function encerrarSessao(
  id: string,
  userId: string,
  metricas: Metricas,
  repo: EncerrarSessaoRepo,
): Promise<unknown> {
  const sessao = await repo.findById(id);
  if (!sessao) throw new SessaoNaoEncontradaError();
  if (sessao.userId !== userId) throw new AcessoNegadoError();
  if (sessao.status !== "ativa") throw new SessaoJaEncerradaError();
  return repo.encerrar(id, metricas);
}
