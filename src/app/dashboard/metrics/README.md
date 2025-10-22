# Dashboard de Métricas para Investidores - Defenz

## Visão Geral

Dashboard completo para showcasing de métricas M&A, desenvolvido para demonstrar que a Defenz é uma aquisição atrativa em 2 anos.

**Localização:** `/dashboard/metrics`

## Estrutura de Arquivos

```
/src/app/dashboard/metrics/
├── page.tsx                    # Página principal do dashboard
├── types.ts                    # TypeScript types para todas as métricas
├── hooks.ts                    # Custom hooks React Query
├── README.md                   # Esta documentação
└── components/
    ├── MetricCard.tsx          # Card reutilizável de métrica
    ├── PeriodSelector.tsx      # Seletor de período (3m, 6m, 12m, all)
    ├── ArrGrowthChart.tsx      # Gráfico de crescimento ARR
    ├── MrrBreakdownChart.tsx   # Gráfico breakdown MRR
    ├── CustomerGrowthChart.tsx # Gráfico crescimento de clientes
    ├── ChurnTrendChart.tsx     # Gráfico tendência de churn
    └── EbitdaMarginChart.tsx   # Gráfico margem EBITDA
```

## Métricas Exibidas

### Hero Section - Key Metrics Cards

1. **ARR (Annual Recurring Revenue)**
   - Formato: Currency (R$)
   - Variação: vs mês anterior
   - Importância: Receita recorrente anualizada indica previsibilidade

2. **EBITDA Margin**
   - Formato: Percentage (%)
   - Target: > 20%
   - Importância: Eficiência operacional, crítica para M&A

3. **Customer Churn Rate**
   - Formato: Percentage (%)
   - Target: < 5%
   - Importância: Retenção de clientes, satisfação

4. **LTV:CAC Ratio**
   - Formato: Number (ex: 3.2)
   - Target: > 3.0 (ideal > 4.0)
   - Importância: Eficiência na aquisição de clientes

5. **Rule of 40 Score**
   - Formato: Percentage (%)
   - Target: > 40%
   - Cálculo: Growth Rate % + EBITDA Margin %
   - Importância: Indicador de SaaS saudável

6. **Net Revenue Retention (NRR)**
   - Formato: Percentage (%)
   - Target: > 100%
   - Importância: Expansão de receita na base existente

### Charts Section

1. **ARR Growth Over Time**
   - Tipo: Line Chart (dual axis)
   - Dados: ARR (R$) + Growth Rate (%)
   - Período: Últimos 12 meses

2. **MRR Breakdown**
   - Tipo: Stacked Bar Chart
   - Componentes:
     - New MRR (novos clientes)
     - Expansion MRR (upsells)
     - Contraction MRR (downgrades)
     - Churned MRR (cancelamentos)
   - Cores: Verde, Azul, Laranja, Vermelho

3. **Customer Growth**
   - Tipo: Area + Line Chart
   - Dados:
     - Clientes Ativos (área)
     - Novos Clientes (linha)
     - Churn (linha)

4. **Churn Trend**
   - Tipo: Line Chart
   - Dados:
     - Customer Churn Rate
     - Revenue Churn Rate
   - Reference Line: Target 5%

5. **EBITDA Margin**
   - Tipo: Area Chart
   - Reference Line: Target 20%
   - Exibe: Margin %, EBITDA, Revenue

### Performance Indicators

1. **CAC Payback Period**
   - Métrica: Meses para recuperar CAC
   - Target: < 12 meses (ideal: 6-9)

2. **Burn Rate & Runway**
   - Burn Rate: R$/mês
   - Runway: Meses de sobrevivência

3. **NPS Score**
   - Escala: -100 a +100
   - Benchmarks:
     - Excelente: > 50
     - Bom: 30-50
     - Ok: 0-30

### Investor Insights

Sistema automático de análise que gera insights baseados nas métricas:
- **Crescimento:** Análise de ARR growth rate
- **Eficiência:** Análise de EBITDA margin
- **Retenção:** Análise de customer churn

## APIs Utilizadas

O dashboard consome 5 endpoints de métricas:

1. `GET /api/metrics/financial` - ARR, EBITDA, MRR, Growth
2. `GET /api/metrics/customer` - Churn, LTV:CAC, NRR, ARPU
3. `GET /api/metrics/engagement` - DAU/MAU, Retention, Activation
4. `GET /api/metrics/product-health` - NPS, CSAT, Uptime, Bugs
5. `GET /api/metrics/sales` - CAC, Pipeline, Conversion

### Query Parameters

Todos os endpoints aceitam:
- `limit`: Número de registros (padrão: 12)
- `startDate`: Data inicial (YYYY-MM-01)
- `endDate`: Data final (YYYY-MM-01)
- `version`: Versão específica dos dados

## Tecnologias

- **React 19** - Framework frontend
- **TypeScript** - Type safety
- **React Query (@tanstack/react-query)** - Data fetching e caching
- **Recharts** - Biblioteca de gráficos
- **Tailwind CSS** - Styling
- **shadcn/ui** - Componentes UI
- **date-fns** - Manipulação de datas
- **Lucide React** - Ícones

