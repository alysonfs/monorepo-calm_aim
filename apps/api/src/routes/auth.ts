import { Router, Request, Response } from "express";
import {
  registerUsuario,
  EmailInvalidoError,
  SenhaInvalidaError,
  EmailJaCadastradoError,
} from "../use-cases/auth/register-usuario.js";
import {
  loginUsuario,
  CredenciaisInvalidasError,
} from "../use-cases/auth/login-usuario.js";
import {
  refreshToken as refreshTokenUseCase,
  TokenInvalidoError,
} from "../use-cases/auth/refresh-token.js";
import { container } from "../container/index.js";
import { TOKENS } from "../container/tokens.js";
import type { UsuarioRepoContract } from "../repositories/usuario-mongo-repo.js";
import { requireAuth } from "../middleware/auth.js";
import { Usuario } from "../models/Usuario.js";

const router = Router();

router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const repo = container.resolve<UsuarioRepoContract>(TOKENS.UsuarioRepo);
    await registerUsuario(req.body.email, req.body.password, repo);
    res.status(201).json({ message: "Usuário criado" });
  } catch (e) {
    if (e instanceof EmailInvalidoError) {
      res.status(400).json({ message: "Email inválido" });
      return;
    }
    if (e instanceof SenhaInvalidaError) {
      res
        .status(400)
        .json({ message: "Senha deve ter no mínimo 6 caracteres" });
      return;
    }
    if (e instanceof EmailJaCadastradoError) {
      res.status(409).json({ message: "Email já cadastrado" });
      return;
    }
    throw e;
  }
});

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const repo = container.resolve<UsuarioRepoContract>(TOKENS.UsuarioRepo);
    const tokens = await loginUsuario(req.body.email, req.body.password, repo);
    res.json(tokens);
  } catch (e) {
    if (e instanceof CredenciaisInvalidasError) {
      res.status(401).json({ message: "Credenciais inválidas" });
      return;
    }
    throw e;
  }
});

router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  try {
    const repo = container.resolve<UsuarioRepoContract>(TOKENS.UsuarioRepo);
    const tokens = await refreshTokenUseCase(req.body.refreshToken, repo);
    res.json(tokens);
  } catch (e) {
    if (e instanceof TokenInvalidoError) {
      res.status(401).json({ message: "Token inválido" });
      return;
    }
    throw e;
  }
});

router.post(
  "/logout",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    await Usuario.findByIdAndUpdate(req.userId, {
      $unset: { refreshToken: 1 },
    });
    res.status(204).send();
  },
);

export default router;
