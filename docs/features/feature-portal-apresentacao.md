# Feature: Apresentação — o Portal gera a apresentação de despertar, sob medida por setor

**Status:** 🟢 **SPEC v3 — APROVADA em 21/08. F1 em implementação.**
**Priority:** P0 — próximo item do roadmap
**Date:** 2026-08-20
**Pai:** `feature-portal-defenz.md` · **Precedente direto:** `feature-portal-proposta.md`
**Crítica adversarial:** [`feature-portal-apresentacao-review.md`](feature-portal-apresentacao-review.md)
— 4 críticos (corrigidos), 5 médios, 3 menores.
**Herda:** invariantes **§5 da `SPEC-MAE.md`** (I1–I11). Extensões justificadas em §6.5.

> **v2 mudou o eixo do produto.** A v1 desenhava um deck técnico-comparativo. O Marcos
> corrigiu: **a apresentação técnica já existe e é dele, usada na reunião.** O que falta é
> a peça de **antes**: marca, mercado, cases e como a Bitdefender atua no setor do cliente.
> O que mudou está em §16.

---

## 1. Objetivo

> "Essa apresentação técnica eu uso com os clientes. Eu quero uma outra apresentação que
> pode usar dados desta, mas que seja **autoexplicativa** também." — Marcos, 20/08
>
> "É mais sobre **a pessoa conhecer Bitdefender e a Defenz. Cases, mercado, e como o
> Bitdefender consegue atuar e ajudar o setor**, com os cases e etc." — Marcos, 20/08
>
> "Pense que num primeiro momento, a pessoa não conhece o Bitdefender." — Marcos

Um documento que o vendedor **manda antes da reunião**, e que funciona **sem ele na
sala**. O leitor termina sabendo três coisas: quem é a Bitdefender, quem é a Defenz, e
**o que anda acontecendo no setor dele** — cada coisa que aconteceu ligada à necessidade
que ela expõe e ao recurso que responde por ela.

### 1.1 Onde ela entra, e o que ela não é

| | Esta apresentação | A apresentação técnica (já existe) |
|---|---|---|
| Momento | **antes** do contato, por e-mail | na reunião |
| Quem conduz | ninguém — se explica sozinha | o Marcos |
| Pergunta que responde | *"por que eu deveria me importar?"* | *"o que exatamente eu compro?"* |
| Produto | uma página com os três níveis | 12 funcionalidades × 3 planos, detalhadas |

**Não é a técnica resumida.** É a peça que faz o leitor querer a técnica.

### 1.2 A diferença que organiza o resto da spec

A Proposta é **determinística**: nenhum caractere do PDF sai de LLM (I9, o ÷48). Esta é a
primeira superfície do produto com **texto gerado por IA indo para o cliente** — e, pior,
**sem ninguém junto para corrigir**, porque ela viaja sozinha por e-mail.

Por isso a maior parte desta spec não é sobre o que a IA escreve. É sobre o que ela não
pode escrever, o que é verificado em código, e quem assina.

---

## 2. O que foi medido antes de desenhar

### 2.1 ⚠️ O arquivo apontado como "o modelo" não é o modelo

O `PROGRESS.md` mandava tratar `V9_PARCEIRO_EDITAVEL_SEM_PME.pptx` como *"o modelo"*. Ele
foi lido: é o deck do **Programa de Parceiros / Finder**. Conteúdo real: *"Transforme
Networking em Receita Recorrente"*, *"O Modelo Finder: Você Indica, Nós cuidamos do
Resto"*, *"Sua Comissão (Ano 1): R$ 3.000,00"*, *"Tabelas de Simulação de Ganhos"*.

**Mandar isso a um cliente final mostraria a ele a comissão do canal.** Sai da posição de
molde.

**O que ele tem de aproveitável**, e é bastante, é a página institucional da marca — que
serve exatamente ao decisor que não conhece a Bitdefender: fundação 2001 (origem 1990),
+170 países, ~2.400 especialistas, sedes em Bucareste e Santa Clara, parceria com o
European Cybercrime Centre desde 2016, apoio no desmantelamento de mercados da dark web,
Gartner Magic Quadrant 2025, Peer Insights 4.8/5 com 95% de disposição a recomendar.
Ver §7.5 sobre a validade desses números.

### 2.2 O molde é o `DEFENZ_APRESENTAÇÃO_ESTRATÉGICA.pptx`

Já nasce parametrizado: a capa diz **`Apresentação Confidencial | [Nome do Cliente] |
[Data]`**. Dez blocos: capa · "O Paradoxo da Segurança" · comparativo com concorrentes ·
visão 360°/XDR · performance · benefícios (risco, produtividade, TCO) · por que Defenz ·
**FAQ com "onde fica o headquarter?" e "por que o Defender nativo não basta?"** · fecho ·
site.

**O slide de FAQ é a resposta literal à objeção "nunca ouvi falar", já escrita e
aprovada.** Numa peça autoexplicativa ele vale ainda mais: é a página que responde o que o
leitor perguntaria se tivesse alguém na frente.

### 2.3 O comparativo GravityZone é conteúdo fechado

`defenz_gravityzone_comparativo.pdf` foi lido inteiro: **12 funcionalidades × 3 planos**,
com descrição técnica de cada uma. Transcrito no **Anexo A**.

Nesta apresentação ele entra **resumido a uma página** (A14). O acervo completo continua
existindo em código porque é dele que sai o enum de funcionalidades (§6.3) e a página 09.

### 2.4 O terceiro arquivo não é legível

`TECNICO_Bitdefender_Liderança_Global_Ação_Brasil.pdf` (13,5 MB) retorna **vazio** pelo
conector do Graph, em três tentativas, com e sem faixa de páginas: é PDF de imagem. Fica
registrado para não se gastar a mesma hora de novo. Não bloqueia — o papel dele é coberto
por §2.1 e §2.2.

### 2.5 ⚠️ A Defenz não tem material de case. Nenhum.

Varredura no OneDrive por *case, sucesso, depoimento, success story, case study*: retorna
**exports do Apollo**. O que a casa tem hoje são **três nomes soltos** no slide de FAQ
(Câmara dos Deputados, INFRAERO, CFMV) e a faixa de logos da página de clientes.

**É o achado que forçou a pergunta ao Marcos**, e a resposta dele redefiniu a palavra:
> "**podem ser cases de problema sim, e vincule à necessidade**"

**"Case" aqui não é história de cliente satisfeito. É o que aconteceu de ruim no setor** —
e é justamente o que faz um leitor que "nunca ouviu falar" continuar lendo. Some da spec a
dependência de um acervo que a Defenz não tem, e entra uma que ela pode ter hoje.

### 2.6 O que a Bitdefender publica, e por que não é a fonte principal

A Bitdefender mantém case studies com PDF público em URL estável e uma taxonomia de **20
setores** (IT Managed Services, Healthcare, Government, Manufacturing, Retail, Finance,
Education, Automotive, Pharmaceuticals, Insurance…). A página que lista o acervo é
renderizada por JS: **enumerar é curadoria manual, não busca em runtime.**

**Decisão do Marcos: não é por aí que os cases entram** (§3, A11). Fica registrado por
dois motivos práticos: a taxonomia de 20 setores é boa demais para ignorar e vira o
alvo do mapeamento de CNAE (A5); e o acervo é candidato natural a uma fase futura de prova
social (§12).

### 2.7 Os decks atuais já saem de código

Metadados do `DEFENZ_APRESENTAÇÃO_ESTRATÉGICA.pptx` e do
`DEFENZ_Apresentação_Institucional.pptx`: **`PptxGenJS Presentation`**. A Defenz já gera
deck por código, em PPTX. O Marcos escolheu **PDF** (A1), pelo mesmo motivo da Proposta:
reusa pipeline em produção. Fica registrado que, se um dia virar "quero editar o slide", o
caminho não é converter PDF, é gerar PPTX do mesmo modelo de dados.

---

## 3. Decisões

