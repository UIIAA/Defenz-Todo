# Feature: Empresa/Projeto no modal de Demanda
**Status:** Done (código + testes; não deployado)
**Priority:** P1
**Date:** 2026-06-17

## Objective
Permitir que admin escolha (na criação) e mude (na edição) a empresa/projeto de uma Demanda pelo modal do board, em vez de tudo cair na empresa primária por falta de `companyId` no POST.

## Behavior
1. Ao abrir o modal **como admin** (com ≥2 empresas), um seletor "Empresa / Projeto" aparece no topo do formulário.
2. **Criação:** o seletor pré-seleciona a empresa do filtro ativo do board; se o filtro = "Todas empresas", default = empresa primária do admin. O `handleSave` envia `companyId` no POST.
3. **Edição:** o seletor mostra a empresa atual do card. Trocar = mover o card para outra empresa (muda quem o vê). O PUT envia `companyId`.
4. Para usuário/gerência comum o campo **não renderiza** (sem mudança de comportamento — continuam presos à própria empresa).

## Business Rules
- Campo visível somente quando `session.user.role === 'admin'` **e** `companies.length > 1` (espelha o `CompanySelector` do board).
- POST: backend já resolve via `resolveActiveCompany(user, body.companyId)` — admin escolhe livre, não-admin só dentro do conjunto (403 fora).
- PUT: ao receber `companyId` ≠ atual → admin pode mover livre; não-admin → 403 (guard server-side, independente da UI).
- **Mover de empresa limpa `teamId` do card** (equipe pertence a uma empresa; evita vínculo cross-tenant). Responsável (`assignedToId`) é mantido.
- Toda mudança de `companyId` é registrada no AuditLog (`companyId` entra em `TRACKED_FIELDS`).

## Edge Cases
- `companyId` inválido/inexistente no PUT → 400 (target não encontrado) ou 403 (fora do escopo do não-admin).
- Mover card com `dependsOn` apontando para demandas da empresa antiga → vínculos ficam "órfãos" (afetam só o grafo visual, não quebram nada). **Limitação conhecida aceita** — não tratada nesta feature.
- Filtro do board em "Todas empresas" na criação → usa empresa primária como default; admin troca no campo se quiser.

## Data Contract
- **Input (UI → API):** `POST/PUT /api/demandas` com `companyId: string` (cuid).
- **Output:** Demanda persistida com `companyId` escolhido; `teamId = null` quando houve troca de empresa no PUT.
- **Persistence:** `Demanda.companyId` (FK existente) + linha AuditLog na troca.

## Acceptance Criteria
- [ ] Admin cria card com empresa diferente da primária pela UI → card nasce na empresa escolhida.
- [ ] Admin edita card e troca a empresa → card muda de empresa e `teamId` é zerado.
- [ ] Não-admin não vê o campo; PUT com `companyId` fora do escopo → 403.
- [ ] Troca de `companyId` gera AuditLog.
- [ ] Usuário/gerência comum: comportamento atual inalterado.

## Technical Decisions
- `companyId` adicionado ao `createDemandaSchema` (`z.string().optional()`), herdado pelo `updateDemandaSchema` via `.partial()`.
- PUT ganha bloco de `companyUpdate`: valida acesso (`assertCompanyAccess` p/ não-admin; admin livre), seta `companyId` + `teamId: null` apenas quando muda.
- Modal busca empresas via `/api/companies` (gated em admin), igual ao `CompanySelector`. Default na criação vem por prop `defaultCompanyId` do board (= filtro ativo).
- `Demanda` interface / `DemandaForm` / `emptyForm` ganham `companyId?: string | null`.

## Dependencies
- Depends on: multi-empresa já shipado (`resolveActiveCompany`, `assertCompanyAccess`, sessão com `companyIds`).
- Blocks: alimentar cards nos projetos certos pela UI (hoje só via API/token).
