import "reflect-metadata";
import { container } from "tsyringe";
import { UsuarioMongoRepo } from "../repositories/usuario-mongo-repo.js";
import { SessaoMongoRepo } from "../repositories/sessao-mongo-repo.js";
import { TOKENS } from "./tokens.js";

container.registerSingleton(TOKENS.UsuarioRepo, UsuarioMongoRepo);
container.registerSingleton(TOKENS.SessaoRepo, SessaoMongoRepo);

export { container };
