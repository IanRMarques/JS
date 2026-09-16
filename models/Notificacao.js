export class Notificacao{
    constructor(chamado){
        this.chamado = chamado;
    }
    enviar(){
        throw new Error ("Necessário implementar");
    }
}
export class NotificacaoEmail extends Notificacao{
    enviar(){
        console.log(`[Email] Chamado #${this.chamado.id} está ${this.chamado.status}`);
    }
}
export class NotificacaoSistema extends Notificacao{
     enviar(){
        console.log(`[Sistema] Chamado #${this.chamado.id} está ${this.chamado.status}`);
    }
}