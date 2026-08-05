# Portal Defenz — F1 (Fundação POPs) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a aba POPs do Portal Defenz — a equipe escreve, busca, lê e verifica procedimentos em markdown dentro do To-Do, com sinal de frescor e isolamento multi-tenant.

**Architecture:** Um modelo Prisma `Playbook` (discriminador `kind`, MVP só usa `POP`) escopado por um helper novo `scopedPlaybookWhere(user, extra)` que faz merge com `AND` — nunca espalhado pelo caller. Rotas em `/api/portal/*` seguindo o padrão do repo (`resolveActor` → Zod → `db` → `createAuditLog` → `successResponse`/`handleApiError`). Render de markdown por `react-markdown` com `urlTransform` allowlist, sem HTML cru e sem DOMPurify no caminho de render.

**Tech Stack:** Next.js 16 (App Router), Prisma 6 + Postgres (Neon), Zod v3, Vitest 4 + Testing Library, `react-markdown@10` + `remark-gfm@4` (já no `package.json`, zero uso em `src/` até aqui).

**Spec:** `docs/features/feature-portal-defenz.md` (v2) · **Revisão:** `docs/features/feature-portal-defenz-review.md`

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `prisma/schema.prisma` (modificar) | `enum PlaybookKind` + `model Playbook` + back-relations em `Company` e `User` |
| `src/lib/playbook-scope.ts` (criar) | `scopedPlaybookWhere(user, extra)` — o único ponto de escopo multi-tenant |
| `src/lib/playbook-freshness.ts` (criar) | `freshnessOf(playbook)` + `nextReviewDueAt(intervalDays, from)` — puro, sem I/O |
| `src/lib/validations/playbook.ts` (criar) | Zod: create/update + refinamento sobre estado **mergeado** |
| `src/app/api/portal/playbooks/route.ts` (criar) | GET (listar/buscar) + POST (criar) |
| `src/app/api/portal/playbooks/[id]/route.ts` (criar) | GET + PUT (editou-sem-ser-dono) + DELETE (soft) |
| `src/app/api/portal/playbooks/[id]/verify/route.ts` (criar) | POST verificar |
| `src/components/portal/portal-markdown.tsx` (criar) | Render seguro de markdown + fallback de imagem quebrada |
| `src/components/portal/freshness-badge.tsx` (criar) | Badge dos 3 estados |
| `src/app/dashboard/portal/page.tsx` (criar) | Aba POPs: busca + lista |
| `src/app/dashboard/portal/pops/[id]/page.tsx` (criar) | Leitura + botão Verificar |
| `src/app/dashboard/portal/pops/[id]/editar/page.tsx` (criar) | Editor (admin/gerência) |
| `src/app/dashboard/layout.tsx` (modificar) | Item de nav "Portal Defenz" |
| `src/app/api/cron/reminders/route.ts` (modificar) | Passo de frescor isolado em try/catch |
| `public/sw.js` (modificar) | Bump de `CACHE_NAME` (invariante §9.8) |
| `src/test/mocks/prisma.ts` (modificar) | Adicionar `playbook` ao mock |

---

## Task 0: Smoke test do hotlink do Drive (R1) — **antes de qualquer código**

Decide se `body` guarda URL do Drive direto ou se a F1 precisa nascer com `/api/portal/image-proxy`. Custa cinco minutos e zero código.

**Files:** nenhum.

- [ ] **Step 1: Subir uma imagem de teste no Drive**

Suba qualquer PNG numa pasta do Drive da Defenz e marque como "Qualquer pessoa com o link — leitor". Copie o link (formato `https://drive.google.com/file/d/<ID>/view?usp=sharing`).

- [ ] **Step 2: Testar o render direto em `<img>`**

Crie `/tmp/hotlink.html` com as duas variantes conhecidas e abra no navegador:

```html
<p>1. uc?export=view</p>
<img src="https://drive.google.com/uc?export=view&id=<ID>" width="300" onerror="this.insertAdjacentText('afterend','FALHOU')">
<p>2. thumbnail</p>
<img src="https://drive.google.com/thumbnail?id=<ID>&sz=w1000" width="300" onerror="this.insertAdjacentText('afterend','FALHOU')">
```

- [ ] **Step 3: Registrar o resultado na spec**

Se **alguma** variante renderizar: anotar em `docs/features/feature-portal-defenz.md` §11 R1 qual formato é o oficial, e seguir o plano como está.
Se **as duas** falharem: anotar "R1 CONFIRMADO — hotlink bloqueado" e **adicionar** ao plano a Task 8b (`/api/portal/image-proxy`: rota que recebe `?src=`, valida que o host é `drive.google.com`, faz fetch server-side e devolve o binário com `Cache-Control`). Não pule esse registro — é o que impede a próxima sessão de redescobrir.

- [ ] **Step 4: Commit do registro**

```bash
git add docs/features/feature-portal-defenz.md
git commit -m "docs(portal): registra resultado do smoke test R1 (hotlink Drive)"
```

---

## Task 1: Schema Prisma

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/test/mocks/prisma.ts`

- [ ] **Step 1: Adicionar o enum e o model no fim do schema**

```prisma
enum PlaybookKind {
  POP
  BIBLIOTECA
}

