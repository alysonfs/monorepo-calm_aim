import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export class CredenciaisInvalidasError extends Error {}

export interface LoginUsuarioRepo {
  findByEmail(
    email: string,
  ): Promise<{ id: string; passwordHash: string } | null>;
  salvarRefreshToken(userId: string, token: string): Promise<void>;
}

function gerarTokens(userId: string): {
  accessToken: string;
  refreshToken: string;
} {
  const secret = process.env["JWT_SECRET"];
  const refreshSecret = process.env["JWT_REFRESH_SECRET"];
  if (!secret || !refreshSecret) throw new Error("Segredos JWT não definidos");
  const accessToken = jwt.sign({ sub: userId }, secret, { expiresIn: "15m" });
  const refreshToken = jwt.sign({ sub: userId }, refreshSecret, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
}

export { gerarTokens };

export async function loginUsuario(
  email: unknown,
  password: unknown,
  repo: LoginUsuarioRepo,
): Promise<{ accessToken: string; refreshToken: string }> {
  if (typeof email !== "string" || typeof password !== "string") {
    throw new CredenciaisInvalidasError();
  }

  const usuario = await repo.findByEmail(email.toLowerCase());
  if (!usuario) throw new CredenciaisInvalidasError();

  const senhaCorreta = await bcrypt.compare(password, usuario.passwordHash);
  if (!senhaCorreta) throw new CredenciaisInvalidasError();

  const tokens = gerarTokens(usuario.id);
  await repo.salvarRefreshToken(usuario.id, tokens.refreshToken);
  return tokens;
}
