# Feature: Apresentação — o Portal gera a apresentação institucional sob medida

**Status:** 🔵 **SPEC v1.1 — aguardando aprovação do Marcos**
**Crítica adversarial:** [`feature-portal-apresentacao-review.md`](feature-portal-apresentacao-review.md) — 4 críticos, 5 médios, 3 menores. Os críticos estão corrigidos aqui; **M3 e a régua de papel são decisão do Marcos** (§15).
**Priority:** P0 — é o próximo item declarado do roadmap
**Date:** 2026-08-20
**Pai:** `feature-portal-defenz.md` · **Precedente direto:** `feature-portal-proposta.md`
**Herda:** invariantes **§5 da `SPEC-MAE.md`** (I1–I11). Onde esta feature *estende* uma
invariante, a extensão está escrita e justificada (§6.4).

---

## 1. Objetivo

> "Um formulário curto → apresentação institucional com comparativo entre as soluções
> GravityZone. Pense que num primeiro momento, a pessoa não conhece o Bitdefender."
> — Marcos
>
> "Quero que sejamos capazes de ir até a internet e entender o nicho do cliente e
> correlacionar dor possível desse cliente com as nossas soluções." — Marcos, 20/08

O vendedor preenche meia dúzia de campos sobre a oportunidade. O Portal **pesquisa o
setor do cliente na internet**, transforma o que achou em dores prováveis, **liga cada
dor a uma funcionalidade concreta do GravityZone**, mostra tudo numa tela onde o vendedor
**edita e aprova**, e só então gera o PDF que vai para o decisor.

### 1.1 A diferença que organiza o resto da spec

A Proposta é **determinística**: nenhum caractere do PDF sai de LLM (invariante I9, o
÷48). A Apresentação **tem texto gerado por IA indo para o cliente** — é a primeira
superfície do produto onde isso acontece.

Por isso a maior parte desta spec não é sobre o que a IA escreve. É sobre **o que ela
não pode escrever, e quem assina o que ela escreveu.**

---

## 2. O que foi medido antes de desenhar

Como na Proposta, o desenho parte de arquivo lido, não de suposição. Quatro medições, e
a primeira derruba uma premissa que estava escrita no `PROGRESS.md`.

### 2.1 ⚠️ O arquivo apontado como "o modelo" não é o modelo

O `PROGRESS.md` mandava tratar `V9_PARCEIRO_EDITAVEL_SEM_PME.pptx` como *"o modelo que o
Marcos disse que ia trazer"*. **Ele foi lido: é outra coisa.**

É o deck do **Programa de Parceiros / Finder** — recrutamento de indicadores, não venda
para cliente final. Conteúdo real dos slides: *"Transforme Networking em Receita
Recorrente"*, *"O Modelo Finder: Você Indica, Nós cuidamos do Resto"*, *"Sua Comissão
(Ano 1): R$ 3.000,00"*, *"Tabelas de Simulação de Ganhos (400 Licenças)"*.

**Mandar isso para um cliente final mostraria a ele a comissão do canal.** O arquivo sai
da posição de molde.

**O que ele tem de aproveitável** — e é bastante — é a página institucional da marca, que
serve exatamente ao decisor que não conhece a Bitdefender: fundação 2001 (origem 1990),
+170 países, ~2.400 especialistas, sede em Bucareste e Santa Clara, parceria com o
European Cybercrime Centre desde 2016, Gartner Magic Quadrant 2025, Peer Insights 4.8/5.
Ver §7.3 e o ⚠️ sobre validade desses números.

### 2.2 O molde real é o `DEFENZ_APRESENTAÇÃO_ESTRATÉGICA.pptx`

Está em `ESTRATEGICO_VENDAS/APRESENTAÇÕES/APRESENTAÇÃO_BITDEFENDER_PARCEIRO/`, e já nasce
parametrizado: a capa diz literalmente **`Apresentação Confidencial | [Nome do Cliente] |
[Data]`**. Dez blocos, nesta ordem:

| # | Bloco | Natureza |
|---|---|---|
| 1 | Capa · *"Cibersegurança Estratégica: Da Liderança Global à Excelência Operacional no Brasil"* | variável (cliente, data) |
| 2 | **"O Paradoxo da Segurança: Mais Ferramentas, Menos Clareza"** — Fragmentação · Vulnerabilidades Desconhecidas · Custo Oculto · Fadiga de Alertas | fixo |
| 3 | **Análise comparativa vs concorrentes** (Microsoft Defender, SentinelOne, Sophos, Kaspersky/ESET) em 5 critérios | fixo ⚠️ §13 R3 |
| 4 | Visão 360° · XDR de alta fidelidade · Prevenção em camadas | fixo |
| 5 | "Performance comprovada onde realmente importa" | fixo |
| 6 | Benefícios: risco operacional · produtividade de TI · decisões · TCO | fixo |
| 7 | Por que Defenz: especialistas certificados, suporte no Brasil, parceiro e não fornecedor | fixo |
| 8 | **FAQ / objeções** — *"Onde fica o headquarter?"*, *"Por que o Defender nativo não basta?"*, *"Quem são os concorrentes?"*, *"Têm cases em governo?"* (Câmara dos Deputados, INFRAERO, CFMV) | fixo |
| 9 | Fecho em três pilares | fixo |
| 10 | `www.Defenz.com.br` | fixo |

