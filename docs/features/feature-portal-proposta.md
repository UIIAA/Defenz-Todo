# Feature: Proposta — o Portal gera a proposta comercial

**Status:** 🟡 **SPEC v1 — aguardando aprovação do Marcos**
**Priority:** P0 — é o motivo declarado da IA Defenz existir
**Date:** 2026-08-09
**Pai:** `feature-portal-defenz.md`. Irmã de `feature-portal-ana.md` (a Ana **não entra** nesta fase).
**Herda:** invariantes **§9 do `service-desk-GUIA.md`** — tenant isolation, fuso SP, sem erro silencioso na UI, take/cap, AuditLog.

---

## 1. Objetivo

> "Como se fosse um botão sempre à mostra chamado Proposta. Quando ela clica, aparecem os campos […] Precisamos registrar essas escolhas, e pedir para o usuário confirmar a geração daquele documento." — Marcos, 09/08

Um vendedor da Defenz preenche meia dúzia de campos, confirma, e recebe a proposta comercial em PDF A4 com a identidade da marca e o preço certo. A escolha fica registrada e buscável.

**A Ana não participa desta fase.** O Marcos foi explícito: os dados são capturados agora *para que* depois a Ana faça a busca completa e enriqueça o documento; por ora, gerar com os campos do formulário já resolve. Ver §12.

---

## 2. O que foi medido antes de desenhar

Esta spec não parte de suposição. Três medições contra os arquivos reais mudaram o desenho:

### 2.1 ⚠️ O erro do ÷48 está em TODA proposta que a Defenz já enviou

O preço unitário por mês da coluna de **36 meses** é calculado dividindo o preço de 3 anos por **48 meses**, não por 36. Verificado em dois clientes, dois formatos, quatro planos:

| Documento | Plano | Preço/licença (3 anos) | Unitário/mês exibido | ÷48 | Correto (÷36) |
|---|---|---|---|---|---|
| João Buffo (PPTX + A4) | Business Security | R$ 171,97 | R$ 3,58 | 3,583 ✓ | **R$ 4,78** |
| João Buffo | Premium | R$ 202,32 | R$ 4,22 | 4,215 ✓ | **R$ 5,62** |
| João Buffo | Enterprise | R$ 356,31 | R$ 7,42 | 7,423 ✓ | **R$ 9,90** |
| Liquos (A4) | Business Security | R$ 182,48 | R$ 3,80 | 3,802 ✓ | **R$ 5,07** |

Os **totais** estão corretos em todos os casos (vêm direto da tabela pública). O erro é só na coluna do unitário mensal, e é sistemático: é a fórmula da origem, não deslize de digitação.

**Consequência de desenho:** o bloco de investimento é função pura de quatro entradas e **é calculado em código, nunca copiado do modelo nem escrito por LLM**. É o princípio da casa: LLM interpreta, JS calcula.

### 2.2 O template sai por diff, não por adivinhação

Existem duas propostas A4 de clientes diferentes (`Defenz Proposta A4 - Joao Buffo.dc.html` e `… - Liquos.dc.html`). O diff textual isolou o que varia — e **nas páginas institucionais não apareceu nenhuma diferença de texto entre os dois clientes** (confidencialidade, quem somos, valores, serviços, clientes, parceria, encerramento).

*Precisão do método:* o diff comparou presença de blocos de texto, não ordem. Buffo tem 270 blocos e Liquos 209; a diferença é explicada pelas duas páginas extras de investimento e pelo cabeçalho repetido por página. Na implementação, as páginas fixas são transcritas do molde e conferidas contra os dois arquivos.

Variável: cliente · subtítulo do produto · data · vendedor (nome e e-mail) · número da proposta · quantidade · quais planos entram · cabeçalho corrido · `Página X de N`.

### 2.3 O A4 não é o PPTX exportado

| Arquivo | Geometria | Páginas |
|---|---|---|
| `Defenz_Proposta_Endpoint_Joao_Buffo.pptx` | 508×286mm, 16:9 | 11 slides |
| `Defenz_ JoaoBuffo_Gerenciado.pdf` | **210×297mm A4** | 16 páginas |

