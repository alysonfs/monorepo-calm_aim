import { describe, it, expect } from "vitest";
import { getLookFromEvent } from "../FpsCamera";
import type { EventoDualSense } from "@calm-aim/core";

function makeEvento(overrides: Partial<EventoDualSense> = {}): EventoDualSense {
  return {
    timestamp: Date.now(),
    conectado: true,
    acelerometro: { x: 0, y: 0, z: 0 },
    giroscopio: { x: 0, y: 0, z: 0 },
    sticks: { esquerdo: { x: 0, y: 0 }, direito: { x: 0, y: 0 } },
    triggers: { l2: 0, r2: 0 },
    botoes: {},
    ...overrides,
  };
}

describe("getLookFromEvent", () => {
  it("deve retornar [0,0] para evento nulo", () => {
    expect(getLookFromEvent(null)).toEqual([0, 0]);
  });

  it("deve retornar [0,0] quando desconectado", () => {
    expect(getLookFromEvent(makeEvento({ conectado: false }))).toEqual([0, 0]);
  });

  it("deve retornar os valores do stick direito quando conectado", () => {
    const evento = makeEvento({
      sticks: { esquerdo: { x: 0, y: 0 }, direito: { x: 0.8, y: -0.5 } },
    });
    expect(getLookFromEvent(evento)).toEqual([0.8, -0.5]);
  });

  it("deve retornar [0,0] quando o stick direito está em repouso", () => {
    const evento = makeEvento({
      sticks: { esquerdo: { x: 0.5, y: 0.5 }, direito: { x: 0, y: 0 } },
    });
    expect(getLookFromEvent(evento)).toEqual([0, 0]);
  });
});