model Playbook {
  id           String       @id @default(cuid())
  kind         PlaybookKind @default(POP)
  title        String
  body         String
  externalUrl  String?
  isArchived   Boolean      @default(false)
  tags         String[]     @default([])

  companyId    String?
  company      Company?  @relation(fields: [companyId], references: [id], onDelete: Restrict)

  ownerId            String?
  owner              User?     @relation("PlaybookOwner", fields: [ownerId], references: [id], onDelete: SetNull)
  verifiedAt         DateTime?
  verifiedById       String?
  verifiedBy         User?     @relation("PlaybookVerifier", fields: [verifiedById], references: [id], onDelete: SetNull)
  reviewIntervalDays Int?      @default(90)
  reviewDueAt        DateTime?
  reviewReminderSent Boolean   @default(false)

  createdById  String?
  createdBy    User?     @relation("PlaybookCreator", fields: [createdById], references: [id], onDelete: SetNull)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([companyId, isArchived])
  @@index([kind, isArchived])
  @@index([ownerId])
  @@index([reviewDueAt, reviewReminderSent])
  @@map("playbooks")
}
```

- [ ] **Step 2: Adicionar as back-relations (sem isso `prisma validate` falha)**

Em `model Company`, depois de `authorizedClients`:

```prisma
  playbooks         Playbook[]
```

Em `model User`, depois de `ticketMessages`:

```prisma
  playbooksOwned    Playbook[]               @relation("PlaybookOwner")
  playbooksVerified Playbook[]               @relation("PlaybookVerifier")
  playbooksCreated  Playbook[]               @relation("PlaybookCreator")
```

- [ ] **Step 3: Validar e gerar**

Run: `npx prisma validate && npx prisma generate`
Expected: `The schema at prisma/schema.prisma is valid` e `Generated Prisma Client`.

- [ ] **Step 4: Adicionar `playbook` ao mock de testes**

Em `src/test/mocks/prisma.ts`, dentro de `mockDb`:

```ts
  playbook: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
```

- [ ] **Step 5: Aplicar no banco**

⚠️ **dev = prod (ADR-008): isto atinge produção.** É aditivo (tabela nova), então é seguro.

Run: `npx prisma db push`
Expected: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma src/test/mocks/prisma.ts
git commit -m "feat(portal): modelo Playbook (kind POP/BIBLIOTECA) + frescor"
```

---

## Task 2: Helper de escopo multi-tenant

O achado C3 da revisão: um helper que devolve `{ OR: [...] }` para o caller espalhar é vazamento esperando acontecer — qualquer filtro com `OR` (a busca!) sobrescreve o escopo.

**Files:**
- Create: `src/lib/playbook-scope.ts`
- Test: `src/lib/__tests__/playbook-scope.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { describe, it, expect } from 'vitest'
import { scopedPlaybookWhere } from '../playbook-scope'

const userA = { id: 'u1', role: 'user', companyId: 'A', companyIds: [] }
const admin = { id: 'u0', role: 'admin', companyId: 'A', companyIds: [] }

describe('scopedPlaybookWhere', () => {
  it('usuário vê a própria empresa + globais (companyId null)', () => {
    const where = scopedPlaybookWhere(userA)
    expect(where).toEqual({
      AND: [{ OR: [{ companyId: 'A' }, { companyId: null }] }, {}],
    })
  })

  it('admin não é filtrado', () => {
    expect(scopedPlaybookWhere(admin, { isArchived: false })).toEqual({ isArchived: false })
  })

  it('filtro com OR próprio NÃO engole o escopo', () => {
    const busca = { OR: [{ title: { contains: 'bm' } }, { body: { contains: 'bm' } }] }
    const where = scopedPlaybookWhere(userA, busca) as { AND: unknown[] }
    expect(where.AND).toHaveLength(2)
    expect(where.AND[0]).toEqual({ OR: [{ companyId: 'A' }, { companyId: null }] })
    expect(where.AND[1]).toEqual(busca)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/__tests__/playbook-scope.test.ts`
Expected: FAIL — `Failed to resolve import "../playbook-scope"`.

- [ ] **Step 3: Implementar**

```ts
import type { Prisma } from '@prisma/client'
import { companyScopeWhere, isAdmin, type ScopeUser } from './auth'

/**
 * Escopo de Playbook: empresa(s) do usuário + globais (companyId null).
 *
 * O `extra` é combinado por AND INTERNAMENTE — o caller nunca espalha o escopo
 * (`{...scope, ...filtros}`), porque um filtro com `OR` próprio sobrescreveria a
 * cláusula de tenant silenciosamente. Ver review C3.
 */
export function scopedPlaybookWhere(
  user: ScopeUser,
  extra: Prisma.PlaybookWhereInput = {}
): Prisma.PlaybookWhereInput {
  if (isAdmin(user)) return extra
  return { AND: [{ OR: [companyScopeWhere(user), { companyId: null }] }, extra] }
}
```

Se `isAdmin` ou `ScopeUser` não estiverem exportados de `src/lib/auth.ts`, exporte-os (são usados internamente lá).

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/__tests__/playbook-scope.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/playbook-scope.ts src/lib/__tests__/playbook-scope.test.ts
git commit -m "feat(portal): scopedPlaybookWhere com merge por AND (anti-vazamento)"
```

---

## Task 3: Frescor (helper puro)

**Files:**
- Create: `src/lib/playbook-freshness.ts`
- Test: `src/lib/__tests__/playbook-freshness.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { describe, it, expect } from 'vitest'
import { freshnessOf, nextReviewDueAt } from '../playbook-freshness'

const base = new Date('2026-08-05T12:00:00Z')