E os metadados do PDF entregam a origem: `Producer: Skia/PDF` + `Creator: Mozilla/5.0` — **impresso do Chrome a partir de HTML**. O `CLAUDE.md` do brandbook confirma e normatiza: *"Documentos A4 = 794×1123px com CSS `@media print`"*, e nomeia `Defenz Proposta A4.dc.html` como o molde.

**Consequência:** o caminho é HTML → Chromium → PDF. **Some do plano** a manipulação de XML do PowerPoint e a necessidade de LibreOffice no servidor.

---

## 3. Decisões

| # | Decisão | Racional |
|---|---|---|
| **P1** | **Saída é PDF A4**, não PPTX | Pedido do Marcos e é o que já entregam ao cliente |
| **P2** | Template **HTML** versionado no repo, renderizado por **Chromium headless** | É a origem real do A4 atual e a regra da casa para material visual |
| **P3** | Preço **calculado em código** a partir da tabela pública versionada | §2.1 |
| **P4** | Só **Bitdefender / proteção de endpoints** nesta fase | Marcos: "vamos apenas para propostas Bitdefender". MDR quando o modelo existir |
| **P5** | Numeração própria **`DFZ-<ano>-<seq>`**, começando em **01986** | Marcos, para ter controle e versionamento |
| **P6** | Arquivo arquivado no **OneDrive** (Graph via n8n), não em Vercel Blob | Marcos preferiu; some uma dependência nova e o arquivo nasce onde o time vive |
| **P7** | Os 3 planos **marcados por padrão**, desmarcáveis no formulário | Buffo levou 3, Liquos levou 1 |
| **P8** | **Sem campo de justificativa** para preço abaixo da tabela | Marcos: sendo Prime, a alçada é dele. Registro do percentual permanece |

---

## 4. Fluxo

```
Botão "Nova proposta" (cabeçalho do Portal, visível nas 3 abas)
  → /dashboard/portal/proposta  · formulário
  → tela de CONFIRMAÇÃO  (mostra cliente, planos, quantidade, preço já calculado)
  → POST /api/portal/propostas
        1. valida  2. reserva o número  3. calcula preço  4. renderiza HTML
        5. imprime PDF  6. grava registro  7. devolve o arquivo
  → download imediato
  → (assíncrono) arquiva no OneDrive e marca o registro
```

A confirmação **mostra o preço calculado** antes de gerar. É onde o vendedor pega um erro de quantidade antes de o documento existir.

---

## 5. Formulário

| Campo | Tipo | Obrigatório | Destino |
|---|---|---|---|
| Tipo de documento | select (só "Bitdefender · Proteção de Endpoints") | sim | escolhe o template |
| Nome do cliente | texto | sim | capa e cabeçalho corrido |
| Nome da empresa | texto | sim | capa e cabeçalho corrido |
| CNPJ | texto | não | só registro (liga ao Zoho depois) |
| O que a empresa faz | textarea | não | **só registro** nesta fase (§12) |
| Quantidade de licenças | número, 5–999 | sim | define a faixa da tabela |
| Quais planos entram | 3 checkboxes, todos marcados | ≥1 | quantas páginas de investimento |
| Valor de tabela? | radio: tabela / abaixo / acima | sim | — |
| Percentual | número, se não for tabela | condicional | linha de desconto ou acréscimo |

**Rótulo dos planos:** "Quais planos entram na proposta?" · auxiliar: *"O cliente vê os planos lado a lado para comparar. Desmarque os que não fizerem sentido para essa oportunidade."*

**Vendedor** (nome, e-mail, telefone) vem da sessão, não é perguntado. **Data** é a de hoje no fuso de São Paulo.

**Fora de 5–999 a tela recusa e diz por quê.** A tabela pública cobre "até 999 licenças"; extrapolar seria inventar preço.

---

## 6. Preço

### 6.1 A tabela

`src/lib/proposta/tabela-precos.ts` — versionado, com procedência carimbada:

