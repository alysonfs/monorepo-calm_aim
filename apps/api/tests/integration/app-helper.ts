import "reflect-metadata";
import express from "express";
import mongoose from "mongoose";
import authRouter from "../../src/routes/auth.js";
import sessionsRouter from "../../src/routes/sessions.js";

export async function buildApp() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env['MONGO_URI']!);
  }

  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  app.use("/auth", authRouter);
  app.use("/sessions", sessionsRouter);

  return app;
}

export async function closeApp() {
  await mongoose.disconnect();
}
