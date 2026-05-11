import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMetricasTracker } from "../MetricasTracker";

describe("createMetricasTracker", () => {
  beforeEach(() => {
    vi.spyOn(performance, "now").mockReturnValue(1000);
  });

  it("deve retornar zeros sem nenhum registro", () => {
    const tracker = createMetricasTracker();
    expect(tracker.calcular()).toEqual({
      totalTiros: 0,
      acertos: 0,
      precisao: 0,
      tempoMedioReacaoMs: 0,
    });
  });

  it("deve contar tiros corretamente", () => {
    const tracker = createMetricasTracker();
    tracker.registrarTiro();
    tracker.registrarTiro();
    tracker.registrarTiro();
    expect(tracker.calcular().totalTiros).toBe(3);
  });

  it("deve calcular precisão como porcentagem de acertos sobre tiros", () => {
    const tracker = createMetricasTracker();
    tracker.registrarTiro();
    tracker.registrarTiro();
    tracker.registrarTiro();
    tracker.registrarTiro();
    tracker.registrarAcerto(800); // reação de 200ms (performance.now()=1000)
    tracker.registrarAcerto(600); // reação de 400ms
    expect(tracker.calcular().precisao).toBe(50);
    expect(tracker.calcular().acertos).toBe(2);
  });

  it("deve calcular tempo médio de reação corretamente", () => {
    const tracker = createMetricasTracker();
    // performance.now() = 1000 (mockado)
    tracker.registrarAcerto(800); // 200ms
    tracker.registrarAcerto(600); // 400ms
    tracker.registrarAcerto(700); // 300ms
    expect(tracker.calcular().tempoMedioReacaoMs).toBe(300);
  });

  it("deve arredondar precisão para 1 casa decimal", () => {
    const tracker = createMetricasTracker();
    tracker.registrarTiro();
    tracker.registrarTiro();
    tracker.registrarTiro();
    tracker.registrarAcerto(800); // 1 acerto de 3 tiros = 33.333...%
    expect(tracker.calcular().precisao).toBe(33.3);
  });

  it("deve retornar 0 de precisão quando não há tiros", () => {
    const tracker = createMetricasTracker();
    tracker.registrarAcerto(900);
    expect(tracker.calcular().precisao).toBe(0);
  });

  it("deve retornar 100% de precisão quando todos os tiros acertam", () => {
    const tracker = createMetricasTracker();
    tracker.registrarTiro();
    tracker.registrarAcerto(999);
    expect(tracker.calcular().precisao).toBe(100);
  });

  it("deve acumular corretamente múltiplas chamadas", () => {
    const tracker = createMetricasTracker();
    for (let i = 0; i < 10; i++) tracker.registrarTiro();
    for (let i = 0; i < 7; i++) tracker.registrarAcerto(950); // 50ms cada
    const m = tracker.calcular();
    expect(m.totalTiros).toBe(10);
    expect(m.acertos).toBe(7);
    expect(m.precisao).toBe(70);
    expect(m.tempoMedioReacaoMs).toBe(50);
  });
});
