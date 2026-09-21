# feature-quantidade-acima-da-tabela

**Status:** Aprovada pelo Marcos (21/09/2026, sessão MP Paraíba · 1400 licenças)
**Origem:** a tela travava em 999 licenças e o MP da Paraíba pede 1400.

## 1. O problema

A tabela pública da SecuriSoft diz, no corpo do documento, "cliente final até 999
licenças". O código levou isso ao pé da letra em QUATRO lugares (Zod, `faixaPorQuantidade`,
`calcularComplementos`, a tela) e RECUSA qualquer quantidade acima de 999 — a regra R6
da spec-mãe ("extrapolar seria inventar preço").

Resultado prático: a proposta de maior valor que a Defenz já teve para emitir não pode
ser emitida pelo gerador.

## 2. A decisão do Marcos

> "Pode aplicar sempre o desconto de 999. Permita sempre que seja criada a proposta."

Acima de 999 licenças a proposta usa **o preço da faixa `500-999`** — a última e mais
barata faixa da tabela. Não se inventa faixa nova, não se interpola, não se extrapola:
usa-se um preço que EXISTE na tabela.

**Por que isso é seguro na direção do dinheiro:** a escada da tabela desce com o volume.
Usar a faixa `500-999` para 1400 licenças cobra do cliente o preço de um volume MENOR,
ou seja, nunca subfatura a Defenz. O risco que sobra é comercial (ficar caro demais num
volume em que a distribuidora provavelmente daria preço especial), não contábil.

**Risco aceito e registrado:** a tabela não autoriza esse preço para 1400 licenças. Antes
de fechar, o preço acima de 999 deveria ser confirmado com a SecuriSoft — o gerador passa
a permitir a emissão, não a garantir a validade comercial.

## 3. O que muda

| Onde | Antes | Depois |
|---|---|---|
| `tabela-precos.ts` | `QUANTIDADE_MAX = 999` | idem (é o teto da TABELA) + `QUANTIDADE_MAX_PROPOSTA = 100000` (teto de sanidade, pega erro de dedo) + `FAIXA_TOPO = '500-999'` |
| `faixaPorQuantidade` | joga acima de 999 | acima de 999 devolve `FAIXA_TOPO`; joga só abaixo de 5 ou acima do teto de sanidade |
| `calcularComplementos` | joga acima de 999 | mesma regra (complemento tem preço único, não faixa) |
| `validations/proposta.ts` | `.max(999)` | `.max(QUANTIDADE_MAX_PROPOSTA)` |
| tela `/dashboard/portal/proposta` | bloqueia acima de 999 | libera + avisa que acima de 999 o preço é o da faixa 500-999 |
| template A4 | imprime "faixa 500-999 da tabela vigente" | **omite o sufixo de faixa** acima de 999 licenças |

## 4. A invariante que isto cria (I-Q1)

> **O documento nunca cita uma faixa que contradiz a quantidade.**
> Imprimir "1400 licenças · faixa 500-999 da tabela vigente" é o documento se desmentindo
> na mesma linha, num papel que vai para um Ministério Público. Acima de 999 o sufixo de
> faixa some — o preço continua sendo o da faixa, o documento é que para de alegar
> cobertura que a tabela não dá.

Mesmo tratamento que o caso `precoAcimaDaTabela` (acréscimo) já recebia por outro motivo.

## 5. Compatibilidade com o que já foi emitido

`faixaPorQuantidade` só muda de comportamento acima de 999 — faixa nenhuma de 5 a 999 se
move. Proposta antiga reimpressa pelo `/arquivo` sai byte a byte igual: o snapshot guarda
`quantidade`, e a supressão do sufixo é DERIVADA de `quantidade > 999`, não de um campo
novo que os snapshots antigos não teriam.

## 6. Testes

- `faixaPorQuantidade(1000)` e `(1400)` → `'500-999'` (era throw).
- `faixaPorQuantidade(999)` → `'500-999'`, e as faixas de 5 a 999 intactas.
- `faixaPorQuantidade(100001)` → ainda joga (teto de sanidade).
- `calcularInvestimento` com 1400 × Premium 36+12 → preço por licença 120,28 (faixa topo),
  total 1400 × 120,28, com −15% aplicado por cima.
