const STATUS_VALIDO=["aberto", "em andamento", "concluido"];

const REGRAS_TRANSICAO = {
    "aberto": ["em andamento"],
    "em andamento": ["concluido"],
    "concluido": []
}
export class Chamado{ 
    #status
    //confere se o status é válido
    static statusValido(novoStatus){
        return STATUS_VALIDO.includes(novoStatus)
    }
    //ve se o status atual permite a transição para o novo status
    mudarStatus(novoStatus){
        if(!REGRAS_TRANSICAO[this.#status].includes(novoStatus)){
            throw new Error(`Transição de status inválida: ${this.#status} para ${novoStatus}`)
        }
        this.#status = novoStatus;
        if(novoStatus === "concluido"){
            this.resolvidoEm = new Date();
        }
    }

    constructor(id, titulo, descricao, categoria, prioridade){
        this.id = id;
        this.titulo = titulo;
        this.descricao = descricao;
        this.categoria = categoria;
        this.prioridade = prioridade;
        this.#status = 'aberto'
        this.criadoEm = new Date();
        this.resolvidoEm = null;
    }

    //retorna o status atual do chamado pelo get, sem permitir a alteração direta do status
    get status(){
        return this.#status
    }
 //metodo especifico do JS para o json ler o #(que é privado) e retornar o status
    toJSON(){
        return {
            id: this.id,
            titulo: this.titulo,
            descricao: this.descricao,
            categoria: this.categoria,
            prioridade: this.prioridade,
            status: this.#status,
            criadoEm: this.criadoEm,
            resolvidoEm: this.resolvidoEm
        } 
    }
    //reconstrói o objeto Chamado a partir de um JSON, incluindo o status privado
    static fromJSON(json){
        const chamado = new Chamado(json.id, json.titulo, json.descricao, json.categoria, json.prioridade);
        chamado.#status = json.status;
        chamado.criadoEm = new Date(json.criadoEm);
        chamado.resolvidoEm = json.resolvidoEm ? new Date(json.resolvidoEm): null;
        return chamado;
    }
}