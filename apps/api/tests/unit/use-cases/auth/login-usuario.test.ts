import { loginUsuario, CredenciaisInvalidasError } from "../../../../src/use-cases/auth/login-usuario";
import bcrypt from "bcrypt";

const passwordHash = bcrypt.hashSync("senha123", 1);

const makeRepo = (
  usuario: { id: string; passwordHash: string } | null = null,
) => ({
  findByEmail: jest.fn().mockResolvedValue(usuario),
  salvarRefreshToken: jest.fn().mockResolvedValue(undefined),
});

beforeAll(() => {
  process.env["JWT_SECRET"] = "test_secret";
  process.env["JWT_REFRESH_SECRET"] = "test_refresh_secret";
});

describe("loginUsuario", () => {
  it("deve retornar tokens com credenciais válidas", async () => {
    const repo = makeRepo({ id: "123", passwordHash });
    const result = await loginUsuario("u@t.com", "senha123", repo);
    expect(result).toHaveProperty("accessToken");
    expect(result).toHaveProperty("refreshToken");
    expect(repo.salvarRefreshToken).toHaveBeenCalledWith(
      "123",
      expect.any(String),
    );
  });

  it("deve lançar CredenciaisInvalidasError se usuário não existe", async () => {
    await expect(
      loginUsuario("x@x.com", "senha123", makeRepo(null)),
    ).rejects.toBeInstanceOf(CredenciaisInvalidasError);
  });

  it("deve lançar CredenciaisInvalidasError se senha incorreta", async () => {
    const repo = makeRepo({ id: "1", passwordHash });
    await expect(
      loginUsuario("u@t.com", "errada", repo),
    ).rejects.toBeInstanceOf(CredenciaisInvalidasError);
  });

  it("deve lançar CredenciaisInvalidasError se email não é string", async () => {
    await expect(
      loginUsuario(null, "senha123", makeRepo()),
    ).rejects.toBeInstanceOf(CredenciaisInvalidasError);
  });
});
