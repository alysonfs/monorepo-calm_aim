import "reflect-metadata";
import { injectable } from "tsyringe";
import { Usuario } from "../models/Usuario.js";
import type { RegisterUsuarioRepo } from "../use-cases/auth/register-usuario.js";
import type { LoginUsuarioRepo } from "../use-cases/auth/login-usuario.js";
import type { RefreshTokenRepo } from "../use-cases/auth/refresh-token.js";

export type UsuarioRepoContract = RegisterUsuarioRepo &
  LoginUsuarioRepo &
  RefreshTokenRepo;

@injectable()
export class UsuarioMongoRepo implements UsuarioRepoContract {
  async emailExiste(email: string): Promise<boolean> {
    return !!(await Usuario.exists({ email }));
  }

  async criar(email: string, passwordHash: string): Promise<void> {
    await Usuario.create({ email, passwordHash });
  }

  async findByEmail(
    email: string,
  ): Promise<{ id: string; passwordHash: string } | null> {
    const u = await Usuario.findOne({ email }).select("passwordHash");
    if (!u) return null;
    return { id: u.id as string, passwordHash: u.passwordHash };
  }

  async salvarRefreshToken(userId: string, token: string): Promise<void> {
    await Usuario.findByIdAndUpdate(userId, { refreshToken: token });
  }

  async findByIdComToken(
    userId: string,
  ): Promise<{ refreshToken?: string } | null> {
    return Usuario.findById(userId).select("refreshToken");
  }
}
