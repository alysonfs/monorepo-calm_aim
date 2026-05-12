import { registrarEmocao } from "../../../../src/use-cases/sessions/registrar-emocao.js";
import type { EventoSessaoRepoContract } from "../../../../src/repositories/evento-sessao-cassandra-repo.js";

function makeRepo(): EventoSessaoRepoContract {
  return {
    registrarEvento: jest.fn(),
    listarUltimosEventos: jest.fn(),
    registrarEmocao: jest.fn().mockResolvedValue(undefined),
    registrarDificuldade: jest.fn(),
  };
}

describe("registrarEmocao", () => {
  it("deve persistir leitura emocional válida", async () => {
    const repo = makeRepo();
    await registrarEmocao({ sessaoId: "s1", nivel: 0.6 }, repo);
    expect(repo.registrarEmocao).toHaveBeenCalledWith({ sessaoId: "s1", nivel: 0.6 });
  });

  it("deve lançar RangeError para nivel > 1", async () => {
    const repo = makeRepo();
    await expect(registrarEmocao({ sessaoId: "s1", nivel: 1.1 }, repo)).rejects.toBeInstanceOf(RangeError);
  });

  it("deve lançar RangeError para nivel < 0", async () => {
    const repo = makeRepo();
    await expect(registrarEmocao({ sessaoId: "s1", nivel: -0.1 }, repo)).rejects.toBeInstanceOf(RangeError);
  });

  it("deve aceitar nivel nos limites exatos 0 e 1", async () => {
    const repo = makeRepo();
    await expect(registrarEmocao({ sessaoId: "s1", nivel: 0 }, repo)).resolves.toBeUndefined();
    await expect(registrarEmocao({ sessaoId: "s1", nivel: 1 }, repo)).resolves.toBeUndefined();
  });
});
