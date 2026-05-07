import { requireAuth } from "./auth";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeAll(() => {
  process.env["JWT_SECRET"] = "test_secret";
});

describe("requireAuth", () => {
  it("deve chamar next() com token válido", () => {
    const token = jwt.sign({ sub: "u1" }, "test_secret");
    const req = { headers: { authorization: `Bearer ${token}` } } as Request;
    const next = jest.fn() as NextFunction;
    requireAuth(req, mockRes(), next);
    expect(next).toHaveBeenCalled();
    expect(req.userId).toBe("u1");
  });

  it("deve retornar 401 sem header Authorization", () => {
    const req = { headers: {} } as Request;
    const res = mockRes();
    requireAuth(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("deve retornar 401 com token inválido", () => {
    const req = {
      headers: { authorization: "Bearer tokeninvalido" },
    } as Request;
    const res = mockRes();
    requireAuth(req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