| # | Decisão | Racional |
|---|---|---|
| **A1** | **Saída é PDF**, pelo pipeline HTML → Chromium da Proposta | Marcos. Em produção desde 20/08 |
| **A1b** | ~~16:9 paisagem~~ → **A4 retrato, o MESMO da proposta** | **Corrigida pelo Marcos em 21/08:** *"siga o mesmo formato A4 da proposta"*. A v2 tinha derivado 16:9 por ser "deck"; ele quer o documento na mesma família visual do que o cliente já recebe. Some uma geometria nova do projeto e o template reusa fonte, logo e grade da proposta |
| **A2** | Pesquisa no **Gemini com Google Search grounding**, em **duas chamadas** (§6.2) | Marcos. Chave já existe. Duas chamadas porque busca e saída estruturada não coexistem de forma confiável (crítica C1) |
| **A3** | Pesquisa vira **seção própria e citada**, nunca diluída no texto fixo | Marcos. Texto de IA fica confinado e auditável |
| **A5** | **CNAE sugere o setor; o vendedor confirma antes da busca** | CNAE é atividade fiscal declarada, muitas vezes genérica ou vencida: sugestão, não verdade (crítica C4) |
| **A6** | **Sem numeração sequencial** | Cicatriz da Proposta: falha de render queima número. Aqui não há série a queimar |
| **A9** | **Só sessão, sem Bearer.** Gerar é liberado para **qualquer papel** — `user`, `gerencia`, `admin` — **mas só para quem é da empresa Defenz** | Marcos, 21/08: *"Podem users também gerar. Mas só users Defenz."* O corte que importa **não é o papel, é a empresa**: o vendedor que precisa da peça é `user`, e quem não pode emitir documento com o logo da Defenz é o usuário de uma empresa-cliente. Usa `resolveDefenzCompanyId()`, que já existe (`service-desk-server.ts`). Ver §10.1 |
| **A10** | **O documento é autoexplicativo** | Marcos, 20/08. Vai por e-mail e é lido sem apresentador. **Consequências reais:** cada página fecha sozinha; texto corrido curto no lugar de bullet telegráfico; **não existem notas de apresentador**; e a página de FAQ deixa de ser apêndice e vira estrutural |
| **A11** | **Cases são de problema, buscados ao vivo, no setor do cliente** | Marcos, 20/08: *"podem ser cases de problema sim, e vincule à necessidade"*. A Defenz não tem acervo de case de sucesso (§2.5), e o caso de problema é o que desperta quem ainda não sente o risco |
| **A12** | **A vítima nunca é nomeada** | Marcos, 20/08. *"Uma rede de varejo brasileira…"* com veículo e ano no rodapé. Mantém a força e não aponta o dedo — inclusive porque o deck pode chegar a quem tem relação com a empresa citada. **Verificado em código** (§6.4), não confiado ao prompt |
| **A13** | **O catálogo `mercado-fatos.ts` é a base** — e a pesquisa **pode acrescentar** fato de mercado do nicho | Marcos, 20/08 e 21/08: *"pode usar os fatos catalogados e ou pode pesquisar adicionais com aquele nicho também"*. O catálogo dá o chão (dado nacional, transversal, conferido por ele); a pesquisa cobre o que é específico do setor e o catálogo não teria como prever. **Fato pesquisado passa pela mesma trava do A13b**: o dígito tem de existir no texto da chamada A, com veículo e ano |
| **A13b** | **O caso PODE carregar número** — duração, prejuízo, quantidade — desde que o número **exista literalmente no texto pesquisado** | Marcos, 21/08: *"Pode afrouxar, eu preciso do número."* Afrouxado **sem** virar promessa vazia: a verificação não é "o vendedor prometeu que leu", é código. Ver §6.5.1 |
| **A14** | **Do técnico entra uma página-resumo dos três níveis** | Marcos, 20/08. O cliente entende que existem três degraus e o que muda entre eles; o aprofundamento é a apresentação técnica, na reunião |
| **A15** | ~~comparativo com concorrentes~~ → **o documento NÃO cita concorrente nenhum.** A página passa a mostrar só o que os testes independentes dizem **do Bitdefender**, na régua mais favorável | Marcos, 21/08: *"Não faça essa comparação direta, não precisa citar os concorrentes. Escolha sempre a melhor régua Bitdefender."* Decidido depois de as fontes derrubarem a coluna de performance (§7.3.1). Sem nome de concorrente, some a exposição de publicidade comparativa **e** o problema da régua que se inverte. Ver §7.3.2 |
| **A16** | **Sem página de clientes, e sem promessa de mobile** | Marcos, 21/08, e ele foi explícito que vale **"de todas as propostas e apresentações"**. Já aplicado na Proposta (§16 e §17 de lá). Aqui é **preventivo**: a página de prova social não entra, e nenhuma página escreve iOS ou Android. Ver §7.4 |

---

## 4. Fluxo

```
Botão "Nova apresentação" (cabeçalho do Portal, ao lado de "Nova proposta")
  → /dashboard/portal/apresentacao          [1] FORMULÁRIO
  → POST .../apresentacoes/setor            [0] SETOR   (barato: só BrasilAPI)
        "Setor identificado: X. É isso?"  ← editável; a busca só roda depois daqui
  → POST .../apresentacoes/pesquisa         [2] PESQUISA  (não grava, não gera arquivo)
        1. chamada A: Gemini COM busca, prosa   → incidentes do setor + fontes reais
        2. chamada B: Gemini SEM ferramenta     → anonimiza, liga à necessidade,
                                                   escolhe a funcionalidade, devolve JSON
        3. guardas em código: nome próprio · número · fonte · enum · faixa de índice
        4. devolve casos + fontes + plano sugerido, cada campo com origem:'ia'
  → tela de REVISÃO                          [3] o vendedor edita, libera, remove
  → tela de CONFIRMAÇÃO                      [4] mostra o que vai sair
  → POST /api/portal/apresentacoes           [5] renderiza, grava, devolve o PDF
  → download imediato
  → (assíncrono) arquiva no OneDrive, mesmo caminho da proposta
```

A pesquisa é passo separado da geração de propósito: leva segundos, o vendedor precisa ver
**antes** de existir arquivo, e refazer não pode custar um documento gravado.

---

## 5. Formulário

| Campo | Tipo | Obrigatório | Para quê |
|---|---|---|---|
| Nome do cliente (pessoa) | texto | sim | capa e cabeçalho |
| Nome da empresa | texto | sim | capa, cabeçalho e chave da pesquisa |
| CNPJ | texto | não | vira setor sugerido via CNAE (A5) |
| Site da empresa | url | não | âncora forte; sem ele a busca pode achar homônimo |
| O que a empresa faz | textarea | condicional | **obrigatório quando não houver CNPJ nem site** |
| Porte / nº de endpoints | número, 1–100.000 | não | plano sugerido e texto de escala. **Não vira preço** (§12) |
| Contexto da oportunidade | textarea, 500 | não | o que o vendedor já ouviu. Entra como pista, nunca como fato, e **não vai para a busca** (§12.1) |

Vendedor vem da sessão. Data é hoje no fuso de São Paulo (I3).

⚠️ **Sem CNPJ, sem site e sem descrição, o formulário recusa e explica** (I4): sem nenhuma
das três âncoras, "entender o nicho" vira adivinhar a partir de um nome de fantasia.

---

## 6. A pesquisa — o coração da feature, e o que ela é proibida de fazer

### 6.1 O que se procura

**Incidentes reais no setor do cliente**, recentes, com veículo identificável. Não
"tendências de cibersegurança": coisas que aconteceram.

Para cada um, a saída amarra três elos — e essa amarração é a feature inteira:

```
o que aconteceu  →  a necessidade que isso expõe  →  a funcionalidade que responde
   (buscado)            (interpretado)                  (escolhido num enum de 12)
```

### 6.2 Duas chamadas, e por quê

⚠️ Grounding de busca e saída estruturada em JSON não coexistem de forma confiável no
Gemini, e o `groundingSupports` mapeia trechos do **texto bruto** — que numa chamada única
seria a própria string JSON. O modo de falha não é erro: é índice de fonte inventado
passando no Zod e **virando citação falsa em documento de cliente** (crítica C1).

| | Chamada A | Chamada B |
|---|---|---|
| Ferramenta | Google Search grounding | **nenhuma** |
| Saída | prosa | JSON do §6.3 |
| Entrada | setor **confirmado**, razão social, site | **só o texto da A** + as 12 funcionalidades |
| Papel | descobrir e citar | **anonimizar**, ligar à necessidade, classificar |

A chamada B **não tem internet**: não pode introduzir fato novo, só reorganizar o da A.
Fonte que não veio no `groundingMetadata` da A não existe.

✅ **R8 RESOLVIDO (22/08).** Confirmado na fonte e medido contra a API real — ver
**§6.2.1**. Resumo: o SDK legado **não** expõe a ferramenta certa, o campo que ele expõe é
**rejeitado** pelo modelo em uso, e as duas chamadas são obrigatórias por um motivo pior do
que o que a C1 previa.

### 6.2.1 ⚠️ R8 — o que o SDK expõe, medido contra a API (22/08)

Três perguntas, três respostas, nenhuma por tentativa e erro. Fontes: os *typings* do
pacote instalado, o `types.ts` do SDK novo (`googleapis/js-genai`), e **chamadas reais** à
`generativelanguage.googleapis.com` com a chave do projeto.

**1. O SDK legado não expõe a ferramenta certa, e a que ele expõe é recusada.**

O `Tool` do `@google/generative-ai@0.21` é uma união de três, e nenhuma é a busca atual:

```ts
// node_modules/@google/generative-ai/dist/generative-ai.d.ts:1259
export declare type Tool = FunctionDeclarationsTool | CodeExecutionTool | GoogleSearchRetrievalTool
```

`googleSearchRetrieval` é a forma da era Gemini 1.5. Contra o modelo que a Ana usa hoje
(`gemini-3.6-flash`), a API responde:

```
HTTP 400 — google_search_retrieval is not supported. Please use google_search tool instead.
```

A forma atual é `tools: [{ googleSearch: {} }]` — que existe no SDK novo (`@google/genai`)
e **não** no `Tool` do legado.

**2. Dá para seguir no SDK legado, mas com dois remendos — e um deles é invisível.**

O legado repassa o campo desconhecido ao corpo da requisição, então
`tools: [{ googleSearch: {} } as any]` **funciona** (verificado: HTTP 200 com
`groundingMetadata`). O problema está na volta: **os *typings* da resposta têm erro de
digitação**, e o campo certo não é o que a tipagem promete.

| O que os *typings* do legado declaram | O que a API devolve de verdade |
|---|---|
| `groundingMetadata.groundingChuncks` | `groundingChunks` |
| `groundingMetadata.groundingSupport` | `groundingSupports` |
| `GroundingSupport.groundingChunckIndices` | `groundingChunkIndices` |
| `GroundingSupport.segment?: string` | objeto `{ startIndex, endIndex, text, partIndex }` |

⚠️ **Por que isto é pior do que um erro de compilação:** quem programar contra a tipagem lê
`gm.groundingChuncks` e recebe `undefined` — sem exceção, sem aviso. Cai no caminho de
"nenhuma fonte encontrada" e o documento sai **sem citação**, ou com o `fonteIdx` apontando
para uma lista vazia. O TypeScript aprova. Medido: `gm.groundingChuncks → undefined`,
`gm.groundingChunks → 1 chunk`; `gm.groundingSupport → undefined`,
`gm.groundingSupports → 3 supports`.

