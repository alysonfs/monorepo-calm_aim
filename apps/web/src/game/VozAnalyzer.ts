export interface VozAnalyzerResult {
  /** Nível de estresse calculado: 0.0 (calmo) a 1.0 (máximo). */
  nivel(): number;
  start(): void;
  stop(): void;
}

const INTERVALO_MS = 500;
const FREQ_ESTRESSE_HZ = 300;
const LIMIAR_VOLUME_ALTO = 0.6;

export function createVozAnalyzer(stream: MediaStream): VozAnalyzerResult {
  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  source.connect(analyser);

  const timeDomainBuffer = new Float32Array(analyser.fftSize);
  const freqBuffer = new Float32Array(analyser.frequencyBinCount);

  let nivelAtual = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  function analisar() {
    analyser.getFloatTimeDomainData(timeDomainBuffer);
    analyser.getFloatFrequencyData(freqBuffer);

    // Volume RMS
    let somaSq = 0;
    for (let i = 0; i < timeDomainBuffer.length; i++) {
      somaSq += timeDomainBuffer[i]! ** 2;
    }
    const rms = Math.sqrt(somaSq / timeDomainBuffer.length);
    const volumeNorm = Math.min(1, rms * 4);

    // Frequência dominante
    const sampleRate = audioCtx.sampleRate;
    const binParaHz = sampleRate / analyser.fftSize;
    const binEstresse = Math.round(FREQ_ESTRESSE_HZ / binParaHz);
    let energiaAlta = 0;
    let energiaTotal = 0;
    for (let i = 0; i < freqBuffer.length; i++) {
      const linear = 10 ** ((freqBuffer[i]! + 140) / 20); // dB → linear
      energiaTotal += linear;
      if (i >= binEstresse) energiaAlta += linear;
    }
    const ratioFreqAlta = energiaTotal > 0 ? energiaAlta / energiaTotal : 0;

    // Heurística: volume alto + frequência alta → estresse
    const sinalEstresse =
      volumeNorm > LIMIAR_VOLUME_ALTO ? ratioFreqAlta * volumeNorm : 0;

    nivelAtual = Math.min(1, Math.max(0, sinalEstresse));
  }

  return {
    nivel: () => nivelAtual,
    start() {
      if (!intervalId) intervalId = setInterval(analisar, INTERVALO_MS);
    },
    stop() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      audioCtx.close();
    },
  };
}
