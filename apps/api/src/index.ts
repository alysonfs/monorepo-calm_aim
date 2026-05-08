import "reflect-metadata";
import cors from "cors";
import express from "express";
import { connectMongo } from "./db/mongo.js";
import authRouter from "./routes/auth.js";
import sessionsRouter from "./routes/sessions.js";

const app = express();
const PORT = process.env["PORT"] ?? 3001;
const ALLOWED_ORIGIN = process.env["ALLOWED_ORIGIN"] ?? "http://localhost:5174";

app.use(cors({ origin: ALLOWED_ORIGIN, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.use("/auth", authRouter);
app.use("/sessions", sessionsRouter);

connectMongo()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[api] Servidor rodando na porta ${PORT}`);
    });
  })
  .catch((err: unknown) => {
    console.error("[api] Falha ao conectar ao MongoDB:", err);
    process.exit(1);
  });

export default app;
