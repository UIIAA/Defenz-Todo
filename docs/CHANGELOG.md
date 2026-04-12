# CHANGELOG

Formato: semver. Entradas mais recentes primeiro.

## [Unreleased]
### Security
- **Tenant isolation fix (P0)**: gerencia/user agora são hard-scoped a `session.user.companyId`. Apenas admin cruza empresas. Corrigido em 6 rotas: `demandas/[id]/links`, `demandas/[id]/links/[linkId]`, `demandas/[id]/subtasks`, `demandas/[id]/subtasks/[subtaskId]`, `users`, `invites`, `audit-logs`. Helper central `assertCompanyAccess()` em `src/lib/auth.ts`.
- `company-selector` agora só renderiza para `admin`.

### Added
- Harness spec-driven structure: `docs/PROGRESS.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md`, `docs/CHANGELOG.md`
- Feature spec `docs/features/feature-tenant-isolation.md` (P0)
- Helpers `isAdmin()`, `assertCompanyAccess()`, `companyScopeWhere()` em `src/lib/auth.ts`
- 10 novos testes cobrindo tenant isolation (289 total passando)

### Changed
- `.claude/CLAUDE.md` reescrito como mapa para `docs/` (enxuto, ~120 linhas)

---

## [0.2.0] - 2026-04-05
### Added
- Relatório executivo branded slide-based com JSON estruturado via Gemini (1c3787c)
- Relatório executivo IA para demandas concluídas (9f1e553)
- Reminder de demandas com notificação por email + alertas visuais (ad8f7c1)
- Links em demandas, CRUD de empresas na UI, permissões de navegação por role (c8ed653)
- Hierarquia multi-tenant Company > Team com branding (logo + accent color) (eebe6e9)
- Datas de lifecycle no modal e cards do Kanban (54ebad2)
- Barra de filtros compacta com dropdowns (9b3b77a)
- Filtro de classificação, filtro de período, timezone fix (8786afb)

### Fixed
- Login e registro case-insensitive (39e19fb)

---

## [0.1.x] - 2026-01 a 2026-03
### Added
- Layout responsivo, suporte PWA, password reset, double-click protection (25ad4eb)
- Campo de classificação, revoke invites, user management, bugfix do modal + Prisma sync (4554e05)
- Kanban v2: 5 features (contrast, timeline click, WIP per user, blocked lane, gray tone) (60dcd20)
- Link Home na sidebar + transições suaves (dec1543)
- Registro invite-only + dropdown de assignee + admin user management (c916249)
- Shared team board — todos os users veem todas as demandas (b14a5ce)
- Enterprise polish — 3 sprints (5f31076)
- Profile page com preferências de notificação + integração Resend (9e5e8d4)
- Kanban/Timeline colapsáveis + scroll para 50+ demandas (d48b305)
- Memphis Corporate redesign do dashboard (b4dae19)

### Fixed
- Dropdown com texto invisível em light mode (a8ea9be)
