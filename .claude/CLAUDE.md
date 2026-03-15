# Defenz - Gestao Estrategica de Atividades

## Stack

- **Runtime**: Next.js 16.1.6 (App Router, Turbopack), React 19.2.4, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui (new-york style), Plus Jakarta Sans + JetBrains Mono
- **Backend**: Next.js API Routes, Prisma ORM 6.x, Zod v3.x
- **Database**: PostgreSQL (Neon DB) — pgbouncer obrigatorio para Vercel
- **Auth**: NextAuth.js v4 (CredentialsProvider, JWT sessions, roles: user/admin/gerencia)
- **Deploy**: Vercel (auto-deploy on push to main)
- **Tests**: Vitest + Testing Library (69 testes)

## Regras Criticas

1. **Database**: SEMPRE `provider = "postgresql"` no schema.prisma. NUNCA sqlite.
2. **Env vars**: `DATABASE_URL` com `pgbouncer=true`, `DIRECT_URL` sem pgbouncer.
3. **Pre-deploy**: `npm run build && npx tsc --noEmit && npm test` devem passar.
4. **.npmrc**: `legacy-peer-deps=true` necessario (next-auth v4 nao suporta Next 16 peer dep).
5. **Audit**: Toda operacao CRUD em Demanda deve gravar AuditLog.
6. **Tema visual**: Azure Shield — azul como cor primaria, nunca vermelho como accent de marca.

## Estrutura Atual

```
src/
  app/
    page.tsx                    # Login
    register/page.tsx           # Registro
    dashboard/
      page.tsx                  # Redirect
      layout.tsx                # Sidebar + header (role-aware)
      demandas/
        page.tsx                # Kanban + Gantt
        helpers.ts              # Types, constants
        analises/page.tsx       # Charts e metricas
      logs/page.tsx             # Audit logs (admin/gerencia only)
    api/
      auth/                     # NextAuth + register
      demandas/                 # CRUD + import (com audit logging)
      audit-logs/               # GET logs (admin/gerencia only)
      health/                   # Health check
  components/
    defenz-logo.tsx             # SVG logo component
    ui/                         # shadcn/ui
  lib/
    auth.ts                     # getCurrentUser(), requireAuth()
    auth-config.ts              # NextAuth options (JWT, role in session)
    audit.ts                    # createAuditLog(), diffChanges()
    api-helpers.ts              # handleApiError, successResponse, ApiError
    db.ts                       # Prisma client
    db-utils.ts                 # caseInsensitiveSearch()
    validations/                # Zod schemas
  types/
    next-auth.d.ts              # User with id + role, Session extension
prisma/
  schema.prisma                 # User, Demanda (version field), AuditLog, Activity...
```

## Comandos

```bash
npm run dev                     # Dev server (Turbopack)
npm run build                   # Build producao
npm test                        # Vitest (69 testes)
npx tsc --noEmit                # Type check
npx prisma validate             # Validar schema
npx prisma db push              # Sync schema com DB
npx prisma generate             # Gerar client
npx prisma studio               # UI do banco
```

## Env Vars (ver .env.example)

```
DATABASE_URL    # Neon pooled (pgbouncer=true)
DIRECT_URL      # Neon direct (sem pgbouncer)
NEXTAUTH_URL    # http://localhost:3000 | https://defenz-todo.vercel.app
NEXTAUTH_SECRET # openssl rand -base64 32
```

## Agentes (.claude/agents/)

- **react-developer**: Componentes React, TypeScript, Tailwind
- **database-architect**: Prisma, PostgreSQL, Neon, migrations
- **api-developer**: Route handlers, Zod, error handling
- **deployment-specialist**: Vercel, CI/CD, monitoring
