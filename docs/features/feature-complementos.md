# Feature — Complementos (add-ons) na proposta e na apresentação

**Status:** APROVADA (modelos validados pelo Marcos em 02/09/2026) · em implementação
**Spec-mãe:** [`SPEC-MAE.md`](../SPEC-MAE.md) · irmãs: `feature-portal-proposta.md`, `feature-portal-apresentacao.md`

---

## 1. O problema

A proposta vende três linhas do GravityZone e mais nada. Os módulos que a Defenz
também revende — Patch Management, Criptografia de Disco, PHASR e os quatro
sensores XDR — ficavam fora do documento: o vendedor mandava a proposta e o
preço do add-on ia solto, por e-mail ou por WhatsApp.

Isso custa de três formas: o cliente não vê o preço da solução inteira, o
vendedor recalcula a soma à mão (e erra), e não fica registrado o que foi
proposto.

## 2. O que a feature faz

1. O vendedor marca os complementos ao gerar a **proposta**.
2. Cada complemento sai em bloco próprio, com preço separado e a descrição do que faz.
3. A **última página soma tudo**: principal + complementos, coluna a coluna.
4. Na **apresentação**, os mesmos complementos aparecem **citados sem preço**.

## 3. Decisões do Marcos (02/09/2026)

| # | Decisão | Consequência |
|---|---|---|
| **D1** | PHASR e sensores XDR: **R$ 126 / 252 / 378 é valor FINAL** | Não levam o desconto competitivo. O desconto é por produto, não global |
| **D2** | Patch e Criptografia: tabela **com 50%** de desconto competitivo | 59,90 → 29,95 · 30,00 → 15,00 |
| **D3** | Complemento **cobre 36 meses**, sem o bônus de 12 | Na coluna 36+12 o principal cobre 48 e o complemento 36. **O documento é obrigado a dizer** |
| **D4** | **Só a proposta leva preço** | A apresentação cita o que o módulo faz e manda o valor para a proposta |
| **D5** | Faixa **5 a 999 licenças** | Mesma da tabela principal. Uma licença avulsa não tem preço aqui |

## 4. Invariantes

| # | Invariante | Por quê |
|---|---|---|
| **I-C1** | **Nenhum preço nosso na apresentação** | É a regra que separa os dois documentos. A apresentação vai por e-mail para quem não conhece a marca |
| **I-C2** | **Cobertura divergente é declarada, sempre** | Somar 48 meses com 36 calado promete o que o preço não sustenta — a família do rótulo "36 meses" que dividia por 48 |
| **I-C3** | O desconto é **por produto**, no catálogo | Um número global aplicaria 50% em cima de quem já está líquido, cortando o PHASR pela metade |
| **I-C4** | **Descrição vem do material oficial**, com fonte impressa | Não passa por LLM. Descrição de produto errada em documento de cliente é promessa que a Defenz não entrega |
| **I-C5** | Proposta **sem** complemento sai idêntica à de antes | A feature não pode mudar documento que já está em produção |
| **I-C6** | O **snapshot** grava os complementos junto do preço | Mesma razão do `precoSnapshot`: "o que a gente propôs ao cliente X" não pode virar memória quando o catálogo mudar |

## 5. Catálogo

`src/lib/proposta/complementos.ts` — procedência carimbada, como a tabela de preços.

| Produto | 12m | 24m | 36m | Desconto | Cobertura |
|---|---|---|---|---|---|
| Patch Management | 59,90 | 119,80 | 179,70 | 50% | 12/24/36 |
| Criptografia de Disco | 30,00 | 60,00 | 90,00 | 50% | 12/24/36 |
| PHASR | 126,00 | 252,00 | 378,00 | — | 12/24/36 |
| XDR Sensor · Productivity / Network / Cloud / Identity | 126,00 | 252,00 | 378,00 | — | 12/24/36 |

Valor por licença, pelo período inteiro. Fonte: tabelas SecuriSoft e valores
passados pelo Marcos em 02/09/2026.

## 6. O consolidado

Recebe **um** plano principal: "quanto custa a solução que eu escolhi" tem uma
resposta só, e uma proposta com três planos teria três. **Quem escolhe é o
vendedor, na tela** — e quando há um plano só, é ele, sem perguntar.

