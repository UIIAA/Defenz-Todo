# feature-catalogo-opcoes — DLP, MDR e desconto por item

**Status:** DONE local (17/09/2026) — 983 testes, `tsc` e `build` verdes. **Não deployado.**
**Origem:** Marcos, 17/09. Três pedidos numa feature só: (1) DLP como opção na proposta **e** na apresentação, a US$ 48 por licença; (2) desconto **por item**, não um único percentual; (3) MDR como opção, usando o material do projeto `Defenz_MDR`.
**Herda:** invariantes da [`SPEC-MAE.md`](../SPEC-MAE.md) §5, da [`feature-complementos.md`](feature-complementos.md) (I-C1…I-C6) e da [`feature-proposta-acrescimo-oculto.md`](feature-proposta-acrescimo-oculto.md).

## 1. Decisões do Marcos (17/09)

| # | Decisão |
|---|---|
| **D1** | **MDR entra sem preço.** Escopo e SLA descritos, investimento **sob consulta**. Não existe tabela de preço do MDR: os valores reais (Wintress R$ 900/mês para 6 máquinas, ExhTech R$ 1.900/mês para ~17) são negociados caso a caso. Inventar faixa seria preço falso num documento assinável. |
| **D2** | **DLP só 12 meses**, com renovação anual. Nas colunas de 24 e 36+12 do GravityZone, entra **um ano** de DLP, e o documento diz isso. |
| **D3** | **Câmbio é constante versionada no código**, com data e fonte, como a tabela de preços. Começa em **R$ 5,1521** (PTAX de venda de 17/09/2026). Nada de consultar o Banco Central na hora de gerar. |
| **D4** | **Desconto por item começa do catálogo e é editável na tela.** Patch e Criptografia nascem com 50%, PHASR/sensores/DLP com 0%, e quem gera muda item a item — inclusive zerar o Patch. |

## 2. O que muda para quem usa

**Proposta.** O bloco "Complementos" passa a ter quatro famílias: GravityZone, Sensores XDR, **DLP** e **Serviços gerenciados**. Ao marcar um item, aparece ao lado dele um campo de **desconto (%)**, já preenchido com o padrão do catálogo. O DLP sai em bloco próprio, com preço em reais e a cotação impressa. O MDR sai em bloco de escopo, sem preço, e **não entra na soma**.

**Apresentação.** DLP e MDR aparecem na lista "Complementos a citar" e saem descritos, **sem preço** (I-C1 continua valendo).

## 3. Catálogo — itens novos

### 3.1 DLP · GTB Endpoint Protector (`DLP_GTB`, família `DLP`)

- Preço de canal: **US$ 48,00 por licença / 12 meses**. Console central on-premises incluso, sem custo.
- Conversão: `US$ 48,00 × 5,1521 = R$ 247,30` por licença (arredondado na formatação, nunca no meio da conta).
- Desconto padrão: **0%**.
- Cobertura: **12 meses nas três colunas**.
- Descrição: o texto do bundle que o Marcos passou em 14/09 (Local PC Discovery, MS Outlook Discovery, USB & Device Controls, Classification & Watermarking, Application Controls, File Share Audit), com a fonte declarada, como manda a I-C4.

### 3.2 MDR · Serviço gerenciado (`MDR_GERENCIADO`, família `SERVICO`)

- **Sem preço.** `precoTabela: null` e `sobConsulta: true`.
- Descrição e escopo tirados de `Defenz_MDR/docs/proposta-servico-gerenciado.md` §7, na **redação defensável** registrada no kit comercial: *monitoramento contínuo da plataforma, resposta humana em dia útil das 9h às 18h*.
- ⚠️ **Não prometer** tempo real, isolamento automático nem bloqueio de indicador por cliente: a memória do projeto MDR registra que os três não funcionam hoje. Isso vira teste, não recomendação.
- Diz o que **não** está incluso: licença do GravityZone (à parte), suporte de TI geral, atendimento presencial, ação física na máquina e recuperação de incidente já consumado.

