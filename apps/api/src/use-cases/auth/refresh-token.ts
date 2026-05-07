import jwt from "jsonwebtoken";
import { gerarTokens } from "./login-usuario.js";

export class TokenInvalidoError extends Error {}

export interface RefreshTokenRepo {
  findByIdComToken(userId: string): Promise<{ refreshToken?: string } | null>;
  salvarRefreshToken(userId: string, token: string): Promise<void>;
}

export async function refreshToken(
  token: unknown,
  repo: RefreshTokenRepo,
): Promise<{ accessToken: string; refreshToken: string }> {
  if (typeof token !== "string") throw new TokenInvalidoError();

  const secret = process.env["JWT_REFRESH_SECRET"];
  if (!secret) throw new Error("JWT_REFRESH_SECRET não definida");

  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, secret) as jwt.JwtPayload;
  } catch {
    throw new TokenInvalidoError();
  }

  const userId = payload["sub"] as string;
  const usuario = await repo.findByIdComToken(userId);

  if (!usuario || usuario.refreshToken !== token)
    throw new TokenInvalidoError();

  const tokens = gerarTokens(userId);
  await repo.salvarRefreshToken(userId, tokens.refreshToken);
  return tokens;
}
