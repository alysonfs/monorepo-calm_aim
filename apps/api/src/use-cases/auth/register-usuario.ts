import bcrypt from "bcrypt";

export class EmailInvalidoError extends Error {}
export class SenhaInvalidaError extends Error {}
export class EmailJaCadastradoError extends Error {}

export interface RegisterUsuarioRepo {
  emailExiste(email: string): Promise<boolean>;
  criar(email: string, passwordHash: string): Promise<void>;
}

export async function registerUsuario(
  email: unknown,
  password: unknown,
  repo: RegisterUsuarioRepo,
): Promise<void> {
  if (typeof email !== "string" || !email.includes("@"))
    throw new EmailInvalidoError();
  if (typeof password !== "string" || password.length < 6)
    throw new SenhaInvalidaError();

  const existe = await repo.emailExiste(email.toLowerCase());
  if (existe) throw new EmailJaCadastradoError();

  const passwordHash = await bcrypt.hash(password, 12);
  await repo.criar(email.toLowerCase(), passwordHash);
}
