import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { Usuario } from "../models/Usuario";

const MONGO_URI = process.env.MONGO_URI;
const SEED_ROOT_EMAIL = process.env.SEED_ROOT_EMAIL;
const SEED_ROOT_PASSWORD = process.env.SEED_ROOT_PASSWORD;

if (!MONGO_URI || !SEED_ROOT_EMAIL || !SEED_ROOT_PASSWORD) {
  console.error(
    "Variáveis obrigatórias ausentes: MONGO_URI, SEED_ROOT_EMAIL, SEED_ROOT_PASSWORD",
  );
  process.exit(1);
}

async function seed() {
  await mongoose.connect(MONGO_URI as string);

  const exists = await Usuario.findOne({ email: SEED_ROOT_EMAIL });
  if (exists) {
    console.log(`Usuário root já existe: ${SEED_ROOT_EMAIL}`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(SEED_ROOT_PASSWORD as string, 12);
  await Usuario.create({
    email: SEED_ROOT_EMAIL,
    passwordHash,
    role: "admin",
    preferences: { nivel: "avancado" },
  });

  console.log(`Usuário root criado: ${SEED_ROOT_EMAIL}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Erro no seed:", err);
  process.exit(1);
});