**Decisão: migrar para `@google/genai` na F3.** O legado está fora de suporte desde
**30/11/2025** (o repositório é hoje `google-gemini/deprecated-generative-ai-js`), a chamada
A depende de um campo que o pacote não conhece, e a leitura da resposta depende de
contornar quatro nomes errados. Isso é dívida com data de vencimento vencida, num caminho
que imprime citação em documento de cliente. A Ana (`src/lib/portal/ask.ts`) fica onde está
por ora — ela não usa grounding.

**3. A premissa da C1 estava certa, mas o modo de falha é outro — e é pior.**

A C1 previa índice de fonte inventado passando no Zod. O que a API faz é mais silencioso:

| Requisição | Resultado medido |
|---|---|
| `googleSearch` + prosa | HTTP 200, `groundingMetadata` completo (`searchEntryPoint`, `groundingChunks`, `groundingSupports`, `webSearchQueries`) |
| `googleSearch` + `responseMimeType: json` + `responseSchema` | HTTP 200, JSON perfeito e plausível — e **`groundingMetadata` simplesmente ausente** |
| `googleSearch` + `responseMimeType: json` **sem** schema | HTTP 200 **sem candidato nenhum** — só `usageMetadata` |

⚠️ **A linha do meio é a que mata.** O modelo devolve casos bem formados, com nome de
empresa e nome de veículo, validando no Zod — e **zero** metadado de atribuição. Não há
índice errado para o `fonteIdx` pegar: não há índice. O `veiculo` teria vindo da memória do
modelo, não da matéria, e o documento sairia com citação que ninguém pode conferir. **Sem
erro, sem aviso.** É a "citação falsa em documento de cliente" da C1, entrando por outra
porta — e uma implementação ingênua embarcaria isso.

**Portanto o desenho de duas chamadas do §6.2 não é preferência: é a única forma de a
chamada A ter `groundingMetadata`.** E A13b (§6.5.1) depende disso duas vezes — precisa do
texto bruto da A para conferir os dígitos, e das fontes da A para o `fonteIdx`.

**4. Achado que ajuda o §6.1 (incidentes *recentes*).** `googleSearch` aceita
`timeRangeFilter: { startTime, endTime }` (ISO-8601) na API Gemini — verificado, HTTP 200
com grounding. Serve para prender a chamada A à janela de recência em vez de pedir isso em
prosa no prompt. Vale como recomendação, não como obrigação.

---

### 6.3 Contrato de saída da chamada B (Zod)

```ts
const PesquisaSchema = z.object({
  panoramaSetor: z.string().max(600),        // o que está acontecendo, qualitativo
  casos: z.array(z.object({
    oQueAconteceu:  z.string().max(400),      // ⬅️ ANÔNIMO (A12)
    entidadesRemovidas: z.array(z.string()),  // ⬅️ os nomes que ele tirou (§6.4)
    necessidade:    z.string().max(300),      // o que o caso expõe
    funcionalidade: z.enum(FUNCIONALIDADES),  // ⬅️ enum fechado das 12 (Anexo A)
    veiculo:        z.string().max(80),       // quem publicou
    ano:            z.number().int().min(2015).max(2026),
    fonteIdx:       z.array(z.number().int()).min(1),
  })).min(0).max(4),
  planoSugerido: z.enum(['BUSINESS_SECURITY','PREMIUM','ENTERPRISE']),
  planoPorque:   z.string().max(300),
  fontes: z.array(z.object({ titulo: z.string(), dominio: z.string() })),
})
// fonteIdx é validado CONTRA O TAMANHO de `fontes` depois do parse: índice fora da faixa
// descarta o CASO inteiro, porque caso sem fonte não entra (crítica M2)
```

**`funcionalidade` ser enum fechado é o que faz a correlação existir.** A IA não descreve a
solução: ela **escolhe** qual das 12 responde à necessidade. O texto que vai ao PDF é o do
Anexo A, transcrito do PDF da Defenz e renderizado por código. É o "LLM interpreta, JS
calcula" aplicado a texto.

### 6.4 ⚠️ A12 — a guarda de anonimato

O prompt manda anonimizar. **Prompt é pedido; a regra é código.** Três camadas:

1. **Autodeclaração cruzada:** o modelo devolve `entidadesRemovidas`. Código verifica que
   **nenhuma delas aparece** em `oQueAconteceu`. Pega o caso trivial: o modelo listar o
   nome e esquecer de tirá-lo do texto.
2. **Detector de nome próprio:** palavra capitalizada fora de início de frase e fora de uma
   *allowlist* (Brasil, unidades federativas, meses, setores, Bitdefender, Defenz,
   GravityZone, LGPD, siglas de norma) **levanta bandeira**.
3. **Bandeira não apaga: barra.** Caso marcado fica **excluído por padrão** na tela de
   revisão, com o trecho destacado, e só entra se o vendedor editar e liberar
   explicitamente.

⚠️ **Honestidade sobre o mecanismo:** a camada 2 é um detector com falso positivo — vai
implicar com "Ministério da Saúde" num caso legítimo do setor público. Por isso a ação é
**barrar até um humano liberar**, e não descartar em silêncio. Descarte silencioso some com
conteúdo bom e ninguém percebe; barrar aparece na tela e é resolvido em um clique.

### 6.5 ⚠️ A13 — nenhum número gerado pela IA entra no PDF

I9 diz: *"nenhum número que vai para cliente sai de LLM"*. Foi escrita por um número
**calculado** (o ÷48). Estatística de setor citada parece outra categoria — mas é
exatamente a categoria onde um modelo produz "37%" com naturalidade, e ninguém confere.

**Como o deck fica com números mesmo assim:** eles vêm do catálogo curado
`src/lib/apresentacao/mercado-fatos.ts` — valor, fonte, ano, e o setor a que se aplica.
Versionado, com procedência carimbada, exatamente como a tabela de preços.

⚠️ **A guarda é estreita e nomeada, nunca "qualquer número"** (crítica M1). Regex genérica
rejeitaria `LGPD`, `ISO 27001`, `Lei 13.709`, `PCI-DSS 4.0`, `24/7` — o vocabulário dos
setores regulados, que são os melhores clientes. Bloqueia **só**: `%` · moeda (`R$`,
`US$`, `USD`) · "N em cada M", "N vezes mais", "Nx mais". **Ano passa** (é data, e o caso
precisa dele). Sem retry: item que viola é descartado e **contado para o vendedor** (I4).

### 6.5.1 A13b — como o caso volta a ter número sem abrir a porta para invenção

O Marcos afrouxou em 21/08: *"pode afrouxar, eu preciso do número"*. O caso volta a poder
dizer **"parou 3 dias"** e **"prejuízo estimado em R$ 40 milhões"**.

**O afrouxamento não é confiança, é uma verificação nova** — e ela é barata porque o
desenho de duas chamadas (§6.2) já deixa o material na mão:

> **A chamada B não tem internet: ela só reescreve o texto da chamada A.** Logo, todo
> número legítimo do caso **já está no texto da A**. Então o código exige exatamente isso:
> a sequência de dígitos precisa **aparecer literalmente no texto bruto da chamada A**.

```
digitosDe("parou por 3 dias, prejuízo de R$ 40 milhões")  →  ["3", "40"]
        ⊆ digitosDe(textoDaChamadaA)   ?   entra   :   barrado para revisão
```

A comparação normaliza formato antes (`R$ 40 milhões`, `40 milhões de reais` e
`R$40.000.000` colapsam para a mesma sequência), porque senão a guarda barraria número
verdadeiro por diferença de escrita.

**O que isso garante e o que não garante.** Garante que o modelo **não inventou** o número
— ele veio da matéria. **Não** garante que a matéria esteja certa, nem que o modelo tenha
atribuído o número ao fato certo. Por isso continua valendo a revisão, e o texto do aceite
muda para: **"Li o que será apresentado ao cliente, conferi os números nas fontes, e assumo
o conteúdo."**

⚠️ **Estatística de mercado continua fora disso.** "X% do setor sofreu ataque" não é fato
de um caso, é agregado — e agregado sai do catálogo curado (A13, Anexo C). O afrouxamento
vale **dentro do bloco de casos**, onde existe uma reportagem específica por trás.

⚠️ **Isto estende I9 conscientemente.** A invariante diz "nenhum número que vai para
cliente sai de LLM". Depois de A13b, um número **passa** pelo LLM — mas só se for cópia
verificável de fonte pesquisada, com veículo e ano impressos ao lado. A extensão fica
registrada aqui e na SPEC-MAE quando a feature for implementada.

### 6.6 A revisão, e quem assina

Cada caso é um bloco editável: o que aconteceu, necessidade, funcionalidade (`select`
entre as 12), veículo, ano, fontes. Editar, remover, reordenar, liberar o que está barrado.
O plano sugerido também é trocável.

Todo campo carrega **`origem: 'ia' | 'humano'`**. Editar vira `humano` e **isenta da guarda
de número** (crítica C2 — a v1 se contradizia aqui). O servidor revalida enum, tamanho,
fonte e faixa de índice em **tudo**; a guarda de dígito só no que continua `ia`.

Botão de gerar desabilitado até o aceite explícito: **"Li o que será apresentado ao
cliente e assumo o conteúdo."** Nunca pré-marcado.

### 6.7 Quando a busca não acha nada

