import { Router, Request, Response } from "express";
import {
  createSessao,
  ModoInvalidoError,
} from "../use-cases/sessions/create-sessao.js";
import {
  getSessao,
  SessaoNaoEncontradaError,
  AcessoNegadoError,
} from "../use-cases/sessions/get-sessao.js";
import { listSessoes } from "../use-cases/sessions/list-sessoes.js";
import {
  encerrarSessao,
  SessaoNaoEncontradaError as EncerrarNaoEncontrada,
  AcessoNegadoError as EncerrarAcessoNegado,
  SessaoJaEncerradaError,
} from "../use-cases/sessions/encerrar-sessao.js";
import { container } from "../container/index.js";
import { TOKENS } from "../container/tokens.js";
import type { SessaoRepoContract } from "../repositories/sessao-mongo-repo.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const repo = container.resolve<SessaoRepoContract>(TOKENS.SessaoRepo);
    const sessoes = await listSessoes(req.userId!, repo);
    res.json(sessoes);
  },
);

router.post(
  "/",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const repo = container.resolve<SessaoRepoContract>(TOKENS.SessaoRepo);
      const sessao = await createSessao(req.userId!, req.body.modo, repo);
      res.status(201).json(sessao);
    } catch (e) {
      if (e instanceof ModoInvalidoError) {
        res.status(400).json({ message: "modo deve ser 'livre' ou 'guiado'" });
        return;
      }
      throw e;
    }
  },
);

router.patch(
  "/:id",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const repo = container.resolve<SessaoRepoContract>(TOKENS.SessaoRepo);
      const { totalTiros, acertos, precisao, tempoMedioReacaoMs } = req.body;
      if (
        typeof totalTiros !== "number" ||
        typeof acertos !== "number" ||
        typeof precisao !== "number" ||
        typeof tempoMedioReacaoMs !== "number"
      ) {
        res.status(400).json({ message: "métricas inválidas" });
        return;
      }
      const sessao = await encerrarSessao(
        req.params["id"] as string,
        req.userId!,
        { totalTiros, acertos, precisao, tempoMedioReacaoMs },
        repo,
      );
      res.json(sessao);
    } catch (e) {
      if (e instanceof EncerrarNaoEncontrada) {
        res.status(404).json({ message: "Sessão não encontrada" });
        return;
      }
      if (e instanceof EncerrarAcessoNegado) {
        res.status(403).json({ message: "Acesso negado" });
        return;
      }
      if (e instanceof SessaoJaEncerradaError) {
        res.status(409).json({ message: "Sessão já encerrada" });
        return;
      }
      throw e;
    }
  },
);

router.get(
  "/:id",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const repo = container.resolve<SessaoRepoContract>(TOKENS.SessaoRepo);
      const sessao = await getSessao(
        req.params["id"] as string,
        req.userId!,
        repo,
      );
      res.json(sessao);
    } catch (e) {
      if (e instanceof SessaoNaoEncontradaError) {
        res.status(404).json({ message: "Sessão não encontrada" });
        return;
      }
      if (e instanceof AcessoNegadoError) {
        res.status(403).json({ message: "Acesso negado" });
        return;
      }
      throw e;
    }
  },
);

export default router;
