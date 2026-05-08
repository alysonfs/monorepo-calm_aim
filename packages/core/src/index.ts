// ─── Domínio: Sessão de Treino ────────────────────────────────────────────────

export type ModoSessao = 'livre' | 'guiado';
export type StatusSessao = 'ativa' | 'concluida' | 'abandonada';
export type EstadoEmocional = 'calmo' | 'nervoso' | 'frustrado';

export interface SessaoTreino {
  id: string;
  usuarioId: string;
  iniciadaEm: Date;
  encerradaEm?: Date;
  modo: ModoSessao;
  status: StatusSessao;
}

// ─── Domínio: DualSense ───────────────────────────────────────────────────────

export interface EventoDualSense {
  timestamp: number;
  conectado: boolean;
  acelerometro: { x: number; y: number; z: number };
  giroscopio: { x: number; y: number; z: number };
  botoes: Record<string, boolean>;
}

// ─── Contratos HTTP: Auth ─────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

// ─── Contratos HTTP: Sessões ──────────────────────────────────────────────────

export interface CriarSessaoRequest {
  modo: ModoSessao;
}

export interface SessaoResponse {
  id: string;
  usuarioId: string;
  modo: ModoSessao;
  status: StatusSessao;
  iniciadaEm: string;
  encerradaEm?: string;
}
