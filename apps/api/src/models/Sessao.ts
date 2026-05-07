import { Schema, model, Document, Types } from "mongoose";

export interface ISessao extends Document {
  userId: Types.ObjectId;
  startedAt: Date;
  endedAt?: Date;
  modo: "livre" | "guiado";
  status: "ativa" | "concluida" | "abandonada";
}

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
  },
  { timestamps: true },
);

export const Sessao = model<ISessao>("Sessao", sessaoSchema);
