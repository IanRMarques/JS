import { Chamado } from "../models/Chamado.js";

export class ChamadoRepository {
  constructor(db) {
    this.db = db;
  }
 //listar todos os chamados
  async listarTodos() {
    await this.db.read(); //espera para ler o arquivo JSON antes de retornar os chamados
    return this.db.data.chamados.map(Chamado.fromJSON); //
  }
//ele vai buscar o chamado pelo id, se não encontrar ele retorna null
  async buscarPorId(id) {
    await this.db.read();
    const chamado = this.db.data.chamados.find((chamado) => chamado.id === id);
    return chamado ? Chamado.fromJSON(chamado) : null;
    //obs, a linha acima é um IF
  }
 //ele vai salvar o chamado, primeiro ele le o arquivo json
 //depois verifica se o chamado ja existe, se não existir ele adiciona, se existir ele atualiza
  async salvar(chamado) {
    await this.db.read();
    const index = this.db.data.chamados.findIndex((c) => c.id === chamado.id);
//se o index for -1, significa que o chamado não existe, então ele adiciona
    if (index === -1) {
      this.db.data.chamados.push(chamado.toJSON());
    } else {
      this.db.data.chamados[index] = chamado.toJSON();
    }
    await this.db.write();
  }
  async remover(id){
    await this.db.read();
    this.db.data.chamados = this.db.data.chamados.filter((c) => c.id !== id);
    await this.db.write();
  }
}
