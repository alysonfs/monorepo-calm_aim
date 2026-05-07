import "reflect-metadata";
import express from "express";
import { connectMongo } from "./db/mongo.js";
import authRouter from "./routes/auth.js";
import sessionsRouter from "./routes/sessions.js";

const app = express();
const PORT = process.env["PORT"] ?? 3001;

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
