# feature-proposta-acrescimo-oculto

**Status:** DONE local (16/09) — 961 testes, tsc e build verdes. **Não deployado.**
**Data:** 16/09/2026
**Origem:** pedido do Marcos. Quando o preço vai **acima** da tabela, o cliente não pode saber disso. O **desconto** continua aparecendo.

## 1. Problema

Hoje a proposta em PDF trata desconto e acréscimo do mesmo jeito. Com acréscimo de X%, o documento que vai ao cliente mostra:

- a linha **"Acréscimo · X%"** e a linha **"Unitário com acréscimo"** na tabela do plano (`tabelaPlano`, `endpoints-a4.ts:234-251`);
- o **valor de tabela** e o **total de tabela** logo acima, o que deixa a diferença visível;
- a frase *"Os valores já contemplam o acréscimo de X%…"* (`endpoints-a4.ts:325`);
- na página de complementos, *"O acréscimo de X% aplicado ao GravityZone não incide…"* (`endpoints-a4.ts:440`);
- no rodapé, *"faixa N da tabela vigente"*, que num preço acima da tabela deixa de ser verdade.

## 2. Regra nova

| Ajuste | Tela de revisão (antes de gerar) | PDF do cliente |
|---|---|---|
| **Tabela (0%)** | como hoje | como hoje |
| **Desconto** | como hoje | como hoje: tabela, desconto, unitário com desconto, total |
| **Acréscimo** | mostra **"Acréscimo de X%"** e os valores finais, com um aviso: *"O cliente verá estes valores como preço, sem menção ao acréscimo."* | mostra **só o preço final** como se fosse o preço: unitário/mês, unitário e total **já com acréscimo**, **sem** linha de ajuste e **sem** a palavra "acréscimo" em nenhum lugar |

## 3. Decisões propostas (confirmar)

- **D1: Texto da página de investimento com acréscimo.** Sai *"conforme tabela vigente"* e entra uma frase neutra: *"Valores por licença, por vigência contratada."*
- **D2: Rodapé com acréscimo.** Sai *"faixa N da tabela vigente"* e fica *"Valores em reais. Dimensionamento para N licenças."* Com desconto ou tabela, o rodapé não muda.
- **D3: Complementos.** A frase de que o ajuste não incide nos complementos só aparece quando é **desconto**.
- **D4: Registro interno sem mudança.** `ajustePercent`, `precoSnapshot`, AuditLog e o log de propostas continuam guardando o acréscimo. Só o documento esconde.

## 4. Invariantes

- **I1:** um PDF com `ajustePercent > 0` não pode conter "acréscimo", "Acréscimo", o percentual nem nenhum valor de tabela (unitário ou total) diferente do final. Isso fica protegido por teste.
- **I2:** o valor impresso é sempre o `valorTotalFinal`/`precoLicencaFinal`. A conta continua em `calculo.ts`, sem nenhuma mudança.
- **I3:** com desconto, o documento sai idêntico ao de hoje (teste de regressão).
- **I4:** `TEMPLATE_VERSAO` sobe, porque o texto fixo muda.

## 5. Risco

- **Propostas antigas com acréscimo.** Se já existir proposta emitida com acréscimo, baixar de novo pelo Portal gera o documento novo, sem o acréscimo. O preço é o mesmo; só a apresentação muda. O aviso de `templateVersao` diferente já cobre isso. **Conferir quantas existem antes do deploy.**

## 5-bis. Crítica da spec (16/09, antes de implementar)

- **K1: a linha de acréscimo não é o único vazamento.** Com acréscimo, `tabelaPlano` imprime "Valor unitário" = `precoLicenca` e "Valor total" = `valorTotal`, ambos **de tabela**. Esconder só as linhas de ajuste deixaria o cliente com dois preços diferentes na mesma tabela e a diferença fácil de calcular. **Correção:** com acréscimo, essas duas linhas passam a imprimir `precoLicencaFinal` e `valorTotalFinal`. I1 testa os valores de tabela, não só a palavra.
- **K2: há dois rodapés com "tabela vigente".** Um fica na página de investimento e o outro no resumo somado (`endpoints-a4.ts:548`). A v1 só citava o primeiro. Os dois mudam.
- **K3: não usar `temAjuste` como gatilho.** Ele é verdadeiro nos dois sentidos. Cria-se um predicado único, `mostraAjusteAoCliente(inv)` (verdadeiro só com desconto), usado nos três pontos do template. Assim um lugar esquecido não reabre o vazamento.
- **K4: futuro link público.** O link público da proposta (pendência 4 do PROGRESS) **não pode** expor `precoSnapshot` nem `ajustePercent` em JSON. Fica anotado como invariante para aquela feature; nada muda agora.
- **K5: a apresentação de soluções não imprime preço** (só cita os complementos). Está fora do escopo e foi conferido.

## 6. Escopo

- `src/lib/proposta/templates/endpoints-a4.ts`: `tabelaPlano`, `paginaInvestimento`, `paginaComplementos` e o rodapé do resumo.
- `src/app/dashboard/portal/proposta/page.tsx`: aviso na etapa de confirmação quando há acréscimo.
- `src/lib/proposta/__tests__/endpoints-a4.test.ts`: o teste `'acréscimo: rótulo "Acréscimo"…'` (linha 244) **inverte**. Entram mais um teste I1 e um I3.

Fora de escopo: a conta, o banco, a API, os complementos (eles não têm acréscimo).

## 7. Pronto quando

`npm run build && npx tsc --noEmit && npm test` verdes. PDF local com +10% passa no `pdftotext | grep -i acr` sem nenhum resultado. PDF com −25% idêntico ao de hoje.

## 8. Resultado (16/09)

- Desconto (−25%) e tabela cheia: HTML **idêntico** ao de antes da mudança (comparado byte a byte).
- +10%: `pdftotext | grep -ciE 'acr[eé]scimo|tabela vigente|10%'` = **0**; nenhum valor de tabela no texto do PDF.
- Propostas emitidas com acréscimo antes da mudança: **5** (DFZ-2026-02002, 02012, 02013 +5%; 02033 +25%; 02034 +20%). As emitidas antes do deploy mostraram o acréscimo ao cliente.
