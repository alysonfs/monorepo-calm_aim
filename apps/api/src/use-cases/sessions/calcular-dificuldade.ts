import type { EventoSessao } from "../../repositories/evento-sessao-cassandra-repo.js";

const DIFICULDADE_MIN = 0.0;
const DIFICULDADE_MAX = 1.0;
const AJUSTE_SUBIDA = 0.05;
const AJUSTE_DESCIDA = 0.08;
const JANELA_EVENTOS = 10;

// precisão mínima p/ aumentar dificuldade
const LIMIAR_PRECISAO_ALTA = 0.75;
// precisão máxima p/ reduzir dificuldade
const LIMIAR_PRECISAO_BAIXA = 0.35;
// reação lenta em ms → reduz dificuldade
const LIMIAR_REACAO_LENTA = 600;

export interface HistoricoParaMotor {
  eventos: EventoSessao[];
}

export function calcularDificuldade(
  historico: HistoricoParaMotor,
  dificuldadeAtual: number,
): number {
  const acertos = historico.eventos
    .slice(0, JANELA_EVENTOS)
    .filter((e) => e.tipo === "acerto");
  const tiros = historico.eventos
    .slice(0, JANELA_EVENTOS)
    .filter((e) => e.tipo === "tiro" || e.tipo === "acerto");

  if (tiros.length < 3) return dificuldadeAtual;

  const precisao = acertos.length / tiros.length;
  const tempoMedioReacao =
    acertos.length > 0
      ? acertos.reduce((soma, e) => soma + e.reacaoMs, 0) / acertos.length
      : 0;

  let nova = dificuldadeAtual;

  if (
    precisao >= LIMIAR_PRECISAO_ALTA &&
    tempoMedioReacao < LIMIAR_REACAO_LENTA
  ) {
    nova = Math.min(DIFICULDADE_MAX, nova + AJUSTE_SUBIDA);
  } else if (
    precisao <= LIMIAR_PRECISAO_BAIXA ||
    tempoMedioReacao >= LIMIAR_REACAO_LENTA
  ) {
    nova = Math.max(DIFICULDADE_MIN, nova - AJUSTE_DESCIDA);
  }

  return Math.round(nova * 100) / 100;
}
