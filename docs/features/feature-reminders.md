# Feature: Lembretes de Demandas
**Status:** Draft
**Priority:** P1
**Date:** 2026-04-01

## Objetivo
Permitir que o usuario defina uma data de lembrete em qualquer demanda. No dia do lembrete, o sistema envia email e destaca visualmente a demanda no kanban (efeito shake + badge visual persistente).

## Comportamento
1. No DemandaModal, campo "Lembrete" (date picker) ao lado do Prazo
2. Ao definir lembrete, a data fica salva na demanda
3. No dia do lembrete (cron diario as 08:00 BRT):
   - Envia email para o assignee (ou criador se sem assignee) com titulo e link
   - Marca a demanda como `reminderSent = true`
4. No Kanban, demandas com lembrete para hoje (ou atrasado nao enviado) exibem:
   - Badge de sino pulsando no card
   - Auto-highlight (shake) ao carregar a pagina
5. Usuario pode limpar o lembrete a qualquer momento

## Regras de Negocio
- Lembrete so pode ser data futura ou hoje
- Uma demanda so pode ter 1 lembrete por vez
- Lembrete so se aplica a demandas nao concluidas
- Email respeita quiet hours e preferencias do usuario (infraestrutura existente)
- Apos envio, `reminderSent = true` — nao reenvia
- Se usuario muda a data do lembrete, reseta `reminderSent = false`
- Demandas concluidas: lembrete ignorado (nao envia, nao destaca)

## Data Contract

### Campos novos no Demanda (schema.prisma)
```prisma
reminderDate  DateTime?  // Data do lembrete
reminderSent  Boolean    @default(false)  // Ja enviou?
```

### Novo emailType
- `reminder` adicionado ao enum de EmailLog e sendEmail

### API Cron
- `GET /api/cron/reminders` — protegido por CRON_SECRET header
- Busca demandas com reminderDate <= hoje, reminderSent = false, status != concluida
- Envia emails e marca reminderSent = true

### vercel.json (novo)
```json
{
  "crons": [{
    "path": "/api/cron/reminders",
    "schedule": "0 11 * * *"
  }]
}
```
(11:00 UTC = 08:00 BRT)

## Criterios de Aceitacao
- [ ] Campo reminderDate no schema.prisma
- [ ] Date picker "Lembrete" no DemandaModal
- [ ] Badge de sino no KanbanCard quando lembrete e hoje
- [ ] Auto-shake em cards com lembrete do dia ao carregar pagina
- [ ] Cron job /api/cron/reminders funcional
- [ ] Email de lembrete enviado com Resend
- [ ] reminderSent resetado ao mudar data
- [ ] vercel.json com schedule configurado
- [ ] Testes para validacao e cron logic

## Decisoes Tecnicas
- Reusar infraestrutura de email existente (src/lib/email.ts + Resend)
- Reusar animacao highlight-shake existente (globals.css)
- Cron via Vercel Cron Jobs (vercel.json)
- Email template simples com React Email (inline, sem arquivo separado por ora)
- CRON_SECRET para proteger endpoint

## Dependencias
- Depende de: Demanda model, email.ts, Resend config
- Bloqueia: nada
