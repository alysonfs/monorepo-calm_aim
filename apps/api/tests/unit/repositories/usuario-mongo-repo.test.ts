import "reflect-metadata";

jest.mock("../../../src/models/Usuario.js", () => ({
  Usuario: {
    exists: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findById: jest.fn(),
  },
}));

import { Usuario } from "../../../src/models/Usuario.js";
import { UsuarioMongoRepo } from "../../../src/repositories/usuario-mongo-repo";

const mockUsuario = Usuario as jest.Mocked<typeof Usuario>;

describe("UsuarioMongoRepo", () => {
  let repo: UsuarioMongoRepo;

  beforeEach(() => {
    repo = new UsuarioMongoRepo();
    jest.clearAllMocks();
  });

  describe("emailExiste", () => {
    it("deve retornar true se email existe", async () => {
      (mockUsuario.exists as jest.Mock).mockResolvedValue({ _id: "1" });
      expect(await repo.emailExiste("a@b.com")).toBe(true);
    });

    it("deve retornar false se email não existe", async () => {
      (mockUsuario.exists as jest.Mock).mockResolvedValue(null);
      expect(await repo.emailExiste("a@b.com")).toBe(false);
    });
  });

  describe("criar", () => {
    it("deve chamar Usuario.create com email e hash", async () => {
      (mockUsuario.create as jest.Mock).mockResolvedValue({});
      await repo.criar("a@b.com", "hash123");
      expect(mockUsuario.create).toHaveBeenCalledWith({
        email: "a@b.com",
        passwordHash: "hash123",
      });
    });
  });

  describe("findByEmail", () => {
    it("deve retornar null se usuário não existe", async () => {
      (mockUsuario.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });
      expect(await repo.findByEmail("x@x.com")).toBeNull();
    });

    it("deve retornar id e passwordHash se usuário existe", async () => {
      const fakeUser = { id: "abc", passwordHash: "hash" };
      (mockUsuario.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(fakeUser),
      });
      const result = await repo.findByEmail("a@b.com");
      expect(result).toEqual({ id: "abc", passwordHash: "hash" });
    });
  });

  describe("salvarRefreshToken", () => {
    it("deve chamar findByIdAndUpdate com o token", async () => {
      (mockUsuario.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
      await repo.salvarRefreshToken("uid1", "token123");
      expect(mockUsuario.findByIdAndUpdate).toHaveBeenCalledWith("uid1", {
        refreshToken: "token123",
      });
    });
  });

  describe("findByIdComToken", () => {
    it("deve chamar findById e selecionar refreshToken", async () => {
      const fakeResult = { refreshToken: "tok" };
      (mockUsuario.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(fakeResult),
      });
      const result = await repo.findByIdComToken("uid1");
      expect(result).toEqual({ refreshToken: "tok" });
    });
  });
});