`coberturasDivergem` é derivado, não escrito à mão: se um dia o complemento
passar a ter bônus, a frase de aviso some sozinha.

## 7. UI

**Proposta** (`/dashboard/portal/proposta`): lista de complementos com checkbox,
agrupada por família (GravityZone · XDR). Quando há mais de um plano marcado,
aparece o seletor "qual plano entra no resumo". Sem complemento marcado, a tela é
a de hoje.

**Apresentação** (`/dashboard/portal/apresentacao`): mesma lista, com o aviso de
que a apresentação não mostra valores.

## 8. Fora de escopo

- Complemento com quantidade **diferente** da do principal (ex.: 30 licenças de
  Premium e 10 de PHASR). Hoje todos seguem a quantidade da proposta.
- Ajuste comercial (`basePreco`/`percentual`) **sobre complemento** — o desconto
  do complemento é o do catálogo, e o ajuste da proposta não o toca.
- Complementos na `feature-calculadora-tco`.

## 9. Testes

Um happy e um sad por unidade, mais os três que protegem invariante:
`coberturasDivergem` na coluna 36+12 (I-C2), ausência de preço na apresentação
(I-C1) e igualdade da proposta sem complemento (I-C5).

---

## 10. Crítica da spec (02/09/2026) — e o que ela mudou

Feita contra o código, não contra a intenção. Cinco achados; dois obrigaram a
mexer no schema **antes** de a feature ir a produção.

### 🔴 C1 — O re-download apagaria os complementos, e o valor mudaria

**O mais grave, e passou perto.** O `/arquivo` de proposta **reimprime a partir
do `precoSnapshot`** — de propósito, para o mesmo código nunca sair com preço
diferente. Só que o snapshot guarda **apenas o `Investimento`**. Os complementos
ficariam de fora.

Consequência concreta: o cliente recebe uma proposta de **R$ 21.455,10**; o
vendedor baixa a mesma proposta na semana seguinte e recebe um PDF com o mesmo
código, sem as páginas de complemento e com **R$ 6.069,60**. Dois documentos com
o mesmo número e valores diferentes — exatamente a classe de bug que o
`precoSnapshot` foi criado para impedir, entrando pela porta que a feature abriu.

**A apresentação tem o mesmo buraco:** o `/arquivo` dela reimprime do
`fatosSnapshot` e não saberia dos complementos citados.

**Correção:** colunas novas `complementosSnapshot` em `Proposta` e em
`Apresentacao`, gravadas na emissão e lidas na reimpressão. Snapshot antigo
(`null`) reimprime como antes — I-C5 continua valendo para o passado também.

### 🟠 C2 — O desconto da proposta não vale para o complemento, e o documento não dizia

A página de investimento escreve *"os valores já contemplam o desconto de 10%"*.
A de complementos vinha logo depois, com preços que **não** têm esse desconto —
só o do catálogo. O cliente lê as duas em sequência e conclui o que qualquer um
concluiria.

**Correção:** quando a proposta tem ajuste comercial, a página de complementos
diz que ele não se aplica a eles.

### 🟠 C3 — O AuditLog não registraria o que foi proposto

`CREATE Proposta` grava quantidade, planos e ajuste. Sem os complementos, o log
responde "que proposta foi emitida" pela metade. **Correção:** entram no log.

### ✅ C4 — PHASR custa 1,5× o Premium (levantado e ENCERRADO em 02/09)

R$ 126/licença/12m contra R$ 80,93 do Premium. Levantei porque um add-on valer
mais que o produto principal costuma ser sinal de preço de tabela lido como
líquido. **O Marcos confirmou e encerrou:** *"O preço que vamos informar é o 126,
esqueça essa tabela e 50% de desconto."* Vale para o PHASR e para os quatro
sensores. O código já estava assim (`descontoPadrao: 0`); a confirmação fecha a
dúvida, não muda linha nenhuma. Os 50% do Patch e da Criptografia seguem — esses
vieram das tabelas da SecuriSoft com a linha de desconto explícita.

### 🟡 C5 — Com os sete complementos a proposta vai a 14 páginas

Não é defeito: são 4 páginas de complemento + resumo. Fica anotado porque
ninguém marcou sete ainda, e o dia que marcar não pode ser surpresa.
