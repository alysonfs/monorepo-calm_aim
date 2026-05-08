import request from "supertest";
import mongoose from "mongoose";
import { buildApp, closeApp } from "../app-helper";
import type { Express } from "express";

let app: Express;

beforeAll(async () => {
  app = await buildApp();
});

afterAll(async () => {
  await mongoose.connection.db?.dropDatabase();
  await closeApp();
});

describe("POST /auth/register", () => {
  it("deve criar usuário e retornar 201", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "novo@test.com", password: "senha123" });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ message: "Usuário criado" });
  });

  it("deve retornar 409 para email duplicado", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "dup@test.com", password: "senha123" });

    const res = await request(app)
      .post("/auth/register")
      .send({ email: "dup@test.com", password: "senha123" });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Email já cadastrado");
  });

  it("deve retornar 400 para email inválido", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "invalido", password: "senha123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Email inválido");
  });

  it("deve retornar 400 para senha curta", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "a@test.com", password: "123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Senha deve ter no mínimo 6 caracteres");
  });
});

describe("POST /auth/login", () => {
  beforeAll(async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "login@test.com", password: "senha123" });
  });

  it("deve retornar accessToken e refreshToken com credenciais válidas", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "login@test.com", password: "senha123" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
  });

  it("deve retornar 401 para senha incorreta", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "login@test.com", password: "errada" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Credenciais inválidas");
  });

  it("deve retornar 401 para email inexistente", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: "naoexiste@test.com", password: "senha123" });

    expect(res.status).toBe(401);
  });
});

describe("POST /auth/refresh", () => {
  let refreshToken: string;

  beforeAll(async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "refresh@test.com", password: "senha123" });

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "refresh@test.com", password: "senha123" });

    refreshToken = res.body.refreshToken;
  });

  it("deve retornar novos tokens com refreshToken válido", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(res.body).toHaveProperty("refreshToken");
  });

  it("deve retornar 401 para refreshToken inválido", async () => {
    const res = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken: "tokeninvalido" });

    expect(res.status).toBe(401);
  });
});
