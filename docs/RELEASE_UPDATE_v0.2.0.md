# Defenz - Documento de Atualização v0.2.0

**Plataforma de Gestão Estratégica de Atividades**
Data: 05 de Abril de 2026
Versão: 0.2.0

---

## 1. Visão Geral

O **Defenz** é uma plataforma web de gestão estratégica de demandas e atividades, projetada para equipes que precisam de visibilidade, controle e rastreabilidade sobre o trabalho em andamento.

A plataforma permite que gestores e equipes acompanhem demandas em tempo real através de quadro Kanban, gráfico Gantt, tabelas filtráveis e relatórios executivos gerados por inteligência artificial.

**Acesso:** [https://defenz-todo.vercel.app](https://defenz-todo.vercel.app)

---

## 2. Evolução do Produto

### Linha do Tempo

| Período | Marco | Entregas Principais |
|---------|-------|-------------------|
| **Out/2025** | Fundação | Infraestrutura inicial, autenticação, CRUD básico, sistema de email, migração para PostgreSQL |
| **Mar/2025** | Redesign Visual | Tema Azure Shield, logo Defenz, Gantt timeline, frosted glass UI |
| **Mar/2025** | Enterprise Polish | Dashboard Memphis Corporate, sidebar escura, KPIs, perfil de usuário, notificações Resend |
| **Mar/2025** | Colaboração | Board compartilhado, registro por convite, gestão de usuários, Kanban v2 (WIP limits, blocked lane, drag-and-drop) |
| **Mar/2025** | Filtros Avançados | Classificação por área, filtro por período, datas de lifecycle, layout responsivo, PWA |
| **Mar/2026** | Multi-Tenant | Hierarquia Company > Team, branding por empresa (logo + cor), links em demandas, permissões por role |
| **Abr/2026** | Inteligência Artificial | Lembretes por email com cron jobs, relatório executivo com IA (Google Gemini), apresentação em slides |

### Em Números

- **6 meses** de desenvolvimento ativo (Out/2025 — Abr/2026)
- **40+ commits** de funcionalidades e correções
- **39 arquivos de teste** cobrindo API, componentes, hooks e validações
- **24 especificações** de features documentadas
- **50+ componentes UI** reutilizáveis (shadcn/ui)

---

## 3. Módulos Entregues

### 3.1 Quadro Kanban

O coração da plataforma. Visualização drag-and-drop das demandas em 5 colunas de status:

- **Solicitada** — demanda registrada, aguardando seleção
- **Selecionada** — aprovada para execução
- **Em Andamento** — trabalho em curso
- **Concluída** — entrega finalizada
- **Bloqueada** — impedimento identificado

**Recursos:**
- Arrastar e soltar entre colunas (atualização em tempo real)
- Limites WIP (Work-In-Progress) por coluna e por responsável
- Cards com indicadores visuais: prioridade, classificação, subtarefas, links, lembretes
- Lane especial para itens bloqueados com rastreio de origem
- Auto-refresh a cada 30 segundos

### 3.2 Gráfico Gantt (Timeline)

Visualização temporal das demandas ativas com:
- Escalas configuráveis: horas, dias, semanas, meses
- Indicador "hoje" (linha vermelha)
- Clique na barra para navegar ao card no Kanban
- Barras coloridas por origem/classificação

### 3.3 Visão em Tabela

Tabela ordenável e filtrável usando TanStack Table, com todas as colunas da demanda visíveis e exportáveis.

### 3.4 Painel de Análises

Dashboard analítico (admin/gerência) com gráficos Recharts:
- Distribuição por status (pizza)
- Classificação por área (barras)
- Carga de trabalho por responsável
- Métricas de timeline (taxa de conclusão, duração média)
- Distribuição por prioridade

### 3.5 Relatório Executivo com IA

Geração automática de relatórios executivos utilizando **Google Gemini**:
- Resumo das entregas do período
- Entregas agrupadas por área (Tecnologia, Marketing, Vendas, etc.)
- Métricas quantitativas (total, por área, por responsável)
- Destaques e observações estratégicas
- **Dois modos de visualização**: documento contínuo ou apresentação em slides
- Filtros por período (7 dias, 30 dias, intervalo personalizado)
- Copiar para clipboard e imprimir

### 3.6 Sistema Multi-Tenant

Arquitetura de isolamento por empresa:

```
Empresa (Company)
  ├── Branding (logo + cor de destaque)
  ├── Equipe A (Team)
  │     └── Usuários
  ├── Equipe B (Team)
  │     └── Usuários
  └── Demandas (filtradas por empresa/equipe)
```

- Cada empresa define seu logo e cor de identidade visual
- Sidebar e header refletem o branding da empresa do usuário logado
- Administradores visualizam todas as empresas

### 3.7 Controle de Acesso por Papel (RBAC)

Três níveis de permissão:

| Papel | Kanban | Análises | Relatório | Usuários | Equipes | Logs |
|-------|--------|----------|-----------|----------|---------|------|
| **Admin** | Total | Sim | Sim | CRUD | CRUD | Sim |
| **Gerência** | Total | Sim | Sim | Ver + Convidar | Ver | Sim |
| **Usuário** | Próprias demandas | Nao | Nao | Nao | Nao | Nao |

### 3.8 Registro por Convite

Acesso controlado ao sistema:
1. Admin ou gerente cria um **token de convite** com papel, empresa e equipes pré-definidos
2. Novo usuário acessa link de registro com o token
3. Token é validado e consumido no cadastro
4. Usuário herda automaticamente as permissões do convite

### 3.9 Lembretes e Notificações

- **Lembretes por email**: cron job diário (11h UTC) verifica demandas com data de lembrete
- **Indicador visual**: sino com animação pulse nos cards do Kanban
- **Preferências**: cada usuário configura quais notificações receber
- **Horário de silêncio**: período configurável sem notificações
- **Serviço de email**: Resend com templates React Email

### 3.10 Auditoria Completa

Todo CRUD em demandas gera registro de auditoria:
- Ação (CREATE, UPDATE, DELETE, IMPORT)
- Usuário responsável
- Timestamp
- Diff das alterações (campo a campo)
- Visualizável na página de Logs (admin/gerência)

### 3.11 Importação em Massa

Upload de planilha Excel (.xlsx) para importar múltiplas demandas de uma vez, com validação de campos e registro de auditoria.

---

## 4. Arquitetura Técnica (Resumo)

| Camada | Tecnologia | Propósito |
|--------|-----------|-----------|
| Frontend | Next.js 16 + React 19 | Interface web responsiva |
| Design System | Tailwind CSS 4 + shadcn/ui | Componentes visuais padronizados |
| Backend | Next.js API Routes | Endpoints REST seguros |
| Banco de Dados | PostgreSQL (Neon) | Armazenamento com connection pooling |
| ORM | Prisma 6 | Modelagem e queries tipadas |
| Autenticação | NextAuth.js (JWT) | Sessões seguras com papéis |
| Email | Resend | Notificações transacionais |
| IA | Google Gemini | Relatórios executivos inteligentes |
| Hospedagem | Vercel | Deploy automático, cron jobs, CDN global |

**Destaques de engenharia:**
- TypeScript end-to-end (frontend, backend, validações, testes)
- Validação de dados com Zod em todas as APIs
- Sanitização HTML (DOMPurify) contra XSS
- Senhas com bcrypt (hash + salt)
- Sessões JWT (sem cookies de sessão no banco)
- Testes automatizados com Vitest + Testing Library

---

## 5. Segurança e Compliance

| Controle | Implementação |
|----------|--------------|
| Autenticação | Credenciais com hash bcrypt, sessões JWT assinadas |
| Autorização | RBAC (admin/gerência/usuário), verificação em cada endpoint |
| Registro | Apenas por convite com token único e expiração |
| Auditoria | Log imutável de toda operação CRUD |
| Proteção XSS | Sanitização com DOMPurify/isomorphic-dompurify |
| Proteção CSRF | Tokens NextAuth com validação de origem |
| Dados sensíveis | Variáveis de ambiente, nunca hardcoded |
| Multi-tenant | Isolamento por empresa, dados filtrados por sessão |

---

## 6. Qualidade e Testes

- **39 arquivos de teste** organizados junto ao código testado
- **Cobertura**: API routes, componentes React, hooks, validações Zod, utilitários
- **Mocks estruturados**: banco de dados (Prisma), autenticação, servidor Next.js
- **Fixtures**: dados de teste realistas para demandas
- **CI**: build + type-check + testes devem passar antes de qualquer deploy

---

## 7. Experiência do Usuário

### Tema Visual: Azure Shield
- Paleta azul profissional com suporte a dark mode
- Sidebar escura fixa (#1C2536) para navegação consistente
- Cards com sombras sutis e hover states
- Animações suaves (Framer Motion)
- Responsivo: desktop, tablet e mobile
- PWA: instalável como aplicativo

### Produtividade
- **Cmd+K**: busca rápida de demandas
- **Drag-and-drop**: mover demandas entre status arrastando
- **Auto-refresh**: dados atualizados a cada 30s
- **Filtros combinados**: origem, responsável, classificação, período, prioridade
- **Subtarefas**: checklist dentro de cada demanda
- **Links**: URLs relevantes anexadas às demandas

---

## 8. Próximos Passos (Roadmap)

Funcionalidades planejadas para as próximas iterações:

- **Comentários em demandas** — colaboração contextualizada
- **Dashboard de métricas de negócio** — KPIs financeiros e operacionais
- **CRM integrado** — gestão de clientes e pipeline de vendas (modelos já no banco)
- **Webhooks** — integrações com ferramentas externas
- **API pública** — acesso programático ao Defenz
- **App mobile** — acesso nativo via React Native
- **Integração calendário** — sincronização com Google/Outlook
- **Exportação PDF** — relatórios para download

---

## 9. Como Acessar

| Ambiente | URL |
|----------|-----|
| Produção | https://defenz-todo.vercel.app |
| Desenvolvimento | http://localhost:3000 |

**Primeiro acesso:** Solicite um convite ao administrador do sistema. Você receberá um link de registro com suas permissões pré-configuradas.

---

## 10. Glossário

| Termo | Significado |
|-------|------------|
| **Demanda** | Unidade de trabalho no sistema (tarefa, atividade, solicitação) |
| **Kanban** | Quadro visual com colunas representando etapas do fluxo de trabalho |
| **Gantt** | Gráfico de barras horizontais mostrando cronograma das demandas |
| **WIP Limit** | Limite de trabalho em progresso — evita sobrecarga |
| **RBAC** | Controle de acesso baseado em papéis (Role-Based Access Control) |
| **Multi-tenant** | Arquitetura que isola dados por empresa |
| **JWT** | Token seguro para manter sessão do usuário |
| **Cron job** | Tarefa automática executada em horário programado |
| **Sprint** | Ciclo de desenvolvimento com entregas definidas |

---

*Documento gerado em 05/04/2026 — Defenz v0.2.0*
*Desenvolvido por Marcos Cruz*
