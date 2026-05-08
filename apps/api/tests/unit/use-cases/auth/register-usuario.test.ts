import {
  registerUsuario,
  EmailInvalidoError,
  SenhaInvalidaError,
  EmailJaCadastradoError,
} from "../../../../src/use-cases/auth/register-usuario";
import type { RegisterUsuarioRepo } from "../../../../src/use-cases/auth/register-usuario";

const makeRepo = (emailExiste = false): RegisterUsuarioRepo => ({
  emailExiste: jest.fn().mockResolvedValue(emailExiste),
  criar: jest.fn().mockResolvedValue(undefined),
});

describe("registerUsuario", () => {
  it("deve criar usuário com dados válidos", async () => {
    const repo = makeRepo(false);
    await expect(
      registerUsuario("user@test.com", "123456", repo),
    ).resolves.toBeUndefined();
    expect(repo.criar).toHaveBeenCalledTimes(1);
  });

  it("deve lançar EmailInvalidoError para email sem @", async () => {
    await expect(
      registerUsuario("invalido", "123456", makeRepo()),
    ).rejects.toBeInstanceOf(EmailInvalidoError);
  });

  it("deve lançar SenhaInvalidaError para senha curta", async () => {
    await expect(
      registerUsuario("u@t.com", "123", makeRepo()),
    ).rejects.toBeInstanceOf(SenhaInvalidaError);
  });

  it("deve lançar EmailJaCadastradoError se email já existe", async () => {
    const repo = makeRepo(true);
    await expect(
      registerUsuario("u@t.com", "123456", repo),
    ).rejects.toBeInstanceOf(EmailJaCadastradoError);
    expect(repo.criar).not.toHaveBeenCalled();
  });
});
