import request from "supertest";
import mongoose from "mongoose";
import { buildApp, closeApp } from "../app-helper";
import type { Express } from "express";

const mockListarUltimosEventos = jest.fn();
const mockRegistrarEvento = jest.fn().mockResolvedValue(undefined);
const mockRegistrarEmocao = jest.fn().mockResolvedValue(undefined);
const mockRegistrarDificuldade = jest.fn().mockResolvedValue(undefined);

jest.mock("../../../src/repositories/evento-sessao-cassandra-repo", () => ({
  getEventoSessaoRepo: () => ({
    registrarEvento: mockRegistrarEvento,
    listarUltimosEventos: mockListarUltimosEventos,
    registrarEmocao: mockRegistrarEmocao,
    registrarDificuldade: mockRegistrarDificuldade,
  }),
  EventoSessaoCassandraRepo: jest.fn(),
}));

const cincoAcertosRapidos = Array.from({ length: 5 }, () => ({
  sessaoId: "s1",
  tipo: "acerto" as const,
  reacaoMs: 200,
  dificuldade: 0.4,
  distanciaM: 5,
  criadoEm: new Date(),
}));

let app: Express;
let accessToken: string;

beforeEach(() => {
  mockListarUltimosEventos.mockResolvedValue(cincoAcertosRapidos);
});

beforeAll(async () => {
  app = await buildApp();

  await request(app)
    .post("/auth/register")
    .send({ email: "sessions@test.com", password: "senha123" });

  const res = await request(app)
    .post("/auth/login")
    .send({ email: "sessions@test.com", password: "senha123" });

  accessToken = res.body.accessToken;
});

afterAll(async () => {
  await mongoose.connection.db?.dropDatabase();
  await closeApp();
});