Setor pequeno, sem cobertura de imprensa. **A saída correta é `casos: []`**, e a tela
dizer: *"Não encontrei incidentes documentados neste setor. O documento sai institucional;
você pode escrever os casos à mão."*

**O que não pode acontecer é o modelo preencher quatro casos genéricos para não voltar
vazio.** É o modo de falha mais provável e o mais difícil de notar, porque texto genérico é
plausível. O prompt manda devolver vazio, a UI trata vazio como resultado normal, e §14 tem
um teste com uma padaria de bairro.

### 6.8 Custo e cap

⚠️ O `checkRateLimit` da Ana roda em **memória do lambda** e não segura custo (R5 do
Portal, aberto). Aqui o cap é **contado no banco**: máximo de N pesquisas por empresa por
dia (default 20, env). Geração a partir de pesquisa já aprovada não conta. Cada pesquisa
grava latência, modelo e contagem de fontes — custo medido, não estimado.

---

## 7. O documento

### 7.1 Estrutura

| # | Página | Natureza | Origem |
|---|---|---|---|
| 01 | Capa · cliente · data · vendedor | **variável** | formulário |
| 02 | Confidencialidade + **"o que você vai ler aqui"** | fixa | A10 |
| 03 | Quem é a Bitdefender · 2001, +170 países, Bucareste e Santa Clara | fixa | §2.1 |
| 04 | A quem ela responde · EC3 desde 2016, dark web, Gartner MQ 2025, Peer Insights 4.8/5 | fixa ⚠️ §7.5 | §2.1 |
| 05 | Quem é a Defenz · integrador, especialistas certificados, suporte no Brasil | fixa | §2.2 |
| 06 | **O que está acontecendo no setor de [empresa]** · panorama + números do catálogo | **gerada (texto) + curada (números)** | §6, A13 |
| 07 | **O que já aconteceu nesse setor** · até 4 casos anônimos, com veículo e ano | **gerada, liberada** | §6, A11/A12 |
| 08 | **O que teria mudado** · caso → necessidade → recurso que responde | **gerada + fixa** | §6.3 + Anexo A |
| 09 | **Os três níveis do GravityZone** · uma página, com o nível sugerido destacado | fixa + destaque variável | A14, Anexo A |
| 10 | **O que os testes independentes dizem** · resultado do Bitdefender, com quem testou e o ano. **Sem concorrente nomeado** | fixa | A15, §7.3.2 |
| 11 | O que muda ter a Defenz do lado · pós-venda direto, sem intermediário | fixa | §2.2 |
| 12 | **Perguntas que todo mundo faz** · inclui "nunca ouvi falar". ⚠️ A pergunta sobre concorrentes **sai** (§7.3.2) | fixa | §2.2 |
| 13 | Próximos passos · como pedir uma avaliação | fixa | — |

**A IA toca 06, 07, 08 e o destaque da 09.** Quatro lugares, todos identificáveis.

**As páginas 02, 12 e 13 são o que torna a peça autoexplicativa** (A10): dizem ao leitor o
que ele está lendo, respondem o que ele perguntaria, e dizem o que fazer depois. Num deck
apresentado, o vendedor faz isso falando; aqui não há vendedor.

### 7.2 Render

Template TS versionado em `src/lib/apresentacao/templates/despertar-169.ts`,
`puppeteer-core` + `@sparticuz/chromium`, `printBackground: true`, margem 0.

⚠️ **I10 e as duas cicatrizes de 20/08 valem sem desconto:**
- Manrope **embutida como woff2 do repo**, nunca `<link>`. Fonte que não carrega quebra o
  PDF em silêncio.
- **Sem `box-shadow`**: o Skia rasteriza sombra como retângulo sólido — foi o borrão
  vermelho do diagrama XDR. Profundidade se faz com borda e fundo chapado.
- A rota nova precisa de `outputFileTracingIncludes` como a da proposta. **Conferir o
  `.nft.json` antes de deployar**, sem tentativa e erro.

### 7.3 A15 — o comparativo com concorrentes, encolhido para o que se sustenta

O slide herdado afirmava, sobre concorrentes nomeados, coisas como *"consumo excessivo de
disco (VSS)"* (SentinelOne), *"complexidade de políticas"* (Kaspersky) e *"depende de 3ºs
para funções chave"*. São **julgamentos comerciais**, não resultados de teste.

**Decisão do Marcos: ficam só os dois critérios com fonte pública e datada** — eficácia de
detecção (AV-TEST / MITRE ATT&CK Evaluations) e impacto em performance (AV-Comparatives
Performance Test). Os três editoriais saem.

⚠️ **Sem fonte carimbada com ano, a linha não é renderizada.** Vale mais do que antes:
hoje o slide sai quando alguém monta um deck à mão; depois desta feature ele sai em **todo
deck gerado**, para leitor que lê sozinho.

### 7.3.1 ⚠️ Fui buscar as fontes, e a coluna de PERFORMANCE não se sustenta

Levantado em 21/08. Fonte primária: **AV-Comparatives · Business Security Test ·
março–junho de 2025**, publicado em 15/07/2025.

| Produto | Proteção real | Falsos alarmes | Malware | **Impacto na performance** |
|---|---|---|---|---|
| **Bitdefender** | **99,8%** | **1** | 99,6% | **32,8** |
| Microsoft Defender | 98,9% | 5 | 99,3% | **13,8** |
| Kaspersky | 99,3% | 3 | 100% | **8,9** |
| ESET | 98,6% | 6 | 99,5% | **4,8** |
| Sophos | 97,5% | 7 | 98,0% | 39,8 |

*No impacto, menor é melhor.*

**Em eficácia o argumento da Defenz é verdadeiro e forte:** Bitdefender lidera a proteção
real e tem **1 falso alarme contra 5 do Defender** — que é exatamente a dor de "fadiga de
alertas" da página 07.

**Em performance o argumento se inverte.** O deck herdado dizia *"Mínimo, otimizado para
VDI e Cloud"* para o Bitdefender e *"Alto em ambientes não-MS"* para o Defender. O teste
diz o contrário: **32,8 do Bitdefender contra 13,8 do Defender**, com Kaspersky e ESET bem
à frente dos dois. Só o Sophos fica atrás.

**Três achados de brinde, do mesmo teste:**
1. *"SentinelOne: consumo excessivo de disco (VSS)"* — **o SentinelOne não estava no
   teste.** A afirmação não tinha como vir dali.
2. *"Sophos: impacto significativo comprovado"* — **essa se sustenta** (39,8, o pior).
3. *"Kaspersky: complexidade de políticas"* — é julgamento de usabilidade, sem número
   público que ampare.

**Resolvido pelo Marcos em 21/08 — e ele foi além das três saídas:** *"Não faça essa
comparação direta, não precisa citar os concorrentes. Escolha sempre a melhor régua
Bitdefender."* Ver §7.3.2.

### 7.3.2 A15 — sem concorrente nomeado, e a régua mais favorável

A página 10 deixa de ser comparativa. Passa a ser **"o que os testes independentes dizem do
Bitdefender"**: resultado, quem testou, ano. Nenhum outro fabricante aparece, nem por
insinuação.

**O que isso resolve de uma vez:**
1. Some a exposição de **publicidade comparativa** sobre concorrente nomeado, que sairia em
   escala num documento lido sem apresentador.
2. Some a contradição do §7.3.1 — a régua que se invertia era a **comparativa**. Afirmar o
   próprio resultado num teste não depende de onde o outro ficou.
3. Some a afirmação sobre o SentinelOne, que **não estava no teste** e portanto nunca teve
   como ser sustentada.

**"Melhor régua" tem um limite, e ele está no texto, não na escolha da fonte.** Escolher o
teste mais favorável é legítimo — todo fabricante faz, e a citação declara qual foi. O que
**não** é legítimo é usar a régua favorável para afirmar superlativo de mercado: dizer
*"menor impacto do mercado"* é comparação implícita, e a outra régua a contradiz
(AV-Comparatives: 32,8 do Bitdefender contra 13,8 do Defender).

**Regra de redação, conferida na revisão do texto fixo:**

| Pode | Não pode |
|---|---|
| "Nota máxima em desempenho no AV-TEST (2025)" | "O menor impacto do mercado" |
| "99,8% de proteção real, com 1 falso alarme · AV-Comparatives, 2025" | "Mais eficaz que os concorrentes" |
| "Premiado como Approved Business Product" | "Melhor que o antivírus nativo" |

Afirma-se **o resultado**, com a fonte. A comparação o leitor faz sozinho, com a régua dele.

#### 7.3.2-bis ⚠️ A exceção declarada da A15 (Marcos, 22/08)

> *"Pode manter o único fabricante, e o TCO."*

Duas frases passam a **comparar** — com o conjunto de fabricantes avaliados, sem nomear
nenhum. A A15 continua de pé para todo o resto; isto é exceção, e por isso está escrita.

**Fui ao relatório primário antes de escrever qualquer uma das duas, e ele derrubou a
redação do anúncio nos dois casos.** Fonte: `avc_epr_2025.pdf`, o comparativo público do
AV-Comparatives (37 páginas, tabelas em imagem — não sai por extração de texto).

| O que o anúncio diz | O que o relatório mostra | O que foi ao papel |
|---|---|---|
| "Único fabricante a prevenir todos os 50 cenários" | **Falso como está escrito.** Na p. 22, os **12** produtos previnem 50/50 no acumulado das três fases. O que é exclusivo do Bitdefender é a **primeira fase**: 100% de resposta ativa na coluna *Phase 1 Only*, contra 98% do segundo colocado | "único dos 12 produtos avaliados a bloquear os 50 cenários **logo na primeira fase**" |
| "TCO 9,8× menor que a média dos demais" | A p. 14 dá o TCO de 5 anos por estação: Bitdefender **US$ 210**, média dos outros 11 **US$ 2.042** → **9,7×**. (Com os 12 na média dá 9,0×. Não achei aritmética que feche 9,8×) | "US$ 210 por estação em cinco anos, contra US$ 2.042 de média dos demais — **9,7 vezes menos**" |

