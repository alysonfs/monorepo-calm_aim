import "reflect-metadata";

jest.mock("../models/Sessao.js", () => ({
  Sessao: {
    create: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock("mongoose", () => ({
  Types: {
    ObjectId: {
      isValid: jest.fn(),
    },
  },
}));

import { Sessao } from "../models/Sessao.js";
import { Types } from "mongoose";
import { SessaoMongoRepo } from "./sessao-mongo-repo";

const mockSessao = Sessao as jest.Mocked<typeof Sessao>;
const mockIsValid = Types.ObjectId.isValid as jest.Mock;

describe("SessaoMongoRepo", () => {
  let repo: SessaoMongoRepo;

  beforeEach(() => {
    repo = new SessaoMongoRepo();
    jest.clearAllMocks();
  });

  describe("criar", () => {
    it("deve criar sessão com userId e modo", async () => {
      const fakeSessao = { id: "s1", userId: "u1", modo: "livre" };
      (mockSessao.create as jest.Mock).mockResolvedValue(fakeSessao);
      const result = await repo.criar("u1", "livre");
      expect(mockSessao.create).toHaveBeenCalledWith({
        userId: "u1",
        modo: "livre",
      });
      expect(result).toEqual(fakeSessao);
    });
  });

  describe("findById", () => {
    it("deve retornar null para id inválido", async () => {
      mockIsValid.mockReturnValue(false);
      expect(await repo.findById("id-invalido")).toBeNull();
      expect(mockSessao.findById).not.toHaveBeenCalled();
    });

    it("deve chamar findById para id válido", async () => {
      mockIsValid.mockReturnValue(true);
      const fakeSessao = { id: "s1", userId: "u1" };
      (mockSessao.findById as jest.Mock).mockResolvedValue(fakeSessao);
      const result = await repo.findById("507f1f77bcf86cd799439011");
      expect(mockSessao.findById).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
      );
      expect(result).toEqual(fakeSessao);
    });

    it("deve retornar null se sessão não existe", async () => {
      mockIsValid.mockReturnValue(true);
      (mockSessao.findById as jest.Mock).mockResolvedValue(null);
      expect(await repo.findById("507f1f77bcf86cd799439011")).toBeNull();
    });
  });
});
