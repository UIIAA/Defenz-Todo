# Feature: Menu "Playbooks / Manuais Defenz"
**Status:** Draft (ideia — precisa brainstorming antes de codar)
**Priority:** P2
**Date:** 2026-06-24

## Objective
Novo menu no dashboard para guardar e consultar **playbooks / manuais** internos da Defenz (procedimentos, runbooks, guias) — base de conhecimento operacional dentro do To-Do.

## Contexto / por que
A Defenz já produz muitos procedimentos (ex.: guia PDF de acesso ao Business Manager p/ Sheila, onboarding de cliente, runbooks do Chief, esteira de habilitação Meta). Hoje ficam espalhados (Drive, PDFs, skills). Um menu próprio centraliza e deixa acessível ao time.

## Perguntas abertas (decidir no brainstorming)
- **Formato do conteúdo:** Markdown editável no app? Upload de PDF/arquivo? Link para Drive? Ou um modelo híbrido (doc curto + links)?
- **Modelo de dados:** novo `Playbook` (title, body markdown, tags/categoria, companyId?, autor, updatedAt) vs reuso de algo. Multi-tenant? (playbooks globais Defenz vs por empresa/cliente).
- **Permissão:** quem cria/edita (admin/gerência) vs quem lê (todos da empresa)? Tenant isolation como nas Demandas.
- **Busca:** integrar no Cmd+K existente?
- **Vínculo com Demandas:** um card pode referenciar um playbook? (ex.: "siga o playbook de onboarding"). Possível link N:N futuro.

## Esboço técnico (ponto de partida)
- Rota `/dashboard/playbooks` (+ subpágina de leitura `/playbooks/[id]`).
- Modelo `Playbook` no Prisma (markdown no body; render com o mesmo stack de markdown já usado no relatório executivo — `react-markdown`/`remark-gfm`).
- API `/api/playbooks` (GET/POST/PUT/DELETE) com `handleApiError`/`successResponse` + Zod + tenant scope (`assertCompanyAccess`).
- Nav em `src/app/dashboard/layout.tsx` (role gating).

## Dependencies
- Independente do Kanban (mas pode ganhar link p/ Demandas depois).
