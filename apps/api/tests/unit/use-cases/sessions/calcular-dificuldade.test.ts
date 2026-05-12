import { calcularDificuldade } from "../../../../src/use-cases/sessions/calcular-dificuldade.js";
import type { EventoSessao } from "../../../../src/repositories/evento-sessao-cassandra-repo.js";

function makeEvento(tipo: "tiro" | "acerto" | "miss", reacaoMs = 300): EventoSessao {
  return {
    sessaoId: "s1",
    tipo,
    reacaoMs,
    dificuldade: 0.3,
    distanciaM: 0,
    criadoEm: new Date(),
  };
}

describe("calcularDificuldade", () => {
  it("deve retornar dificuldade atual quando há menos de 3 eventos", () => {
    const resultado = calcularDificuldade({ eventos: [makeEvento("acerto")] }, 0.5);
    expect(resultado).toBe(0.5);
  });

  it("deve aumentar dificuldade com precisão alta e reação rápida", () => {
    const eventos = [
      makeEvento("acerto", 200),
      makeEvento("acerto", 250),
      makeEvento("acerto", 180),
      makeEvento("tiro"),
    ];
    const resultado = calcularDificuldade({ eventos }, 0.3);
    expect(resultado).toBeGreaterThan(0.3);
  });

  it("deve reduzir dificuldade com precisão baixa", () => {
    const eventos = [
      makeEvento("tiro"),
      makeEvento("tiro"),
      makeEvento("tiro"),
      makeEvento("tiro"),
      makeEvento("acerto", 800),
    ];
    const resultado = calcularDificuldade({ eventos }, 0.5);
    expect(resultado).toBeLessThan(0.5);
  });

  it("deve reduzir dificuldade com reação lenta mesmo com precisão ok", () => {
    const eventos = [
      makeEvento("acerto", 2600),
      makeEvento("acerto", 2800),
      makeEvento("acerto", 2700),
    ];
    const resultado = calcularDificuldade({ eventos }, 0.4);
    expect(resultado).toBeLessThan(0.4);
  });

  it("deve manter dificuldade no limite máximo de 1.0", () => {
    const eventos = Array.from({ length: 10 }, () => makeEvento("acerto", 100));
    const resultado = calcularDificuldade({ eventos }, 1.0);
    expect(resultado).toBe(1.0);
  });

  it("deve manter dificuldade no limite mínimo de 0.0", () => {
    const eventos = [makeEvento("tiro"), makeEvento("tiro"), makeEvento("tiro")];
    const resultado = calcularDificuldade({ eventos }, 0.0);
    expect(resultado).toBe(0.0);
  });

  it("deve detectar melhora contínua e subir progressivamente", () => {
    const d1 = calcularDificuldade(
      { eventos: Array.from({ length: 8 }, () => makeEvento("acerto", 200)) },
      0.3,
    );
    const d2 = calcularDificuldade(
      { eventos: Array.from({ length: 8 }, () => makeEvento("acerto", 200)) },
      d1,
    );
    expect(d2).toBeGreaterThan(d1);
  });

  it("deve detectar queda brusca e reduzir rapidamente", () => {
    const eventos = Array.from({ length: 5 }, () => makeEvento("tiro"));
    const d1 = calcularDificuldade({ eventos }, 0.7);
    const d2 = calcularDificuldade({ eventos }, d1);
    expect(d2).toBeLessThan(0.7);
  });

  it("deve permanecer estável quando precisão e reação estão na zona neutra", () => {
    const eventos = [
      makeEvento("acerto", 500),
      makeEvento("tiro"),
      makeEvento("acerto", 490),
      makeEvento("tiro"),
    ];
    const resultado = calcularDificuldade({ eventos }, 0.5);
    expect(resultado).toBe(0.5);
  });
});