**O slide 8 é a resposta literal à objeção "nunca ouvi falar".** Já existe, já está
escrito, e é conteúdo aprovado pela casa. Não precisa de IA.

**Consequência de desenho:** o deck institucional **já está pronto e é fixo**. O que esta
feature acrescenta são **três blocos novos** (setor, correlação, plano recomendado) e a
parametrização de capa e cabeçalho. Isso é muito menos trabalho do que "criar uma
apresentação", e é o mesmo achado que a Proposta teve com as páginas institucionais.

### 2.3 O comparativo GravityZone é conteúdo fechado, não interpretação

`defenz_gravityzone_comparativo.pdf` foi lido inteiro. São **12 funcionalidades × 3
planos**, com descrição técnica de cada uma e a linha "Disponível em:" explícita.
Transcrito no **Anexo A**.

**Consequência:** a tabela do comparativo é constante versionada no repo, como a tabela de
preços. **A IA não escreve uma linha dela.** Quando a IA "recomenda um plano", ela está
escolhendo entre três valores de um enum, e a justificativa é montada por código a partir
da coluna que difere.

### 2.4 O terceiro arquivo não é legível, e isso não bloqueia

`TECNICO_Bitdefender_Liderança_Global_Ação_Brasil.pdf` (13,5 MB) retorna **vazio** pelo
conector do Graph, em três tentativas, com e sem faixa de páginas. É PDF de imagem: o que
existe é figura, não texto extraível.

Fica registrado para não se gastar a mesma hora de novo. **Não bloqueia:** a ficha da
Biblioteca dizia que ele serve para "decisor que não conhece a marca", e esse papel é
coberto pelo §2.1 (institucional da marca) e pelo slide 8 do §2.2 (objeções). Se um dia o
conteúdo dele for necessário, o caminho é OCR ou exportação manual pelo Marcos.

### 2.5 Os decks atuais já saem de código

Os metadados do `DEFENZ_APRESENTAÇÃO_ESTRATÉGICA.pptx` e do
`DEFENZ_Apresentação_Institucional.pptx` dizem **`PptxGenJS Presentation`**. Ou seja: a
Defenz já gera deck por código, em PPTX.

Isso foi levado ao Marcos como opção de formato. **Ele escolheu PDF** (A1), pelo mesmo
motivo que a Proposta é PDF: reusa um pipeline que já roda em produção. O achado fica
registrado porque, se um dia o pedido virar "quero editar o slide antes de apresentar", o
caminho de menor atrito **não** é converter PDF, é gerar PPTX pelo mesmo modelo de dados.

---

## 3. Decisões

| # | Decisão | Racional |
|---|---|---|
| **A1** | **Saída é PDF**, pelo mesmo pipeline HTML → Chromium da Proposta | Marcos, 20/08. Pipeline em produção desde 20/08, com fonte e imagens embutidas |
| **A1b** | **Geometria 16:9 paisagem** (338,67 × 190,5 mm), não A4 retrato | Derivada. É deck, não documento: o original é 508×286 mm 16:9, e a apresentação é projetada ou vista em tela. A4 retrato faria slide em pé. Reverter é trocar o `format` do `page.pdf()` e o CSS |
| **A2** | **A pesquisa web roda no Gemini com Google Search grounding**, na própria rota, em **duas chamadas** (§6.2) | Marcos, 20/08. A chave já existe (`GEMINI_API_KEY`), a Ana já roda nela, e o grounding devolve as fontes junto da resposta. Zero infra nova, contra o n8n que ainda não tem o webhook. **Duas chamadas** porque busca e saída estruturada não coexistem de forma confiável (crítica C1) |
| **A3** | **A pesquisa vira seção própria e citada**, não texto diluído nos slides fixos | Marcos, 20/08. Texto de IA fica confinado em blocos identificáveis: dá para auditar o que a máquina escreveu sem reler o deck inteiro |
| **A4** | **Comparativo sempre completo**, com destaque no plano recomendado | Marcos, 20/08. As 12 funcionalidades são fato técnico (§2.3). O que varia é qual coluna ganha o destaque, e isso é derivado das dores |
| **A5** | **O CNAE sugere o setor; quem confirma é o vendedor, antes da busca** | Derivada, corrigida pela crítica C4. BrasilAPI é pública e sem chave, mas CNAE é atividade **fiscal declarada**, frequentemente genérica ou vencida: é sugestão, não verdade. O passo zero do fluxo mostra o setor e deixa corrigir **antes** de gastar a pesquisa. Falha da API = cai no campo livre, sem travar |
| **A6** | **Sem numeração sequencial reservada** | Aprende a cicatriz da Proposta: falha de render **queima número** porque a sequência é reservada antes de o arquivo existir. Apresentação não é documento de valor contratual e não precisa de série. Identidade é o `id` do registro + nome de arquivo com empresa e data |
| **A7** | **Nenhum número gerado pela IA entra no PDF** | Extensão literal de I9. Ver §6.4 — é a decisão mais restritiva desta spec e a que mais muda o resultado |
| **A8** | **Tela de revisão obrigatória**: nada gerado vai ao PDF sem passar por um textarea editável e um aceite explícito | O vendedor assina o que o cliente vai ler. Ver §6.5 |
| **A9** | **Rota só com sessão, sem Bearer** | Mesma regra de `/api/portal/ask` e das propostas: consome IA **e** emite documento em nome da Defenz |

