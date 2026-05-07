import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Token ausente" });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new Error("JWT_SECRET não definida");

  try {
    const payload = jwt.verify(token, secret) as jwt.JwtPayload;
    req.userId = payload["sub"] as string;
    next();
  } catch {
    res.status(401).json({ message: "Token inválido" });
  }
}
