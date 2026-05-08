import { listSessoes } from "../../../../src/use-cases/sessions/list-sessoes";

const makeRepo = (sessoes: unknown[]) => ({
  findByUserId: jest.fn().mockResolvedValue(sessoes),
});

describe("listSessoes", () => {
  it("deve retornar lista de sessões do usuário", async () => {
    const sessoes = [
      { _id: "s1", userId: "u1", modo: "livre" },
      { _id: "s2", userId: "u1", modo: "guiado" },
    ];
    const repo = makeRepo(sessoes);
    const result = await listSessoes("u1", repo);
    expect(result).toHaveLength(2);
    expect(repo.findByUserId).toHaveBeenCalledWith("u1");
  });

  it("deve retornar lista vazia quando usuário não tem sessões", async () => {
    const repo = makeRepo([]);
    const result = await listSessoes("u1", repo);
    expect(result).toEqual([]);
  });
});
