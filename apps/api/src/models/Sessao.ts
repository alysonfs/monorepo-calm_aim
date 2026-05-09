import { Schema, model, Document, Types } from "mongoose";

export interface IMetricas {
  totalTiros: number;
  acertos: number;
  precisao: number;
  tempoMedioReacaoMs: number;
}

export interface ISessao extends Document {
  userId: Types.ObjectId;
  startedAt: Date;
  endedAt?: Date;
  modo: "livre" | "guiado";
  status: "ativa" | "concluida" | "abandonada";
  metricas?: IMetricas;
}

const metricasSchema = new Schema<IMetricas>(
  {
    totalTiros: { type: Number, required: true },
    acertos: { type: Number, required: true },
    precisao: { type: Number, required: true },
    tempoMedioReacaoMs: { type: Number, required: true },
  },
  { _id: false },
);

const sessaoSchema = new Schema<ISessao>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "Usuario", required: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    modo: { type: String, enum: ["livre", "guiado"], required: true },
    status: {
      type: String,
      enum: ["ativa", "concluida", "abandonada"],
      default: "ativa",
    },
    metricas: { type: metricasSchema },
  },
  { timestamps: true },
);

export const Sessao = model<ISessao>("Sessao", sessaoSchema);
