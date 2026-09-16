import { db } from "./db.js";
import { ChamadoRepository } from "./repositories/ChamadoRepository.js";
import { ChamadoService } from "./services/ChamadoService.js";

const repo = new ChamadoRepository(db);
const service = new ChamadoService(repo);

const c = await service.criarChamado("Tela quebrada", "tela trincada", "hardware", "alta");
console.log(c);

await service.atualizarStatus(c.id, "em andamento");
console.log(await service.dashboard());

try {
  await service.atualizarStatus(c.id, "aberto");
} catch (erro) {
  console.log("Bloqueado:", erro.message);
}