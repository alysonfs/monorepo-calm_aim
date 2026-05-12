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
import { registrarEventoSessao } from "../use-cases/sessions/registrar-evento-sessao.js";
import { getDificuldadeAtual } from "../use-cases/sessions/get-dificuldade-atual.js";
import { registrarEmocao } from "../use-cases/sessions/registrar-emocao.js";
import { getEventoSessaoRepo } from "../repositories/evento-sessao-cassandra-repo.js";
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

router.get(
  "/:id/dificuldade",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const result = await getDificuldadeAtual(
      req.params["id"] as string,
      getEventoSessaoRepo(),
    );
    res.json(result);
  },
);

router.post(
  "/:id/eventos",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const { tipo, reacaoMs, dificuldadeAtual } = req.body as {
      tipo: unknown;
      reacaoMs: unknown;
      dificuldadeAtual: unknown;
    };
    if (
      (tipo !== "tiro" && tipo !== "acerto" && tipo !== "miss") ||
      typeof reacaoMs !== "number" ||
      typeof dificuldadeAtual !== "number"
    ) {
      res.status(400).json({ message: "corpo inválido" });
      return;
    }
    const result = await registrarEventoSessao(
      { sessaoId: req.params["id"] as string, tipo, reacaoMs },
      getEventoSessaoRepo(),
      dificuldadeAtual,
    );
    res.json(result);
  },
);

router.post(
  "/:id/emocao",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const { nivel } = req.body as { nivel: unknown };
    if (typeof nivel !== "number") {
      res.status(400).json({ message: "nivel deve ser número entre 0 e 1" });
      return;
    }
    try {
      await registrarEmocao(
        { sessaoId: req.params["id"] as string, nivel },
        getEventoSessaoRepo(),
      );
      res.status(204).send();
    } catch (e) {
      if (e instanceof RangeError) {
        res.status(400).json({ message: e.message });
        return;
      }
      throw e;
    }
  },
);

export default router;