## 4. Desenho técnico

### 4.1 Câmbio (`src/lib/proposta/cambio.ts`, novo)

```ts
export const CAMBIO = {
  usdBrl: 5.1521,
  fonte: 'PTAX de venda · Banco Central do Brasil',
  data: '2026-09-17',
} as const
export function converterUSD(valorUSD: number): number  // × usdBrl, sem arredondar
```
Todo documento que imprime preço convertido imprime também a cotação e a data.

### 4.2 Catálogo (`complementos.ts`)

`Complemento` ganha três campos opcionais, para não mexer nos sete itens que já existem:

```ts
moeda?: 'BRL' | 'USD'          // ausente = BRL (os sete de hoje)
precoTabela: readonly [number, number, number] | null   // null = sob consulta
mesesCobertura?: readonly [number, number, number]      // ausente = [12,24,36]
sobConsulta?: boolean
naoIncluso?: readonly string[]  // só o MDR usa
```

`familia` passa a aceitar `'DLP' | 'SERVICO'`.

### 4.3 Cálculo (`calculo-complementos.ts`)

- `calcularComplementos(ids, quantidade, descontos?)` — `descontos` é um mapa `id → percentual` que **sobrepõe** o `descontoPadrao`. Ausente = catálogo (compatível com toda chamada de hoje).
- Item `sobConsulta` **não** entra em `calcularComplementos`: vira `BlocoServico`, lista separada, sem vigências e sem total.
- `LinhaComplemento` ganha `moeda`, `precoOrigem` (o valor em US$, para o documento poder mostrar a procedência) e `meses` vem do item, não da constante global.
- `consolidar()`: `LinhaConsolidada.mesesComplementos` vira **`coberturas: number[]`** (os prazos distintos daquela coluna). Com Patch (36) e DLP (12) juntos na coluna 3, o documento tem de dizer os dois. `coberturasDivergem` continua verdadeiro quando qualquer cobertura difere da do principal.

### 4.4 API e validação

`createPropostaSchema` ganha:

```ts
descontosComplemento: z.record(z.enum(COMPLEMENTO_IDS), z.number().min(0).max(90)).optional()
```

Campo **opcional**: payload antigo continua válido (I-C5). O desconto efetivo de cada item entra no `complementosSnapshot` e no AuditLog (`complementos: "Patch 0% · DLP 10%"`).

### 4.5 Templates

- **Proposta:** bloco do DLP igual ao dos outros, mais a linha de procedência: *"Convertido de US$ 48,00 por licença pela PTAX de 17/09/2026 (R$ 5,1521)."* Bloco do MDR: escopo, o que não está incluso e **"Investimento sob consulta"**, sem tabela. Resumo: nota de que o MDR não está somado.
- **Apresentação:** nada de preço. O bloco atual já imprime nome + descrição do catálogo, então DLP e MDR entram sozinhos. A frase da seção passa a dizer "módulos e serviços".

### 4.6 UI

- Proposta: as famílias deixam de ser a lista fixa `['GRAVITYZONE','XDR']` (hoje `page.tsx:290`) e passam a sair do catálogo — senão item novo fica invisível. Campo de desconto por item ao lado de cada marcado.
- Apresentação: já varre `COMPLEMENTOS` inteiro; só conferir o texto.

## 5. Invariantes

- **I-N1** Nenhum preço na apresentação, inclusive DLP e MDR (I-C1 estendida).
- **I-N2** Item `sobConsulta` nunca entra em soma nenhuma, e o documento diz que ele está fora do total.
- **I-N3** Preço em US$ nunca é impresso sem a cotação e a data ao lado.
- **I-N4** Desconto por item vale de 0 a 90, por item, e o efetivo aplicado vai para o snapshot e para o AuditLog.
- **I-N5** Proposta sem complemento e proposta com os mesmos complementos de antes saem **idênticas** às de hoje (regressão byte a byte).
- **I-N6** O texto do MDR não contém "tempo real", "isolamento automático" nem "24x7" sozinho: o que se promete é monitoramento contínuo da plataforma com resposta humana em dia útil, 9h às 18h.
- **I-N7** Cobertura divergente continua declarada, agora com mais de um prazo na mesma coluna (I-C2 estendida).

