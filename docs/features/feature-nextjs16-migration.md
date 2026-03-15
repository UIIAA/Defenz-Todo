# Feature: Migrar Next.js 15.3.5 para 16.x
**Status:** Done
**Priority:** P0
**Date:** 2026-03-15

## Objective
Migrar de Next.js 15.3.5 para 16.x para resolver vulnerabilidade de segurança que bloqueia deploy na Vercel.

## Behavior
1. Quando o deploy for acionado na Vercel
2. O build deve completar sem erro de "Vulnerable version of Next.js detected"
3. A aplicacao funciona identicamente ao estado anterior

## Business Rules
- Zero downtime na migracao
- Todas funcionalidades existentes devem continuar funcionando
- Testes devem passar sem modificacao

## Edge Cases
- NextAuth middleware incompativel com Next.js 16 -> manter middleware.ts (suportado como fallback)
- Turbopack como default quebra build -> next.config.ts nao tem webpack custom, risco baixo
- React types breaking changes -> atualizar @types/react junto

## Data Contract
- Input: package.json com next@15.3.5
- Output: package.json com next@16.x
- Persistence: sem mudancas no schema do banco

## Acceptance Criteria
- [ ] `npm install next@latest react@latest react-dom@latest` executa sem erros
- [ ] `npx tsc --noEmit` passa sem erros TypeScript
- [ ] `npm test` — todos os 69 testes passam
- [ ] `npm run build` — build completa com sucesso
- [ ] Deploy na Vercel passa sem erro de vulnerabilidade
- [ ] Health check responde OK apos deploy

## Technical Decisions
- Manter middleware.ts (Next.js 16 suporta como fallback, sem necessidade de renomear para proxy.ts)
- Atualizar react/react-dom junto para manter compatibilidade
- Atualizar eslint-config-next para mesma major version
- Atualizar @types/react e @types/react-dom

## Dependencies
- Depends on: nenhuma feature
- Blocks: todos os deploys futuros (Vercel bloqueado)
