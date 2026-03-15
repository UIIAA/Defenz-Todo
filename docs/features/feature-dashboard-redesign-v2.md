# Feature: Dashboard Redesign V2 — Dark Sidebar + Light Content
**Status:** Approved
**Priority:** P0
**Date:** 2026-03-15

## Objective
Redesenhar o dashboard seguindo as referencias visuais aprovadas: sidebar escura (dark navy), content area clara, KPI cards com barra colorida no topo, filtros pill arredondados, timeline com fundo azul claro. Adicionar menu Configuracoes com Logs, info do usuario e email para notificacoes.

## Behavior
1. Sidebar tem fundo escuro com texto branco e item ativo em pill azul
2. Dropdown "Demandas" com sub-itens Kanban e Analises (manter)
3. Dropdown "Configuracoes" com sub-itens: Logs, Perfil (email/notificacoes)
4. Content area com fundo claro e cards brancos com sombra
5. KPI cards com barra colorida no topo
6. Filtros pill arredondados, ativo em azul solido
7. Timeline com fundo azul claro e grid vertical

## Design Spec

### Sidebar
- Fundo: `#1C2536` (dark navy) — fixo em light e dark mode
- Texto: branco (`#FFFFFF`) com opacidade para inativos (`#94A3B8`)
- Logo: Defenz icon + texto branco no topo
- Nav items: icone + texto, `py-2.5 px-4 rounded-lg`
- Item ativo: `bg-blue-500 text-white rounded-lg` (pill azul preenchido)
- Item inativo: `text-slate-400 hover:text-white hover:bg-white/10`
- Dropdowns com chevron, sub-itens indentados

### Sidebar Navigation Structure
```
[Logo DEFENZ.]
─────────────
📋 Demandas          ▾
   ├─ Kanban
   └─ Analises
⚙️ Configuracoes     ▾  (admin/gerencia only)
   ├─ Logs
   └─ Perfil
─────────────
[User avatar + name]
[Logout]
```

### Header
- Fundo: branco `#FFFFFF` com border bottom `border-slate-200`
- Hamburger menu no esquerdo
- User name + theme toggle + logout no direito

### Content Area
- Fundo: `#F0F4F8` (light gray-blue)
- Dark mode: `#0f172a` (slate-900)
- Cards: `bg-white rounded-xl shadow-sm border border-slate-200`

### KPI Cards
- Brancos com sombra `shadow-sm`
- Barra colorida no TOPO (3px, rounded-t-xl, cor semantica)
- Numero grande (text-2xl font-bold)
- Label pequena embaixo (text-xs uppercase tracking-wider text-slate-500)
- 6 cards em grid responsivo (grid-cols-2 sm:grid-cols-3 lg:grid-cols-6)

### Filter Bar
- Pills arredondados (`rounded-full px-4 py-2`)
- Ativo: `bg-blue-500 text-white shadow-sm`
- Inativo: `bg-white text-slate-600 border border-slate-200 hover:bg-slate-50`

### Kanban Cards
- Fundo branco, border `border-slate-200`, rounded-xl
- Left border colorida 3px (por origem)
- Titulo 14px font-semibold text-slate-800
- Hover: shadow-md, translate-y -1px

### Timeline/Gantt
- Container card com fundo `bg-blue-50` (light mode) / `bg-slate-800/40` (dark)
- Barras em tons de azul
- Grid vertical em `border-blue-200/40`
- Today marker em `bg-blue-500`

### Pagina Perfil (/dashboard/configuracoes/perfil)
- Exibir dados do usuario (nome, email, role)
- Campo email para notificacoes push
- Toggle on/off para receber notificacoes
- Botao salvar

### Email / Notificacoes
- Usar Resend (ja instalado no projeto) — nao precisa SMTP
- API key do Resend como env var: `RESEND_API_KEY`
- Enviar notificacoes quando: demanda atribuida, prazo proximo, status alterado
- Configurar na Vercel: adicionar `RESEND_API_KEY` nas env vars

## Arquivos Afetados
- `src/app/dashboard/layout.tsx` — sidebar + header redesign
- `src/app/dashboard/demandas/page.tsx` — KPIs, filtros, kanban, timeline
- `src/app/dashboard/configuracoes/perfil/page.tsx` — **CRIAR** pagina de perfil
- `src/app/globals.css` — ajustar tokens

## Fases de Implementacao

### Fase 1 — Visual (esta sessao)
- Sidebar escura com nav structure
- Content area clara
- KPI cards redesign
- Filtros pill
- Timeline azul claro

### Fase 2 — Configuracoes (proxima sessao)
- Menu Configuracoes no sidebar
- Pagina Perfil com email
- Integracao Resend para notificacoes

## Acceptance Criteria

### Fase 1
- [ ] Sidebar escura (#1C2536) com pill azul ativo
- [ ] Dropdown Demandas mantido (Kanban + Analises)
- [ ] Dropdown Configuracoes (Logs + Perfil) visivel para admin/gerencia
- [ ] Content area fundo #F0F4F8
- [ ] KPI cards com barra colorida no TOPO
- [ ] Filtros pill arredondados (ativo azul solido)
- [ ] Timeline com bg-blue-50 e grid vertical
- [ ] Cards brancos com shadow-sm e border-slate-200
- [ ] Dark mode funcional
- [ ] Build passa sem erros
- [ ] 69 testes passam

### Fase 2
- [ ] Pagina /dashboard/configuracoes/perfil
- [ ] Campo email para notificacoes
- [ ] Resend integrado (RESEND_API_KEY)
- [ ] Notificacoes por email funcionando

## Technical Decisions
- Resend em vez de SMTP (serverless-friendly, ja instalado)
- Sidebar escura fixa (nao muda em dark/light mode)
- KPI barra no topo (nao na lateral) — referencia visual aprovada
- Dropdown mantido para Demandas
- Novo dropdown Configuracoes para admin/gerencia

## Dependencies
- Resend (`resend: ^6.1.2`) — ja instalado
- Nenhuma nova biblioteca necessaria
- Env var: `RESEND_API_KEY` (Fase 2)