⚠️ **A diferença não é preciosismo.** A frase do anúncio é refutável **pelo próprio
relatório que ela cita** — um leitor técnico abre a p. 22 e vê onze concorrentes com os
mesmos 50/50. Seria o erro do deck herdado outra vez (§7.3.1), agora impresso.

⚠️ **Uma armadilha de leitura registrada:** a p. 23 tem uma tabela *EPR Cost* onde a G Data
(US$ 397 mil) é **mais barata** que a Bitdefender (US$ 500 mil). Ela é só o preço de lista.
O TCO do quadrante (p. 14) soma custo de acurácia operacional, atraso de workflow e
**economia de custo de brecha** — e aí a Bitdefender é a menor. Quem citar a p. 23 achando
que é TCO afirma o contrário do que quer.

**A exceção é estreita, e o código a mantém estreita.** `Prova.comparativoAnonimo` marca as
duas; `COMPARACAO_VOCAB` lista o vocabulário de comparação; e o teste exige, para toda prova
marcada: `origem: 'independente'` (anúncio do fabricante não sustenta comparação — foi o
relatório que derrubou o anúncio), o conjunto comparado dito no texto, e nenhum concorrente
nomeado. Prova que compare **sem** a marca quebra o build. Uma terceira exceção aparecendo
sem decisão do Marcos também quebra.

⚠️ **Consequência que pega outra página:** o FAQ (pág. 12) herdado responde *"Quem são os
principais concorrentes?"* nomeando Microsoft, SentinelOne e Sophos. Essa pergunta **sai**,
e no lugar entra *"Por que não basta a proteção que já vem no sistema operacional?"* —
respondida com resultado de teste independente do Bitdefender, sem nomear ninguém. O
argumento sobrevive; o nome do concorrente, não.

### 7.4 A16 — o que este documento não afirma

Duas remoções que o Marcos mandou aplicar **em propostas e apresentações** (21/08). Aqui
elas nascem aplicadas, em vez de serem removidas depois:

**1. Não existe página "Alguns dos nossos clientes".** A Defenz não tem material de case
(§2.5) e a página que existia na Proposta afirmava algo falso — a Ferrari aparecia sob o
título "nossos clientes" e é patrocínio da Bitdefender, não cliente da Defenz. A prova
social deste documento é a da **marca** (páginas 03 e 04), que é verdadeira e citável. Se
um dia houver case de cliente da Defenz, ele entra com autorização por escrito, não com
uma faixa de logos.

**2. Nenhuma página promete iOS ou Android.** Não é preferência de texto: o comparativo do
Anexo A tem 12 funcionalidades e **nenhuma é de mobile**. O que a Defenz licencia nos três
planos é endpoint Windows/Linux/Mac. A página 09 (os três níveis) e qualquer texto de
cobertura dizem **"Windows, Linux e Mac"**.

⚠️ **Vale para o texto gerado também.** O prompt da chamada B proíbe prometer plataforma
fora dessa lista, e o Anexo A é a única fonte do que o produto faz — a IA escolhe entre as
12, não descreve cobertura por conta própria.

### 7.5 ⚠️ Números do fabricante e do mercado têm validade

"Gartner Magic Quadrant 2025", "4.8/5", "+170 países", "~2.400 especialistas" vêm de deck
do fabricante de **janeiro/2026**. Não são invenção da IA (I9 está a salvo), mas
envelhecem: em 2027, "Magic Quadrant 2025" fica velho num slide de credibilidade.

Ficam em **dois arquivos com `fonte` e `vigenteDesde` carimbados** —
`institucional-fatos.ts` (a marca) e `mercado-fatos.ts` (o setor, A13) — mesmo tratamento
da tabela de preços. E vale o lembrete que a tabela já ensinou: **carimbo sem dono não
revalida sozinho** (VALIDADE-DA-TABELA aberta desde 09/08).

---

## 8. Identidade do documento

Sem sequência reservada (A6). Arquivo:
`Defenz_Apresentacao_<EmpresaSlug>_<AAAA-MM-DD>_<HHMM>.pdf`. Sufixo é o **horário**, não um
contador: contador exigiria consultar o banco e dois cliques simultâneos gerariam dois `_2`
(crítica m3).

Motivo de fundo: na Proposta o número é reservado numa transação que **comita mesmo se o
render explode**, e o contador teve de ser devolvido à mão. Aqui não existe número a
queimar.

---

## 9. Dados

```prisma
model Apresentacao {
  id            String   @id @default(cuid())

  clienteNome   String
  empresaNome   String
  cnpj          String?
  site          String?
  setorTexto    String?                 // o que o vendedor confirmou
  setorCnae     String?                 // o que a BrasilAPI sugeriu (A5)
  setorFoiCorrigido Boolean @default(false)   // o CNAE errou?
  endpointsEstimados Int?

  renderSnapshot Json                   // PAYLOAD COMPLETO de render: casos liberados,
                                        // fontes, E TAMBÉM o texto fixo aplicado
  casosBarrados  Int     @default(0)    // quantos a guarda de anonimato segurou
  casosLiberados Int     @default(0)    // quantos o humano liberou depois de editar
  editadoPorHumano Boolean @default(false)
  planoDestaque  String
  fatosVigencia  String                 // versão de institucional-fatos + mercado-fatos

  arquivoNome    String
  oneDriveItemId String?
  arquivadoEm    DateTime?

  companyId     String
  criadoPorId   String
  createdAt     DateTime @default(now())

  @@index([companyId, createdAt])
  @@index([empresaNome])
}
```

**`renderSnapshot` guarda o payload inteiro, texto fixo junto** (crítica C3). Guardar só a
parte gerada e carimbar a vigência documentaria a divergência sem impedi-la: no dia em que
o Gartner 2026 substituir o 2025, todo re-download de apresentação antiga sairia com
conteúdo novo sob o mesmo registro. É o buraco que o `precoSnapshot` da Proposta existe
para tapar. **O template pode evoluir; o que foi afirmado ao cliente, não.**

`casosBarrados` / `casosLiberados` / `setorFoiCorrigido` respondem as perguntas que o
Marcos vai fazer no terceiro mês: *a guarda de anonimato está pegando alguma coisa? o
pessoal edita ou clica em aprovar sem ler? o CNAE acerta o setor?*

Escopo por empresa (I1, `assertCompanyAccess`, `AND` nunca spread — I2). Criação grava
`AuditLog`.

---

## 10. Rotas

| Rota | Método | Contrato |
|---|---|---|
| `/api/portal/apresentacoes/setor` | POST | CNPJ → CNAE sugerido. Barato, sem LLM |
| `/api/portal/apresentacoes/pesquisa` | POST | pesquisa e devolve; **não grava, não gera arquivo** |
| `/api/portal/apresentacoes` | POST | recebe o aprovado, renderiza, grava, devolve o PDF |
| `/api/portal/apresentacoes` | GET | log buscável (`q`, `de`, `ate`), cap 200 (I5) |
| `/api/portal/apresentacoes/[id]/arquivo` | GET | re-download, do snapshot |

### 10.1 Quem pode gerar (A9)

**Só sessão, sem Bearer.** E o corte é por **empresa**, não por papel:

| Quem | Gera? |
|---|---|
| `user`, `gerencia` ou `admin` **da empresa Defenz** | ✅ sim |
| Qualquer papel de **empresa-cliente** | ❌ não — 403 explicando, sem 500 (I4) |

O vendedor que precisa da peça é `user`; quem não pode emitir documento com o logo da
Defenz é o usuário de uma empresa-cliente que usa a plataforma. `resolveDefenzCompanyId()`
já existe em `service-desk-server.ts` e é o mesmo mecanismo do Service Desk (SD-ADR-001).

⚠️ **A mesma pergunta se aplica à Proposta, e lá a resposta hoje é "qualquer um".**
`POST /api/portal/propostas` faz `getCurrentUser()` + `resolveActiveCompany()` e **não
checa empresa nem papel**: um `user` de empresa-cliente com sessão válida emite uma
proposta comercial com a marca Defenz, numerada na série `DFZ-`. Não é bug desta feature —
é exposição que já está em produção, e a decisão de 21/08 sugere fechar. **Não fechei por
conta própria**: mudar quem entra numa rota que já roda pode trancar alguém fora. É uma
linha, quando o Marcos disser.

⚠️ **O POST de geração não confia no cliente.** Revalida Zod, faixa de `fonteIdx`, presença
de fonte, enum, **e reexecuta a guarda de anonimato e a de número nos campos `origem:
'ia'`**. Aceitar o JSON do navegador como verdade seria deixar qualquer texto entrar num
documento com o logo da Defenz.

---

## 11. Fases

