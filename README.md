# Bancada — API de Chamados de Assistência Técnica

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)

API REST para gestão de chamados de assistência técnica, com fluxo de status controlado, busca textual e painel de indicadores. Construída em JavaScript puro, com arquitetura em camadas e orientação a objetos.

---

## Sumário

- [O problema](#o-problema)
- [Arquitetura](#arquitetura)
- [Fluxo de status](#fluxo-de-status)
- [Como rodar](#como-rodar)
- [Endpoints](#endpoints)
- [Decisões técnicas](#decisões-técnicas)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Próximos passos](#próximos-passos)

---

## O problema

Uma assistência técnica recebe equipamentos, registra o defeito, acompanha o reparo e devolve ao cliente. Sem controle, dois problemas aparecem: chamados pulam etapas do fluxo (algo é marcado como concluído sem nunca ter entrado em manutenção) e não há visibilidade de quantos chamados estão em cada estágio, nem de quanto tempo os reparos levam.

Este projeto resolve os três: o fluxo de status é validado pela própria entidade, e um endpoint de indicadores agrega a fila por status, por categoria e calcula o tempo médio de resolução.

---

## Arquitetura

O código é organizado em quatro camadas, cada uma com uma responsabilidade única:

```
HTTP  →  Rotas (Express)  →  Service  →  Repository  →  db.json
                                ↓
                            Chamado (entidade)
```

| Camada | Arquivo | Responsabilidade |
|---|---|---|
| Entidade | `models/Chamado.js` | Representa um chamado. Protege o próprio estado e valida transições de status. |
| Notificação | `models/Notificacao.js` | Hierarquia de notificação (base + subtipos), disparada a cada mudança de status. |
| Repositório | `repositories/ChamadoRepository.js` | Único ponto de acesso à persistência. Converte dados brutos em entidades e vice-versa. |
| Serviço | `services/ChamadoService.js` | Regras de negócio: criação, filtros, busca, indicadores, orquestração da notificação. |
| Rotas | `server.js` | Traduz HTTP em chamadas ao serviço. Não contém regra de negócio. |

**O ganho prático dessa separação:** as rotas não sabem que existe um arquivo JSON por trás. Trocar a persistência por PostgreSQL significa reescrever apenas o repositório — o serviço, a entidade e as rotas permanecem intactos.

### Orientação a objetos aplicada

- **Encapsulamento** — o status do chamado é um campo privado (`#status`). Não existe forma de alterá-lo de fora sem passar por `mudarStatus()`, que valida antes de aceitar. Um acesso direto como `chamado.status = "concluido"` não compila.
- **Abstração** — quem consome o serviço chama `criarChamado()` ou `listarChamados()` sem saber como os dados são lidos, validados ou gravados.
- **Herança e polimorfismo** — `Notificacao` define o contrato; `NotificacaoEmail` e `NotificacaoSistema` sobrescrevem `enviar()` com comportamentos próprios. O serviço chama `notificacao.enviar()` sem saber qual subtipo está por trás. Adicionar um novo canal (SMS, webhook) não exige alterar o serviço.
- **Método estático** — `Chamado.statusValido()` não depende de nenhuma instância, então é chamado direto na classe.

---

## Fluxo de status

Um chamado nasce como `aberto` e só avança em uma direção:

```
aberto  →  em andamento  →  concluido
```

Transições fora dessa sequência são rejeitadas pela entidade, não pela rota. Tentar ir de `aberto` direto para `concluido` devolve `400` com a mensagem do erro, e o estado do chamado permanece inalterado.

Ao entrar em `concluido`, o instante da conclusão é registrado — é o que permite calcular o tempo de resolução.

O front-end respeita a mesma regra: um chamado concluído não exibe botão de avanço.

---

## Como rodar

**Pré-requisitos:** Node.js 18 ou superior.

```bash
git clone https://github.com/IanRMarques/JS.git
cd JS
npm install
npm start
```

A aplicação sobe em `http://localhost:3000`. Abrir esse endereço no navegador carrega a interface de demonstração; a API fica sob `/api`.

Para desenvolvimento com recarga automática a cada alteração:

```bash
npm run dev
```

---

## Endpoints

Base: `http://localhost:3000/api`

### Criar chamado

```http
POST /api/chamados
Content-Type: application/json

{
  "titulo": "Teclado não responde",
  "descricao": "Metade das teclas parou depois de um derramamento",
  "categoria": "hardware",
  "prioridade": "alta"
}
```

**201 Created**

```json
{
  "id": 1,
  "titulo": "Teclado não responde",
  "descricao": "Metade das teclas parou depois de um derramamento",
  "categoria": "hardware",
  "prioridade": "alta",
  "status": "aberto",
  "criadoEm": "2026-09-16T14:25:00.000Z",
  "resolvidoEm": null
}
```

O status inicial e o instante de criação são definidos pela entidade e não podem ser informados na requisição.

---

### Listar chamados

```http
GET /api/chamados
GET /api/chamados?status=aberto
GET /api/chamados?categoria=hardware
GET /api/chamados?status=aberto&categoria=rede
```

**200 OK** — array de chamados. Os filtros são opcionais e combináveis; sem nenhum, devolve a fila inteira.

---

### Buscar por texto

```http
GET /api/chamados/busca?q=teclado
```

**200 OK** — chamados cujo título ou descrição contenham o termo. A comparação ignora maiúsculas e minúsculas e aceita correspondência parcial.

---

### Atualizar status

```http
PATCH /api/chamados/1
Content-Type: application/json

{
  "status": "em andamento",
  "tipoNotificacao": "email"
}
```

**200 OK** — o chamado atualizado. O campo `tipoNotificacao` é opcional (`"email"` ou `"sistema"`, padrão `"sistema"`) e determina qual subtipo de notificação é disparado.

**400 Bad Request** — quando o chamado não existe ou a transição é inválida:

```json
{ "erro": "Transição de status inválida: em andamento para aberto" }
```

---

### Remover chamado

```http
DELETE /api/chamados/1
```

**204 No Content** — sem corpo de resposta.

---

### Indicadores

```http
GET /api/dashboard
```

**200 OK**

```json
{
  "porStatus": {
    "aberto": 4,
    "em andamento": 2,
    "concluido": 7
  },
  "porCategoria": {
    "hardware": 9,
    "software": 3,
    "rede": 1
  },
  "tempoMedioHoras": 18.4
}
```

As agregações são calculadas em uma única passada pela lista, sem necessidade de conhecer os status ou categorias de antemão — um valor novo aparece automaticamente no resultado.

O tempo médio considera apenas chamados concluídos, calculado pela diferença entre os instantes de abertura e conclusão. Quando nenhum chamado foi concluído, o valor é `null` — ausência de dado não é tratada como erro, para não derrubar as demais métricas do painel.

---

## Decisões técnicas

**Persistência em arquivo JSON (lowdb).** O projeto roda sem instalar ou configurar banco de dados. É um trade-off consciente: prioriza simplicidade de execução sobre escalabilidade. Como o acesso está isolado no repositório, a migração para um banco relacional é localizada.

**Regra de negócio na entidade, não no serviço.** A validação de transição vive dentro de `Chamado.mudarStatus()`. Isso garante que o objeto não consegue entrar em estado inconsistente por nenhum caminho — nem por uma rota nova, nem por um script que use o repositório diretamente. A alternativa (validar na rota) exigiria repetir a checagem em todo lugar que altera status.

**Validação antes da mutação.** Em `mudarStatus()`, as duas checagens acontecem antes de qualquer atribuição. Se a ordem fosse invertida, o estado seria corrompido mesmo com o erro sendo lançado — não há rollback em memória.

**`toJSON()` e `fromJSON()` explícitos.** Campos privados são invisíveis para `JSON.stringify()`, e datas viram string ao serem gravadas. Sem esses dois métodos, o status desapareceria ao salvar e as datas voltariam como texto, impedindo qualquer cálculo de intervalo. A serialização é feita à mão, de forma controlada.

**Unidade na API, formatação no cliente.** O tempo médio é devolvido em horas fracionárias, sem arredondamento. A conversão para uma unidade legível (segundos, minutos, horas ou dias, conforme a grandeza) é feita no front-end. A API entrega o dado bruto; a apresentação é responsabilidade de quem consome.

**Ausência de dado não é erro.** Um painel sem chamados concluídos devolve `null` no tempo médio, não uma exceção. Lançar erro nesse caso derrubaria as contagens por status e categoria junto — métricas que continuam válidas.

**Busca textual em memória.** Para o volume deste projeto, filtrar em JavaScript é suficiente. Em escala, o caminho seria um motor de busca dedicado (Elasticsearch, por exemplo) com índice invertido e ranqueamento por relevância, em vez de varredura linear.

**Códigos HTTP específicos.** `201` para criação, `204` para remoção sem corpo, `400` para requisição inválida — em vez de `200` genérico para tudo.

---

## Estrutura de pastas

```
JS/
├── models/
│   ├── Chamado.js              entidade e regras de transição
│   └── Notificacao.js          hierarquia de notificação
├── repositories/
│   └── ChamadoRepository.js    acesso à persistência
├── services/
│   └── ChamadoService.js       regras de negócio
├── public/
│   └── index.html              interface de demonstração
├── data/
│   └── db.json                 base de dados
├── db.js                       configuração do lowdb
├── server.js                   rotas HTTP
└── package.json
```

---

## Próximos passos

- **Testes automatizados** — as regras de transição e as agregações do dashboard são os candidatos naturais a cobertura.
- **Geração de id no banco** — hoje o contador vive em memória no serviço e reinicia junto com o processo. Derivar o próximo id do maior já persistido resolve.
- **Validação de entrada nas rotas** — campos obrigatórios e formatos são assumidos válidos. Uma biblioteca de schema (Zod, Joi) formalizaria o contrato.
- **Logging estruturado** — substituir saída de console por uma biblioteca com níveis de severidade.
- **Métricas por recorte** — hoje o tempo médio é global; separá-lo por categoria ou prioridade mostraria onde os reparos travam.