```ts
export const TABELA = {
  fonte: 'Tabela Bundle Pública BRL · SecuriSoft · substitui as vigentes',
  vigenteDesde: '2024-11-29',
  ateLicencas: 999,
  // preço POR LICENÇA, pelo PERÍODO INTEIRO (não por mês)
  BUSINESS_SECURITY: { '5-14': [84.46, 135.14, 211.16], '15-24': [72.99, 116.79, 182.48], … },
  PREMIUM:           { '5-14': [99.37, 158.99, 248.42], … },
  ENTERPRISE:        { '5-14': [178.05, 284.88, 445.13], … },
} as const
```

Faixas: `5-14 · 15-24 · 25-49 · 50-99 · 100-149 · 150-249 · 250-499 · 500-999`. Vigências: 1, 2 e 3 anos.

⚠️ **A tabela precisa de dono e prazo, como um POP.** O PDF diz "29/11/2024" no corpo e "Dez.2026" no nome do arquivo. Preço vencido em proposta é erro caro. Ver R3.

### 6.2 As contas

```
faixa            = faixaPorQuantidade(qtd)               // erro explícito fora de 5..999
precoLicenca     = TABELA[plano][faixa][anos-1]
valorTotal       = precoLicenca × qtd
valorUnitarioMes = precoLicenca / (12 × anos)            // ← aqui morre o ÷48
precoLicencaFinal= precoLicenca × (1 + ajuste)
valorTotalFinal  = valorTotal   × (1 + ajuste)
```

`ajuste` é negativo para desconto, positivo para acréscimo, zero para tabela. Arredondamento para centavo só na **formatação**, nunca no meio da conta.

**Rótulo variável:** "Desconto competitivo" quando negativo, "Acréscimo" quando positivo, e a linha **não aparece** quando é tabela cheia. O rótulo fixo do modelo atual mentiria em dois dos três casos.

---

## 7. O documento

### 7.1 Template

`src/lib/proposta/templates/endpoints-a4.tsx` — derivado do `Defenz Proposta A4.dc.html`, que o brandbook nomeia como molde. Páginas de 794×1123px, `@media print` com A4, margem 0 e `break-after: page`.

Segue o `CLAUDE.md` do brandbook: Manrope em tudo, crimson `#C1121F` com parcimônia (~8%), papel `#F6F3EE`, barra vermelha curta + seção numerada abrindo cada seção, **sem travessões em frase corrida** (vírgula ou `·`).

**Páginas fixas** (idênticas entre os dois clientes reais): confidencialidade, conheça-nos, porque nós, nossos serviços, alguns dos nossos clientes, parceria estratégica, encerramento.
**Páginas variáveis:** capa, uma página de investimento **por plano marcado**, cabeçalho corrido e `Página X de N` — com `N` calculado, já que muda com a quantidade de planos (Buffo 11, Liquos 10).

### 7.2 Fontes e imagens ficam no repo

⚠️ **Manrope é embutida como woff2 no bundle, e os logos como arquivos do repo.** Nada de `<link>` para Google Fonts nem de imagem vinda do OneDrive: se a fonte não carregar no Chromium do servidor, o PDF sai com fonte substituta e o visual quebra em silêncio. É a mesma cicatriz já registrada na skill `modelos-defenz` ("precisa estar instalada, senão o Word substitui e o visual quebra"), agora do lado do servidor.

### 7.3 Render

`puppeteer-core` + `@sparticuz/chromium-min`, `page.pdf({ format: 'A4', printBackground: true, margin: 0 })`. `export const maxDuration` na rota.

---

## 8. Numeração

`DFZ-<ano>-<seq>`, sequência **contínua** começando em **01986**, com no mínimo 5 dígitos (`01986`, `01987`, …, `99999`, `100000`) — ex.: `DFZ-2026-01986`.

⚠️ **O contador não zera na virada do ano.** O ano é rótulo; o número é único e monotônico para sempre. Zerar produziria `DFZ-2027-01986` colidindo em significado com o de 2026 e quebraria "para termos controle".

