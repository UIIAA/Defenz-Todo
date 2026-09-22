# feature-addons-quantidade-propria

**Status:** APROVADA e IMPLEMENTADA (22/09/2026)
**Origem:** "quero gerar proposta só de add-ons; 400 licenças Enterprise e 550 sensores
de Produtividade" (Marcos, 22/09/2026)

## 1. O que a documentação da Bitdefender responde

Duas perguntas foram feitas à fonte oficial, não ao meu palpite.

### ✅ Quantidade própria por add-on: PODE, e é assim que a Bitdefender vende

> "GravityZone XDR allows choosing the right coverage and visibility for our customers,
> by combining GravityZone Business Security Enterprise and **a separately purchasable
> add-on for each sensor category** (Network, Identity, Cloud, Productivity Apps)."
> — Bitdefender, FAQ da página oficial do GravityZone XDR

Cada sensor é **SKU próprio, com chave de licença própria** (o Productivity Apps Sensor
é listado em distribuidor como "subscription license (1 year) — 1 license", SKU
`3116ZZBEN120GLZZ`). O mesmo vale para os módulos GravityZone: *"Patch Management is an
add-on available with a **separate license key** for all available GravityZone packages."*

E mais: para o sensor de **Produtividade**, quantidade diferente do parque é o caso
NORMAL, não a exceção — ele licencia usuários de Microsoft 365 / Google Workspace, e
quase toda empresa tem mais gente com e-mail do que com máquina gerenciada. **400
endpoints + 550 caixas é o formato certo do pedido, não um desvio dele.**

### ⚠️ Proposta só de add-ons: PODE, mas com uma condição que o papel tem de dizer

Os sensores XDR **exigem o GravityZone Business Security Enterprise como base**. Um
sensor sozinho não se ativa.

Isso NÃO impede a proposta só de add-ons — impede a proposta só de add-ons **para quem
não tem a base**. O caso legítimo e comum é o upsell no meio do contrato: o cliente já
comprou Enterprise, e agora leva os sensores. Aí a proposta é só dos add-ons, e está
certa.

O que não pode é o documento ficar calado sobre isso. Proposta de sensor sem base, sem
dizer de onde vem a base, vende algo que o cliente não consegue ligar.

### 🔴 Achado não pedido: sensor XDR exige ENTERPRISE, e hoje nada impede o contrário

A tabela de comparação oficial da Bitdefender é explícita: **Business Security Premium
NÃO suporta os sensores XDR.** Eles são add-on do Enterprise.

Hoje o formulário deixa marcar `Business Security` ou `Premium` + qualquer sensor XDR e
emite a proposta. **Seria uma proposta de uma combinação que não existe.**

Conferi as 61 propostas emitidas: **nenhuma caiu nisso** — as três com sensor XDR
(02029 HM Engenharia, 02030 e 02032 ABGF) têm Enterprise. O risco é real e ainda não
cobrado; a sorte é que ainda não foi.

## 2. O que muda

### F1 · Quantidade própria por add-on

`quantidadesComplemento: Record<ComplementoId, number>` no payload, espelhando o que
`descontosComplemento` já faz (17/09). Ausente = usa a quantidade do principal, que é o
comportamento de hoje — **payload antigo continua idêntico.**

Na tela, um campo de quantidade ao lado do campo de desconto, em branco por padrão
("mesma do principal").

O documento passa a imprimir a quantidade DE CADA bloco. Hoje a página de complementos
diz "pelas mesmas N licenças" — frase que vira mentira no instante em que as
quantidades divergem, e é a mesma classe de defeito do "faixa 500-999" de ontem.

### F2 · Proposta só de add-ons

`planos` passa a aceitar lista vazia **quando houver ao menos um complemento**. Sem
plano e sem complemento continua sendo erro.

Sem plano, o documento não tem página de investimento do GravityZone — abre direto nos
complementos, e o resumo soma só o que existe.

### F3 · Nota de pré-requisito, fixa e automática (D1)

Quando há sensor XDR na proposta **e não há Enterprise nela**, o documento imprime:

> Os sensores XDR são complementos do **Bitdefender GravityZone Business Security
> Enterprise** e exigem essa base ativa no cliente, contratada nesta proposta ou já em
> vigor.

Quando há módulo GravityZone (Patch, Criptografia, PHASR) numa proposta **sem plano
nenhum**, a nota equivalente para a base de qualquer linha.

Sai dos dados, não de texto fixo: **some sozinha** quando a base está na própria
proposta.

### F4 · Aviso na tela, não bloqueio (D2)

O Marcos decidiu mandar **a base em proposta separada para o mesmo cliente**. Logo o
guarda não pode ser bloqueio: a base existe, só não está NAQUELE papel. Bloquear pela
ausência do Enterprise no documento reprovaria o fluxo real de venda.

Fica: aviso âmbar na tela de confirmação (mesmo padrão do acréscimo oculto) + a nota
impressa do F3. O aviso pega de quebra o caso perigoso de verdade — **Premium + sensor
XDR**, combinação que a Bitdefender não vende.

## 3. Decisões tomadas

| # | Decisão do Marcos |
|---|---|
| D1 | Frase fixa automática (não campo digitado) |
| D2 | Base vai em **proposta separada** para o mesmo cliente → avisa, não bloqueia |
| D3 | Campo de quantidade por item; em branco = a mesma do principal |

## 4. Fora de escopo, e por quê

- **Preço por faixa do add-on**: nenhum complemento escalona por quantidade — todos têm
  preço único. Quantidade própria só multiplica.
- **Resumo consolidado na proposta só de add-ons**: o consolidado responde "quanto custa
  a solução que escolhi" somando UM plano principal com os complementos. Sem plano não
  há o que consolidar, então a página de resumo não existe e os preços ficam nas páginas
  de complemento.

## 5. Compatibilidade

- `quantidadesComplemento` e `planos: []` são ambos **opcionais / novos**. Payload antigo
  produz documento byte a byte igual — as frases novas saem dos dados e só aparecem
  quando alguma quantidade diverge ou falta a base.
- Reimpressão pelo `/arquivo` lê `complementosSnapshot`, que agora carrega `quantidade`
  por bloco. Snapshot antigo não tem o campo; o template usa `c.quantidade`, que vem
  `undefined` — **verificar no teste de reimpressão** (ver §7).

## 6. Conferência no acervo (22/09)

61 propostas emitidas. Três têm sensor XDR — 02029 (HM Engenharia, 550), 02030 e 02032
(ABGF, 130) — e **todas as três têm Enterprise**. Nenhuma proposta inválida saiu. O
achado do Premium era risco real e ainda não cobrado.

## 7. O risco que a própria spec revelou (e que já foi fechado)

Escrever o §5 expôs um defeito que teria ido a produção: **snapshot anterior a esta
feature não tem `quantidade` por bloco**, e o template passou a ler dela. O
re-download das propostas já emitidas com complemento imprimiria `undefined licenças`
e ainda alegaria "pela quantidade indicada em cada bloco" numa proposta em que nada
divergia.

É a mesma classe do achado C1 de 02/09, em que o `/arquivo` rebaixava a proposta no
re-download. O conserto é o mesmo padrão já usado para `v.rotulo`: preencher a
quantidade faltante com a do principal, num ponto só, na entrada do render. Com teste
que simula o snapshot velho.
