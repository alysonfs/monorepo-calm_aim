import express from "express";

const app = express();
const PORT = process.env["PORT"] ?? 3001;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`[api] Servidor rodando na porta ${PORT}`);
});

export default app;
