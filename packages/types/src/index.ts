export interface EventoDualSense {
  timestamp: number;
  conectado: boolean;
  acelerometro: { x: number; y: number; z: number };
  giroscopio: { x: number; y: number; z: number };
  botoes: Record<string, boolean>;
}

export interface SessaoTreino {
  id: string;
  usuarioId: string;
  iniciadaEm: Date;
  encerradaEm?: Date;
  modo: 'livre' | 'adaptativo';
  status: 'em_andamento' | 'concluida' | 'abandonada';
}

export type EstadoEmocional = 'calmo' | 'nervoso' | 'frustrado';