| Fase | Entrega | DoD |
|---|---|---|
| **F1** ✅ | `comparativo.ts` (Anexo A) · `institucional-fatos.ts` · `mercado-fatos.ts` (Anexo C) · `recomendarNivel()` puro | **FEITA em 21/08.** 13 testes. XEDR → Enterprise ✓ · necessidade do básico não empurra plano ✓ · pesquisa vazia recomenda a entrada ✓ · fato do setor vem antes do nacional ✓ · **teste que varre os catálogos e falha se aparecer nome de concorrente ou superlativo de comparação** (A15 virou regra executável) |
| **F2** ✅ | Template **A4** + render + POST que gera **sem IA** + entrada no Portal | **FEITA em 22/08.** A4 210×297mm, sem box-shadow, numeração derivada, adapta ao nicho pelo catálogo. `POST /api/portal/apresentacoes` gera e devolve o PDF; registro em `Apresentacao` com `fatosSnapshot`. Formulário em `/dashboard/portal/apresentacao` e **caixa de emissão** nas abas (§11.1) |
| **F3** | ✅ **ENTREGUE 02/09/2026.** Passo zero (BrasilAPI + confirmação) + pesquisa em duas chamadas + guardas + revisão + aceite | Padaria → `casos: []`. Hospital → casos anônimos com veículo e ano |
| **F4** | Formulário, revisão com liberação do que foi barrado, aceite, confirmação | Marcos gera a primeira apresentação em localhost |
| **F5** 🟡 | Log buscável + re-download + arquivamento no OneDrive | **Log e re-download FEITOS em 22/08**: aba "Apresentações", busca por empresa/pessoa/setor + período, cap 200, e re-download que reimprime do `fatosSnapshot`. **Falta o arquivamento no OneDrive**, que depende do mesmo webhook n8n que a Proposta espera desde 09/08 e ainda não existe |
| **F6** | Deploy | `.nft.json` conferido **antes** do push (§7.2) |

**F2 antes de F3 é deliberado.** O documento institucional já é entregável sozinho: quem
não conhece a Bitdefender aprende quem ela é mesmo sem uma linha de IA. Se a pesquisa
atrasar ou você mudar de ideia sobre a IA, existe produto no fim da F2.

---

## 12. Fora de escopo

- **Preço.** Quem faz preço é a Proposta, e ela já existe. O porte entra só para dimensionar
  o nível sugerido.
- **O comparativo técnico completo.** Continua sendo a sua apresentação, na reunião (A14).
- **Cases de sucesso publicados pela Bitdefender.** O acervo existe e é bom (§2.6), mas
  enumerar é curadoria manual. Fase futura de prova social; não entra agora.
- **PPTX editável.** Decidido PDF (A1); o caminho está em §2.7.
- **A Ana não participa.** Ela responde sobre base interna; aqui a pesquisa é externa e tem
  contrato próprio. Compartilham a chave, não o código.
- **Arquivamento automático no OneDrive** depende do mesmo fluxo n8n que a Proposta espera
  desde 09/08 e **ainda não existe**. F5 entrega o app pronto e inerte, como lá.
- **Vínculo apresentação → proposta.** Natural, mas é feature própria.

### 12.1 O que sai da Defenz na consulta externa

Decisão, não detalhe (crítica m2): a chamada A manda **razão social, site e setor
confirmado**. Ela **não** manda o campo "contexto da oportunidade" — onde o vendedor
escreve o que ouviu numa reunião com o cliente. Esse campo entra só na chamada B, que não
tem acesso à internet. O documento se chama "Apresentação Confidencial"; a
confidencialidade começa aqui.

---

## 13. Riscos

| # | Risco | Mitigação |
|---|---|---|
| **R1** | **A IA afirma algo falso sobre o setor, e o leitor sabe mais do que nós** — agravado porque a peça é lida sem ninguém para corrigir | Enum fechado; caso sem fonte descartado; zero número gerado (§6.5); revisão obrigatória com aceite (§6.6). É o risco #1 e a spec inteira gira em torno dele |
| **R2** | **Homônimo:** a busca acha outra empresa de nome parecido | **Passo zero**: setor confirmado **antes** da busca (§4). Na v1 a mitigação era a tela de revisão, tarde demais — a essa altura já se pagou a chamada e o vendedor recebe casos coerentes sobre o setor errado, e texto coerente não dispara desconfiança (crítica C4) |
| **R3** | **A vítima acaba nomeada** apesar de A12 | Três camadas do §6.4, sendo a última um humano liberando o que foi barrado. **Nenhuma delas confia no prompt** |
| **R4** | **O caso citado é impreciso ou a fonte não sustenta** | Veículo e ano impressos: o leitor pode conferir. Caso sem fonte não entra. E a revisão existe justamente para o vendedor abrir o link antes de assinar |
| **R5** | Grounding devolve link que expira (`…grounding-api-redirect/…`) | O PDF imprime **veículo e ano**, nunca o redirecionador; ele fica no snapshot para auditoria interna |
| **R6** | Custo do Gemini sem teto | Cap contado no banco, não em memória de lambda (§6.8). ⚠️ A chave **segue sem rotacionar** desde 09/08 |
| **R7** | Chromium na função Vercel | `outputFileTracingIncludes` + `.nft.json` antes do deploy. Custo já pago uma vez |
| **R8** | `@google/generative-ai@0.21` é SDK legado; o grounding dos modelos novos pode estar só no `@google/genai` | Verificar na doc **antes** de escrever a integração. Se preciso, REST direto |
| **R9** | Vendedor libera caso barrado sem ler | `casosLiberados` mede. Não resolve, torna visível |
| **R10** | **`mercado-fatos.ts` envelhece e ninguém revalida** | Carimbo de ano por fato + a mesma pergunta em aberto da tabela de preços: **quem é o dono e qual o prazo** (§7.5) |

---

## 14. Critérios de aceite

- [ ] PDF **16:9**, Manrope embutida, sem `box-shadow`, sem `[Nome do Cliente]` literal.
- [ ] **Um leitor que não conhece a Bitdefender entende o documento sozinho** — sem
      apresentador, sem link externo obrigatório (A10). Teste: o Marcos lê sem eu explicar.
- [ ] Empresa sem CNPJ, sem site e sem descrição → formulário **recusa e explica**.
- [ ] **Padaria de bairro** → `casos: []`, documento institucional gerado, tela avisando.
      Não podem aparecer quatro casos genéricos. *(smoke ao vivo)*
- [ ] **Hospital / clínica** → casos com veículo e ano, cada um ligado a uma das 12
      funcionalidades, **nenhum com nome de vítima**, nenhum com `%` ou `R$`. *(smoke ao vivo)*
- [ ] Caso com nome próprio fora da allowlist → **barrado, visível, liberável** — nunca
      descartado em silêncio nem publicado direto.
- [ ] `entidadesRemovidas` que ainda aparece no texto → caso barrado.
- [ ] `LGPD`, `ISO 27001`, `24/7` e o **ano** passam pela guarda; `37%` e `R$ 4,5 milhões` não.
- [ ] Campo editado na revisão vira `origem: 'humano'` e **pode** conter número.
- [ ] `funcionalidade` fora do enum → **rejeitada no servidor**, mesmo vinda do navegador.
- [ ] Página 10 renderiza **só** eficácia e performance, **toda linha com fonte e ano** (A15).
- [ ] Todo número do documento é rastreável a `mercado-fatos.ts` ou `institucional-fatos.ts`.
- [ ] Re-download depois de mexer nos arquivos de fatos sai **idêntico** ao original.
- [ ] `user` não gera; `gerencia` gera.
- [ ] Cap diário estourado → mensagem clara, sem 500 (I4).
- [ ] Falha da BrasilAPI → cai no campo livre, sem travar. Falha do OneDrive → não impede o
      download.
- [ ] Usuário de outra empresa não vê a apresentação (I1).

### 14.1 Dois níveis, porque LLM não roda em CI

Os critérios marcados *(smoke ao vivo)* são os melhores da spec e **não podem estar no
`npm test`**: dependem de rede, chave, custo e de um modelo não determinístico (crítica
M4). Do jeito escrito na v1, a suíte ficaria intermitente até alguém apagar o teste.

- **Unitário, sempre verde:** respostas gravadas em `src/test/fixtures/`. Cobre guarda de
  anonimato (as três camadas), guarda de número, enum, `fonteIdx` fora de faixa,
  `casos: []`, régua de nível, `origem`.
- **Smoke ao vivo, à mão:** `scripts/smoke-apresentacao-pesquisa.ts`, com padaria e
  hospital reais, resultado colado nesta spec. Mesmo protocolo do `smoke-proposta-pdf.ts`.

---

## 15. O que ainda depende do Marcos

**Nenhuma.** O Anexo C foi aprovado em 21/08, com a extensão de a pesquisa poder
acrescentar fato do nicho (A13), e o §7.3.1 foi resolvido pelo §7.3.2 — sem concorrente
nomeado. **A spec está aprovada; o que falta é código.**

| Era | Virou |
|---|---|
| Semear `mercado-fatos.ts` | ✅ levantado — **Anexo C**, aguardando o OK dele |
| Papel mínimo para gerar | ✅ **A9 / §10.1** — qualquer papel, só empresa Defenz |
| Afrouxar o número no caso | ✅ **A13b / §6.5.1** — liberado, com trava verificável em código |

---

## 16. O que mudou da v1.1 para a v2

O Marcos corrigiu o eixo: **a apresentação técnica é dele e já é usada**; o que falta é a
peça de antes. Mudou o produto, não o encanamento — as quatro correções críticas da crítica
adversarial continuam valendo e estão aplicadas.

| Mudou | v1.1 | v2 |
|---|---|---|
| O que o deck é | técnico-comparativo | **marca + mercado + cases**, autoexplicativo (A10) |
| "Case" | não existia | **caso de problema do setor**, anônimo, ligado à necessidade (A11/A12) |
| Comparativo 12×3 | página central | **uma página-resumo**; o detalhe segue na técnica (A14) |
| Números | proibidos, e ponto | **catálogo curado** `mercado-fatos.ts` (A13) — o deck tem número, nenhum passa por LLM |
| Slide de concorrentes | decisão em aberto | **só eficácia e performance**, com fonte e ano (A15) |
| Guarda nova | — | **anonimato em três camadas**, com barrar-em-vez-de-apagar (§6.4) |

