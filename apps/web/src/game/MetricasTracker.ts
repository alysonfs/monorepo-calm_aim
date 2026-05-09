export interface Metricas {
  totalTiros: number;
  acertos: number;
  precisao: number;
  tempoMedioReacaoMs: number;
}

export interface MetricasTrackerResult {
  registrarTiro(): void;
  registrarAcerto(spawnedAt: number): void;
  calcular(): Metricas;
}

export function createMetricasTracker(): MetricasTrackerResult {
  let totalTiros = 0;
  let acertos = 0;
  const reacoes: number[] = [];

  return {
    registrarTiro() {
      totalTiros++;
    },
    registrarAcerto(spawnedAt: number) {
      acertos++;
      reacoes.push(performance.now() - spawnedAt);
    },
    calcular(): Metricas {
      const precisao = totalTiros > 0 ? (acertos / totalTiros) * 100 : 0;
      const tempoMedioReacaoMs =
        reacoes.length > 0
          ? reacoes.reduce((a, b) => a + b, 0) / reacoes.length
          : 0;
      return {
        totalTiros,
        acertos,
        precisao: Math.round(precisao * 10) / 10,
        tempoMedioReacaoMs: Math.round(tempoMedioReacaoMs),
      };
    },
  };
}
