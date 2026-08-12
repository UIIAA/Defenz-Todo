# SPEC — Defenz To-Do

> ⚠️ **SUPERSEDIDO por [`SPEC-MAE.md`](SPEC-MAE.md)** (agosto/2026), que cobre o produto
> inteiro — Demandas, Service Desk e Portal Defenz. Este arquivo é o escopo de abril,
> quando o produto era só Demandas. Mantido como histórico; **não use para decidir nada.**


**Version:** 0.2.0
**Last updated:** 2026-04-11

## Purpose
Plataforma de gestão estratégica de atividades (Demandas) para times executivos. Multi-tenant (Company > Team), com Kanban/Gantt/List views, auditoria completa, reminders por email, e relatório executivo com IA.

## Users / Roles
- **admin** — acesso total, cross-company. Administra empresas, equipes, usuários, convites, configurações.
- **gerencia** (diretoria) — acesso total dentro da sua própria company. Vê todas as equipes da company, audit logs da company, gerencia usuários/invites da company. NÃO vê outras empresas.
- **user** — acesso às demandas das equipes às quais pertence. Edita o próprio trabalho e o do time.

## Core Modules (ativos)
- **Demandas** — CRUD, subtasks, links, import, Kanban/Gantt/List, filtros, WIP limits, blocked lane
- **Companies / Teams** — hierarquia multi-tenant, branding (logo + accent color)
- **Users / Invites** — invite-only via InviteToken (carrega role + company + teams)
- **Audit log** — toda mutação de Demanda é logada
- **Notifications** — email via Resend, preferências por usuário, reminders diários via cron
- **Executive Report** — relatório IA (Gemini) com slides estruturados para demandas concluídas
- **Analytics** — charts e métricas (admin/gerencia)

## Archived / Out-of-scope
- CRM (Clients, Opportunities, Interactions) — schema presente mas UI arquivada
- Métricas M&A — arquivado
- AI Insights avançados (além do executive report) — arquivado
- Push notifications, webhooks, mobile app, PDF export — backlog, sem ETA

## Non-functional constraints
- **Database**: PostgreSQL (Neon) only. Nunca SQLite.
- **Vercel**: pgbouncer obrigatório em `DATABASE_URL`; `DIRECT_URL` sem pgbouncer para migrations.
- **Auth**: NextAuth v4 + JWT. Invite-only (sem registro aberto).
- **Tenant isolation**: gerencia/user são hard-scoped a `session.user.companyId`. Qualquer rota que lista ou muta entidades scoped deve aplicar filtro.
- **Audit**: toda mutação CRUD em Demanda → AuditLog obrigatório.
- **Pre-deploy**: `npm run build && npx tsc --noEmit && npm test`.

## Success criteria (qualitative)
- Um admin consegue provisionar uma empresa nova (company + branding + invite inicial) em menos de 5 minutos.
- Um gerencia de Defenz nunca vê dado de outra empresa, em nenhuma view ou endpoint.
- Um user consegue abrir, atualizar status e fechar uma demanda sem ler documentação.
- Relatório executivo gera em menos de 30 segundos para uma demanda típica.