**O que não mudou:** duas chamadas (C1), `origem: 'ia'|'humano'` (C2), snapshot com o texto
fixo junto (C3), passo zero antes da busca (C4), guarda de número estreita (M1), faixa de
`fonteIdx` (M2), testes em dois níveis (M4), papel mínimo (M5).

---

## Anexo A — Comparativo GravityZone, transcrito

Fonte: `defenz_gravityzone_comparativo.pdf` · Defenz Cybersecurity · lido em 20/08/2026 ·
`ADMINISTRATIVO/ESTRATEGICO_VENDAS/APRESENTAÇÕES/APRESENTAÇÃO_TÉCNICA/`.

| # | Funcionalidade | Business Security | Premium | Enterprise |
|---|---|:--:|:--:|:--:|
| 1 | Antimalware | ✓ | ✓ | ✓ |
| 2 | Controle Avançado de Ameaças | ✓ | ✓ | ✓ |
| 3 | Antiexploit Avançado | ✓ | ✓ | ✓ |
| 4 | Firewall | ✓ | ✓ | ✓ |
| 5 | Proteção de Rede | ✓ | ✓ | ✓ |
| 6 | Controle de Dispositivos | ✓ | ✓ | ✓ |
| 7 | Gerenciamento de Riscos | ✓ | ✓ | ✓ |
| 8 | Mitigação de Ransomware | ✓ | ✓ | ✓ |
| 9 | Proteção contra Ataque sem Arquivo | — | ✓ | ✓ |
| 10 | HyperDetect | — | ✓ | ✓ |
| 11 | Analisador Sandbox | — | ✓ | ✓ |
| 12 | XEDR | — | — | ✓ |

**A régua de recomendação sai daí, em código, sem LLM:** necessidade coberta só por 9–11 →
Premium; necessidade que exige 12 (correlação entre máquinas, investigação de incidente) →
Enterprise; o resto → Business Security. O enum de `funcionalidade` (§6.3) é esta lista.

As descrições técnicas vão transcritas em `src/lib/apresentacao/comparativo.ts` — é delas
que a página 08 tira o texto do recurso que responde a cada caso, e a 09, o resumo dos
três níveis.

---

## Anexo C — `mercado-fatos.ts`, semeado · ⚠️ AGUARDANDO CONFERÊNCIA DO MARCOS

Levantado em 21/08 a pedido dele (*"traga para que eu confira"*). **Nada daqui entra em
documento antes do OK.** Cada linha traz o número exato, quem publicou e o ano, porque é
assim que vai para o rodapé do slide.

> ✅ **APROVADO pelo Marcos em 21/08**, com uma extensão: *"pode usar os fatos catalogados
> e ou pode pesquisar adicionais com aquele nicho também"*. O catálogo é o chão; a pesquisa
> acrescenta o que é específico do setor, sujeito à trava do A13b.

### C.1 Os que eu recomendo aceitar

| # | O fato | Número | Fonte | Ano | Onde entra |
|---|---|---|---|---|---|
| **M1** | Custo médio de uma violação de dados **no Brasil** | **R$ 7,19 milhões** (era R$ 6,75 mi em 2024, **+6,5%**) | IBM · *Cost of a Data Breach Report*, recorte Brasil | 2025 | pág. 06 · o número de abertura |
| **M2** | Custo médio **por setor, no Brasil** | Saúde **R$ 11,43 mi** · Financeiro **R$ 8,92 mi** · Serviços **R$ 8,51 mi** | IBM · idem | 2025 | pág. 06 · **o mais valioso**: fala do setor do leitor |
| **M3** | Vetor inicial mais comum **no Brasil** | Phishing **18%** (R$ 7,18 mi) · Terceiros/cadeia **15%** (R$ 8,98 mi) · Exploração de vulnerabilidade **13%** (R$ 7,61 mi) | IBM · idem | 2025 | pág. 06 · liga direto ao Antiexploit e à Proteção de Rede |
| **M4** | Motivação dos ataques | **≥52%** dos ataques com motivação conhecida foram **extorsão ou ransomware**; espionagem pura, **4%** | Microsoft · *Digital Defense Report* | 2025 | pág. 06 · justifica a Mitigação de Ransomware |
| **M5** | Posição do Brasil | **1º da América do Sul** entre os países cujos clientes mais sofreram atividade cibernética (1º semestre) | Microsoft · idem | 2025 | pág. 06 · "não é problema de fora" |
| **M6** | Empresas menores e ransomware | Ransomware presente em **88%** das violações em **PMEs** | Verizon · *DBIR* | 2025 | pág. 06 · fala com o porte do cliente típico |
| **M7** | Terceiros | Envolvimento de terceiros em violações **dobrou, para 30%** | Verizon · idem | 2025 | pág. 06 · casa com o M3 |
| **M8** | O que a própria Bitdefender mediu | **55%** das equipes de segurança foram orientadas a **não divulgar** uma violação (1.200 profissionais) | Bitdefender · *Annual Cybersecurity Assessment* | 2025 | pág. 04 · e explica por que o cliente "nunca ouviu falar" de ataque nenhum |
| **M9** | O que a lei já cobra | Multa de até **2% do faturamento**, limitada a **R$ 50 milhões por infração** | **LGPD, Art. 52** | lei | pág. 06 · setores regulados. **Não envelhece** |

### C.2 O que eu encontrei e **recusei**, e por quê

Isto é metade do valor deste anexo. Todos apareceram na busca, todos são citados por aí, e
nenhum entra:

| Recusado | Por quê |
|---|---|
| *"60% das pequenas empresas fecham em 6 meses após um ataque grave"* | **Estatística zumbi.** Circula há mais de uma década sem fonte primária rastreável — blog de fornecedor citando blog de fornecedor. Num deck com fonte no rodapé, é o item que um leitor cético derruba, e derruba os outros oito junto |
| *"3.520 tentativas de ataque por semana"* · *"315 bilhões de tentativas em 2025"* | Plausíveis e provavelmente reais, mas só achei **agregadores**, sem o relatório primário na mão. Não vai para papel com a marca da Defenz sem o documento |
| Multas aplicadas pela **ANPD** | Não há número consolidado confiável para citar. O que dá para afirmar é **o que a lei prevê** (M9), não o que foi cobrado |
| *"46% das violações globais miraram PMEs"* | Atribuído ao DBIR por blogs, **não confirmei no relatório**. Troquei pelo M6, que veio da Verizon direto e é mais forte |

### C.3 Duas ressalvas honestas

1. **M1, M2 e M3 saem de uma fonte só (IBM).** É a melhor série com recorte Brasil que
   existe, mas são três afirmações apoiadas num único relatório.
2. **M4 a M7 vêm de fornecedores de segurança** (Microsoft, Verizon). São primárias e de
   metodologia pública, mas têm interesse comercial no assunto. Num deck da Defenz isso é
   normal e fica declarado pela citação — só não é o mesmo que dado independente.

**Vigência:** todos carimbados **2025**, menos o M9. Na virada de 2027 este anexo precisa
de revisão — e, como a tabela de preços já ensinou, **carimbo sem dono não revalida
sozinho**.

---

## Anexo B — o que a IA recebe e o que ela devolve

**Chamada A recebe:** setor confirmado, razão social, site. **Devolve:** prosa sobre
incidentes reais no setor, com `groundingMetadata`.

**Chamada B recebe:** o texto da A, as 12 funcionalidades com uma linha cada, e o contexto
do vendedor. **Devolve:** o JSON do §6.3. Nada além dele. **Sem acesso à internet.**

**O prompt proíbe, explicitamente:** nomear empresa vítima · número, percentual ou valor
monetário · afirmar que *este* cliente sofreu incidente · citar concorrente · escolher
funcionalidade que não cubra a necessidade · devolver caso sem fonte · preencher para não
voltar vazio.

**A proibição é verificada em código depois**, não confiada ao prompt. Prompt é pedido;
`zod` + guarda de anonimato + guarda de dígitos é regra.

---

## Anexo D — o que o Marcos corrigiu no conteúdo (22/08)

Ajustes vindos da leitura dele no documento gerado. Os de tipografia estão no código; os
de **fato** ficam aqui porque mudam o que a Defenz afirma.

### D.1 ⚠️ O Premium tem EDR — o comparativo transcrito estava defasado

O `defenz_gravityzone_comparativo.pdf` traz **uma** linha, "XEDR", disponível só no
Enterprise. O Marcos corrigiu: **o Premium já tem uma camada de EDR**, e o que o Enterprise
acrescenta é **XDR com sensores adicionais**.

A tabela passou de 12 para **13 linhas**, e o `aPartirDe` mudou de acordo. É o primeiro
desvio deliberado da transcrição, e está anotado no topo do `comparativo.ts`.

⚠️ **Consequência fora daqui:** o PDF do comparativo que a Defenz usa na reunião técnica
**continua com a informação antiga**. Se a apresentação diz uma coisa e o comparativo diz
outra, o cliente atento vê. Vale corrigir o documento de origem.

### D.2 ⚠️ Infraestrutura no Texas e na Europa — declarado, não verificado

A pergunta sobre sedes passou a citar **infraestrutura principal no Texas e na Europa**,
além das sedes de Bucareste e Santa Clara, e a usar isso para sustentar cobertura 24×7 por
fuso.

