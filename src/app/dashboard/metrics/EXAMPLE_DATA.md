# Exemplo de Dados para Testar o Dashboard de Métricas

Este arquivo contém exemplos de payloads JSON para popular o dashboard de métricas para investidores.

## Como Adicionar Métricas

Use as APIs via Postman, curl ou interface:

### 1. Métricas Financeiras

**Endpoint:** `POST /api/metrics/financial`

```json
{
  "period": "2025-10-01",
  "mrr": 50000,
  "arr": 600000,
  "newMrr": 5000,
  "expansionMrr": 2000,
  "contractionMrr": 500,
  "churnedMrr": 1000,
  "netNewMrr": 5500,
  "mrrGrowthRate": 12.5,
  "arrGrowthRate": 35.0,
  "revenue": 55000,
  "cogs": 10000,
  "operatingExpenses": 30000,
  "ebitda": 15000,
  "ebitdaMargin": 27.3,
  "grossProfit": 45000,
  "grossMargin": 81.8,
  "burnRate": 15000,
  "cashBalance": 180000,
  "runway": 12,
  "ruleOf40Score": 62.3,
  "source": "manual",
  "notes": "Q4 2025 - Crescimento acelerado"
}
```

**Exemplo com curl:**
```bash
curl -X POST http://localhost:3000/api/metrics/financial \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "period": "2025-10-01",
    "mrr": 50000,
    "arr": 600000,
    "newMrr": 5000,
    "expansionMrr": 2000,
    "contractionMrr": 500,
    "churnedMrr": 1000,
    "netNewMrr": 5500,
    "mrrGrowthRate": 12.5,
    "arrGrowthRate": 35.0,
    "revenue": 55000,
    "cogs": 10000,
    "operatingExpenses": 30000,
    "ebitda": 15000,
    "ebitdaMargin": 27.3,
    "grossProfit": 45000,
    "grossMargin": 81.8,
    "burnRate": 15000,
    "cashBalance": 180000,
    "runway": 12,
    "ruleOf40Score": 62.3
  }'
```

### 2. Métricas de Clientes

**Endpoint:** `POST /api/metrics/customer`

```json
{
  "period": "2025-10-01",
  "activeCustomers": 150,
  "newCustomers": 12,
  "churnedCustomers": 3,
  "netNewCustomers": 9,
  "customerChurnRate": 2.0,
  "revenueChurnRate": 1.5,
  "netRevenueRetention": 110.0,
  "averageLtv": 12000,
  "averageCac": 3000,
  "ltvCacRatio": 4.0,
  "cacPaybackMonths": 8,
  "arpu": 333.33,
  "arpuGrowth": 5.5,
  "customerGrowthRate": 6.4,
  "source": "manual",
  "notes": "Churn baixo, LTV:CAC excelente"
}
```

### 3. Métricas de Engajamento

**Endpoint:** `POST /api/metrics/engagement`

```json
{
  "period": "2025-10-01",
  "dau": 85,
  "mau": 140,
  "wau": 110,
  "dauMauRatio": 60.7,
  "avgSessionsPerUser": 4.5,
  "avgSessionDuration": 25.0,
  "avgActivitiesPerUser": 8.2,
  "avgTimeToFirstValue": 3.5,
  "activationRate": 75.0,
  "weeklyRetention": 82.0,
  "monthlyRetention": 68.0,
  "quarterlyRetention": 55.0,
  "powerUserPercentage": 25.0,
  "source": "manual",
  "notes": "Engajamento alto, boa ativação"
}
```

### 4. Métricas de Product Health

**Endpoint:** `POST /api/metrics/product-health`

```json
{
  "period": "2025-10-01",
  "npsScore": 52,
  "npsPromoters": 65,
  "npsDetractors": 13,
  "csatScore": 4.3,
  "uptime": 99.95,
  "avgResponseTime": 180,
  "p95ResponseTime": 450,
  "errorRate": 0.15,
  "bugCount": 8,
  "criticalBugsCount": 1,
  "avgTimeToResolution": 2.5,
  "avgFirstResponseTime": 4.2,
  "ticketsResolved": 42,
  "ticketsCreated": 38,
  "source": "manual",
  "notes": "NPS excelente, uptime > 99.9%"
}
```

### 5. Métricas de Vendas

**Endpoint:** `POST /api/metrics/sales`

```json
{
  "period": "2025-10-01",
  "salesMarketingSpend": 36000,
  "newCustomers": 12,
  "cac": 3000,
  "pipelineValue": 250000,
  "pipelineCoverage": 4.2,
  "avgDealSize": 4000,
  "avgSalesCycle": 21,
  "leadToMql": 35.0,
  "mqlToSql": 55.0,
  "sqlToWon": 40.0,
  "overallConversionRate": 7.7,
  "winRate": 42.0,
  "dealsWon": 12,
  "dealsLost": 16,
  "source": "manual",
  "notes": "Win rate crescendo, CAC controlado"
}
```

