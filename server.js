    import { ChamadoService } from "./services/ChamadoService.js";
    import { db } from "./db.js";
    import { ChamadoRepository } from "./repositories/ChamadoRepository.js";
    import express from "express";

    const app = express ();
    app.use (express.json());
     app.use(express.static("public"));

    const repo = new ChamadoRepository(db);
    const service = new ChamadoService(repo);

    app.post("/api/chamados", async (req, res) => {
        //pegar as propriedades do objeto
        const {titulo, descricao, categoria, prioridade} = req.body;
        // chama o service para criar o chamado
        const chamado = await service.criarChamado(titulo,descricao, categoria, prioridade);
        //status 201, deu bom 
        res.status(201).json(chamado);
    });

    app.get("/api/chamados", async (req, res) =>{
    const chamados = await service.listarChamados(req.query);
    res.status(200).json(chamados);
    });
    // melhorias a fazer na busca, adicionar um padrão de checagem na rota
    app.get("/api/chamados/busca", async (req, res) =>{
        const chamados = await service.buscar(req.query.q)
        res.status(200).json(chamados);
    });

    app.patch("/api/chamados/:id", async (req, res) =>{
        try{
            const id = Number(req.params.id);
            const {status, tipoNotificacao} = req.body;
            const chamado = await service.atualizarStatus(id, status, tipoNotificacao);
            res.status(200).json(chamado);
        } catch (erro){
            res.status(400).json({erro: erro.message});
        }
    });

    app.delete("/api/chamados/:id", async (req, res)=>{
        const id = Number(req.params.id);
        await service.remover(id);
        res.status(204).send();
        
    });

    app.get ("/api/dashboard", async (req, res)=>{
        const dados =  await service.dashboard();
        res.status(200).json(dados);
    })

   app.listen(3000, () => console.log("Servidor rodando em http://localhost:3000"));