---

## 4. Fluxo

```
Botão "Nova apresentação" (cabeçalho do Portal, ao lado de "Nova proposta")
  → /dashboard/portal/apresentacao          [1] FORMULÁRIO
  → POST .../apresentacoes/setor            [0] SETOR   (barato: só BrasilAPI)
        "Setor identificado: X. É isso?"  ← editável, e a busca só roda depois daqui
  → POST /api/portal/apresentacoes/pesquisa [2] PESQUISA  (não gera arquivo, não grava)
        1. chamada A: Gemini COM busca, saída em prosa  → fontes reais
        2. chamada B: Gemini SEM ferramenta, saída JSON → estrutura só o texto da A
        3. valida contra o Zod, checa faixa de fonteIdx, descarta o que não tem fonte
        4. devolve dores + fontes + plano sugerido, cada campo marcado origem:'ia'
  → tela de REVISÃO                          [3] o vendedor edita, remove, aprova
  → tela de CONFIRMAÇÃO                      [4] mostra o que vai sair
  → POST /api/portal/apresentacoes           [5] renderiza, grava, devolve o PDF
  → download imediato
  → (assíncrono) arquiva no OneDrive, mesmo caminho da proposta
```

**A pesquisa é um passo separado da geração, de propósito.** Três razões, todas
concretas: a busca leva segundos e não pode estar dentro do mesmo `await` do render; o
vendedor precisa ver o que a IA achou **antes** de existir arquivo; e pesquisar de novo
não pode custar um documento gravado.

---

## 5. Formulário

| Campo | Tipo | Obrigatório | Para quê |
|---|---|---|---|
| Nome do cliente (pessoa) | texto | sim | capa e cabeçalho |
| Nome da empresa | texto | sim | capa, cabeçalho, e chave da pesquisa |
| CNPJ | texto | não | **A5** — vira setor oficial via CNAE |
| Site da empresa | url | não | âncora forte para a busca; sem ele a IA busca pelo nome e pode achar homônimo |
| O que a empresa faz | textarea | condicional | obrigatório **quando não houver CNPJ nem site** |
| Quantidade estimada de endpoints | número, 1–100.000 | não | só para o plano sugerido e para o texto de escala. **Não vira preço** (§12) — por isso não herda a faixa 5–999, que é limite da tabela de preços e aqui recusaria oportunidade grande à toa (crítica m1) |
| Contexto da oportunidade | textarea, 500 | não | o que o vendedor já ouviu do cliente. Entra na pesquisa como pista, nunca como fato |

**Vendedor** (nome, e-mail, telefone) vem da sessão. **Data** é hoje no fuso de São Paulo
(I3).

⚠️ **Sem CNPJ, sem site e sem descrição, o formulário recusa e explica** (I4): sem nenhum
desses três, "pesquisar o nicho" vira adivinhar a partir de um nome de fantasia, que é o
modo de falha mais provável desta feature inteira.

---

## 6. A pesquisa — o coração da feature, e o que ela é proibida de fazer

### 6.1 Entrada

```
setor        = CNAE do CNPJ (BrasilAPI)  ||  descrição livre do vendedor
ancoras      = { nomeEmpresa, site?, contextoDaOportunidade? }
```

### 6.2 Duas chamadas, e por quê

⚠️ **Não é uma chamada só.** Grounding de busca e saída estruturada em JSON não coexistem
de forma confiável no Gemini, e o `groundingSupports` mapeia trechos do **texto bruto** —
que num desenho de chamada única seria a própria string JSON. Casar "fonte 3" com "dor 2"
viraria aritmética de offset dentro do JSON, e o modo de falha não é erro: é `fonteIdx`
inventado passando no Zod e **virando citação falsa em documento de cliente** (crítica C1).

| | Chamada A | Chamada B |
|---|---|---|
| Ferramenta | Google Search grounding | **nenhuma** |
| Saída | prosa | JSON do §6.2.1 |
| Entrada | setor confirmado, razão social, site | **só o texto da A** + as 12 funcionalidades + o contexto do vendedor |
| Papel | descobrir e citar | estruturar e classificar |

