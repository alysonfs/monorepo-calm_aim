import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createVozAnalyzer } from "../VozAnalyzer";

// ─── Mocks de Web Audio API ────────────────────────────────────────────────────

function makeTimeDomainData(rms: number, length = 2048): Float32Array {
  // Para gerar um RMS desejado: valor = rms / sqrt(1) = rms (sinal DC)
  const buf = new Float32Array(length);
  buf.fill(rms);
  return buf;
}

function makeFreqData(
  dBAbaixo300Hz: number,
  dBAbove300Hz: number,
  length = 1024,
): Float32Array {
  // sampleRate = 44100, fftSize = 2048 → binParaHz = 44100/2048 ≈ 21.5
  // bin 300Hz ≈ 14 → índices 0..13 = abaixo, 14..end = acima
  const buf = new Float32Array(length);
  const binEstresse = Math.round(300 / (44100 / 2048));
  for (let i = 0; i < length; i++) {
    buf[i] = i < binEstresse ? dBAbaixo300Hz : dBAbove300Hz;
  }
  return buf;
}

function makeMockAudioContext(
  timeDomainData: Float32Array,
  freqData: Float32Array,
) {
  const analyser = {
    fftSize: 2048,
    frequencyBinCount: 1024,
    getFloatTimeDomainData: vi.fn((buf: Float32Array) =>
      buf.set(timeDomainData),
    ),
    getFloatFrequencyData: vi.fn((buf: Float32Array) => buf.set(freqData)),
    connect: vi.fn(),
  };
  const source = { connect: vi.fn() };
  const ctx = {
    sampleRate: 44100,
    createAnalyser: vi.fn(() => analyser),
    createMediaStreamSource: vi.fn(() => source),
    close: vi.fn().mockResolvedValue(undefined),
  };
  // Usar função regular (não arrow) para poder ser usada com `new`

  const AudioContextMock = vi.fn(function (this: unknown) {
    return ctx;
  } as any);
  return { ctx, analyser, source, AudioContextMock };
}

function makeMockStream(): MediaStream {
  return {} as MediaStream;
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("VozAnalyzer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("deve retornar nivel 0 antes de qualquer análise", () => {
    const { AudioContextMock } = makeMockAudioContext(
      makeTimeDomainData(0),
      makeFreqData(-140, -140),
    );
    vi.stubGlobal("AudioContext", AudioContextMock);

    const az = createVozAnalyzer(makeMockStream());
    expect(az.nivel()).toBe(0);
  });

  it("deve retornar nivel 0 quando volume está abaixo do limiar", () => {
    // RMS baixo → volumeNorm < LIMIAR_VOLUME_ALTO (0.6) → nivel deve ser 0
    const { AudioContextMock } = makeMockAudioContext(
      makeTimeDomainData(0.05), // rms 0.05 * 4 = 0.2 (abaixo de 0.6)
      makeFreqData(-140, -60),
    );
    vi.stubGlobal("AudioContext", AudioContextMock);

    const az = createVozAnalyzer(makeMockStream());
    az.start();
    vi.advanceTimersByTime(500);

    expect(az.nivel()).toBe(0);
  });

  it("deve retornar nivel > 0 com volume alto e frequências altas", () => {
    // rms 0.2 * 4 = 0.8 (acima de 0.6); energia alta > 300Hz dominante
    const { AudioContextMock } = makeMockAudioContext(
      makeTimeDomainData(0.2),
      makeFreqData(-140, -40), // frequências altas bem energizadas
    );
    vi.stubGlobal("AudioContext", AudioContextMock);

    const az = createVozAnalyzer(makeMockStream());
    az.start();
    vi.advanceTimersByTime(500);

    expect(az.nivel()).toBeGreaterThan(0);
  });

  it("deve chamar close() no AudioContext ao parar", () => {
    const { ctx, AudioContextMock } = makeMockAudioContext(
      makeTimeDomainData(0),
      makeFreqData(-140, -140),
    );
    vi.stubGlobal("AudioContext", AudioContextMock);

    const az = createVozAnalyzer(makeMockStream());
    az.start();
    az.stop();

    expect(ctx.close).toHaveBeenCalled();
  });

  it("deve parar de atualizar nivel após stop()", () => {
    const { ctx, analyser, AudioContextMock } = makeMockAudioContext(
      makeTimeDomainData(0.2),
      makeFreqData(-140, -40),
    );
    vi.stubGlobal("AudioContext", AudioContextMock);

    const az = createVozAnalyzer(makeMockStream());
    az.start();
    vi.advanceTimersByTime(500);
    az.stop();

    const nivelAposStop = az.nivel();
    vi.advanceTimersByTime(2000);

    // O analyser não deve ter sido chamado novamente após stop
    const chamadosAposStop = (
      analyser.getFloatTimeDomainData as ReturnType<typeof vi.fn>
    ).mock.calls.length;
    expect(chamadosAposStop).toBe(1); // apenas 1 chamada antes do stop
    expect(az.nivel()).toBe(nivelAposStop);
    void ctx; // referência mantida para clareza
  });

  it("deve respeitar o limite máximo de 1.0 no nivel", () => {
    // Volume máximo
    const { AudioContextMock } = makeMockAudioContext(
      makeTimeDomainData(1.0),
      makeFreqData(-140, -20),
    );
    vi.stubGlobal("AudioContext", AudioContextMock);

    const az = createVozAnalyzer(makeMockStream());
    az.start();
    vi.advanceTimersByTime(500);

    expect(az.nivel()).toBeLessThanOrEqual(1.0);
    expect(az.nivel()).toBeGreaterThanOrEqual(0.0);
  });
});
