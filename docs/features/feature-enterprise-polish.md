# Feature: Enterprise Polish — 3 Sprints
**Status:** Approved
**Priority:** P0
**Date:** 2026-03-15

## Objective
Transformar o Defenz de um dashboard funcional para um dashboard enterprise-grade, adotando padroes Apple (qualidade material), Microsoft (densidade de dados) e HP Enterprise (estrutura operacional).

---

## Sprint 1 — Impacto Visual Imediato

### 1.1 Dashboard Home (/dashboard/page.tsx)
- Substituir redirect por pagina real
- Saudacao personalizada ("Bom dia, Marcos")
- Cards de resumo: demandas em andamento, atrasadas, concluidas hoje
- Lista "Atividade recente" (ultimas 5 acoes do audit log)
- Botoes rapidos: Nova Demanda, Ver Kanban, Ver Analises
- Usar Recharts para sparklines nos KPI cards

### 1.2 Breadcrumbs no Header
- Componente Breadcrumb do shadcn/ui (ja instalado, nao usado)
- Derivar path do usePathname()
- Mapeamento: demandas→"Demandas", analises→"Analises", etc

### 1.3 Loading Skeletons
- Substituir spinner por Skeleton do shadcn/ui (ja instalado)
- DemandasSkeleton: 6 KPI skeletons + 5 colunas kanban com 3 cards cada
- DashboardSkeleton: cards de resumo + lista de atividade

### 1.4 Empty States
- Componente reutilizavel EmptyState com icone + titulo + descricao + CTA
- Kanban vazio: "Nenhuma demanda ainda" + botao "Criar primeira demanda"
- Timeline vazio: ja existe texto, melhorar com icone

### 1.5 Sombras Apple-style
- Dual shadow em todos os cards: `0 1px 2px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)`
- Hover cards: shadow aumenta

## Sprint 2 — Interacao Enterprise

### 2.1 View Toggle: Kanban / Lista
- Botoes toggle no header da secao Demandas
- View Lista: tabela com colunas sortaveis (Titulo, Origem, Prioridade, Status, Responsavel, Prazo)
- Usar componente Table do shadcn/ui
- Badges de status com cores consistentes

### 2.2 Graficos Recharts na Analises
- Substituir barras HTML por BarChart/PieChart do Recharts (ja instalado)
- Status distribution: PieChart
- Origin breakdown: BarChart
- Trend over time: LineChart/AreaChart (se houver dados temporais)

### 2.3 Trend Cards nos KPIs
- Cada KPI mostra: valor atual + variacao (seta up/down + percentual)
- Sparkline mini abaixo do numero (Recharts Sparkline)

## Sprint 3 — Polish Premium

### 3.1 Busca Global (Cmd+K)
- Usar Command do shadcn/ui (ja instalado)
- Buscar demandas por titulo
- Navegacao rapida entre paginas
- Atalho Cmd+K / Ctrl+K

### 3.2 Componentes reutilizaveis
- StatusBadge: badge colorido por status
- UserAvatar: avatar com iniciais (shadcn Avatar, ja instalado)
- EmptyState: icone + texto + CTA

### 3.3 Keyboard shortcuts
- N: nova demanda
- I: importar
- /: focar busca
- Mostrar hints nos botoes

---

## Arquivos a Criar
- `src/app/dashboard/page.tsx` — REESCREVER (era redirect)
- `src/components/empty-state.tsx` — CRIAR
- `src/components/status-badge.tsx` — CRIAR
- `src/components/search-command.tsx` — CRIAR

## Arquivos a Modificar
- `src/app/dashboard/layout.tsx` — breadcrumbs no header
- `src/app/dashboard/demandas/page.tsx` — skeletons, empty states, shadows, view toggle
- `src/app/dashboard/demandas/analises/page.tsx` — Recharts

## Acceptance Criteria
- [ ] Dashboard home com saudacao + KPIs + atividade recente
- [ ] Breadcrumbs no header em todas as paginas
- [ ] Loading skeletons em vez de spinner
- [ ] Empty states com CTA
- [ ] Sombras dual em todos os cards
- [ ] View toggle Kanban/Lista
- [ ] Graficos Recharts na analises
- [ ] Trend cards nos KPIs
- [ ] Busca global Cmd+K
- [ ] StatusBadge reutilizavel
- [ ] Build passa
- [ ] Testes passam