A chamada B **não tem acesso à internet**, então não pode introduzir fato novo: no máximo
reorganiza o que a A trouxe. Fonte que não veio no `groundingMetadata` da A não existe.

⚠️ **A8/R8 continua valendo:** confirmar na doc oficial, **antes de escrever a
integração**, se o SDK `@google/generative-ai@0.21` expõe a ferramenta de busca para o
modelo em uso. Se não expuser, chamar a REST direto. Não descobrir por tentativa e erro.

### 6.2.1 Contrato de saída da chamada B (Zod, como o relatório executivo)

```ts
const PesquisaSchema = z.object({
  setorResumo: z.string().max(400),           // o que essa empresa faz, em 2 frases
  dores: z.array(z.object({
    titulo:      z.string().max(80),
    porque:      z.string().max(400),          // por que esse setor sofre disso
    funcionalidade: z.enum(FUNCIONALIDADES),   // ⬅️ enum fechado das 12 (Anexo A)
    fonteIdx:    z.array(z.number().int()),    // ≥1, aponta para `fontes`
  })).min(0).max(5),
  // fonteIdx é validado CONTRA O TAMANHO de `fontes` depois do parse:
  // índice fora da faixa descarta a DOR inteira (dor sem fonte não entra) — crítica M2
  planoSugerido: z.enum(['BUSINESS_SECURITY','PREMIUM','ENTERPRISE']),
  planoPorque:   z.string().max(300),
  fontes: z.array(z.object({ titulo: z.string(), dominio: z.string() })),
})
```

**`funcionalidade` ser enum fechado é o que faz a correlação existir.** A IA não descreve
a solução: ela **escolhe** qual das 12 funcionalidades responde à dor. O texto da
funcionalidade que vai para o PDF é o do Anexo A, transcrito do PDF da Defenz, renderizado
por código. É o "LLM interpreta, JS calcula" aplicado a texto.

### 6.3 Fontes: o que se imprime é domínio e título, nunca o link do grounding

⚠️ **Armadilha específica do Google Search grounding:** as URIs que ele devolve são
redirecionadores (`vertexaisearch.cloud.google.com/grounding-api-redirect/…`) e **expiram**.
Imprimir isso num PDF entrega ao cliente um link que morre em semanas, e é do tipo de
defeito que ninguém percebe porque ninguém clica no rodapé de um slide.

