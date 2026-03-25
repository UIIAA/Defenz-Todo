# Feature: PWA (Progressive Web App)
**Status:** Draft
**Priority:** P1
**Date:** 2026-03-22

## Objective
Tornar o Defenz instalavel no celular (Android/iOS) como app nativo, com icone na home screen, abertura fullscreen e cache offline de assets.

## Behavior
1. Usuario abre o site no Chrome (Android) ou Safari (iOS)
2. Browser exibe opcao "Adicionar a tela inicial" / "Add to Home Screen"
3. App instala com icone Defenz, abre em standalone (sem barra do browser)
4. Assets estaticos (JS, CSS, fontes, imagens) sao cacheados pelo service worker
5. Paginas carregam mais rapido em acessos subsequentes

## Escopo

### Incluido
- `manifest.json` com metadata do app (nome, icones, cores, display standalone)
- Service Worker com cache de assets estaticos (network-first para API, cache-first para assets)
- Meta tags para iOS (apple-touch-icon, apple-mobile-web-app-capable, status-bar-style)
- Viewport meta tag otimizada para mobile
- Icones PWA em multiplos tamanhos (192x192, 512x512)

### Excluido
- Push notifications (feature futura)
- Sincronizacao offline de dados (feature futura)
- Publicacao na Play Store / App Store (nao necessario para PWA)

## Business Rules
- O app deve funcionar 100% online — service worker so cacheia assets, nao dados
- JWT sessions do NextAuth continuam funcionando normalmente
- Tema visual (Azure Shield) deve ser respeitado no splash screen

## Edge Cases
- iOS Safari nao suporta service worker em modo standalone em versoes antigas → graceful degradation
- Se service worker falhar, app funciona normalmente sem cache
- Atualizacao do app: service worker detecta nova versao e atualiza na proxima visita

## Data Contract
- Input: nenhum (configuracao estatica)
- Output: manifest.json, service worker, meta tags
- Persistence: nenhuma (cache do browser)

## Acceptance Criteria
- [ ] manifest.json valido com name, icons, theme_color, background_color, display: standalone
- [ ] Service worker registrado e cacheando assets estaticos
- [ ] Meta tags iOS presentes no layout.tsx
- [ ] App instalavel no Chrome Android (prompt "Add to Home Screen")
- [ ] App abre fullscreen (sem barra de URL)
- [ ] Icone Defenz aparece na home screen
- [ ] Lighthouse PWA score >= 90
- [ ] Testes unitarios para registro do service worker
- [ ] Build de producao passa sem erros

## Technical Decisions
- Usar Next.js metadata API para manifest link e meta tags (sem next-pwa — dependencia desnecessaria)
- Service worker manual em `public/sw.js` (simples, sem framework)
- Gerar icones PWA a partir do `defenz-icon.png` existente
- Cores do manifest: theme_color `#1C2536` (sidebar navy), background_color `#1C2536`

## Dependencies
- Depends on: assets em /public (defenz-icon.png ja existe)
- Blocks: nenhum
