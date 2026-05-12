import { registrarEventoSessao } from "../../../../src/use-cases/sessions/registrar-evento-sessao.js";
import type { EventoSessaoRepoContract } from "../../../../src/repositories/evento-sessao-cassandra-repo.js";

function makeRepo(eventos = []): EventoSessaoRepoContract {
  return {
    registrarEvento: jest.fn().mockResolvedValue(undefined),
    listarUltimosEventos: jest.fn().mockResolvedValue(eventos),
    registrarEmocao: jest.fn().mockResolvedValue(undefined),
    registrarDificuldade: jest.fn().mockResolvedValue(undefined),
  };
}

describe("registrarEventoSessao", () => {
  it("deve chamar registrarEvento com os dados corretos", async () => {
    const repo = makeRepo();
    await registrarEventoSessao(
      { sessaoId: "s1", tipo: "acerto", reacaoMs: 300 },
      repo,
      0.3,
    );
    expect(repo.registrarEvento).toHaveBeenCalledWith(
      expect.objectContaining({ sessaoId: "s1", tipo: "acerto", reacaoMs: 300 }),
    );
  });

  it("deve retornar a nova dificuldade calculada", async () => {
    const repo = makeRepo();
    const { dificuldade } = await registrarEventoSessao(
      { sessaoId: "s1", tipo: "tiro", reacaoMs: 0 },
      repo,
      0.5,
    );
    expect(typeof dificuldade).toBe("number");
  });

  it("deve chamar registrarDificuldade quando a dificuldade muda", async () => {
    // 8 acertos rápidos → dificuldade vai subir
    const eventos = Array.from({ length: 8 }, () => ({
      sessaoId: "s1",
      tipo: "acerto" as const,
      reacaoMs: 150,
      dificuldade: 0.3,
      criadoEm: new Date(),
    }));
    const repo = makeRepo(eventos);
    await registrarEventoSessao(
      { sessaoId: "s1", tipo: "acerto", reacaoMs: 150 },
      repo,
      0.3,
    );
    expect(repo.registrarDificuldade).toHaveBeenCalled();
  });
});