- `calcularComplementos(['PATCH_MANAGEMENT'], 1400)` não joga.
- template: HTML de 1400 licenças NÃO contém "faixa 500-999"; o de 300 contém "faixa 250-499".

---

## 7. Crítica da spec (21/09, antes do deploy)

Três revisões adversariais: a spec (aqui), o documento gerado e o código/snapshot
(§8). O que segue são defeitos DA PRÓPRIA SPEC acima — não do código.

### C1 🔴 "nunca subfatura a Defenz" é meia verdade, e a metade que falta é a cara

O §2 prova que o cliente não paga MENOS do que pagaria numa faixa dedicada. Isso
protege a receita. Mas a proposta é um **compromisso de preço**: se o MP aceitar
R$ 143.133,20 e a SecuriSoft, para 1400 licenças, exigir registro de oportunidade
ou cotar um custo que não seja o da faixa 500-999, a Defenz fica presa a um preço
que talvez não consiga comprar. A spec afirmou a direção do risco sem nenhuma
evidência sobre o CUSTO da Defenz acima de 999 — e é o custo, não o preço de
tabela, que decide se a margem existe.

**Correção da spec:** o risco não é "ficar caro demais". É **vender sem saber o
custo**. Continua valendo emitir; não continua valendo emitir sem confirmar.

### C2 🟠 O risco foi "registrado" num markdown, que é onde risco vai morrer

O §2 diz "deveria ser confirmado com a SecuriSoft". Isso é um desejo num arquivo
que ninguém abre na hora de emitir. Este repo já tem um precedente exato:
**VALIDADE-DA-TABELA**, aberta em agosto, viva até hoje, anotada em comentário.

**Correção implementada:** a proposta acima de 999 passa a ser marcada no próprio
registro (`acimaDaTabela` no snapshot) e no AuditLog. Assim existe uma LISTA
consultável de propostas emitidas fora da cobertura da tabela, em vez de uma
frase numa spec.

### C3 🟠 A invariante I-Q1 é mais larga que o conserto que ela descreve

O §4 promete: "o documento nunca cita uma faixa que contradiz a quantidade". O
código só tirou o sufixo `· faixa X da tabela vigente`. A frase
**"Valores conforme tabela vigente, por vigência contratada."** sobreviveu — é a
mesma alegação sem a palavra "faixa", e sai três vezes (uma por plano) em toda
proposta acima de 999 com preço de tabela cheia. Invariante mais larga que o
conserto é exatamente como a invariante volta a ser violada depois.

**Correção implementada:** a frase passa a ser governada pelo mesmo `citaFaixa()`.

### C4 🟠 O teto de 100.000 não pega o erro de dedo que existe

O §3 vende `QUANTIDADE_MAX_PROPOSTA` como defesa contra erro de dedo. O erro de
dedo real é **um zero a mais**: 1400 → 14000. Passa pelo teto, e sai uma proposta
de 14.000 licenças com preço de faixa 500-999. O teto só pega dedada de 6 dígitos.

Teto nenhum distingue "14000 digitado errado" de "14000 de verdade" — só um
humano distingue. **Correção implementada:** a tela de confirmação, que já existe
e já avisa sobre acréscimo, passa a avisar em destaque quando a quantidade está
acima da cobertura da tabela. A defesa é o olho de quem emite, não uma constante.

### C5 🟡 §5 afirma compatibilidade sem teste que a sustente

"sai byte a byte igual" era alegação, não teste. Ver §8.

## 8. Crítica adversarial do documento e do código (dois revisores)

Dois revisores independentes: um sobre o PDF gerado, outro sobre código,
snapshot e testes. Renderizaram o caso real (1400 · −15% · Patch Management).

### Aplicado

