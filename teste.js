import { db } from "./db.js";
import { ChamadoRepository } from "./repositories/ChamadoRepository.js";
import { Chamado } from "./models/Chamado.js";

const repo = new ChamadoRepository(db);

const chamado = new Chamado(1, "Tela quebrada", "tela trincada", "hardware", "alta");
await repo.salvar(chamado);

const todos = await repo.listarTodos();
console.log(todos);