**Regra:** o PDF imprime **título + domínio** (ex.: *"Panorama de ransomware no varejo ·
cert.br"*). O redirecionador fica no snapshot do registro, para auditoria interna.

**Dor sem fonte não entra.** Se o `groundingMetadata` não trouxe chunk para aquele trecho,
a dor é descartada no servidor, silenciosamente para o modelo e **explicitamente para o
vendedor** ("2 achados foram descartados por não ter fonte" — I4).

### 6.4 ⚠️ A7 — nenhum número gerado pela IA entra no PDF

A invariante I9 diz: *"nenhum número que vai para cliente sai de LLM"*. Ela foi escrita
por causa do ÷48, um número **calculado**. Uma estatística de setor citada de fonte parece
outra categoria — mas é exatamente a categoria em que um modelo inventa "37%" com
naturalidade, e ninguém confere.

**Decisão:** a seção de setor sai **qualitativa**. Nada de "cresceu X%", "Y% das empresas
do setor", "custo médio de R$ Z". O prompt proíbe, e há **verificação em código**.

⚠️ **A guarda é estreita e nomeada, nunca "qualquer número"** (crítica M1). Uma regex
genérica de dígito rejeitaria `LGPD`, `ISO 27001`, `Lei 13.709`, `PCI-DSS 4.0`,
`Windows 11`, `24/7` — justamente o vocabulário dos setores regulados, que são os melhores
clientes. A guarda bloqueia **só**: `%` · moeda (`R$`, `US$`, `USD`) · as formas
"N em cada M", "N vezes mais", "Nx mais". Norma, lei, versão e horário passam.

**Sem retry.** Item que viola é **descartado** e entra na contagem mostrada ao vendedor
(I4). Repetir a chamada dobraria custo para consertar cosmético.

**O que sobra para quem quer número:** a tela de revisão mostra as fontes; se o vendedor
quiser citar um dado, ele **digita** — e aí o número não veio de LLM, veio de uma pessoa
que leu a fonte e assinou embaixo. É exatamente o que I9 protege.

⚠️ **Para isso funcionar, a guarda tem de saber quem escreveu o quê** (crítica C2 — na v1
a spec se contradizia aqui). Todo campo carrega **`origem: 'ia' | 'humano'`**. Editar um
bloco na revisão vira `humano` e o **isenta** da guarda de dígito. O servidor revalida
enum, tamanho e presença de fonte em **tudo**; a guarda de número roda **só no que
continua marcado como `ia`**.

### 6.5 A8 — a tela de revisão

Cada dor aparece como bloco editável: título, texto, funcionalidade escolhida (`select`,
trocável entre as 12), fontes. O vendedor pode **editar, remover, reordenar**. O plano
sugerido também é trocável.

O botão de gerar fica desabilitado até um aceite explícito: **"Li o que será apresentado
ao cliente e assumo o conteúdo."** Nada de checkbox pré-marcado.

**Zero dores aprovadas é um caminho legítimo:** gera o deck institucional sem a seção de
setor, e a tela diz isso antes.

### 6.6 Quando a pesquisa não acha nada

Empresa pequena, sem pegada digital, CNAE genérico. **A saída correta é `dores: []`**, e a
tela dizer *"Não encontrei material confiável sobre o setor desta empresa. A apresentação
sai institucional; você pode escrever as dores à mão."* Com os campos abertos para o
vendedor preencher.

**O que não pode acontecer é o modelo preencher cinco dores genéricas de cibersegurança
para não voltar vazio.** É o modo de falha mais provável e o mais difícil de notar, porque
o texto genérico é plausível. Mitigação: o prompt manda devolver vazio; a UI trata vazio
como resultado normal, não como erro; e §14 tem um teste com uma padaria de bairro.

### 6.7 Custo e cap

⚠️ O `checkRateLimit` da Ana roda em **memória do lambda** e não segura custo (risco R5 do
Portal, ainda aberto). Aqui o cap é **contado no banco**: máximo de **N pesquisas por
empresa por dia** (default 20, env). Pesquisa é a chamada cara; geração de PDF a partir de
pesquisa já aprovada não conta.

Cada pesquisa grava latência, modelo e contagem de fontes no registro, para o custo ser
mensurável em vez de estimado.

---

## 7. O documento

### 7.1 Estrutura

| # | Página | Natureza | Origem |
|---|---|---|---|
| 01 | Capa · cliente · data · vendedor | **variável** | formulário |
| 02 | Confidencialidade | fixa | modelo da Proposta |
| 03 | Quem é a Bitdefender (2001, +170 países, Bucareste/Santa Clara) | fixa | §2.1 |
| 04 | Prova externa: Gartner MQ 2025, Peer Insights 4.8/5, EC3 desde 2016 | fixa ⚠️ §7.3 | §2.1 |
| 05 | **Panorama do setor de [empresa]** — `setorResumo` + fontes | **gerada, aprovada** | §6 |
| 06 | **Dores prováveis → o que cobre cada uma** — 1 linha por dor | **gerada, aprovada** | §6 |
| 07 | O Paradoxo da Segurança | fixa | §2.2 slide 2 |
| 08 | **Comparativo GravityZone** — 12 × 3, coluna recomendada destacada | fixa + destaque variável | Anexo A |
| 09 | Detalhe das funcionalidades citadas nas dores | fixa (seleção variável) | Anexo A |
| 10 | Comparativo competitivo | fixa ⚠️ §13 R3 | §2.2 slide 3 |
| 11 | Por que Defenz | fixa | §2.2 slide 7 |
| 12 | FAQ / objeções, incluindo "nunca ouvi falar" | fixa | §2.2 slide 8 |
| 13 | Próximos passos | fixa | — |

**Páginas 05, 06 e o destaque da 08 são tudo que a IA toca.** Três lugares, todos
auditáveis.

### 7.2 Render

Mesmo caminho da Proposta: template TS versionado em
`src/lib/apresentacao/templates/institucional-169.ts`, `puppeteer-core` +
`@sparticuz/chromium`, `printBackground: true`, margem 0.

⚠️ **I10 e as duas cicatrizes de 20/08 valem aqui, sem desconto:**
- Fonte Manrope **embutida como woff2 do repo**, nunca `<link>`. Fonte que não carrega
  quebra o PDF em silêncio.
- **Sem `box-shadow`**: o Skia rasteriza sombra como retângulo sólido. Foi o borrão
  vermelho do diagrama XDR. Profundidade se faz com borda e fundo chapado.
- ⚠️ A rota nova precisa de `outputFileTracingIncludes` **como a da proposta**. O
  rastreador do Next não segue os binários do Chromium, que são abertos por caminho.
  **Conferir com o `.nft.json` antes de deployar**, sem tentativa e erro.

### 7.3 ⚠️ Números do fabricante têm validade

"Gartner Magic Quadrant 2025", "4.8/5", "+170 países", "~2.400 especialistas" vêm de um
deck do fabricante de **janeiro/2026**. Não são invenção da IA (I9 está a salvo), mas
**envelhecem**: em 2027 "Magic Quadrant 2025" fica velho num slide de credibilidade.

**Ficam num arquivo único, `institucional-fatos.ts`, com `fonte` e `vigenteDesde`
carimbados** — o mesmo tratamento da tabela de preços, e pela mesma razão. E vale o
lembrete: a tabela de preços já ensinou que **carimbo sem dono não revalida sozinho**
(VALIDADE-DA-TABELA segue aberta desde 09/08).

---

## 8. Identidade do documento

**Sem sequência reservada** (A6). Arquivo:
`Defenz_Apresentacao_<EmpresaSlug>_<AAAA-MM-DD>_<HHMM>.pdf`. O sufixo é o **horário**, não
um contador: contador exigiria consultar o banco e dois cliques simultâneos gerariam dois
`_2` (crítica m3).

O motivo é a cicatriz: na Proposta o número é reservado numa transação que **comita mesmo
se o render explode**, e o contador teve de ser devolvido à mão. Aqui não existe número a
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
  setorTexto    String?                 // o que o vendedor escreveu
  setorCnae     String?                 // o que a BrasilAPI devolveu (A5)
  endpointsEstimados Int?

  renderSnapshot   Json                 // ⬅️ PAYLOAD COMPLETO de render: dores aprovadas,
                                        //    fontes, E TAMBÉM o texto fixo aplicado
  pesquisaEditada  Boolean @default(false)  // o vendedor mexeu no texto da IA?
  planoDestaque    String               // BUSINESS_SECURITY | PREMIUM | ENTERPRISE
  fatosVigencia    String               // versão de institucional-fatos.ts

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

**`renderSnapshot` é o que torna isto defensável.** Guarda o que a IA propôs, o que o
vendedor aprovou e de onde veio. Se um cliente questionar uma afirmação seis meses depois,
a resposta existe. Sem ele, "o que a gente afirmou para o cliente X" vira memória.

⚠️ **Ele guarda o payload INTEIRO, o texto fixo junto** (crítica C3). Na v1 o snapshot
guardava só a parte gerada e o registro carimbava `fatosVigencia` — mas metade do
documento vem de `institucional-fatos.ts` e `comparativo.ts`, que são **código**. No dia em
que o Gartner 2026 substituir o 2025, todo re-download de apresentação antiga sairia com
conteúdo novo sob o mesmo registro. É exatamente o buraco que o `precoSnapshot` da Proposta
existe para tapar. O template pode evoluir; **o que foi afirmado ao cliente, não**.

`pesquisaEditada` responde a pergunta que o Marcos vai fazer no terceiro mês: *os
vendedores estão editando ou clicando em aprovar sem ler?*

Escopo por empresa (I1, `assertCompanyAccess`, `AND` nunca spread — I2). Criação grava
`AuditLog`.

---

## 10. Rotas

| Rota | Método | Contrato |
|---|---|---|
| `/api/portal/apresentacoes/setor` | POST | passo zero: CNPJ → CNAE sugerido. Barato, sem LLM |
| `/api/portal/apresentacoes/pesquisa` | POST | pesquisa e devolve; **não grava, não gera arquivo** |
| `/api/portal/apresentacoes` | POST | recebe a pesquisa **aprovada**, renderiza, grava, devolve o PDF |
| `/api/portal/apresentacoes` | GET | log buscável (`q`, `de`, `ate`), cap 200 (I5) |
| `/api/portal/apresentacoes/[id]/arquivo` | GET | re-download, regenerado do snapshot |

**Só sessão, sem Bearer** (A9).

**Papel** (crítica M5 — a v1 simplesmente não dizia): **gerar** exige `gerencia` ou
`admin`; `user` vê o log da própria empresa e faz download. O documento leva o logo da
Defenz e afirma coisas ao mercado, então quem emite é quem conduz oportunidade. Liberar
para `user` é uma linha de código — mas tem de ser escolha do Marcos, não omissão.

⚠️ **O POST de geração não confia no cliente.** Ele revalida contra o Zod, checa a faixa de
`fonteIdx`, exige fonte em toda dor e recusa `funcionalidade` fora do enum. **A guarda de
números ele reaplica só nos campos `origem: 'ia'`** — campo editado por humano é isento
(§6.4). Aceitar o JSON do
navegador como verdade seria deixar qualquer texto entrar num documento com o logo da
Defenz.

---

## 11. Fases

| Fase | Entrega | DoD |
|---|---|---|
| **F1** | `comparativo.ts` (Anexo A) + `institucional-fatos.ts` + `recomendarPlano()` puro | Teste: dor que exige XEDR → Enterprise; dor coberta pelo básico não empurra Enterprise |
| **F2** | Template 16:9 + render + POST que gera **sem IA** (deck institucional puro) | PDF 16:9 sai correto antes de qualquer LLM entrar. Sem "[Nome do Cliente]" literal no arquivo |
| **F3** | Passo zero (BrasilAPI + confirmação do setor) + pesquisa em **duas chamadas** + Zod + faixa de `fonteIdx` + guarda de números + descarte sem fonte | Padaria de bairro → `dores: []`. Hospital → dores plausíveis com fonte. **Antes de codar: confirmar na doc oficial como o SDK expõe a busca (R8)** |
| **F4** | Formulário, tela de revisão, aceite, confirmação | Marcos gera a primeira apresentação em localhost |
| **F5** | Log buscável + re-download + arquivamento no OneDrive | Reusa o webhook da proposta (que ainda não existe — §12) |
| **F6** | Deploy | `.nft.json` conferido **antes** do push (§7.2) |

**F2 antes de F3 é deliberado.** O deck institucional já é entregável sozinho. Se a
pesquisa atrasar ou o Marcos mudar de ideia sobre a IA, existe produto no fim da F2.

---

## 12. Fora de escopo

- **Preço.** Apresentação não mostra investimento. Quem faz preço é a Proposta, e ela já
  existe. A quantidade de endpoints entra só para dimensionar o plano sugerido.
- **PPTX editável.** Decidido PDF (A1). O caminho, se mudar, está no §2.5.
- **A Ana não participa.** Ela responde sobre a base interna; a pesquisa aqui é externa e
  tem contrato próprio. Compartilham a chave, não o código.
- **Arquivamento automático no OneDrive** depende do mesmo fluxo n8n que a Proposta espera
  desde 09/08 e que **ainda não existe**. F5 entrega o app pronto e inerte, como lá.
- **MDR.** Só GravityZone endpoint, como a Proposta.
- **Vínculo apresentação → proposta.** Seria natural ("gerar proposta a partir desta
  apresentação"), mas é feature própria. Fica anotado, fora desta.

### 12.1 O que sai da Defenz na consulta externa

Fica escrito porque é decisão, não detalhe (crítica m2): a chamada A manda **razão social,
site e setor**. Ela **não** manda o campo "contexto da oportunidade" — que é onde o
vendedor escreve o que ouviu numa reunião com o cliente. Esse campo entra só na **chamada
B**, que não tem acesso à internet. O deck se chama "Apresentação Confidencial"; a
confidencialidade começa aqui.

---

## 13. Riscos

| # | Risco | Mitigação |
|---|---|---|
| **R1** | **A IA afirma algo falso sobre o setor do cliente, e o cliente sabe mais do que nós** | Enum fechado, dor sem fonte descartada, proibição de números (§6.4), revisão obrigatória com aceite (§6.5). É o risco #1 e é por isso que a spec inteira gira em torno dele |
| **R2** | **Homônimo:** a busca acha outra empresa com nome parecido | **Passo zero**: o setor é confirmado **antes** de a busca rodar (§4). Na v1 a mitigação era a tela de revisão, tarde demais — a essa altura já se pagou a chamada e o vendedor recebe cinco dores coerentes sobre a empresa errada, e texto coerente não dispara desconfiança (crítica C4). Site e CNPJ como âncoras; sem nenhuma das três o formulário recusa (§5) |
| **R3** | ⚠️ **Afirmações sobre concorrentes nomeados** — o slide 10 diz que SentinelOne tem "consumo excessivo de disco" e que Defender é "vulnerável" | **Herdado, não criado**: é conteúdo já em uso pela Defenz. Mas publicidade comparativa precisa ser verificável. Cada linha do slide passa a carregar **fonte e ano** (MITRE / AV-TEST / Gartner). **Sem fonte, a linha sai.** Decisão do Marcos, registrada aqui porque agora o material passa a ser gerado em escala |
| **R4** | Grounding devolve link que expira | Imprime domínio e título; redirecionador só no snapshot (§6.3) |
| **R5** | Custo do Gemini sem teto | Cap contado no banco, não em memória de lambda (§6.7). ⚠️ A chave **segue sem rotacionar** desde 09/08 |
| **R6** | Chromium na função Vercel | `outputFileTracingIncludes` + conferência do `.nft.json` antes do deploy (§7.2). Custo já pago uma vez |
| **R7** | Vendedor clica em aprovar sem ler | `pesquisaEditada` mede. Não resolve, mas torna visível |
| **R8** | `@google/generative-ai@0.21` é o SDK legado; o grounding dos modelos novos vive no `@google/genai` | Verificar na F3 **antes** de escrever a integração. Se o SDK antigo não expuser a ferramenta de busca, chamar a REST direto. Não descobrir isso por tentativa e erro (regra da casa) |

---

## 14. Critérios de aceite

- [ ] PDF sai **16:9**, com Manrope embutida, sem `box-shadow`, sem `[Nome do Cliente]`
      literal em lugar nenhum.
- [ ] Empresa sem CNPJ, sem site e sem descrição → formulário **recusa e explica**.
- [ ] **Padaria de bairro** → `dores: []`, deck institucional gerado, tela avisando. Não
      podem aparecer cinco dores genéricas. *(smoke ao vivo)*
- [ ] **Hospital / clínica** → dores com fonte, cada uma ligada a uma das 12
      funcionalidades, nenhuma com percentual ou valor em reais. *(smoke ao vivo)*
- [ ] `LGPD`, `ISO 27001` e `24/7` **passam** pela guarda; `37%` e `R$ 4,5 milhões` **não**.
- [ ] Campo editado na revisão vira `origem: 'humano'` e **pode** conter número.
- [ ] Re-download depois de mexer em `institucional-fatos.ts` sai **idêntico** ao original.
- [ ] `user` não gera; `gerencia` gera.
- [ ] Saída do modelo com `funcionalidade` fora do enum → **rejeitada no servidor**, mesmo
      que venha do próprio navegador.
- [ ] Dor sem fonte é descartada, e a tela **diz quantas** foram descartadas.
- [ ] Botão de gerar desabilitado até o aceite; aceite nunca pré-marcado.
- [ ] `pesquisaSnapshot` grava o que foi aprovado; re-download regenera **igual**.
- [ ] Usuário de outra empresa não vê a apresentação (I1).
- [ ] Cap diário estourado → mensagem clara, sem 500 (I4).
- [ ] Falha da BrasilAPI → cai no campo livre, sem travar.
- [ ] Falha do OneDrive → não impede o download (registro fica "não arquivado").
- [ ] Slide de comparativo competitivo: **toda linha com fonte e ano**, ou a linha não
      existe.

### 14.1 Dois níveis, porque LLM não roda em CI

Os dois primeiros critérios são os melhores da spec e **não podem estar no `npm test`**:
dependem de rede, chave, custo e de um modelo não determinístico (crítica M4). Do jeito
escrito na v1, a suíte ficaria intermitente até alguém apagar o teste no primeiro vermelho.

- **Unitário, sempre verde:** respostas gravadas em `src/test/fixtures/`. Cobre guarda de
  dígitos, enum, `fonteIdx` fora de faixa, `dores: []`, régua de plano, `origem`.
- **Smoke ao vivo, à mão:** `scripts/smoke-apresentacao-pesquisa.ts`, com padaria e
  hospital reais, resultado colado nesta spec. Mesmo protocolo do `smoke-proposta-pdf.ts`.

---

## 15. Decisões que ficaram para o Marcos

**Não implemento nenhuma das duas sem resposta.**

### 15.1 ⚠️ O slide de comparativo competitivo (crítica M3)

O slide 10 afirma, sobre concorrentes nomeados, coisas como *"consumo excessivo de disco
(VSS)"* (SentinelOne), *"complexidade de políticas"* (Kaspersky) e *"depende de 3ºs para
funções chave"*. São **julgamentos comerciais**, não resultados de teste — não há AV-TEST
que sustente essas frases como estão. O critério "toda linha com fonte e ano" apagaria a
maior parte do slide.

O conteúdo é **herdado**, já em uso pela Defenz. **O que esta feature muda é a escala:**
hoje o slide sai quando alguém monta um deck à mão; depois dela, sai automaticamente em
todo deck gerado. Afirmação sobre concorrente nomeado, em volume, é exposição de outra
ordem.

| Saída | O que acontece |
|---|---|
| **(a) Manter só o que tem fonte pública** — eficácia (AV-TEST, MITRE) e performance (AV-Comparatives) | slide encolhe, continua verdadeiro. **Recomendada** |
| **(b) Manter tudo como está** | decisão consciente do Marcos, registrada |
| **(c) Trocar por "o que avaliar num EDR"**, sem nome de concorrente | vende igual, não cita ninguém. A mais segura |

### 15.2 Papel mínimo para gerar (crítica M5)

A spec fechou em `gerencia`+`admin` (§10). Se o time de vendas opera como `user`, isso
trava a feature no primeiro dia. **Marcos confirma qual é.**

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

**A régua de recomendação sai daí, em código, sem LLM:** dor que só é coberta por 9–11 →
Premium; dor que exige 12 (correlação entre máquinas, investigação de incidente) →
Enterprise; o resto → Business Security. O enum de `funcionalidade` (§6.2) é exatamente
esta lista.

As descrições técnicas de cada funcionalidade estão no PDF de origem e vão transcritas em
`src/lib/apresentacao/comparativo.ts` (é o que a página 09 imprime).

---

## Anexo B — o que a IA recebe e o que ela devolve

**Recebe:** setor (CNAE ou texto), nome da empresa, site, contexto do vendedor, e **a
lista das 12 funcionalidades com uma linha de descrição cada**.

**Devolve:** o JSON do §6.2. Nada além dele.

**O prompt proíbe, explicitamente:** número, percentual, valor monetário · afirmar que
*este* cliente sofreu incidente · nomear empresa de terceiro como vítima · citar
concorrente · recomendar plano que não cubra a funcionalidade escolhida · devolver dor sem
fonte · preencher para não voltar vazio.

**A proibição é verificada em código depois**, não confiada ao prompt. Prompt é pedido;
`zod` + guarda de dígitos é regra.