**A informação veio do Marcos; eu não a confirmei em fonte pública.** Fica registrado
porque: (a) é afirmação sobre infraestrutura de terceiro num documento que vai a cliente;
(b) para cliente de **saúde ou financeiro**, localização de dado é assunto regulatório, e
uma pergunta de acompanhamento sobre residência de dados é provável. **Confirmar com o
fabricante antes de emitir para cliente regulado.**

### D.3 O que mudou de texto

| Onde | Era | Virou |
|---|---|---|
| Pág. 04 · título | "A quem ela já responde" | **"Reconhecimento de mercado"** — e a página passou a mostrar **só** o reconhecimento de mercado; os resultados de laboratório ficaram na página própria, que antes duplicava |
| Pág. 09 · título | "Perguntas que todo mundo faz" | **"Perguntas frequentes"** |
| Pág. 09 · sedes | só Bucareste e Santa Clara | + Texas e Europa, + cobertura por fuso 24×7 (D.2) |
| Pág. 09 · proteção nativa | não existia | pergunta nova: **não são produtos comparáveis**, são categorias diferentes — antivírus de linha de base × plataforma de gestão. **Sem nomear ninguém** (A15) |
| Pág. 09 · licenciamento | não existia | pergunta nova |
| Pág. 09 · atendimento | "Quem me atende depois da venda?" | **"Quem me atende?"** — a Defenz atende **antes, durante e depois**, com a mesma equipe |
| Pág. 09 · órgão público | pergunta sobre licitações | **removida**, a pedido dele |

### D.4 Tipografia

O +15% de 21/08 ficou "grosseiro" na leitura dele. Recuado para **~+6%** sobre o original,
entrelinha de 1,9 para 1,75, e o `space-evenly` — que abria vãos mecânicos entre blocos —
trocado por respiro fixo. A página do setor manteve a distribuição, porque lá ele pediu
**mais** respiro entre os campos.


### D.5 As páginas ganharam corpo (22/08, segunda rodada)

| Página | Era | Virou |
|---|---|---|
| 04 · Reconhecimento de mercado | 3 itens | **6** — entram Best Protection 6×, a parceria com a Scuderia Ferrari e as ferramentas gratuitas de descriptografia para vítimas de ransomware |
| 05 · Quem é a Defenz | 3 blocos | **5**, mais um segundo parágrafo de abertura. Novos: *Avaliação antes da decisão* e *Um interlocutor, três etapas* |
| 08 · Testes independentes | 3 resultados | **6** — todos buscados na fonte primária antes de entrar |

**Os três resultados novos da página 08**, com procedência:

| Resultado | Fonte |
|---|---|
| 99,8% de proteção real repetido no ciclo seguinte, com 2 falsos alarmes | AV-Comparatives · Business Security Test, ago–nov/2025 |
| 99,9% no teste de malware, com **zero** falsos alarmes em software corporativo comum | AV-Comparatives · idem |
| Certificação EPR: preveniu os 50 cenários de ataque da primeira fase; 99,3% de detecção na fase seguinte | AV-Comparatives · Endpoint Prevention and Response Test 2025 |

✅ **Os dois dados fortes ENTRARAM** (Marcos, 22/08: *"pode manter o único fabricante, e o
TCO"*). A exceção declarada à A15 está escrita no **§7.3.2-bis**, com o que o relatório
primário mudou na redação de cada um — porque nos **dois** casos a frase do anúncio não se
sustenta como está, e uma delas é refutável pelo próprio teste que cita.

A página 08 passou de 6 para **7 resultados** (a prova de prevenção e a do "único" viraram
uma frase só, para não dizer o mesmo duas vezes).

⚠️ **E isso quase saiu cortado.** Com o 7º bloco a página passou a medir **1244px numa folha
de 1123** — 121px a mais. Como `.page` é `overflow:hidden`, não haveria erro: o último
resultado sumiria em silêncio, que é exatamente o modo de falha que o
`scripts/smoke-apresentacao-html.ts` existe para pegar. Corrigido apertando a seção
(corpo 16,4→15,4px, entrelinha 1,65→1,5, respiro 22→14px) e re-medido: as 10 páginas fecham
sem corte, em dois setores e com razão social longa.


---

## Anexo E — a caixa de emissão no Portal (22/08)

> *"Coloque a geração da apresentação no mesmo menu da geração da proposta. Pode ser uma
> caixa em evidência. Porque às vezes vamos gerar apresentação e não proposta. Mas algumas
> vezes vamos gerar apresentação e proposta. E outras vezes vamos gerar apenas propostas."*
> — Marcos, 22/08

**O botão "Nova proposta" virou uma caixa com as duas emissões, lado a lado.** Mora no
componente das abas, então toda tela do Portal a ganha sem ninguém repetir código.

**Duas ações à mostra, e não um menu com submenu**, exatamente pelo que ele descreveu: os
três caminhos são igualmente comuns. Esconder uma atrás da outra faria o caminho do meio
("as duas") custar dois cliques e sugeriria uma ordem que não existe entre elas.

**A ação da tela em que já se está aparece apagada e sem link.** No formulário de proposta,
"Proposta" apaga e **"Apresentação" continua clicável** — é o caso "gerei a proposta, agora
quero a apresentação também", que não pode custar uma volta pelo menu. Há teste para as
duas direções.

### E.1 Por que isto obrigou a fechar a F2 inteira

A invariante **I11** diz que aba morta é promessa quebrada. Entregar só a caixa deixaria um
botão levando a uma tela que não existe. Então entraram junto:

- `POST /api/portal/apresentacoes` — só sessão, e só emissor Defenz (§10.1), reusando o
  `exigirEmissorDefenz` que a Proposta já usa;
- modelo `Apresentacao`, **sem sequência reservada** (A6) e com `fatosSnapshot` congelando
  os fatos que entraram — mesma razão do `precoSnapshot`;
- o formulário, com quatro campos: empresa, A/C, setor e nível em destaque.

**O registro é gravado DEPOIS do render**, e não antes: sem número de série a queimar,
gravar antes só criaria linha órfã se o Chromium falhasse.

### E.2 O formulário mostra o que o nicho muda, antes de gerar

O campo "setor" diz, ao vivo, quantos dados específicos daquele setor vão entrar — e,
quando não há nenhum, diz isso **explicitamente**: *"a apresentação sai com os números
nacionais, sem inventar um número setorial"*. Usa a mesma função pura do servidor, então a
tela não consegue prometer um número que o documento não vai trazer.

### E.3 O log entrou logo em seguida (22/08)

A aba **"Apresentações"** existe agora, e com ela a quinta aba do Portal. Ela só entrou
depois de a tela existir — era a razão de não ter entrado junto com a caixa (I11).

| Entregue | Detalhe |
|---|---|
| `GET /api/portal/apresentacoes` | busca por empresa, pessoa ou setor + período, cap 200 (I5), escopo por `AND` explícito (I2) |
| `GET /api/portal/apresentacoes/[id]/arquivo` | re-download |
| `/dashboard/portal/apresentacoes` | a tela, com aviso âmbar de modelo divergente |

⚠️ **Consultar não exige ser emissor Defenz; emitir, sim.** São permissões diferentes de
propósito: ver o que já saiu é outra coisa que emitir em nome da casa.

**O re-download nasceu certo, e é a lição da Proposta aplicada de saída:** ele reimprime a
partir do `fatosSnapshot`, então **um número que saiu do catálogo depois continua saindo no
documento antigo**. Há teste que prova isso com um fato que não existe no catálogo. Na
Proposta esse buraco foi descoberto em produção, com 6 documentos já emitidos.

O texto institucional fixo ainda vem do código — por isso o `templateVersao` e o aviso
âmbar no log, em vez de entregar documento diferente calado.

### E.4 O que ainda não existe

**Arquivamento no OneDrive** (resto da F5): depende do mesmo fluxo n8n que a Proposta espera
desde 09/08 e que **ainda não existe**.

---

## 15. F3 — como ficou (02/09/2026)

Entregue em cinco passos, cada um com o projeto rodável no fim.

| Passo | O que entrou |
|---|---|
| F3.1 | As cinco guardas, antes de qualquer chamada de IA |
| F3.2 | Migração para `@google/genai` e as duas chamadas |
| F3.3 | Passo zero: CNPJ → CNAE → setor sugerido |
| F3.4 | Rotas `/setor` e `/pesquisa`, cap de custo contado no banco |
| F3.5 | Tela de revisão, aceite e revalidação no servidor |

### ⚠️ Dois desvios declarados

**1. A revalidação usa o texto do BANCO, não o do navegador.** A spec §6.6 dizia
que o servidor revalida o que volta da tela. Implementado assim, a conferência do
A13b usaria o texto da chamada A que o navegador devolvesse — e quem controla o
navegador controlaria a guarda. Agora a pesquisa grava `textoPesquisa` e
`fontes`, a geração recebe só o `pesquisaId`, e os dígitos são conferidos contra
o que está no servidor.

**2. Editar NÃO isenta da guarda de número.** A spec (§6.6, crítica C2) dizia que
campo editado vira `humano` e sai da guarda. Implementado ao contrário: as
guardas rodam de novo sobre o texto novo, e o que continuar com bandeira precisa
de "conferi e libero mesmo assim". A razão é prática — um campo editado pode
ganhar um número novo, e a isenção automática deixaria passar exatamente o caso
em que alguém digitou o número de cabeça. Custa um clique a mais no caso raro.

### O que o servidor recusa

- Caso com bandeira e sem liberação → **400 dizendo quantos ficaram de fora**, em
  vez de gerar o PDF sem eles (a ausência silenciosa seria pior).
- Caso sem `pesquisaId` → 400. Caso não nasce do nada.
- Casos sem aceite → 400.
- `casosSnapshot` congela o que entrou: a reimpressão não perde a página.
