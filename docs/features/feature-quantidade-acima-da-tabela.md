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
