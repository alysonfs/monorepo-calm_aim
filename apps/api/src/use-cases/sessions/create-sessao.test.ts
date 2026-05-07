import { createSessao, ModoInvalidoError } from "./create-sessao";

const makeRepo = () => ({
  criar: jest.fn().mockResolvedValue({ id: "1", modo: "livre", userId: "u1" }),
});

describe("createSessao", () => {
  it("deve criar sessão com modo válido", async () => {
    const repo = makeRepo();
    const result = await createSessao("u1", "livre", repo);
    expect(repo.criar).toHaveBeenCalledWith("u1", "livre");
    expect(result).toHaveProperty("id");
  });

  it("deve lançar ModoInvalidoError para modo inválido", async () => {
    await expect(
      createSessao("u1", "invalido", makeRepo()),
    ).rejects.toBeInstanceOf(ModoInvalidoError);
  });

  it("deve aceitar modo guiado", async () => {
    const repo = makeRepo();
    await createSessao("u1", "guiado", repo);
    expect(repo.criar).toHaveBeenCalledWith("u1", "guiado");
  });
});
