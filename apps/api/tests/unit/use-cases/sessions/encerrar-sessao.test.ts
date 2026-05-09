import {
  encerrarSessao,
  SessaoNaoEncontradaError,
  AcessoNegadoError,
  SessaoJaEncerradaError,
  type EncerrarSessaoRepo,
  type Metricas,
} from "../../../../src/use-cases/sessions/encerrar-sessao";

const metricas: Metricas = {
  totalTiros: 20,
  acertos: 15,
  precisao: 75,
  tempoMedioReacaoMs: 320,
};

function makeRepo(
  overrides: Partial<EncerrarSessaoRepo> = {},
): EncerrarSessaoRepo {
  return {
    findById: jest.fn().mockResolvedValue({
      userId: "user1",
      status: "ativa",
    }),
    encerrar: jest.fn().mockResolvedValue({ status: "concluida", metricas }),
    ...overrides,
  };
}

describe("encerrarSessao", () => {
  it("deve encerrar a sessão e retornar com métricas", async () => {
    const repo = makeRepo();
    const result = await encerrarSessao("sess1", "user1", metricas, repo);
    expect(repo.encerrar).toHaveBeenCalledWith("sess1", metricas);
    expect(result).toMatchObject({ status: "concluida" });
  });

  it("deve lançar SessaoNaoEncontradaError quando sessão não existe", async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
    await expect(
      encerrarSessao("sess-inexistente", "user1", metricas, repo),
    ).rejects.toBeInstanceOf(SessaoNaoEncontradaError);
  });

  it("deve lançar AcessoNegadoError quando userId não bate", async () => {
    const repo = makeRepo();
    await expect(
      encerrarSessao("sess1", "outro-user", metricas, repo),
    ).rejects.toBeInstanceOf(AcessoNegadoError);
  });

  it("deve lançar SessaoJaEncerradaError quando status não é ativa", async () => {
    const repo = makeRepo({
      findById: jest.fn().mockResolvedValue({
        userId: "user1",
        status: "concluida",
      }),
    });
    await expect(
      encerrarSessao("sess1", "user1", metricas, repo),
    ).rejects.toBeInstanceOf(SessaoJaEncerradaError);
  });
});
