import mongoose from "mongoose";

export async function connectMongo(): Promise<void> {
  const uri = process.env["MONGO_URI"];
  if (!uri) throw new Error("MONGO_URI não definida");
  await mongoose.connect(uri);
  console.log("[api] MongoDB conectado");
}
