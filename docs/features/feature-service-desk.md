# Feature: Menu "Service Desk" (tickets) — integrado ao Kanban Defenz
**Status:** Draft (ideia — REQUER brainstorming profundo antes de qualquer código)
**Priority:** P2
**Date:** 2026-06-24

## Objective
Uma ferramenta de **Service Desk** própria da Defenz: abrir/triar/resolver **tickets**, entender as demandas que chegam, e — ponto central pedido pelo Marcos — **vincular onde couber ao Kanban de Demandas que já existe**, sem duplicar o trabalho.

## A pergunta central: como Ticket se relaciona com Demanda?
O Kanban atual (`Demanda`) é o **trabalho interno** do time. Um Service Desk adiciona a camada de **entrada/atendimento** (quem pediu, SLA, canal, status de atendimento). A decisão de arquitetura é como ligar os dois. Três abordagens:

### Opção A — Ticket = Demanda (mesma entidade, novo tipo)
Um ticket é uma `Demanda` com um marcador (ex.: `origin: 'ticket'` ou novo `type`). Reusa Kanban, audit, horas, subtarefas, multi-tenant inteiros.
- ✅ Mínimo esforço; tudo que já existe (board, diário de horas, subtarefas, MCP) funciona de graça.
- ❌ Mistura atendimento externo com trabalho interno no mesmo board; faltam campos de ticket (solicitante externo, SLA, canal); difícil ter intake público.

### Opção B — Ticket como entidade separada, ligada a Demanda(s)
Novo modelo `Ticket` (requester, assunto, canal, prioridade/SLA, status próprio: aberto→triagem→em atendimento→resolvido→fechado) com vínculo opcional a uma ou mais `Demanda` (o trabalho interno gerado).
- ✅ Separação limpa: ticket = visão do cliente/SLA; Demanda = execução interna. Permite intake externo (e-mail/portal) depois.
- ❌ Mais para construir (modelo, rotas, UI, ciclo de vida próprio, relatórios).

### Opção C — Híbrido (intake leve → vira/linka Demanda) [lean inicial]
Ticket é uma **entrada leve**; ao ser aceito, **cria ou linka uma Demanda** que toca a execução. Ticket guarda SLA/solicitante/canal; Demanda toca o board/horas.
- ✅ Equilíbrio: SLA e atendimento separados, mas execução reaproveita 100% do Kanban (horas, subtarefas, MCP).
- ❌ Define-se a "fronteira" (o que vive no ticket x na demanda) — precisa de regras claras.

## Perguntas abertas (brainstorming)
- **Quem abre ticket?** Interno (time registra demandas que chegam) vs **externo** (cliente por portal/e-mail). Marcos disse "para desenvolvermos, abrir ticket, entender as demandas" → começa **interno**; intake externo (e-mail→ticket) como fase 2.
- **Campos de ticket:** solicitante (reusar `client`?), canal (e-mail/WhatsApp/telefone/chat), SLA/prazo de resposta, severidade, categoria.
- **Ciclo de vida:** status de ticket são os mesmos do Kanban (`solicitada…concluida`) ou um conjunto próprio (aberto/triagem/atendimento/resolvido/fechado)?
- **Vínculo:** 1 ticket → 1 Demanda? 1 ticket → N Demandas? Reusar `DemandaLink`/dependências?
- **Multi-tenant:** tickets scoped por empresa como Demandas (`assertCompanyAccess`).
- **Integrações:** intake por e-mail (Resend já está no projeto), MCP (criar/mover ticket via Claude), e o `Defenz_Chief` (MSSP) — há sobreposição com o mundo de tickets de suporte Bitdefender? Avaliar.
- **Métricas:** tempo de resolução, SLA cumprido, volume por canal/cliente — relatórios.

## Recomendação inicial (a validar)
Começar pela **Opção C (híbrido)**, fase 1 **interna**: modelo `Ticket` enxuto (requester/cliente, canal, severidade, SLA, status próprio) + botão "gerar Demanda a partir do ticket" (linka 1:1, herda empresa/cliente). Assim o atendimento ganha sua camada sem poluir o board, e a execução continua no Kanban + diário de horas + MCP que já existem.

## Dependencies
- Forte acoplamento conceitual com `Demanda` (o vínculo é o coração da feature).
- Reaproveita: multi-tenant (`auth.ts`), audit, diário de horas, MCP.
- Possível overlap com `Defenz_Chief` (suporte Bitdefender) — alinhar escopo antes.