## Performance

### Otimizações Implementadas

1. **React.memo** em todos os componentes de chart
2. **useMemo** para processamento de dados
3. **React Query** com:
   - Cache de 2 minutos (staleTime)
   - Auto-refresh a cada 5 minutos
   - Fetch paralelo de todas as APIs
4. **Lazy Loading** (opcional via dynamic import)

### Métricas de Performance Esperadas

- **FCP (First Contentful Paint):** < 1.5s
- **LCP (Largest Contentful Paint):** < 2.5s
- **TTI (Time to Interactive):** < 3.5s
- **CLS (Cumulative Layout Shift):** < 0.1

## Estados do Dashboard

### Loading State
- Skeleton loaders em todos os cards e charts
- Spinner no botão de refresh

### Empty State
- Mensagem clara quando não há dados
- Call-to-action para adicionar primeira métrica

### Error State
- Alert component com mensagem de erro
- Opção de retry via botão de refresh

## Filtros e Interatividade

### Period Selector
- **3 meses:** Últimos 3 períodos
- **6 meses:** Últimos 6 períodos
- **12 meses:** Últimos 12 períodos (padrão)
- **Todos:** Todos os períodos disponíveis

### Tooltips
- Todos os cards possuem tooltips explicativos
- Charts possuem tooltips customizados com dados detalhados

### Refresh
- Botão manual de refresh
- Auto-refresh a cada 5 minutos (React Query)

## Design System

### Cores

**Métricas Positivas:**
- Verde: `#10b981` (green-500)
- Azul: `#3b82f6` (blue-500)

**Métricas Neutras:**
- Roxo: `#a855f7` (purple-500)
- Ciano: `#06b6d4` (cyan-500)

**Métricas de Atenção:**
- Amarelo: `#f59e0b` (yellow-500)
- Laranja: `#f97316` (orange-500)

**Métricas Negativas:**
- Vermelho: `#ef4444` (red-500)

### Layout Responsivo

**Mobile (< 768px):**
- 1 coluna para metric cards
- Charts em largura total
- Period selector em largura total

**Tablet (768px - 1024px):**
- 2 colunas para metric cards
- Charts 1 coluna

**Desktop (> 1024px):**
- 3 colunas para metric cards
- Charts 2 colunas (EBITDA em largura total)

## Significância das Métricas para M&A

### Métricas Críticas (Deal Breakers)

1. **ARR Growth Rate**
   - Ideal: > 20% MoM
   - Aceitável: > 10% MoM
   - Mostra tração e potencial de escala

2. **EBITDA Margin**
   - Ideal: > 20%
   - Aceitável: > 10%
   - Mostra eficiência operacional

3. **Customer Churn**
   - Ideal: < 3% mensalmente
   - Aceitável: < 5% mensalmente
   - Mostra product-market fit

4. **Rule of 40**
   - Ideal: > 50%
   - Aceitável: > 40%
   - Balanço entre crescimento e lucratividade

### Métricas de Validação

5. **LTV:CAC Ratio**
   - Ideal: > 4.0
   - Aceitável: > 3.0
   - Mostra unit economics saudável

6. **NRR (Net Revenue Retention)**
   - Ideal: > 110%
   - Aceitável: > 100%
   - Mostra expansão de receita orgânica

7. **CAC Payback Period**
   - Ideal: < 9 meses
   - Aceitável: < 12 meses
   - Velocidade de retorno do investimento

## Casos de Uso

### Para Fundadores
- Monitorar métricas críticas para M&A
- Identificar gaps antes de buscar aquisição
- Preparar narrativa para investidores

### Para Investidores/Acquirers
- Avaliar saúde financeira da empresa
- Comparar com benchmarks de mercado
- Analisar tendências e trajetória

### Para Time Executivo
- Acompanhar KPIs estratégicos
- Tomar decisões data-driven
- Comunicar progresso ao board

## Próximos Passos (Melhorias Futuras)

1. **Export para PDF**
   - Gerar relatório em PDF para investidores

2. **Comparações de Período**
   - YoY, QoQ comparisons

3. **Benchmarks de Mercado**
   - Comparar com médias do setor

4. **Projeções**
   - Forecast de métricas futuras

5. **Alerts**
   - Notificações quando métricas ficarem fora do target

6. **Cohort Analysis**
   - Análise de cohorts de clientes

7. **Unit Economics Deep Dive**
   - Dashboard específico para unit economics

## Troubleshooting

### Problema: Gráficos não aparecem
**Solução:** Verificar se há dados nas APIs de métricas

### Problema: Loading infinito
**Solução:** Verificar console do browser para erros de API

### Problema: Métricas zeradas
**Solução:** Cadastrar métricas via POST nas APIs correspondentes

### Problema: Período não atualiza
**Solução:** Verificar implementação de `periodFilterToParams` no hooks.ts

## Contato

Para dúvidas ou suporte sobre o dashboard de métricas:
- Verificar documentação das APIs em `/api/metrics/*`
- Consultar tipos em `types.ts`
- Revisar implementação dos hooks em `hooks.ts`

---

**Desenvolvido para o projeto Defenz - Dashboard M&A Ready**
