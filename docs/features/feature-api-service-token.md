# Feature: API Service Token (Bearer) — Solução A
**Status:** Approved
**Priority:** P1
**Date:** 2026-06-07

## Objective
Permitir que chamadores máquina-a-máquina (Claude via curl, MCP, automações) autentiquem nas rotas de Demanda via `Authorization: Bearer <token>`, ao lado da sessão NextAuth, herdando o acesso do usuário dono do token.

## Behavior
1. Quando uma request chega a uma rota da família demanda com header `Authorization: Bearer <raw>`.
2. O sistema computa `SHA-256(raw)`, busca `ApiToken` por `tokenHash` (unique), valida `revokedAt`/`expiresAt`, carrega o `User` dono (+ company/teams) e monta um `SessionUser` idêntico ao do login.
3. A rota aplica EXATAMENTE a mesma lógica de autorização de 3 níveis — o token herda o escopo do usuário (admin vê tudo; Marcos vê as empresas dele). `lastUsedAt` é atualizado fire-and-forget.
4. Sem header `Authorization` → fallback para sessão NextAuth (`getCurrentUser`). Com header presente e inválido → **401 imediato, sem fallback**.

## Business Rules
- Token é vinculado a **1 usuário** (`userId` FK) e autentica "como" ele. Não tem escopo próprio — escopo = escopo do usuário.
- Bearer é aceito **apenas na família demanda**: `GET/POST/PUT/DELETE /api/demandas`, `/api/demandas/[id]/subtasks` (POST/PUT/DELETE), `/api/demandas/[id]/links` (POST/PUT/DELETE), `POST /api/demandas/import`. Demais rotas seguem session-only.
- Mutações gravam `AuditLog` com o `userId`/`userEmail` do dono do token.
- Formato do token: `defz_` + 56 hex chars (28 bytes aleatórios = 224 bits). Validação estrita de formato antes do lookup.
- Rate limit por ator (`key = demandas-write:${user.id}`) aplicado após resolver o token.

## Edge Cases
- Token inexistente / hash não bate → 401.
- Token revogado (`revokedAt != null`) → 401 (e NÃO atualiza `lastUsedAt`).
- Token expirado (`expiresAt <= now`) → 401.
- Header malformado / fora do formato `defz_...` → 401 (sem fallback de sessão).
- Token de usuário escopado à empresa X tentando tocar demanda da empresa Y (não-admin) → 403 (tenant isolation preservada).

## Data Contract
- **ApiToken** (Prisma): `id`, `name`, `tokenHash @unique`, `tokenPrefix` (8 chars visíveis), `userId` FK→User (onDelete: Cascade), `expiresAt?`, `revokedAt?`, `lastUsedAt?`, `createdBy?`, `createdAt`.
- Rotas/data contract de demanda **já existem** (POST `{title,status?,priority?,...}`; PUT `{id,status,...}`).

## Acceptance Criteria
- [ ] Bearer válido autentica como o usuário vinculado (resolveActor retorna SessionUser correto).
- [ ] Token inexistente/revogado/expirado → 401; header malformado → 401 sem fallback.
- [ ] POST/PUT demanda via Bearer grava `AuditLog` com `userId` do dono do token.
- [ ] Token não cruza empresas (não-admin tocando outra empresa → 403).
- [ ] `create-api-token.ts` gera token, persiste só o hash, imprime plaintext UMA vez.
- [ ] Rate limit por ator retorna 429 ao exceder.

## Technical Decisions
- **SHA-256, não bcrypt**: token é alta-entropia (224 bits) → SHA-256 + lookup por `@unique` é O(1) e seguro (padrão GitHub PAT / Stripe restricted keys). bcrypt exigiria varredura (não indexável) sem ganho real para segredos de alta entropia.
- **Sem `timingSafeEqual` sobre o raw** (diferente do `CRON_SECRET`, que compara plaintext fixo): aqui a validação é lookup por hash unique; não há comparação de string secreta em memória.
- `resolveActor` em `src/lib/auth.ts` monta SessionUser idêntico ao `authorize()` → nenhuma lógica de autorização das rotas muda.
- Sem fallback silencioso: header presente ⇒ deve ser Bearer válido.

## Dependencies
- Depende de: [[feature-multi-company-membership]] (scoping por conjunto torna o token seguro p/ usuários multi-empresa e cobre `companyId=null`).
- Bloqueia: MCP server `defenz-mcp` (Solução B).