## 5-bis. Crítica (17/09, antes de implementar)

- **C1 — arredondamento do câmbio, medido.** `48 × 5,1521 = 247,3008`. Com a regra da casa (arredondar só na formatação), o unitário sai **R$ 247,30** e o total **R$ 98.920,32** — 400 × o unitário impresso dá **R$ 98.920,00**, e a proposta se contradiz em R$ 0,32. **Correção:** a conversão arredonda **uma vez**, na entrada (`precoBRL = round(usd × cambio, 2)`), e esse vira o preço em reais do item. Daí para frente tudo é BRL e a regra da casa continua valendo. Teste: `unitário impresso × quantidade === total impresso`.
- **C2 — `z.record(z.enum(...), z.number())`, medido no Zod v3 do projeto:** `{}` passa, `{PATCH_MANAGEMENT: 10}` passa (parcial é aceito) e chave fora do enum é **rejeitada** com `invalid_enum_value`. O desenho do §4.4 se sustenta. Fica registrado porque era suposição.
- **C3 — DLP com três colunas iguais pareceria erro.** Item de cobertura única imprime **uma coluna só** ("12 meses"), não três com o mesmo número. O bloco diz que a renovação é anual.
- **C4 — o texto da seção da apresentação mente com MDR marcado.** Hoje: *"Módulos que somam ao GravityZone e são contratados à parte"*. O MDR é serviço da Defenz, não módulo do GravityZone. Passa a "Módulos e serviços que somam à proteção contratada".
- **C5 — desconto por item pode ser dado sobre quem já está líquido.** PHASR, sensores e DLP são valor final; um desconto ali sai do bolso da Defenz. É decisão do Marcos (D4), então não é bloqueio — mas a tela avisa quando o item tem desconto padrão 0 e alguém digita um número.
- **C6 — o MDR não pode virar página fantasma.** Sem preço e sem vigência, o bloco é só texto; se ele for o **único** item marcado, não existe página de complementos nem resumo somado — só a seção de serviço. Teste explícito.

## 5-ter. Crítica adversarial (17/09) — 21 achados, e o que foi feito

**Decisões novas do Marcos, tiradas da crítica:**

- **D5 — o DLP fica FORA do total somado**, como o MDR. Motivo (achado 5): somar 12 meses de DLP com 48 de GravityZone e chamar de "Investimento total" subestima o DLP em duas renovações — é a mesma família do rótulo "36 meses" que dividia por 48, e declarar não conserta o número. O DLP sai com preço em bloco próprio e entra no resumo como **linha informativa fora do total**, dizendo que a renovação é anual.
- **D6 — item de preço líquido não imprime linha de desconto.** Aceita desconto (D4), mas o documento mostra só o preço final. Imprimir "Valor unitário R$ 126,00 · Desconto 20%" inventaria uma tabela que a SecuriSoft não pratica (achado 8).

**Achados aceitos e corrigidos:**

