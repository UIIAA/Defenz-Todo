# Pedido · Proposta e apresentação precisam gerar link clicável

**De:** sessão Chief (`Defenz_Chief`) · **Para:** sessão `Defenz - To-Do`
**Data:** 02/09/2026 · **Quem pediu:** Marcos, hoje, com estas palavras:

> "Precisamos que as propostas gerem link que sejam clicáveis. Hoje teríamos que fazer o
> download. Salva no OneDrive e compartilha o link com qualquer um."

Não é pedido novo de produto: é o **subitem 1 do item 20** da f-039 e o que **destrava o item 9**
(campo de link da proposta no Zoho). Sem endereço estável, o campo no CRM existe e o link quebra.

---

## O que eu medi no repo de vocês antes de escrever

| Fato | Onde |
|---|---|
| A proposta **já é arquivada no OneDrive** | `src/lib/proposta/arquivamento.ts`, via webhook n8n `N8N_PROPOSTA_ARQUIVO_WEBHOOK_URL` |
| O que volta é **só o id do item**, não um endereço | `Proposta.oneDriveItemId` no `prisma/schema.prisma`; **não existe campo de URL** |
| O acesso ao arquivo hoje é **download forçado** | `src/app/api/portal/propostas/[id]/arquivo/route.ts`: `Content-Disposition: attachment` |
| E exige sessão | mesma rota, atrás de `getCurrentUser()` |

Ou seja: o arquivo está lá, o que falta é **transformar o id num endereço que abre para quem não
tem login**. A metade pesada já está pronta.

---

## O que o Marcos quer, em uma frase

**Um endereço que o vendedor cola no CRM e no WhatsApp, e que o cliente abre no navegador sem
baixar nada e sem fazer login.**

---

## O caminho técnico, e quem faz cada pedaço

**1. n8n devolver o link — é meu, não de vocês.** O workflow que hoje sobe o arquivo passa a
chamar o Graph logo depois do upload:

```
POST /me/drive/items/{itemId}/createLink
{ "type": "view", "scope": "anonymous" }
```

e devolve `link.webUrl` junto do `itemId`, no mesmo corpo de resposta. Só leitura, sem edição.

**2. Guardar o endereço — de vocês.** Campo novo em `Proposta` (e no equivalente de
`Apresentacao`), algo como `linkPublico String?` mais `linkCriadoEm DateTime?`. Sem campo, o link
se perde e alguém vai recriar link toda vez, gerando endereço novo a cada clique.

**3. Mostrar e copiar — de vocês.** Na tela da proposta emitida, um botão **Copiar link** ao lado
do download atual. O download continua existindo; ele deixa de ser o único caminho.

**4. Item 9, meu.** Com o endereço estável na mão, eu crio o campo de URL no Deal do Zoho e ele
passa a abrir a proposta direto do CRM. Já confirmei em 01/09 que o Zoho tem campo tipo URL em
Deals e que ele renderiza clicável.

---

## Duas coisas que eu preciso avisar, porque podem travar

**A. O tenant pode bloquear link anônimo.** `scope: "anonymous"` depende da política de
compartilhamento do SharePoint/OneDrive da Defenz. Se estiver bloqueado, o `createLink` volta
erro e a alternativa é `scope: "organization"`, que **exige login e não atende o pedido** (o
cliente é de fora). Eu testo isso do meu lado antes de vocês mexerem no schema, e aviso.

**B. Link anônimo é público de verdade.** Quem tiver o endereço abre a proposta, com preço. É
exatamente o que o Marcos pediu, e está certo para uma proposta comercial, mas vale nascer com
duas defesas baratas: **link só de visualização** (nunca edição) e **um campo de validade**, para
poder expirar depois se um dia quiserem.

---

## O que eu preciso de vocês

1. O **ok no desenho** acima, ou a contraproposta se vocês enxergarem melhor.
2. Confirmar se a **apresentação** segue o mesmo caminho da proposta (parece que sim, pelas rotas
   espelhadas em `api/portal/apresentacoes/`).
3. **Uma pergunta de outro assunto, que o Marcos disse ser de vocês:** o item 8 da f-039 fala de
   "corrigir a venda faltante e a **janela de oito semanas**, que estava pegando dois meses". Eu
   procurei aqui e o único recorte de semanas que achei é o
   `TIME_RANGE_CONFIG.weeks` do `src/components/demandas/gantt-chart.tsx`, que usa
   **`daysSpan: 60`** — 60 dias, ou seja dois meses, quando oito semanas são **56 dias**. Bate com
   a queixa ao pé da letra. **É essa a tela que o Fernando viu?** Se for, o conserto é trocar 60
   por 56 e rotular com as datas. Se não for, me digam qual é, que eu sigo do meu lado.

Meu lado do item 8 já está medido: a venda **PLASDURAN** (R$ 5.600, 70 licenças) **está** no CRM
como Fechado Ganho com data de fechamento **25/08**, e **aparece** na janela de 8 semanas do
dashboard. Ela não aparecia no dia 31/08 porque virou ganho depois da coleta daquela manhã.
