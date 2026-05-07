import "reflect-metadata";
import { injectable } from "tsyringe";
import { Types } from "mongoose";
import { Sessao } from "../models/Sessao.js";
import type { CreateSessaoRepo } from "../use-cases/sessions/create-sessao.js";
import type { GetSessaoRepo } from "../use-cases/sessions/get-sessao.js";

export type SessaoRepoContract = CreateSessaoRepo & GetSessaoRepo;

@injectable()
export class SessaoMongoRepo implements SessaoRepoContract {
  async criar(userId: string, modo: "livre" | "guiado"): Promise<unknown> {
    return Sessao.create({ userId, modo });
  }

  async findById(
    id: string,
  ): Promise<{ userId: string; [key: string]: unknown } | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Sessao.findById(id);
  }
}
