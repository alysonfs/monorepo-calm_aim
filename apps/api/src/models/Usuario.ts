import { Schema, model, Document } from "mongoose";

export interface IUsuario extends Document {
  email: string;
  passwordHash: string;
  refreshToken?: string;
  role: "admin" | "user";
  preferences: {
    nivel: "iniciante" | "intermediario" | "avancado";
  };
}

const usuarioSchema = new Schema<IUsuario>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    refreshToken: { type: String },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    preferences: {
      nivel: {
        type: String,
        enum: ["iniciante", "intermediario", "avancado"],
        default: "iniciante",
      },
    },
  },
  { timestamps: true },
);

export const Usuario = model<IUsuario>("Usuario", usuarioSchema);