| # | Achado | O que foi feito |
|---|---|---|
| 1 | `coberturas` quebraria re-download | `mesesComplementos` **mantido** e `coberturas` **acrescentado**; leitor único normaliza `coberturas ?? [mesesComplementos]` |
| 2 | Cotação impressa viria da constante de hoje | Cotação, fonte e data entram no **snapshot** na emissão; o template lê do snapshot, nunca da constante |
| 5 | DLP no total subestima | **D5**: fora do total |
| 6 | "os valores estão na proposta comercial" mente com MDR | Frase da apresentação vira condicional: item sob consulta força "investimento sob consulta" |
| 7 | Desconto por item colide com I1 do acréscimo oculto | **I1 alterada**: o grep de "sem percentual" passa a valer para a **página de investimento**, não para o documento inteiro. Registrado na `feature-proposta-acrescimo-oculto.md` |
| 8 | Desconto sobre preço líquido inventa tabela | **D6** |
| 9 | Rodapé "por licença, pelo período contratado" fica falso | Texto derivado dos itens presentes na página |
| 10 | Unitário × quantidade ≠ total | Já corrigido na C1: conversão arredonda uma vez |
| 11 | Fração (0,5) vs percentual (50) | Override entra em percentual e é dividido por 100 na fronteira; teste fixa Patch 0% → R$ 59,90 e PHASR 10% → R$ 113,40 |
| 12 | Item sem preço somando como R$ 0,00 | `calcularComplementos` **filtra** o sob consulta e `servicosSobConsulta()` o devolve como escopo; teste cobre marcar MDR junto com Patch |
| 13 | DLP com três colunas iguais | Item tem **uma** vigência; `vigenciaDaColuna()` satura o índice |
| 14/15/16 | Zod: tipo não-parcial, chave de item não selecionado, id repetido | Assinatura tipada como `Partial<Record<…>>`; `.refine` amarra as chaves aos itens marcados; `.refine` de unicidade |
| 17 | Proposta só com MDR sairia sem página de MDR | `servicos` entram em `PropostaDocumento`, no snapshot e nas condições de render |
| 18 | Numeração ignora a página de serviço | `totalPaginas(planos, complementos, servicos)` e numeração de seção derivada do que existe |
| 20 | Fonte do texto do MDR | Texto **copiado** para o catálogo com data e origem declaradas; revalidação junto com a tabela |

**Achados recusados, com motivo:**

- **3** (subir `TEMPLATE_VERSAO` da apresentação): **aceito**, entra na F5.
- **19** (itens novos visíveis antes da F5): as fatias **não são deploys**. Tudo entra em produção num push só, com o gate completo. O risco descrito só existiria se a F1 fosse deployada sozinha — e não vai.
- **21** (`planoConsolidado` é índice da ordem de clique): defeito **real e pré-existente**, mas fora do escopo desta feature. Vira item próprio no PROGRESS em vez de entrar de carona numa feature que já mexe em preço.

## 6. Fora de escopo

Tabela de preço do MDR, geração das propostas antigas de MDR em HTML manual, mudança na tabela do GravityZone, acréscimo por item (só desconto), reajuste automático de câmbio.

## 7. Risco

- **Propostas já emitidas:** o `precoSnapshot`/`complementosSnapshot` das antigas tem o formato velho (`mesesComplementos` número). O reconstrutor precisa ler os dois formatos, ou o re-download de proposta antiga quebra. **Teste obrigatório.**
- **`TEMPLATE_VERSAO` sobe** de novo, e o log passa a avisar divergência em mais propostas.
- **Estamos em produção:** a entrega é em fatias verificáveis (§8), cada uma com build, tipos e testes verdes antes da seguinte.

## 8. Fatias

| # | Fatia | Pronto quando |
|---|---|---|
| **F1** | Câmbio + catálogo (DLP e MDR) + tipos novos, sem tocar em template | testes do catálogo e da conversão passam; proposta atual idêntica |
| **F2** | Cálculo: desconto por item, cobertura por item, item sob consulta fora da soma | regressão dos sete itens de hoje byte a byte |
| **F3** | Template da proposta: bloco DLP com procedência, bloco MDR sem preço, resumo com as duas coberturas | PDF local conferido; I-N2, I-N3, I-N6, I-N7 testadas |
| **F4** | API + UI da proposta (famílias do catálogo, campo de desconto por item) | payload antigo aceito; snapshot e AuditLog com o desconto efetivo |
| **F5** | Apresentação: DLP e MDR citados sem preço | teste "nenhum valor em reais" continua verde com os dois marcados |