describe("POST /sessions", () => {
  it("deve criar sessão com modo livre e retornar 201", async () => {
    const res = await request(app)
      .post("/sessions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ modo: "livre" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      modo: "livre",
      status: "ativa",
    });
    expect(res.body).toHaveProperty("_id");
  });

  it("deve criar sessão com modo guiado", async () => {
    const res = await request(app)
      .post("/sessions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ modo: "guiado" });

    expect(res.status).toBe(201);
    expect(res.body.modo).toBe("guiado");
  });

  it("deve retornar 401 sem token", async () => {
    const res = await request(app)
      .post("/sessions")
      .send({ modo: "livre" });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Token ausente");
  });

  it("deve retornar 400 para modo inválido", async () => {
    const res = await request(app)
      .post("/sessions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ modo: "invalido" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("modo deve ser 'livre' ou 'guiado'");
  });
});

describe("GET /sessions/:id", () => {
  let sessaoId: string;
  let outroAccessToken: string;

  beforeAll(async () => {
    const res = await request(app)
      .post("/sessions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ modo: "livre" });

    sessaoId = res.body._id;

    await request(app)
      .post("/auth/register")
      .send({ email: "outro@test.com", password: "senha123" });

    const login = await request(app)
      .post("/auth/login")
      .send({ email: "outro@test.com", password: "senha123" });

    outroAccessToken = login.body.accessToken;
  });

  it("deve retornar sessão do usuário autenticado", async () => {
    const res = await request(app)
      .get(`/sessions/${sessaoId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(sessaoId);
  });

  it("deve retornar 403 para outro usuário tentando acessar sessão alheia", async () => {
    const res = await request(app)
      .get(`/sessions/${sessaoId}`)
      .set("Authorization", `Bearer ${outroAccessToken}`);

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Acesso negado");
  });

  it("deve retornar 404 para id inexistente", async () => {
    const res = await request(app)
      .get("/sessions/507f1f77bcf86cd799439999")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });

  it("deve retornar 401 sem token", async () => {
    const res = await request(app).get(`/sessions/${sessaoId}`);

    expect(res.status).toBe(401);
  });
});

describe("GET /sessions", () => {
  it("deve retornar lista de sessões do usuário", async () => {
    const res = await request(app)
      .get("/sessions")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("modo");
    expect(res.body[0]).toHaveProperty("status");
  });

  it("deve retornar 401 sem token", async () => {
    const res = await request(app).get("/sessions");
    expect(res.status).toBe(401);
  });
});

describe("PATCH /sessions/:id", () => {
  let sessaoId: string;
  const metricas = {
    totalTiros: 20,
    acertos: 15,
    precisao: 75,
    tempoMedioReacaoMs: 320,
  };

  beforeAll(async () => {
    const res = await request(app)
      .post("/sessions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ modo: "livre" });
    sessaoId = res.body._id;
  });

  it("deve encerrar a sessão e retornar métricas", async () => {
    const res = await request(app)
      .patch(`/sessions/${sessaoId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send(metricas);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("concluida");
    expect(res.body.metricas).toMatchObject(metricas);
    expect(res.body.endedAt).toBeDefined();
  });

  it("deve retornar 409 ao tentar encerrar sessão já concluída", async () => {
    const res = await request(app)
      .patch(`/sessions/${sessaoId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send(metricas);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Sessão já encerrada");
  });

  it("deve retornar 400 para métricas inválidas", async () => {
    const res = await request(app)
      .patch(`/sessions/${sessaoId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ totalTiros: "nao-e-numero" });

    expect(res.status).toBe(400);
  });

  it("deve retornar 401 sem token", async () => {
    const res = await request(app)
      .patch(`/sessions/${sessaoId}`)
      .send(metricas);
    expect(res.status).toBe(401);
  });

  it("deve retornar 404 para sessão inexistente", async () => {
    const res = await request(app)
      .patch("/sessions/507f1f77bcf86cd799439999")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(metricas);

    expect(res.status).toBe(404);
  });
});

describe("GET /:id/dificuldade", () => {
  let sessaoId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post("/sessions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ modo: "livre" });
    sessaoId = res.body._id;
  });

  it("deve retornar dificuldade atual da sessão", async () => {
    const res = await request(app)
      .get(`/sessions/${sessaoId}/dificuldade`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("sessaoId");
    expect(res.body).toHaveProperty("dificuldade");
    expect(typeof res.body.dificuldade).toBe("number");
  });

  it("deve retornar dificuldade inicial quando sessão não tem histórico", async () => {
    mockListarUltimosEventos.mockResolvedValueOnce([]);
    const res = await request(app)
      .get(`/sessions/${sessaoId}/dificuldade`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.dificuldade).toBe(0.3);
  });

  it("deve retornar dificuldade inicial quando último evento tem dificuldade 0", async () => {
    mockListarUltimosEventos.mockResolvedValueOnce([
      { sessaoId: "s1", tipo: "acerto", reacaoMs: 300, dificuldade: 0, distanciaM: 0, criadoEm: new Date() },
    ]);
    const res = await request(app)
      .get(`/sessions/${sessaoId}/dificuldade`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.dificuldade).toBe(0.3);
  });

  it("deve retornar 401 sem token", async () => {
    const res = await request(app).get(`/sessions/${sessaoId}/dificuldade`);
    expect(res.status).toBe(401);
  });
});

describe("POST /:id/eventos", () => {
  let sessaoId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post("/sessions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ modo: "livre" });
    sessaoId = res.body._id;
  });

  it("deve registrar evento de acerto e retornar nova dificuldade", async () => {
    const res = await request(app)
      .post(`/sessions/${sessaoId}/eventos`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ tipo: "acerto", reacaoMs: 400, dificuldadeAtual: 0.3, distanciaM: 5 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("dificuldade");
    expect(typeof res.body.dificuldade).toBe("number");
  });

  it("deve registrar evento de tiro (miss)", async () => {
    const res = await request(app)
      .post(`/sessions/${sessaoId}/eventos`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ tipo: "tiro", reacaoMs: 0, dificuldadeAtual: 0.3 });

    expect(res.status).toBe(200);
  });

  it("deve reduzir dificuldade quando histórico tem precisão baixa", async () => {
    mockListarUltimosEventos.mockResolvedValueOnce(
      Array.from({ length: 5 }, () => ({
        sessaoId: "s1",
        tipo: "tiro" as const,
        reacaoMs: 0,
        dificuldade: 0.5,
        distanciaM: 0,
        criadoEm: new Date(),
      })),
    );
    const res = await request(app)
      .post(`/sessions/${sessaoId}/eventos`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ tipo: "tiro", reacaoMs: 0, dificuldadeAtual: 0.5 });

    expect(res.status).toBe(200);
    expect(res.body.dificuldade).toBeLessThan(0.5);
  });

  it("deve retornar 400 para tipo inválido", async () => {
    const res = await request(app)
      .post(`/sessions/${sessaoId}/eventos`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ tipo: "invalido", reacaoMs: 300, dificuldadeAtual: 0.3 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("corpo inválido");
  });

  it("deve retornar 400 quando reacaoMs não é número", async () => {
    const res = await request(app)
      .post(`/sessions/${sessaoId}/eventos`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ tipo: "acerto", reacaoMs: "rápido", dificuldadeAtual: 0.3 });

    expect(res.status).toBe(400);
  });

  it("deve retornar 401 sem token", async () => {
    const res = await request(app)
      .post(`/sessions/${sessaoId}/eventos`)
      .send({ tipo: "acerto", reacaoMs: 300, dificuldadeAtual: 0.3 });

    expect(res.status).toBe(401);
  });
});

describe("POST /:id/emocao", () => {
  let sessaoId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post("/sessions")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ modo: "livre" });
    sessaoId = res.body._id;
  });

  it("deve registrar nível emocional e retornar 204", async () => {
    const res = await request(app)
      .post(`/sessions/${sessaoId}/emocao`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nivel: 0.5 });

    expect(res.status).toBe(204);
  });

  it("deve retornar 400 quando nivel não é número", async () => {
    const res = await request(app)
      .post(`/sessions/${sessaoId}/emocao`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nivel: "alto" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("nivel deve ser número entre 0 e 1");
  });

  it("deve retornar 400 quando nivel está fora do intervalo [0, 1]", async () => {
    const res = await request(app)
      .post(`/sessions/${sessaoId}/emocao`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ nivel: 1.5 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("nivel deve ser entre 0 e 1");
  });

  it("deve retornar 401 sem token", async () => {
    const res = await request(app)
      .post(`/sessions/${sessaoId}/emocao`)
      .send({ nivel: 0.3 });

    expect(res.status).toBe(401);
  });
});
