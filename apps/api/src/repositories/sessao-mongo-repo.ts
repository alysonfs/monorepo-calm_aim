import "reflect-metadata";
import { injectable } from "tsyringe";
import { Types } from "mongoose";
import { Sessao } from "../models/Sessao.js";
import type { CreateSessaoRepo } from "../use-cases/sessions/create-sessao.js";
import type { GetSessaoRepo } from "../use-cases/sessions/get-sessao.js";
import type { ListSessoesRepo } from "../use-cases/sessions/list-sessoes.js";
import type {
  EncerrarSessaoRepo,
  Metricas,
} from "../use-cases/sessions/encerrar-sessao.js";

export type SessaoRepoContract = CreateSessaoRepo &
  GetSessaoRepo &
  ListSessoesRepo &
  EncerrarSessaoRepo;

@injectable()
export class SessaoMongoRepo implements SessaoRepoContract {
  async criar(userId: string, modo: "livre" | "guiado"): Promise<unknown> {
    return Sessao.create({ userId, modo });
  }

  async findById(id: string): Promise<{
    userId: string;
    status: string;
    [key: string]: unknown;
  } | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await Sessao.findById(id).lean();
    if (!doc) return null;
    return { ...doc, userId: String(doc.userId) };
  }

  async findByUserId(userId: string): Promise<unknown[]> {
    return Sessao.find({ userId }).sort({ createdAt: -1 });
  }

  async encerrar(id: string, metricas: Metricas): Promise<unknown> {
    return Sessao.findByIdAndUpdate(
      id,
      { status: "concluida", endedAt: new Date(), metricas },
      { new: true },
    );
  }
}
