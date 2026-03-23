# Feature: App Responsivo + PWA
**Status:** Done
**Priority:** P0
**Date:** 2026-03-23

## Objective
Tornar o Defenz 100% funcional em dispositivos mobile e instalavel como PWA.

## Behavior
1. Quando acessado no mobile, sidebar funciona como drawer com backdrop
2. Todos os componentes se adaptam a tela pequena (Kanban, Gantt, modais, tabelas)
3. O app pode ser instalado via "Add to Home Screen" no Chrome/Safari

## Business Rules
- Sidebar inicia fechada no mobile (< 768px)
- Colunas secundarias de tabelas ficam ocultas no mobile
- Modais nao excedem o viewport
- PWA funciona offline para assets estaticos

## Edge Cases
- Rotacao de tela: layout se adapta via media query
- PWA sem conexao: network-first para API, cache-first para assets

## Data Contract
- Input: viewport width via `useIsMobile` hook (breakpoint 768px)
- Output: layout responsivo + manifest.json + service worker

## Acceptance Criteria
- [ ] Viewport meta tag configurado
- [ ] Sidebar funciona como drawer no mobile
- [ ] Header de demandas empilha verticalmente no mobile
- [ ] Kanban scrollavel horizontalmente com colunas menores
- [ ] Tabelas escondem colunas secundarias no mobile
- [ ] Modais nao excedem viewport
- [ ] manifest.json com icones 192x192 e 512x512
- [ ] Service worker com cache strategy
- [ ] PWA instalavel no Chrome Android
- [ ] Todos os testes passam

## Technical Decisions
- useIsMobile hook existente (768px breakpoint) para logica de sidebar
- Classes Tailwind responsivas (sm:, lg:) para layout CSS
- Service worker vanilla JS (sem workbox) para simplicidade
- Network-first para API, cache-first para assets estaticos

## Dependencies
- Depends on: useIsMobile hook (ja existe)
- Blocks: nenhum
