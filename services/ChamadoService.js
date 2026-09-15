import { Chamado } from "../models/Chamado.js";
export class ChamadoService {
    constructor(chamadoRepository){
        this.chamadoRepository = chamadoRepository;
        this.proximoId = 1;
    }
    async criarChamado(titulo, descricao, categoria, prioridade){
        const id = this.proximoId++;
        const chamado = new Chamado (id, titulo, descricao, categoria, prioridade);
        await this.chamadoRepository.salvar(chamado);
        return chamado;
    }
    async listarChamados(){
        const chamados = await this.chamadoRepository.listarChamados();
        
    }
}