| # | Sev | Achado | Conserto |
|---|---|---|---|
| A1/C3 | 🔴 | `"Valores conforme tabela vigente"` — a MESMA alegação sem a palavra "faixa", 1× por plano, em toda proposta acima de 999 com tabela cheia. A supressão era **parcial por construção**: `citaFaixa()` governava só o sufixo. | a frase passou a ser governada por `citaFaixa()` |
| A2 | 🔴 | **A página de Complementos afirmava a tabela por escrito** — "os valores abaixo são os da tabela deles", e essa tabela declara validade 5–999. Disparava com QUALQUER desconto: **era o caso exato do MP.** `citaFaixa` nunca foi chamado fora das páginas de investimento e resumo. | acima de 999 a frase perde a parte que a tabela não sustenta; o ponto comercial (o desconto não incide aqui) fica de pé |
| 2 | 🟠 | A mensagem de erro dos complementos passou a **afirmar que a tabela deles cobre 100.000 licenças**. Trocar a constante arrastou a frase junto. | a mensagem diz sanidade, não cobertura |
| 3 | 🟠 | **O teto de 100.000 não pegava o erro de dedo que existe.** 1400→14000 passava em todos os guards e saía PDF de R$ 1.431.332,00. 100.000 era 71× a maior proposta real. | teto para **10.000**: o zero a mais bate, e sobram 7× de folga sobre o maior caso real |
| A6 | 🟡 | O conserto de A1 fez "acima da tabela" e "acréscimo oculto" saírem com a MESMA frase — duas situações comerciais indistinguíveis no papel. | frase própria para acima-da-tabela |
| A7 | 🟡 | O teste que "provava" I-Q1 montava o documento **sem complementos e sem resumo** — justamente as páginas que vazavam. A2 era invisível para a suíte. | teste do documento COMPLETO do caso real, varrendo o HTML inteiro |
| 5 | 🟡 | Asserção morta (`not.toContain` implicado por outro) e âncora `R$ 102,24` que é, por coincidência, preço de tabela do Business Security — passaria pelo motivo errado. | asserção removida; âncora no total |

### Rejeitado, com motivo

**A5 — subir `TEMPLATE_VERSAO`.** Os dois revisores discordaram. O do documento
citou a regra ("subir quando as promessas mudarem"); o do código trouxe a
consequência: as frases que mudaram só aparecem acima de 999, **não existe uma
proposta emitida assim**, e subir marcaria as 6 propostas reais como "modelo
divergente" sem divergência nenhuma. Ganhou a consequência verificável. A decisão
está registrada em comentário na própria constante.

### Aberto — decisão do Marcos, não do código

**A3/4 🟠 — o preço de referência impresso acima do desconto.** Com desconto e
acima de 999, a grade imprime `Valor unitário R$ 120,28` e logo abaixo
`Desconto competitivo 15%`. R$ 120,28 é o preço da faixa 500-999; sob um
cabeçalho que diz "1400 licenças", lê-se como preço de lista para 1400. O
documento não o chama mais de tabela, mas o número faz a afirmação sozinho.
O mesmo vale dentro do bloco de cada complemento (R$ 59,90 → 50%).

**Não mexi de propósito.** O conserto seria imprimir só o preço final, como já
se faz no acréscimo oculto — e isso **apaga o desconto de 15% do documento do
cliente**, que é argumento de venda. É decisão comercial do Marcos, não conserto
técnico, e fazê-la sozinho seria mudar o que o cliente vê sem ele saber.

### Confirmado pela crítica (alegações que se sustentaram)

- **Reimpressão idêntica**: `/arquivo` lê `precoSnapshot` e **não recalcula** —
  não chama `faixaPorQuantidade`, não lê `TABELA`. Todo snapshot já tem
  `quantidade`; todo acervo tem `quantidade ≤ 999` (o guard antigo era
  intransponível). E se faltasse, `undefined > 999` é `false` — degrada para o
  comportamento antigo.
- **Nenhuma faixa de 5..999 mudou** — demonstrado, não só testado: `FAIXA_LIMITES`
  é contígua e exaustiva em [5,999], então o fallback é **inalcançável** ali.
- **Não subfatura** — as três escadas de preço são monotonicamente decrescentes
  nas oito faixas e nas três colunas; `500-999` é o piso em todos os casos.
- **Não sobrou nenhum outro guard de quantidade** em `src/`, `scripts/`,
  `prisma/` ou `mcp/`.

### Dívida conhecida

Não existe teste de rota para `/api/portal/propostas` (a cobertura "de servidor"
acima de 999 é o `createPropostaSchema.parse`). É proporcional à regra da casa,
mas registrado aqui para não ser confundido com cobertura de API.
