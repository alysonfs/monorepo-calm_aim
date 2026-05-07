import {
  getSessao,
  SessaoNaoEncontradaError,
  AcessoNegadoError,
} from "./get-sessao";

const makeRepo = (
  sessao: { userId: string; [key: string]: unknown } | null,
) => ({
  findById: jest.fn().mockResolvedValue(sessao),
});

describe("getSessao", () => {
  it("deve retornar sessão quando usuário é o dono", async () => {
    const repo = makeRepo({ userId: "u1", id: "s1" });
    const result = await getSessao("s1", "u1", repo);
    expect(result).toHaveProperty("userId", "u1");
  });

  it("deve lançar SessaoNaoEncontradaError se sessão não existe", async () => {
    await expect(getSessao("s1", "u1", makeRepo(null))).rejects.toBeInstanceOf(
      SessaoNaoEncontradaError,
    );
  });

  it("deve lançar AcessoNegadoError se userId não bate", async () => {
    const repo = makeRepo({ userId: "outro", id: "s1" });
    await expect(getSessao("s1", "u1", repo)).rejects.toBeInstanceOf(
      AcessoNegadoError,
    );
  });
});