## Exemplo Completo: Adicionar 12 Meses de Dados

Para popular o dashboard com um ano de dados de exemplo, use este script:

### Script Node.js

```javascript
const months = [
  { month: '2024-11-01', arr: 400000, growth: 25 },
  { month: '2024-12-01', arr: 450000, growth: 28 },
  { month: '2025-01-01', arr: 500000, growth: 30 },
  { month: '2025-02-01', arr: 525000, growth: 32 },
  { month: '2025-03-01', arr: 550000, growth: 33 },
  { month: '2025-04-01', arr: 570000, growth: 34 },
  { month: '2025-05-01', arr: 585000, growth: 35 },
  { month: '2025-06-01', arr: 595000, growth: 35 },
  { month: '2025-07-01', arr: 600000, growth: 35 },
  { month: '2025-08-01', arr: 605000, growth: 35 },
  { month: '2025-09-01', arr: 610000, growth: 35 },
  { month: '2025-10-01', arr: 620000, growth: 36 }
];

async function populateMetrics() {
  for (const data of months) {
    const mrr = data.arr / 12;

    // Financial Metrics
    await fetch('http://localhost:3000/api/metrics/financial', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        period: data.month,
        mrr,
        arr: data.arr,
        newMrr: mrr * 0.1,
        expansionMrr: mrr * 0.04,
        contractionMrr: mrr * 0.01,
        churnedMrr: mrr * 0.02,
        netNewMrr: mrr * 0.11,
        mrrGrowthRate: data.growth / 3,
        arrGrowthRate: data.growth,
        revenue: mrr * 1.1,
        cogs: mrr * 0.18,
        operatingExpenses: mrr * 0.55,
        ebitda: mrr * 0.27,
        ebitdaMargin: 24.5,
        grossProfit: mrr * 0.82,
        grossMargin: 81.8,
        burnRate: mrr * 0.28,
        cashBalance: 180000,
        runway: 12,
        ruleOf40Score: data.growth + 24.5
      })
    });

    // Customer Metrics
    const customers = Math.floor(data.arr / 4000);
    await fetch('http://localhost:3000/api/metrics/customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        period: data.month,
        activeCustomers: customers,
        newCustomers: Math.floor(customers * 0.08),
        churnedCustomers: Math.floor(customers * 0.02),
        netNewCustomers: Math.floor(customers * 0.06),
        customerChurnRate: 2.0,
        revenueChurnRate: 1.5,
        netRevenueRetention: 110.0,
        averageLtv: 12000,
        averageCac: 3000,
        ltvCacRatio: 4.0,
        cacPaybackMonths: 8,
        arpu: data.arr / customers,
        arpuGrowth: 5.5,
        customerGrowthRate: 6.4
      })
    });

    console.log(`✓ Added metrics for ${data.month}`);
  }
}

populateMetrics();
```

## Valores Ideais para M&A

Para mostrar que a empresa está pronta para M&A, mantenha estes targets:

### Métricas Críticas ✨
- **ARR Growth:** > 30% YoY
- **EBITDA Margin:** > 20%
- **Customer Churn:** < 5% monthly
- **Rule of 40:** > 40% (ideal > 50%)
- **LTV:CAC Ratio:** > 3.0 (ideal > 4.0)
- **NRR:** > 100% (ideal > 110%)
- **CAC Payback:** < 12 months (ideal 6-9)

### Métricas de Suporte 📊
- **DAU/MAU Ratio:** > 40%
- **Monthly Retention:** > 60%
- **NPS Score:** > 50
- **Uptime:** > 99.9%
- **Win Rate:** > 30%

## Narrativa para Investidores

Com métricas sólidas, crie a narrativa:

> "A Defenz apresenta métricas excepcionais para M&A:
> - ARR de R$ 600k crescendo 35% YoY
> - EBITDA Margin de 27%, bem acima do target de 20%
> - Churn de apenas 2%, indicando alta satisfação
> - Rule of 40 de 62%, demonstrando SaaS saudável
> - LTV:CAC de 4.0, mostrando unit economics eficiente
> - NRR de 110%, com expansão orgânica da base"

## Próximos Passos

1. Adicionar métricas mensais via API
2. Acessar `/dashboard/metrics`
3. Verificar todos os gráficos e cards
4. Ajustar período de visualização (3m, 6m, 12m)
5. Exportar para apresentação de investidores (futuro)

---

**Pro tip:** Comece adicionando dados dos últimos 3 meses para testar rapidamente, depois expanda para 12 meses para análises completas.
