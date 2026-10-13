# feature-proposta-numeracao-secoes

**Status:** APROVADA pelo Marcos (13/10/2026: "gere a spec, critique e implemente")
**Origem:** Fernando, e-mails de 23/09 e 07/10/2026 (caso Clayton Casal Sociedade de Advogados)

## 1. O problema

> "A numeração do menu está se repetindo. O item 6 deve ser exclusivamente
> 'Investimento', sem outro item com o mesmo número, mesmo quando houver quebra de
> página." — Fernando

Evidência: DFZ-2026-02039 (25 licenças, Business Security + Premium, 10 páginas).
Pág. 08 abre **"06. Investimento"** (Business Security); pág. 09 abre **de novo
"06. Investimento continuação"** (Premium). Para quem lê, são dois itens 06.

O mesmo defeito existe, ainda sem reclamação, na seção **Complementos**: com mais
complementos do que cabem numa página, a segunda abre "07. Complementos continuação".

## 2. Por que ninguém viu

O teste que confere a numeração (`secoesNoHtml`) **descarta número repetido em
sequência antes de comparar**:

```ts
return achados.filter((n, i) => n !== achados[i - 1])
```

Uma proposta de três planos imprime `06. 06. 06.` e o teste enxerga `06.`. Ele foi
escrito para aceitar a repetição como "a mesma seção". O defeito não escapou do teste:
o teste é que dizia que estava certo.

## 3. A solução

**Página de continuação não leva número.** A seção é numerada uma vez só, na página em
que começa. As páginas seguintes da mesma seção recebem um rótulo discreto, sem número,
no estilo dos rótulos pequenos que o documento já usa (caixa alta, letra pequena, cor
de apoio):

> INVESTIMENTO · CONTINUAÇÃO

No lugar do título grande numerado. O resto da página não muda: o parágrafo de
dimensionamento e a tabela do plano continuam ali — é o nome do plano, na tabela, que
diz ao leitor o que aquela página traz.

Vale para Investimento **e** Complementos, numa função só — a mesma regra escrita duas
vezes é como uma das duas fica para trás.

## 4. Invariante (I-N1)

> **Cada número de seção aparece exatamente uma vez no documento.**

`secoesNoHtml` deixa de deduplicar e passa a devolver o que está impresso. O teste
exige a lista estritamente crescente e sem repetição, nos cenários:

| Cenário | Seções esperadas |
|---|---|
| 1, 2 e 3 planos | 01–06 |
| 2 planos + complementos em mais de uma página + resumo | 01–08 |
| plano + complemento + serviço + resumo | 01–09 |
| só add-ons (sem plano) | 01–06 |

## 5. Critério de aceite

1. Proposta de 25 licenças, Business Security + Premium: "06." aparece **uma** vez; a
   página do Premium mostra "Investimento · continuação" sem número.
2. Nenhuma proposta, em nenhum dos cenários do §4, imprime um número de seção duas vezes.
3. Página única por seção (1 plano, poucos complementos): documento idêntico ao de hoje.
4. PDF de exemplo gerado para o Marcos enviar ao Fernando. **Nada é enviado por mim.**

## 6. Versão do modelo

`TEMPLATE_VERSAO` **sobe** (`2026-09-17` → `2026-10-13`). Medido no acervo antes de
decidir, com o mesmo critério de 21/09 (quando ela NÃO subiu porque zero propostas
mudavam):

| Versão de origem | Propostas | Mudam com esta correção |
|---|---|---|
| 2026-09-17 (atual) | 29 | **21** (2+ planos, ou complementos em 2+ páginas) |

72% do acervo atual muda de cara no re-download, então o selo "modelo divergente" passa
a ser verdadeiro para a maioria. As 8 de um plano só ganham o selo sem mudança visível,
mas o texto dele continua correto ("o texto institucional é o de hoje"). Em 21/09 o
mesmo critério deu zero, e a versão ficou; aqui dá 72%, e ela sobe.

## 7. Fora de escopo

A apresentação institucional (`institucional-a4.ts`) não tem página de continuação —
conferido, nada a mudar lá.

## 8. Crítica

**C1 — o verificador escondia o defeito.** `secoesNoHtml` deduplicava número repetido
em sequência; dois testes antigos ("seções contíguas com 1–3 planos" e "investimento,
complementos, resumo") só passavam por causa disso. Com o verificador honesto, os dois
ficaram vermelhos antes do conserto, o que prova que agora eles enxergam o defeito.

**C2 — o mecanismo do defeito saiu do código.** O parâmetro `sufixo` de
`tituloSecao` existia só para pendurar "continuação" ao lado do número. Removido: não há
mais como imprimir título numerado de continuação sem escrever código novo de propósito.

**C3 — layout.** A página de continuação perdeu o título de 40px. A tabela fica num
bloco `flex:1` centralizado, então sobra espaço em vez de faltar. Conferido no PDF
renderizado (págs. 08 e 09 do exemplo).