describe('freshnessOf', () => {
  it('nunca verificado quando verifiedAt é null', () => {
    expect(freshnessOf({ verifiedAt: null, reviewDueAt: base }, base)).toBe('nunca_verificado')
  })

  it('precisa revisão quando reviewDueAt já passou', () => {
    const ontem = new Date('2026-08-04T12:00:00Z')
    expect(freshnessOf({ verifiedAt: ontem, reviewDueAt: ontem }, base)).toBe('precisa_revisao')
  })

  it('verificado quando reviewDueAt está no futuro', () => {
    const amanha = new Date('2026-08-06T12:00:00Z')
    expect(freshnessOf({ verifiedAt: base, reviewDueAt: amanha }, base)).toBe('verificado')
  })

  it('evergreen (reviewDueAt null) nunca fica stale', () => {
    expect(freshnessOf({ verifiedAt: base, reviewDueAt: null }, base)).toBe('verificado')
  })
})

describe('nextReviewDueAt', () => {
  it('soma o intervalo em dias', () => {
    expect(nextReviewDueAt(90, base)?.toISOString()).toBe('2026-11-03T12:00:00.000Z')
  })

  it('devolve null para evergreen', () => {
    expect(nextReviewDueAt(null, base)).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/__tests__/playbook-freshness.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar**

```ts
export type Freshness = 'nunca_verificado' | 'precisa_revisao' | 'verificado'

/**
 * Estado de frescor DERIVADO — nunca persistido.
 * Compara instantes; não depende de fronteira de dia, então não há questão de fuso.
 */
export function freshnessOf(
  p: { verifiedAt: Date | null; reviewDueAt: Date | null },
  now: Date = new Date()
): Freshness {
  if (!p.verifiedAt) return 'nunca_verificado'
  if (p.reviewDueAt && p.reviewDueAt.getTime() < now.getTime()) return 'precisa_revisao'
  return 'verificado'
}

/** `null` = evergreen (nunca expira). */
export function nextReviewDueAt(
  intervalDays: number | null | undefined,
  from: Date = new Date()
): Date | null {
  if (intervalDays == null) return null
  return new Date(from.getTime() + intervalDays * 24 * 60 * 60 * 1000)
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/__tests__/playbook-freshness.test.ts`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/playbook-freshness.ts src/lib/__tests__/playbook-freshness.test.ts
git commit -m "feat(portal): frescor derivado (3 estados) + cálculo de reviewDueAt"
```

---

## Task 4: Validações Zod

O achado M3: num PUT parcial o refinamento tem que rodar sobre o **estado mergeado**, não sobre o payload.

**Files:**
- Create: `src/lib/validations/playbook.ts`
- Test: `src/lib/validations/__tests__/playbook.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { describe, it, expect } from 'vitest'
import { createPlaybookSchema, updatePlaybookSchema, assertKindInvariant } from '../playbook'

describe('createPlaybookSchema', () => {
  it('aceita POP sem externalUrl', () => {
    const r = createPlaybookSchema.parse({ title: 'Acesso BM', body: '# passo 1' })
    expect(r.kind).toBe('POP')
    expect(r.reviewIntervalDays).toBe(90)
  })

  it('rejeita externalUrl que não é https', () => {
    expect(() =>
      createPlaybookSchema.parse({ title: 'x', body: 'y', kind: 'BIBLIOTECA', externalUrl: 'javascript:alert(1)' })
    ).toThrow()
  })
})

describe('assertKindInvariant (estado mergeado)', () => {
  it('rejeita PUT que vira BIBLIOTECA sem externalUrl no existente', () => {
    const existing = { kind: 'POP' as const, externalUrl: null }
    expect(() => assertKindInvariant(existing, updatePlaybookSchema.parse({ kind: 'BIBLIOTECA' }))).toThrow()
  })

  it('aceita PUT que vira BIBLIOTECA quando o existente já tem externalUrl', () => {
    const existing = { kind: 'POP' as const, externalUrl: 'https://drive.google.com/x' }
    expect(() => assertKindInvariant(existing, updatePlaybookSchema.parse({ kind: 'BIBLIOTECA' }))).not.toThrow()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/lib/validations/__tests__/playbook.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar**

```ts
import { z } from 'zod'
import { ApiError } from '@/lib/api-helpers'

export const PLAYBOOK_KINDS = ['POP', 'BIBLIOTECA'] as const

const httpsUrl = z
  .string()
  .max(2000)
  .refine((v) => v.startsWith('https://'), { message: 'URL deve começar com https://' })

export const createPlaybookSchema = z.object({
  kind: z.enum(PLAYBOOK_KINDS).default('POP'),
  title: z.string().min(1, 'Título obrigatório').max(200),
  body: z.string().min(1, 'Conteúdo obrigatório').max(100000),
  externalUrl: httpsUrl.nullable().optional(),
  tags: z.array(z.string().max(40)).max(20).default([]),
  companyId: z.string().nullable().optional(),
  ownerId: z.string().nullable().optional(),
  reviewIntervalDays: z.number().int().min(1).max(3650).nullable().default(90),
})

export const updatePlaybookSchema = z.object({
  kind: z.enum(PLAYBOOK_KINDS).optional(),
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(100000).optional(),
  externalUrl: httpsUrl.nullable().optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  companyId: z.string().nullable().optional(),
  ownerId: z.string().nullable().optional(),
  reviewIntervalDays: z.number().int().min(1).max(3650).nullable().optional(),
  isArchived: z.boolean().optional(),
})

/**
 * BIBLIOTECA exige externalUrl. Valida o ESTADO MERGEADO (existente + payload),
 * não o payload — senão um PUT com só `{kind:'BIBLIOTECA'}` passa. Ver review M3.
 */
export function assertKindInvariant(
  existing: { kind: 'POP' | 'BIBLIOTECA'; externalUrl: string | null },
  payload: { kind?: 'POP' | 'BIBLIOTECA'; externalUrl?: string | null }
): void {
  const merged = {
    kind: payload.kind ?? existing.kind,
    externalUrl: payload.externalUrl !== undefined ? payload.externalUrl : existing.externalUrl,
  }
  if (merged.kind === 'BIBLIOTECA' && !merged.externalUrl) {
    throw new ApiError('Item de Biblioteca exige externalUrl (link do Drive)', 400)
  }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/lib/validations/__tests__/playbook.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validations/playbook.ts src/lib/validations/__tests__/playbook.test.ts
git commit -m "feat(portal): Zod de playbook + invariante de kind sobre estado mergeado"
```

---

## Task 5: `GET`/`POST /api/portal/playbooks`

**Files:**
- Create: `src/app/api/portal/playbooks/route.ts`
- Test: `src/app/api/portal/playbooks/__tests__/route.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { GET, POST } from '../route'

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthenticated()
})

describe('GET /api/portal/playbooks', () => {
  it('lista com take e ordena stale primeiro', async () => {
    mockDb.playbook.findMany.mockResolvedValue([])
    const res = await GET(createRequest('GET'))
    expect(res.status).toBe(200)
    const args = mockDb.playbook.findMany.mock.calls[0][0]
    expect(args.take).toBeDefined()
    expect(args.where).toBeDefined()
  })

  it('busca por termo no corpo, sem engolir o escopo', async () => {
    mockDb.playbook.findMany.mockResolvedValue([])
    await GET(createRequest('GET', { searchParams: { q: 'business manager' } }))
    const where = JSON.stringify(mockDb.playbook.findMany.mock.calls[0][0].where)
    expect(where).toContain('business manager')
    expect(where).toContain('body')
  })
})

describe('POST /api/portal/playbooks', () => {
  it('cria POP com reviewDueAt já preenchido na criação', async () => {
    mockDb.playbook.create.mockResolvedValue({ id: 'p1', title: 'Acesso BM' })
    const res = await POST(createRequest('POST', { body: { title: 'Acesso BM', body: '# passo' } }))
    expect(res.status).toBe(201)
    const data = mockDb.playbook.create.mock.calls[0][0].data
    expect(data.reviewDueAt).toBeInstanceOf(Date)
    expect(data.createdById).toBeDefined()
  })

  it('rejeita título vazio', async () => {
    const res = await POST(createRequest('POST', { body: { title: '', body: 'x' } }))
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/app/api/portal/playbooks/__tests__/route.test.ts`
Expected: FAIL — `../route` não existe.

- [ ] **Step 3: Implementar**

```ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { resolveActor, resolveActiveCompany, isAdmin } from '@/lib/auth'
import { handleApiError, successResponse, createdResponse, ApiError } from '@/lib/api-helpers'
import { scopedPlaybookWhere } from '@/lib/playbook-scope'
import { nextReviewDueAt } from '@/lib/playbook-freshness'
import { createPlaybookSchema } from '@/lib/validations/playbook'
import { createAuditLog } from '@/lib/audit'

const MAX_ITEMS = 200

export async function GET(request: NextRequest) {
  try {
    const user = await resolveActor(request)
    const { searchParams } = new URL(request.url)

    const filtros: Record<string, unknown> = {
      isArchived: searchParams.get('archived') === 'true',
    }
    const kind = searchParams.get('kind')
    if (kind) filtros.kind = kind
    const tag = searchParams.get('tag')
    if (tag) filtros.tags = { has: tag }

    const q = searchParams.get('q')?.trim()
    if (q) {
      filtros.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { body: { contains: q, mode: 'insensitive' } },
      ]
    }

    const playbooks = await db.playbook.findMany({
      where: scopedPlaybookWhere(user, filtros),
      select: {
        id: true, kind: true, title: true, tags: true, companyId: true,
        verifiedAt: true, reviewDueAt: true, updatedAt: true, externalUrl: true,
        owner: { select: { name: true, email: true } },
      },
      orderBy: [{ reviewDueAt: 'asc' }, { updatedAt: 'desc' }],
      take: MAX_ITEMS,
    })

    return successResponse(playbooks)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await resolveActor(request)
    const data = createPlaybookSchema.parse(await request.json())

    // Global (companyId null) é privilégio de admin; demais gravam na própria empresa.
    const companyId = isAdmin(user)
      ? (data.companyId ?? null)
      : resolveActiveCompany(user, data.companyId ?? undefined)
    if (!isAdmin(user) && data.companyId === null) {
      throw new ApiError('Só admin cria conteúdo global', 403)
    }

    const now = new Date()
    const playbook = await db.playbook.create({
      data: {
        kind: data.kind,
        title: data.title,
        body: data.body,
        externalUrl: data.externalUrl ?? null,
        tags: data.tags,
        companyId,
        ownerId: data.ownerId ?? user.id,
        reviewIntervalDays: data.reviewIntervalDays,
        // Nasce com relógio de frescor rodando: sem isso um POP nunca verificado
        // ficaria invisível ao motor de frescor pra sempre (review M4).
        reviewDueAt: nextReviewDueAt(data.reviewIntervalDays, now),
        createdById: user.id,
      },
    })

    await createAuditLog({
      action: 'CREATE',
      entityType: 'Playbook',
      entityId: playbook.id,
      userId: user.id,
      changes: { title: { from: null, to: playbook.title } },
    })

    return createdResponse(playbook)
  } catch (error) {
    return handleApiError(error)
  }
}
```

Confira a assinatura real de `createAuditLog` em `src/lib/audit.ts` e ajuste os nomes dos campos se divergirem — não invente parâmetros.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/app/api/portal/playbooks/__tests__/route.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/portal/playbooks/
git commit -m "feat(portal): GET/POST /api/portal/playbooks (busca no corpo + reviewDueAt na criação)"
```

---

## Task 6: `GET`/`PUT`/`DELETE /api/portal/playbooks/[id]`

**Files:**
- Create: `src/app/api/portal/playbooks/[id]/route.ts`
- Test: `src/app/api/portal/playbooks/[id]/__tests__/route.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { PUT, DELETE } from '../route'

const ctx = { params: Promise.resolve({ id: 'p1' }) }

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthenticated()
})

describe('PUT /api/portal/playbooks/[id]', () => {
  it('editar sendo diferente do owner zera verifiedAt', async () => {
    mockDb.playbook.findFirst.mockResolvedValue({
      id: 'p1', kind: 'POP', externalUrl: null, title: 'A', body: 'b',
      ownerId: 'outro-user', verifiedAt: new Date(), companyId: null,
    })
    mockDb.playbook.update.mockResolvedValue({ id: 'p1' })

    const res = await PUT(createRequest('PUT', { body: { title: 'B' } }), ctx)
    expect(res.status).toBe(200)
    expect(mockDb.playbook.update.mock.calls[0][0].data.verifiedAt).toBeNull()
  })

  it('PUT parcial não loga campo ausente como null no AuditLog', async () => {
    mockDb.playbook.findFirst.mockResolvedValue({
      id: 'p1', kind: 'POP', externalUrl: null, title: 'A', body: 'corpo',
      ownerId: 'user-1', verifiedAt: null, companyId: null,
    })
    mockDb.playbook.update.mockResolvedValue({ id: 'p1', title: 'B', body: 'corpo' })

    await PUT(createRequest('PUT', { body: { title: 'B' } }), ctx)
    const audit = mockDb.auditLog.create.mock.calls[0]?.[0]?.data
    expect(JSON.stringify(audit?.changes ?? {})).not.toContain('body')
  })

  it('404 quando o item está fora do escopo do usuário', async () => {
    mockDb.playbook.findFirst.mockResolvedValue(null)
    const res = await PUT(createRequest('PUT', { body: { title: 'B' } }), ctx)
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/portal/playbooks/[id]', () => {
  it('arquiva (soft delete) em vez de apagar', async () => {
    mockDb.playbook.findFirst.mockResolvedValue({ id: 'p1', kind: 'POP', externalUrl: null, companyId: null, ownerId: 'user-1' })
    mockDb.playbook.update.mockResolvedValue({ id: 'p1', isArchived: true })
    const res = await DELETE(createRequest('DELETE'), ctx)
    expect(res.status).toBe(200)
    expect(mockDb.playbook.update.mock.calls[0][0].data.isArchived).toBe(true)
    expect(mockDb.playbook.delete).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/app/api/portal/playbooks/\[id\]/__tests__/route.test.ts`
Expected: FAIL — `../route` não existe.

- [ ] **Step 3: Implementar**

```ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { resolveActor, isAdmin, assertCompanyAccess } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'
import { scopedPlaybookWhere } from '@/lib/playbook-scope'
import { updatePlaybookSchema, assertKindInvariant } from '@/lib/validations/playbook'
import { createAuditLog, diffChanges } from '@/lib/audit'

type Ctx = { params: Promise<{ id: string }> }

async function loadScoped(request: NextRequest, id: string) {
  const user = await resolveActor(request)
  const playbook = await db.playbook.findFirst({ where: scopedPlaybookWhere(user, { id }) })
  if (!playbook) throw new ApiError('Playbook não encontrado', 404)
  return { user, playbook }
}

/** Só admin edita global; gerência edita a própria empresa; user não edita. */
function assertCanWrite(user: { role: string }, playbook: { companyId: string | null }, actor: Parameters<typeof assertCompanyAccess>[1]) {
  if (isAdmin(actor)) return
  if (playbook.companyId === null) throw new ApiError('Só admin edita conteúdo global', 403)
  if (user.role !== 'gerencia') throw new ApiError('Sem permissão para editar', 403)
  assertCompanyAccess(playbook.companyId, actor)
}

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const { playbook } = await loadScoped(request, id)
    return successResponse(playbook)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const { user, playbook } = await loadScoped(request, id)
    assertCanWrite(user, playbook, user)

    const payload = updatePlaybookSchema.parse(await request.json())
    assertKindInvariant(playbook, payload)

    const data: Record<string, unknown> = { ...payload }
    // O badge VERIFICADO não pode mentir: quem não é dono editou → des-verifica.
    if (playbook.ownerId && playbook.ownerId !== user.id) data.verifiedAt = null

    const updated = await db.playbook.update({ where: { id }, data })

    // diffChanges recebe SÓ as chaves presentes no payload — campo ausente em PUT
    // parcial não pode virar `→ null` no log (GUIA §9.6).
    const changes = diffChanges(
      playbook as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>,
      Object.keys(payload)
    )
    await createAuditLog({ action: 'UPDATE', entityType: 'Playbook', entityId: id, userId: user.id, changes })

    return successResponse(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const { user, playbook } = await loadScoped(request, id)
    assertCanWrite(user, playbook, user)

    const updated = await db.playbook.update({ where: { id }, data: { isArchived: true } })
    await createAuditLog({ action: 'DELETE', entityType: 'Playbook', entityId: id, userId: user.id, changes: null })

    return successResponse(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/app/api/portal/playbooks/\[id\]/__tests__/route.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/portal/playbooks/[id]/"
git commit -m "feat(portal): GET/PUT/DELETE de playbook (des-verifica, soft delete, audit parcial)"
```

---

## Task 7: `POST /api/portal/playbooks/[id]/verify`

**Files:**
- Create: `src/app/api/portal/playbooks/[id]/verify/route.ts`
- Test: `src/app/api/portal/playbooks/[id]/verify/__tests__/route.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { POST } from '../route'

const ctx = { params: Promise.resolve({ id: 'p1' }) }

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthenticated()
})

describe('POST verify', () => {
  it('grava verifiedAt/verifiedById/reviewDueAt e RESETA reviewReminderSent', async () => {
    mockDb.playbook.findFirst.mockResolvedValue({ id: 'p1', companyId: null, reviewIntervalDays: 90, reviewReminderSent: true })
    mockDb.playbook.update.mockResolvedValue({ id: 'p1' })

    const res = await POST(createRequest('POST'), ctx)
    expect(res.status).toBe(200)
    const data = mockDb.playbook.update.mock.calls[0][0].data
    expect(data.verifiedAt).toBeInstanceOf(Date)
    expect(data.verifiedById).toBeDefined()
    expect(data.reviewDueAt).toBeInstanceOf(Date)
    expect(data.reviewReminderSent).toBe(false)
  })

  it('404 fora do escopo', async () => {
    mockDb.playbook.findFirst.mockResolvedValue(null)
    const res = await POST(createRequest('POST'), ctx)
    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run "src/app/api/portal/playbooks/[id]/verify/__tests__/route.test.ts"`
Expected: FAIL — `../route` não existe.

- [ ] **Step 3: Implementar**

```ts
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { resolveActor } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'
import { scopedPlaybookWhere } from '@/lib/playbook-scope'
import { nextReviewDueAt } from '@/lib/playbook-freshness'
import { createAuditLog } from '@/lib/audit'

type Ctx = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const user = await resolveActor(request)

    const playbook = await db.playbook.findFirst({ where: scopedPlaybookWhere(user, { id }) })
    if (!playbook) throw new ApiError('Playbook não encontrado', 404)

    const now = new Date()
    const updated = await db.playbook.update({
      where: { id },
      data: {
        verifiedAt: now,
        verifiedById: user.id,
        reviewDueAt: nextReviewDueAt(playbook.reviewIntervalDays, now),
        // Sem este reset o 2º ciclo de staleness nunca reavisa (bug latente do cron atual).
        reviewReminderSent: false,
      },
    })

    await createAuditLog({
      action: 'UPDATE', entityType: 'Playbook', entityId: id, userId: user.id,
      changes: { verifiedAt: { from: playbook.verifiedAt, to: now } },
    })

    return successResponse(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run "src/app/api/portal/playbooks/[id]/verify/__tests__/route.test.ts"`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/portal/playbooks/[id]/verify/"
git commit -m "feat(portal): verificar playbook (reseta relógio e lembrete)"
```

---

## Task 8: `<PortalMarkdown>` — render seguro

O achado M1: DOMPurify não entra aqui. `react-markdown` devolve elementos React; o risco residual é URL, e quem corta é o `urlTransform`.

**Files:**
- Create: `src/components/portal/portal-markdown.tsx`
- Test: `src/components/portal/__tests__/portal-markdown.test.tsx`

- [ ] **Step 1: Escrever o teste que falha**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PortalMarkdown, safeUrl } from '../portal-markdown'

describe('safeUrl', () => {
  it('deixa passar https', () => {
    expect(safeUrl('https://drive.google.com/x')).toBe('https://drive.google.com/x')
  })

  it('corta javascript:', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('')
  })

  it('corta data:', () => {
    expect(safeUrl('data:text/html,<script>alert(1)</script>')).toBe('')
  })
})

describe('PortalMarkdown', () => {
  it('renderiza markdown', () => {
    render(<PortalMarkdown body={'# Título\n\ntexto do pop'} />)
    expect(screen.getByText('texto do pop')).toBeInTheDocument()
  })

  it('não executa HTML cru', () => {
    const { container } = render(<PortalMarkdown body={'<script>window.x=1</script>ok'} />)
    expect(container.querySelector('script')).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/portal/__tests__/portal-markdown.test.tsx`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar**

```tsx
'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useState } from 'react'

/** Allowlist de esquema. Tudo que não for https:/mailto: vira string vazia. */
export function safeUrl(url: string): string {
  const v = url.trim()
  if (v.startsWith('https://') || v.startsWith('mailto:')) return v
  return ''
}

function ImagemDoDrive({ src, alt }: { src?: string; alt?: string }) {
  const [quebrou, setQuebrou] = useState(false)
  if (!src || quebrou) {
    return (
      <span className="block rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
        Imagem indisponível — verifique o link do Drive{alt ? ` (${alt})` : ''}
      </span>
    )
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt ?? ''} className="max-w-full rounded-md" onError={() => setQuebrou(true)} />
}

/**
 * Render de markdown do Portal.
 * HTML cru NÃO é habilitado (default do react-markdown v10 — não adicionar rehype-raw).
 * O risco residual é URL perigosa, cortada pelo urlTransform.
 */
export function PortalMarkdown({ body }: { body: string }) {
  return (
    <div className="prose prose-slate max-w-none text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={safeUrl}
        components={{
          img: ({ src, alt }) => <ImagemDoDrive src={typeof src === 'string' ? src : undefined} alt={alt} />,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  )
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/components/portal/__tests__/portal-markdown.test.tsx`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/portal/
git commit -m "feat(portal): PortalMarkdown com urlTransform e fallback de imagem quebrada"
```

---

## Task 9: Badge de frescor

**Files:**
- Create: `src/components/portal/freshness-badge.tsx`
- Test: `src/components/portal/__tests__/freshness-badge.test.tsx`

- [ ] **Step 1: Escrever o teste que falha**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FreshnessBadge } from '../freshness-badge'

describe('FreshnessBadge', () => {
  it('mostra precisa revisão quando venceu', () => {
    render(<FreshnessBadge verifiedAt={new Date('2026-01-01')} reviewDueAt={new Date('2026-01-02')} now={new Date('2026-08-05')} />)
    expect(screen.getByText(/precisa revisão/i)).toBeInTheDocument()
  })

  it('mostra nunca verificado quando verifiedAt é null', () => {
    render(<FreshnessBadge verifiedAt={null} reviewDueAt={null} now={new Date('2026-08-05')} />)
    expect(screen.getByText(/nunca verificado/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/components/portal/__tests__/freshness-badge.test.tsx`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar**

```tsx
import { freshnessOf } from '@/lib/playbook-freshness'

const ESTILOS = {
  verificado: { label: 'Verificado', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  precisa_revisao: { label: 'Precisa revisão', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  nunca_verificado: { label: 'Nunca verificado', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
} as const

export function FreshnessBadge({
  verifiedAt, reviewDueAt, now,
}: { verifiedAt: Date | null; reviewDueAt: Date | null; now?: Date }) {
  const estado = freshnessOf({ verifiedAt, reviewDueAt }, now)
  const { label, cls } = ESTILOS[estado]
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${cls}`}>{label}</span>
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/components/portal/__tests__/freshness-badge.test.tsx`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/components/portal/freshness-badge.tsx src/components/portal/__tests__/freshness-badge.test.tsx
git commit -m "feat(portal): badge dos 3 estados de frescor"
```

---

## Task 10: Páginas do Portal

Sem teste unitário de página (o repo não testa páginas); a verificação é o smoke no navegador da Task 13.

**Files:**
- Create: `src/app/dashboard/portal/page.tsx`
- Create: `src/app/dashboard/portal/pops/[id]/page.tsx`
- Create: `src/app/dashboard/portal/pops/[id]/editar/page.tsx`

- [ ] **Step 1: Criar a lista (`/dashboard/portal`)**

Client component. Regras obrigatórias:
- `useEffect` carrega `GET /api/portal/playbooks?kind=POP` (+ `&q=` quando houver busca, com debounce de 300 ms).
- **Erro não pode ser silencioso** (invariante §9.3): se `!res.ok`, renderizar faixa vermelha com a mensagem do backend.
- Abas: **só "POPs" está viva**; "Biblioteca" e "IA Defenz" aparecem com o rótulo da fase e sem link (`F3`/`F4`).
- Cada linha: título, `owner.name`, `<FreshnessBadge/>`, link para `/dashboard/portal/pops/[id]`.
- Botão "Novo POP" visível só para `admin`/`gerencia` (ler `useSession()`), levando a `/dashboard/portal/pops/novo/editar`.
- Estado vazio: "Nenhum POP ainda. Comece escrevendo o primeiro procedimento."

- [ ] **Step 2: Criar a leitura (`/dashboard/portal/pops/[id]`)**

- Carrega `GET /api/portal/playbooks/[id]`; 404 → mensagem "POP não encontrado ou fora do seu acesso".
- Topo: título + `<FreshnessBadge/>` + linha "Verificado por X em DD/MM" ou "Precisa revisão — última verificação há N dias" (use `formatDate` de `src/lib/date.ts`).
- Corpo: `<PortalMarkdown body={playbook.body} />`.
- Botão "Verificar" → `POST /api/portal/playbooks/[id]/verify`, recarrega ao voltar 200, mostra erro inline se falhar.
- Botão "Editar" só para quem pode escrever.

- [ ] **Step 3: Criar o editor (`/dashboard/portal/pops/[id]/editar`)**

- `id === 'novo'` → POST; senão → PUT.
- Campos: `title`, `body` (textarea grande), `tags` (input separado por vírgula), `ownerId` (select de usuários), `reviewIntervalDays` (número + checkbox "evergreen" que manda `null`).
- Ao salvar: erro do backend renderizado inline; sucesso → `router.push` para a leitura.
- Painel de ajuda curto: "Para imagem, cole o link do Drive no formato `![alt](https://…)`".

- [ ] **Step 4: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/portal/
git commit -m "feat(portal): páginas de lista, leitura e edição de POP"
```

---

## Task 11: Nav + Service Worker

**Files:**
- Modify: `src/app/dashboard/layout.tsx`
- Modify: `public/sw.js`

- [ ] **Step 1: Adicionar o item de nav**

Em `src/app/dashboard/layout.tsx`, depois do bloco do Service Desk (~linha 241), no mesmo padrão dos outros itens:

```tsx
<a href="/dashboard/portal" className={navItemClass('/dashboard/portal')}>
  <BookOpen className="h-5 w-5" />
  {sidebarOpen && <span className="font-medium">Portal Defenz</span>}
</a>
```

Importe `BookOpen` de `lucide-react` junto dos ícones já importados no topo do arquivo. Sem gate de role — todo usuário logado lê o Portal.

- [ ] **Step 2: Bumpar o cache do Service Worker**

Em `public/sw.js`, incrementar `CACHE_NAME` (`defenz-v3` → `defenz-v4`). Sem isso o menu novo não aparece para quem já tem o SW instalado — foi a causa-raiz do "menu some/aparece" (GUIA §9.8).

- [ ] **Step 3: Verificar**

Run: `npx tsc --noEmit && npm run build`
Expected: build verde.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/layout.tsx public/sw.js
git commit -m "feat(portal): item de nav Portal Defenz + bump do cache do SW"
```

---

## Task 12: Passo de frescor no cron

**Files:**
- Modify: `src/app/api/cron/reminders/route.ts`
- Test: `src/app/api/cron/__tests__/reminders-playbook.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { notificarPlaybooksVencidos } from '../reminders/route'

beforeEach(() => vi.clearAllMocks())

describe('notificarPlaybooksVencidos', () => {
  it('marca reviewReminderSent após notificar', async () => {
    mockDb.playbook.findMany.mockResolvedValue([
      { id: 'p1', title: 'Acesso BM', owner: { email: 'cris@defenz.com.br', name: 'Cris' } },
    ])
    mockDb.playbook.update.mockResolvedValue({ id: 'p1' })

    const n = await notificarPlaybooksVencidos()
    expect(n).toBe(1)
    expect(mockDb.playbook.update.mock.calls[0][0].data.reviewReminderSent).toBe(true)
  })

  it('ignora playbooks sem owner (não há para quem mandar)', async () => {
    mockDb.playbook.findMany.mockResolvedValue([{ id: 'p2', title: 'X', owner: null }])
    const n = await notificarPlaybooksVencidos()
    expect(n).toBe(0)
    expect(mockDb.playbook.update).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/app/api/cron/__tests__/reminders-playbook.test.ts`
Expected: FAIL — `notificarPlaybooksVencidos` não é exportado.

- [ ] **Step 3: Implementar**

Adicione em `src/app/api/cron/reminders/route.ts` (exportada, para ser testável):

```ts
/**
 * Notifica donos de playbooks vencidos. Retorna quantos e-mails saíram.
 * Comparação por instante — sem fronteira de dia, sem questão de fuso.
 */
export async function notificarPlaybooksVencidos(): Promise<number> {
  const vencidos = await db.playbook.findMany({
    where: {
      isArchived: false,
      reviewReminderSent: false,
      reviewDueAt: { lte: new Date() },
    },
    select: { id: true, title: true, owner: { select: { email: true, name: true } } },
    take: 200,
  })

  let enviados = 0
  for (const p of vencidos) {
    if (!p.owner?.email) continue
    await sendEmailWithChecks({
      to: p.owner.email,
      subject: `Revisar POP: ${p.title}`,
      html: `<p>Olá ${p.owner.name ?? ''}, o POP <strong>${p.title}</strong> passou da data de revisão. Confira se ainda está correto e clique em Verificar no Portal Defenz.</p>`,
    })
    await db.playbook.update({ where: { id: p.id }, data: { reviewReminderSent: true } })
    enviados++
  }
  return enviados
}
```

Confira a assinatura real de `sendEmailWithChecks` no arquivo e ajuste os campos se divergirem.

E chame dentro do handler do cron, **isolado**, para não derrubar os lembretes de Demanda:

```ts
  let playbooksNotificados = 0
  try {
    playbooksNotificados = await notificarPlaybooksVencidos()
  } catch (err) {
    console.error('Cron de frescor de playbooks falhou:', err)
  }
```

Inclua `playbooksNotificados` no payload de resposta do cron.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/app/api/cron/__tests__/reminders-playbook.test.ts`
Expected: 2 passed.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/cron/
git commit -m "feat(portal): passo de frescor no cron diário (isolado em try/catch)"
```

---

## Task 13: Gate + smoke no navegador

- [ ] **Step 1: Rodar o gate completo**

Run: `npm run build && npx tsc --noEmit && npm test`
Expected: build verde, sem erro de tipo, **todos** os testes passando (668 anteriores + os novos). Se algum teste antigo quebrar, conserte antes de seguir — não siga com vermelho.

- [ ] **Step 2: Smoke autenticado em localhost**

Run: `npm run dev`

Percorrer, nesta ordem:
1. `/dashboard` → o item "Portal Defenz" aparece na sidebar.
2. `/dashboard/portal` → aba POPs viva; Biblioteca e IA marcadas com a fase.
3. "Novo POP" → criar um POP com título, corpo em markdown e **uma imagem do Drive** no formato aprovado na Task 0.
4. Abrir o POP → markdown renderiza; a imagem aparece (ou o placeholder explícito, se R1 tiver falhado).
5. Clicar "Verificar" → badge vira verde.
6. Buscar por uma palavra que só existe **no corpo** → o POP aparece.
7. Editar como outro usuário (ou simular) → badge volta para "precisa revisão".

- [ ] **Step 3: Registrar o resultado**

Atualizar `docs/PROGRESS.md` (seção "Current focus" + "Recently completed") e apender em `docs/CHANGELOG.md` sob `[Unreleased]`. Marcar a F1 como implementada em `docs/features/feature-portal-defenz.md` §8.

- [ ] **Step 4: Commit final**

```bash
git add docs/
git commit -m "docs(portal): F1 implementada — PROGRESS/CHANGELOG/spec"
```

---

## Fora desta F1 (não implemente aqui)

Biblioteca (`kind=BIBLIOTECA` na UI) = F3 · IA interna = F4 · IA web/n8n = F5 · categorias, Cmd+K, índice GIN, image-proxy (**salvo** se a Task 0 mostrar que o hotlink falha) — ver §12 da spec.