Reservado atomicamente, no mesmo padrão já provado do `TicketSequence` do Service Desk (`SD-2026-000001`). Regerar a mesma proposta emite número novo — dois PDFs diferentes nunca compartilham código, que é o que evita a confusão do arquivo revisado errado.

---

## 9. Dados

```prisma
model Proposta {
  id            String   @id @default(cuid())
  codigo        String   @unique          // DFZ-2026-01986
  tipo          PropostaTipo @default(ENDPOINTS)

  clienteNome   String
  empresaNome   String
  cnpj          String?
  oQueFaz       String?                   // capturado agora, usado pela Ana depois

  quantidade    Int
  planos        String[]                  // BUSINESS_SECURITY | PREMIUM | ENTERPRISE
  ajustePercent Decimal  @db.Decimal(6,3) // negativo = desconto

  precoSnapshot Json                      // linhas da tabela efetivamente aplicadas
  tabelaVigencia String                   // '2024-11-29'

  arquivoNome   String
  oneDriveItemId String?                  // null = ainda não arquivado
  arquivadoEm   DateTime?

  companyId     String
  criadoPorId   String
  createdAt     DateTime @default(now())

  @@index([companyId, createdAt])
  @@index([empresaNome])
  @@index([cnpj])
}
```

**`precoSnapshot` é o que torna o registro auditável.** Sem ele, "quanto eu cobrei do João em agosto" vira adivinhação assim que a tabela mudar.

Escopo por empresa como todo o resto (`assertCompanyAccess`). Criação grava `AuditLog`.

---

## 10. Rotas

| Rota | Método | Contrato |
|---|---|---|
| `/api/portal/propostas` | POST | formulário → gera, grava e devolve o PDF |
| `/api/portal/propostas` | GET | log buscável (`q`, `de`, `ate`), cap 200 |
| `/api/portal/propostas/[id]/arquivo` | GET | re-download |

**Só sessão, sem Bearer** — mesma regra da `/api/portal/ask`. Um token de serviço permanente que emite documento comercial em nome da Defenz é exposição sem rastro.

---

## 11. Fases

| Fase | Entrega | DoD |
|---|---|---|
| **F1** | Tabela versionada + `calcularInvestimento()` puro | Teste de regressão do ÷36; faixa fora de 5–999 recusada |
| **F2** | Template A4 + render PDF + POST que gera | PDF de 210×297mm, fonte Manrope embutida, sem "João Buffo" em lugar nenhum |
| **F3** | Botão, formulário, confirmação, numeração, registro | Marcos gera a primeira proposta em localhost |
| **F4** | Log buscável + re-download | Acha por empresa, cliente, CNPJ e período |
| **F5** | Arquivamento no OneDrive via n8n | Falha do Graph não perde o documento nem trava a geração |
| **F6** | Deploy | Vercel |

---

## 12. O que fica de fora, e por quê

- **A Ana não gera texto nesta fase.** Decisão do Marcos. `oQueFaz` é capturado e guardado justamente para a fase em que ela fizer a busca completa e escrever contexto e escopo sob medida.
- **Proposta MDR** — o modelo (`proposta-mdr-defenz.pptx`) está no OneDrive do Fernando, fora da pasta do Portal. Entra quando o arquivo existir.
- **Suporte Dedicado** não é modelo de proposta: 6 páginas institucionais, sem campo de cliente e sem investimento. É anexo.
- **Edição de proposta gerada.** Regerar emite número novo (§8).

---

## 13. Riscos

| # | Risco | Mitigação |
|---|---|---|
| R1 | **Chromium na Vercel** — cold start, tamanho, memória | `@sparticuz/chromium-min`; se doer, o render migra para o n8n sem mudar o contrato da rota |
| R2 | **Fonte não carrega e o PDF sai errado em silêncio** | Manrope embutida no bundle (§7.2) + teste que confere a fonte no PDF |
| R3 | **Tabela de preço vencida** | Carimbo de vigência no arquivo e no `precoSnapshot`; avaliar dar à tabela o mesmo motor de frescor dos POPs |
| R4 | **Preço errado em documento assinado** | Cálculo em código com teste de regressão; confirmação mostra o preço antes de gerar |
| R5 | **Graph/n8n fora do ar** | Geração e download não dependem dele; registro fica `oneDriveItemId: null` e a UI mostra "não arquivado" |
| R6 | **Quantidade fora da tabela** | Recusa explícita, nunca extrapolação |

