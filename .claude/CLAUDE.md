# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Defenz — Gestao Estrategica de Atividades

> **Start every session by reading `docs/PROGRESS.md`** para recuperar estado. Antes de tocar código de uma feature, ler `docs/features/feature-<slug>.md` correspondente. README.md está desatualizado (Next.js 15 / SQLite / modelo "Activity") — fonte de verdade é este arquivo + `docs/`.

## Harness Workflow

1. Ler `docs/PROGRESS.md` — estado atual, próximos passos, blockers.
2. Nova feature → criar `docs/features/feature-<slug>.md` seguindo template do global CLAUDE.md, aprovar, então codar.
3. Implementar com TDD proporcional (um happy + um sad path, não matriz exaustiva).
4. Antes de "done": `npm run build && npx tsc --noEmit && npm test`.
5. Ao completar: status do feature → Done, append `docs/CHANGELOG.md`, update `docs/PROGRESS.md`, commit.
6. Referências de arquitetura: `docs/SPEC.md` (escopo), `docs/ARCHITECTURE.md` (ADRs).

## Stack

- **Runtime**: Next.js 16.1.6 (App Router, Turbopack), React 19.2.4, TypeScript 5
- **Styling**: Tailwind CSS 4, shadcn/ui (new-york), Plus Jakarta Sans + JetBrains Mono
- **Backend**: Next.js API Routes, Prisma 6.x, Zod v3
- **Database**: PostgreSQL (Neon) — pgbouncer obrigatorio
- **Auth**: NextAuth v4 (Credentials, JWT, roles: admin/gerencia/user)
- **AI**: Google Gemini (@google/generative-ai)
- **Email**: Resend + React Email
- **DnD**: @dnd-kit/core + sortable
- **Charts**: Recharts + SVG custom
- **State**: Zustand, TanStack Query, TanStack Table
- **Tests**: Vitest 4 + Testing Library
- **Deploy**: Vercel (auto-deploy push main)

## Regras Criticas

1. **Database**: SEMPRE `provider = "postgresql"`. NUNCA sqlite.
2. **Env vars**: `DATABASE_URL` com `pgbouncer=true`, `DIRECT_URL` sem pgbouncer.
3. **Pre-deploy**: `npm run build && npx tsc --noEmit && npm test` devem passar.
4. **.npmrc**: `legacy-peer-deps=true` (next-auth v4 vs Next 16).
5. **Audit**: Toda CRUD em Demanda grava AuditLog (`src/lib/audit.ts`).
6. **Tenant isolation**: `admin` vê tudo; `gerencia`/`user` são hard-scoped a `session.user.companyId`. Use `assertCompanyAccess()` em qualquer rota que toca dados scoped.
7. **Invite-only**: Registro via InviteToken criado por admin/gerencia.
8. **Tema**: Azure Shield (#3b82f6). Empresas customizam accent + logo via branding.

## Architecture Big Picture

- **Multi-tenant data flow**: Toda Demanda é scoped por `companyId`. Sessão JWT (`src/lib/auth-config.ts`) carrega `companyId`, `companyLogoUrl`, `companyAccentColor`, `teams[]`. Rotas filtram por `session.user.companyId`; apenas `admin` cruza empresas.
- **Auth + role gating**: `src/lib/auth.ts` expõe `getCurrentUser()`, `requireAuth()`, `assertCompanyAccess()`. Role check em route handlers e em `src/app/dashboard/layout.tsx` (nav).
- **API contract**: Todas as rotas usam `handleApiError` / `successResponse` / `ApiError` de `src/lib/api-helpers.ts` + schemas Zod em `src/lib/validations/`.
- **Audit pattern**: Mutações de Demanda → `createAuditLog()` + `diffChanges()`. Logs em `/dashboard/logs` (admin + gerencia scoped à própria company).
- **AI report pipeline**: `/api/report/executive` → `src/lib/ai/` (Gemini + prompts + Zod validation do JSON estruturado) → slides branded.
- **Invite-only**: `/register` valida `InviteToken` (role + company + teams). Sem signup aberto.
- **Cron**: `/api/cron/reminders` (diário 11:00 UTC) guardado por `CRON_SECRET`.

## Não-óbvio — onde procurar

- `src/lib/ai/` — Gemini service, prompts, types, validation, insight-mapper
- `src/lib/validations/` — Zod schemas (demanda, company, subtask, demanda-link, metrics)
- `src/test/mocks/` — prisma, next-server, auth mocks
- `src/test/fixtures/` — test data
- `prisma/schema.prisma` — Company, Team, UserTeam, User, Demanda, Subtask, DemandaLink, AuditLog, InviteToken, NotificationPreferences, EmailLog (+ Activity/CRM arquivados)

## Comandos

```bash
npm run dev                                           # Dev (Turbopack)
npm run build                                         # Build (inclui prisma generate)
npm test                                              # Vitest single-run
npm run test:watch                                    # Vitest watch
npm run test:coverage                                 # Coverage
npx vitest run src/lib/__tests__/auth.test.ts         # Arquivo único
npx vitest run -t "nome do teste"                     # Por nome
npx tsc --noEmit                                      # Type check
npx prisma validate | db push | generate | studio
npm run db:migrate                                    # Migration dev
npm run db:migrate:deploy                             # Migration prod
```

## Env Vars (ver .env.example)

```
DATABASE_URL        # Neon pooled (pgbouncer=true)
DIRECT_URL          # Neon direct
NEXTAUTH_URL        # http://localhost:3000 | https://defenz-todo.vercel.app
NEXTAUTH_SECRET     # openssl rand -base64 32
RESEND_API_KEY      # Resend (opcional)
EMAIL_FROM / EMAIL_FROM_NAME
GEMINI_API_KEY      # Executive report
ANTHROPIC_API_KEY   # Claude (insights arquivados)
CRON_SECRET         # Bearer para /api/cron/reminders
```

## Cron Jobs (vercel.json)

- `/api/cron/reminders` — diário 11:00 UTC. Envia emails para demandas com `reminderDate <= hoje`.

## Testes

- Vitest com globals. `jsdom` para `.test.tsx`, `node` para `.test.ts`.
- Mocks em `src/test/mocks/`, fixtures em `src/test/fixtures/`.
- Testes colocados em `__tests__/` ao lado do código.
- Teste proporcional: um happy + um sad path por endpoint/função, não matriz exaustiva.

## Agentes

Ver `.claude/agents/` — react-developer, database-architect, api-developer, deployment-specialist.
