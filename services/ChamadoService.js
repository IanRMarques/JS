  import { Chamado } from "../models/Chamado.js";
  import { NotificacaoEmail, NotificacaoSistema } from "../models/Notificacao.js";
  export class ChamadoService {
    //construtor que recebe o repositorio de chamadas como parametro
    //e indica que o proximo id a ser gerado é 1
    constructor(chamadoRepository) {
      this.chamadoRepository = chamadoRepository;
      this.proximoId = 1;
    }
    //função que cria um novo chamado e recebe os parametros ...
    async criarChamado(titulo, descricao, categoria, prioridade) {
      const id = this.proximoId++;
      const chamado = new Chamado(id, titulo, descricao, categoria, prioridade);
      await this.chamadoRepository.salvar(chamado);
      return chamado;
    }
    // função que lista todos os chamados e recebe um objeto de filtros como parametro
    async listarChamados(filtros = {}) {
      // aqui foi usado o objeto vazio para caso não seja passado nenhum filtro, assim ele lista todos os chamado
      const chamados = await this.chamadoRepository.listarTodos(); //chamadas é a lista de todos os chamados
      const filtrados = chamados.filter((chamado) => {
        //filtra os chamados de acordo com os filtros passados
        if (filtros.status && chamado.status !== filtros.status) {
          //filtra por status
          return false;
        }
        if (filtros.categoria && chamado.categoria !== filtros.categoria) {
          // filtra por categoria
          return false;
        }
        return true;
      });
      return filtrados;
    }
    //funcao para transoformar qualquer titulo e descricao para minusculo
    async buscar(texto) {
      const chamados = await this.chamadoRepository.listarTodos();
      const termo = texto.toLowerCase();
      const encontrados = chamados.filter((chamado) => {
        return (
          chamado.titulo.toLowerCase().includes(termo) ||
          chamado.descricao.toLowerCase().includes(termo)
        );
      });
      return encontrados;
    }
    //remover ID
    async remover(id) {
      await this.chamadoRepository.remover(id);
    }
    // funcao para atualizar status
    // primeiro buscamos o id, se não achar, lança erro
    //se for verdadeiro, muda o statos e ja salva no repository
    // cria a notificacao e retorna o chamado atualizado
    async atualizarStatus(id, novoStatus, tipoNotificacao = "sistema") {
      const chamado = await this.chamadoRepository.buscarPorId(id);
      if (!chamado) {
        throw new Error("Chamado não encontrado");
      }
      chamado.mudarStatus(novoStatus);
      await this.chamadoRepository.salvar(chamado);
      const notificacao =
        tipoNotificacao === "email"
          ? new NotificacaoEmail(chamado)
          : new NotificacaoSistema(chamado);

      notificacao.enviar();
      return chamado;
    }
    //dashboard pra contagem e por categoria
    async dashboard() {
      const chamados = await this.chamadoRepository.listarTodos();
      //aqui o "reduce" monta um placar por status, não apenas uma soma
      const contagem = chamados.reduce((acumulador, chamado) => {
        acumulador[chamado.status] = (acumulador[chamado.status] || 0) + 1;
        return acumulador;
      }, {});
      const contagemCategoria = chamados.reduce((acumulador, chamado) =>{
        acumulador[chamado.categoria] = (acumulador[chamado.categoria] || 0) + 1;
        return acumulador;
      },{});
      return { porStatus: contagem, porCategoria: contagemCategoria};
      
    }
  }