---

## 14. Critérios de aceite

- [ ] `171.97 / 36 = 4.78` e **não** `3.58` — teste de regressão nomeado.
- [ ] Quantidade 4 e 1000 → recusadas com mensagem, sem gerar arquivo.
- [ ] PDF gerado mede 210×297mm; há **uma página de investimento por plano marcado**, e o rodapé `Página X de N` traz o total real do documento gerado (Buffo tem 11 páginas com 3 planos, Liquos 10 com 1 — as duas bases não têm o mesmo número de páginas fixas, então `N` é contado, nunca constante).
- [ ] O PDF não contém "João Buffo", "Liquos", "Gustavo Figueira" nem "PBI-25-01642".
- [ ] Ajuste 0% → a linha de desconto não aparece. Ajuste positivo → rótulo "Acréscimo".
- [ ] `DFZ-2026-01986` é o primeiro; dois cliques simultâneos não geram o mesmo código.
- [ ] Registro guarda `precoSnapshot`; log acha por empresa, CNPJ e período.
- [ ] Usuário de outra empresa não vê a proposta (tenant isolation).
- [ ] Falha do OneDrive não impede o download.

---

## Anexo A — Tabela pública, transcrita

Fonte: `Tabela Bundle Pública BRL - Dez.2026.pdf` · SecuriSoft, distribuidora exclusiva Bitdefender · corpo do documento datado **29/11/2024** · "cliente final até 999 licenças" · "substitui as tabelas vigentes".

**Preço por licença, pelo período inteiro, em reais.**

| Faixa | Business Security 1a / 2a / 3a | Premium 1a / 2a / 3a | Enterprise 1a / 2a / 3a |
|---|---|---|---|
| 5 a 14 | 84,46 · 135,14 · 211,16 | 99,37 · 158,99 · 248,42 | 178,05 · 284,88 · 445,13 |
| 15 a 24 | 72,99 · 116,79 · 182,48 | 85,87 · 137,40 · 214,68 | 160,06 · 256,09 · 400,15 |
| 25 a 49 | 68,79 · 110,06 · 171,97 | 80,93 · 129,48 · 202,32 | 142,52 · 228,04 · 356,31 |
| 50 a 99 | 58,85 · 94,16 · 147,13 | 69,24 · 110,78 · 173,09 | 129,04 · 206,46 · 322,60 |
| 100 a 149 | 51,60 · 82,55 · 128,99 | 60,70 · 97,12 · 151,75 | 116,00 · 185,61 · 290,01 |
| 150 a 249 | 47,01 · 75,21 · 117,52 | 55,30 · 88,49 · 138,26 | 104,32 · 166,90 · 260,79 |
| 250 a 499 | 43,57 · 69,71 · 108,92 | 51,26 · 82,01 · 128,14 | 84,53 · 135,24 · 211,32 |
| 500 a 999 | 40,90 · 65,43 · 102,24 | 48,11 · 76,98 · 120,28 | 75,08 · 120,13 · 187,71 |

Produtos, nome cheio: `GRAVITYZONE BUSINESS SECURITY BRAZILIAN EDITION` · `GRAVITYZONE PREMIUM BRAZILIAN EDITION` · `GRAVITYZONE ENTERPRISE BRAZILIAN EDITION`.

⚠️ **Discrepância de data a resolver com o Marcos:** o nome do arquivo diz "Dez.2026", a capa diz "2024" e o corpo diz 29/11/2024. A implementação carimba `vigenteDesde: '2024-11-29'` (o que está escrito no documento) até o Marcos confirmar qual é a tabela válida. Ver R3.
