# ActivityInsight - Exemplos Práticos

## Exemplo Completo: Fluxo de Análise

### 1. Usuário cria atividade

```typescript
// src/app/api/activities/route.ts
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const data = await req.json();

  const activity = await prisma.activity.create({
    data: {
      title: 'Implementar chatbot de atendimento',
      description: 'Sistema de chatbot com IA para suporte 24/7',
      area: 'Marketing',
      priority: 0, // Alta
      status: 'pending',
      responsible: 'João Silva',
      deadline: '2025-11-30',
      cost: 'R$ 15.000',
      userId: data.userId,
    },
  });

  // Disparar análise de IA em background
  await triggerAIAnalysis(activity.id, data.userId);

  return Response.json(activity);
}
```

### 2. Análise de IA (background job)

```typescript
// src/lib/ai/analyze-activity.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import type {
  BusinessIndicator,
  MAMetric,
  InsightAnalysisResponse,
} from '@/types/activity-insight';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function analyzeActivity(
  activityId: string,
  userId: string
): Promise<InsightAnalysisResponse> {
  const startTime = Date.now();

  // 1. Buscar atividade
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
  });

  if (!activity) throw new Error('Activity not found');

  // 2. Construir prompt
  const prompt = buildAnalysisPrompt(activity);

  // 3. Chamar Gemini API
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  const response = result.response.text();

  // 4. Parsear resposta
  const analysis = JSON.parse(response);

  // 5. Calcular scores
  const businessScore = calculateAggregateScore(analysis.businessIndicators);
  const maScore = calculateAggregateScore(analysis.maMetrics);

  // 6. Salvar insight
  await prisma.activityInsight.create({
    data: {
      activityId,
      createdBy: userId,
      businessIndicators: analysis.businessIndicators,
      businessScore,
      maMetrics: analysis.maMetrics,
      maScore,
      aiModel: 'gemini-1.5-flash',
      aiConfidence: analysis.confidence,
      processingTime: Date.now() - startTime,
      tokenCount: result.response.usageMetadata?.totalTokenCount,
      analysisPrompt: prompt,
      rawResponse: response,
      analysisVersion: '1.0',
    },
  });

  return {
    businessIndicators: analysis.businessIndicators,
    businessScore,
    maMetrics: analysis.maMetrics,
    maScore,
    aiConfidence: analysis.confidence,
    processingTime: Date.now() - startTime,
    tokenCount: result.response.usageMetadata?.totalTokenCount,
  };
}

function buildAnalysisPrompt(activity: Activity): string {
  return `
Analise a seguinte atividade e identifique:

1. **Business Indicators**: Indicadores operacionais que serão impactados
2. **M&A Metrics**: Métricas financeiras/de valorização impactadas

**Atividade:**
- Título: ${activity.title}
- Descrição: ${activity.description || 'N/A'}
- Área: ${activity.area}
- Prioridade: ${activity.priority === 0 ? 'Alta' : activity.priority === 1 ? 'Média' : 'Baixa'}
- Responsável: ${activity.responsible || 'N/A'}
- Método: ${activity.how || 'N/A'}
- Custo: ${activity.cost || 'N/A'}

**Formato da resposta (JSON):**
{
  "businessIndicators": [
    {
      "name": "Nome do Indicador",
      "impact": 0-100,
      "confidence": "low" | "medium" | "high",
      "explanation": "Por que este indicador é impactado"
    }
  ],
  "maMetrics": [
    {
      "name": "ARR" | "MRR" | "Customer Churn Rate" | ...,
      "impact": 0-100,
      "confidence": "low" | "medium" | "high",
      "explanation": "Por que esta métrica é impactada"
    }
  ],
  "confidence": 0.0-1.0
}

**Métricas M&A válidas:**
ARR, MRR, MRR Growth Rate, EBITDA, EBITDA Margin, Gross Margin, Customer Churn Rate,
Revenue Churn Rate, Net Revenue Retention, LTV:CAC Ratio, CAC Payback Period, ARPU,
DAU/MAU Ratio, Activation Rate, NPS Score, CSAT Score, Product Uptime, CAC,
Sales Cycle Length, Lead Conversion Rate

**Importante:**
- Seja específico e prático
- Impact = severidade/importância (0-100)
- Confidence = quão certo está da análise
- Retorne apenas JSON válido
`;
}

function calculateAggregateScore(
  items: Array<{ impact: number; confidence: string }>
): number {
  if (items.length === 0) return 0;

  // Peso por confiança
  const weights = { low: 0.5, medium: 0.8, high: 1.0 };

  const totalWeightedImpact = items.reduce((sum, item) => {
    const weight = weights[item.confidence as keyof typeof weights];
    return sum + item.impact * weight;
  }, 0);

  const totalWeight = items.reduce((sum, item) => {
    return sum + weights[item.confidence as keyof typeof weights];
  }, 0);

  return Math.round(totalWeightedImpact / totalWeight);
}
```

### 3. Resposta da IA (exemplo)

```json
{
  "businessIndicators": [
    {
      "name": "Tempo de Resposta ao Cliente",
      "impact": 90,
      "confidence": "high",
      "explanation": "Chatbot 24/7 reduz tempo médio de primeira resposta de 4h para <1min, impacto direto na satisfação"
    },
    {
      "name": "Carga de Trabalho da Equipe",
      "impact": 75,
      "confidence": "high",
      "explanation": "Automação de 60-70% das perguntas frequentes libera equipe para casos complexos"
    },
    {
      "name": "Satisfação do Cliente (CSAT)",
      "impact": 68,
      "confidence": "medium",
      "explanation": "Atendimento instantâneo melhora experiência, mas depende da qualidade das respostas"
    },
    {
      "name": "Volume de Tickets Resolvidos",
      "impact": 82,
      "confidence": "high",
      "explanation": "Automação aumenta capacidade de atendimento em 3-4x"
    }
  ],
  "maMetrics": [
    {
      "name": "Customer Churn Rate",
      "impact": 72,
      "confidence": "medium",
      "explanation": "Melhor suporte reduz frustração e churn, especialmente em onboarding. Estudos mostram redução de 15-25%"
    },
    {
      "name": "NPS Score",
      "impact": 65,
      "confidence": "medium",
      "explanation": "Atendimento 24/7 e respostas rápidas melhoram NPS, mas qualidade das respostas é crítica"
    },
    {
      "name": "LTV:CAC Ratio",
      "impact": 58,
      "confidence": "medium",
      "explanation": "Redução de churn aumenta LTV. Com investimento de R$15k, ROI depende de escala"
    },
    {
      "name": "CSAT Score",
      "impact": 70,
      "confidence": "high",
      "explanation": "Tempo de resposta é fator #1 em CSAT. Chatbot impacta diretamente"
    },
    {
      "name": "CAC",
      "impact": 45,
      "confidence": "low",
      "explanation": "Indireto: melhor suporte pode virar argumento de venda, mas impacto menor que outras métricas"
    }
  ],
  "confidence": 0.812
}
```

### 4. Insight salvo no banco

```typescript
// Resultado no banco de dados:
{
  id: "clxinsight123",
  activityId: "clxactivity456",

  businessIndicators: [
    {
      name: "Tempo de Resposta ao Cliente",
      impact: 90,
      confidence: "high",
      explanation: "Chatbot 24/7 reduz tempo médio..."
    },
    // ... mais 3 indicadores
  ],
  businessScore: 79, // Weighted average

  maMetrics: [
    {
      name: "Customer Churn Rate",
      impact: 72,
      confidence: "medium",
      explanation: "Melhor suporte reduz frustração..."
    },
    // ... mais 4 métricas
  ],
  maScore: 62, // Weighted average

  aiModel: "gemini-1.5-flash",
  aiConfidence: 0.812,
  processingTime: 2340, // ms
  tokenCount: 1850,

  analysisPrompt: "Analise a seguinte atividade...",
  rawResponse: "{\"businessIndicators\": [...]}",
  analysisVersion: "1.0",

  createdBy: "cluserxxx",
  createdAt: "2025-10-20T10:30:00Z",
  updatedAt: "2025-10-20T10:30:00Z"
}
```

### 5. Exibir insights no frontend

```typescript
// src/app/dashboard/activities/[id]/insights/page.tsx
import { prisma } from '@/lib/prisma';
import { InsightCard } from '@/components/insights/InsightCard';
import { MetricBadge } from '@/components/insights/MetricBadge';

export default async function ActivityInsightPage({
  params,
}: {
  params: { id: string };
}) {
  const insight = await prisma.activityInsight.findUnique({
    where: { activityId: params.id },
    include: {
      activity: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (!insight) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Nenhum insight disponível ainda.</p>
        <button className="mt-4 btn-primary">Gerar Análise de IA</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{insight.activity.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Análise gerada por {insight.user.name} •{' '}
            {new Date(insight.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-500">Confiança da IA</div>
          <div className="text-2xl font-bold text-blue-600">
            {(insight.aiConfidence * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Scores Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="text-sm font-medium text-blue-700">
            Impacto Operacional
          </div>
          <div className="text-4xl font-bold text-blue-900 mt-2">
            {insight.businessScore}
          </div>
          <div className="text-xs text-blue-600 mt-1">de 100</div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <div className="text-sm font-medium text-green-700">
            Impacto em Valorização (M&A)
          </div>
          <div className="text-4xl font-bold text-green-900 mt-2">
            {insight.maScore}
          </div>
          <div className="text-xs text-green-600 mt-1">de 100</div>
        </div>
      </div>

      {/* Business Indicators */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Indicadores de Negócio</h2>
        <div className="space-y-3">
          {(insight.businessIndicators as BusinessIndicator[]).map((indicator, i) => (
            <InsightCard
              key={i}
              name={indicator.name}
              impact={indicator.impact}
              confidence={indicator.confidence}
              explanation={indicator.explanation}
              type="business"
            />
          ))}
        </div>
      </div>

      {/* M&A Metrics */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Métricas M&A</h2>
        <div className="space-y-3">
          {(insight.maMetrics as MAMetric[]).map((metric, i) => (
            <InsightCard
              key={i}
              name={metric.name}
              impact={metric.impact}
              confidence={metric.confidence}
              explanation={metric.explanation}
              type="ma"
            />
          ))}
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-gray-50 p-4 rounded-lg text-sm">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-gray-500">Modelo IA</div>
            <div className="font-medium">{insight.aiModel}</div>
          </div>
          <div>
            <div className="text-gray-500">Tempo de Processamento</div>
            <div className="font-medium">{insight.processingTime}ms</div>
          </div>
          <div>
            <div className="text-gray-500">Tokens Consumidos</div>
            <div className="font-medium">
              {insight.tokenCount?.toLocaleString() || 'N/A'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 6. Componente InsightCard

```typescript
// src/components/insights/InsightCard.tsx
import { ConfidenceLevel } from '@/types/activity-insight';

interface InsightCardProps {
  name: string;
  impact: number;
  confidence: ConfidenceLevel;
  explanation: string;
  type: 'business' | 'ma';
}

export function InsightCard({
  name,
  impact,
  confidence,
  explanation,
  type,
}: InsightCardProps) {
  const getImpactColor = (impact: number) => {
    if (impact >= 80) return 'text-red-600 bg-red-50';
    if (impact >= 60) return 'text-orange-600 bg-orange-50';
    if (impact >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getConfidenceBadge = (confidence: ConfidenceLevel) => {
    const styles = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800',
    };
    return styles[confidence];
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900">{name}</h3>

        <div className="flex items-center gap-2">
          {/* Confidence Badge */}
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceBadge(
              confidence
            )}`}
          >
            {confidence}
          </span>

          {/* Impact Score */}
          <div
            className={`px-3 py-1 rounded-full font-bold ${getImpactColor(
              impact
            )}`}
          >
            {impact}
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600">{explanation}</p>

      {/* Impact Bar */}
      <div className="mt-3 bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${
            type === 'business' ? 'bg-blue-500' : 'bg-green-500'
          }`}
          style={{ width: `${impact}%` }}
        />
      </div>
    </div>
  );
}
```

## Queries Úteis

### Dashboard: Top Atividades por Impacto

```typescript
// src/app/api/insights/top-impact/route.ts
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'ma'; // 'ma' ou 'business'
  const limit = parseInt(searchParams.get('limit') || '10');

  const insights = await prisma.activityInsight.findMany({
    orderBy: type === 'ma' ? { maScore: 'desc' } : { businessScore: 'desc' },
    take: limit,
    where: {
      activity: {
        deletedAt: null, // Apenas atividades ativas
      },
    },
    include: {
      activity: {
        select: {
          id: true,
          title: true,
          area: true,
          priority: true,
          status: true,
          responsible: true,
        },
      },
    },
  });

  return Response.json(insights);
}
```

### Análise por Área

```typescript
// Insights agregados por área de negócio
const insightsByArea = await prisma.activityInsight.groupBy({
  by: ['activity.area'], // Nota: precisa usar raw query para groupBy em relation
  _avg: {
    businessScore: true,
    maScore: true,
  },
  _count: true,
});

// Alternativa com raw query:
const byArea = await prisma.$queryRaw`
  SELECT
    a.area,
    COUNT(*) as insight_count,
    AVG(ai.business_score) as avg_business_score,
    AVG(ai.ma_score) as avg_ma_score,
    AVG(ai.ai_confidence) as avg_confidence
  FROM activity_insights ai
  JOIN activities a ON a.id = ai.activity_id
  WHERE a.deleted_at IS NULL
  GROUP BY a.area
  ORDER BY avg_ma_score DESC;
`;
```

### Buscar por Métrica Específica

```typescript
// Atividades que impactam Customer Churn
const churnActivities = await prisma.$queryRaw`
  SELECT
    ai.id,
    ai.ma_score,
    a.title,
    a.area,
    a.responsible,
    jsonb_array_elements(ai.ma_metrics) ->> 'name' as metric_name,
    (jsonb_array_elements(ai.ma_metrics) ->> 'impact')::int as metric_impact,
    jsonb_array_elements(ai.ma_metrics) ->> 'explanation' as metric_explanation
  FROM activity_insights ai
  JOIN activities a ON a.id = ai.activity_id
  WHERE ai.ma_metrics @> '[{"name": "Customer Churn Rate"}]'::jsonb
  AND a.deleted_at IS NULL
  ORDER BY metric_impact DESC
  LIMIT 20;
`;
```

## Testes

### Teste de Criação de Insight

```typescript
// __tests__/insights/create.test.ts
import { prisma } from '@/lib/prisma';
import { analyzeActivity } from '@/lib/ai/analyze-activity';

describe('ActivityInsight Creation', () => {
  it('should create insight for activity', async () => {
    // Criar atividade de teste
    const activity = await prisma.activity.create({
      data: {
        title: 'Test Activity',
        area: 'Marketing',
        priority: 0,
        status: 'pending',
        userId: 'test-user',
      },
    });

    // Gerar insight
    const analysis = await analyzeActivity(activity.id, 'test-user');

    // Verificar criação
    const insight = await prisma.activityInsight.findUnique({
      where: { activityId: activity.id },
    });

    expect(insight).toBeDefined();
    expect(insight?.businessScore).toBeGreaterThanOrEqual(0);
    expect(insight?.businessScore).toBeLessThanOrEqual(100);
    expect(insight?.maScore).toBeGreaterThanOrEqual(0);
    expect(insight?.maScore).toBeLessThanOrEqual(100);
    expect(insight?.aiConfidence).toBeGreaterThanOrEqual(0);
    expect(insight?.aiConfidence).toBeLessThanOrEqual(1);

    // Cleanup
    await prisma.activityInsight.delete({ where: { id: insight!.id } });
    await prisma.activity.delete({ where: { id: activity.id } });
  });

  it('should enforce 1:1 relationship', async () => {
    const activity = await prisma.activity.create({
      data: {
        title: 'Test Activity',
        area: 'Marketing',
        priority: 0,
        status: 'pending',
        userId: 'test-user',
      },
    });

    // Criar primeiro insight
    await prisma.activityInsight.create({
      data: {
        activityId: activity.id,
        createdBy: 'test-user',
        businessIndicators: [],
        businessScore: 50,
        maMetrics: [],
        maScore: 50,
        aiModel: 'test-model',
        aiConfidence: 0.8,
        processingTime: 1000,
        analysisPrompt: 'test',
        rawResponse: 'test',
        analysisVersion: '1.0',
      },
    });

    // Tentar criar segundo insight (deve falhar)
    await expect(
      prisma.activityInsight.create({
        data: {
          activityId: activity.id, // Mesmo activityId
          createdBy: 'test-user',
          businessIndicators: [],
          businessScore: 60,
          maMetrics: [],
          maScore: 60,
          aiModel: 'test-model',
          aiConfidence: 0.9,
          processingTime: 1000,
          analysisPrompt: 'test',
          rawResponse: 'test',
          analysisVersion: '1.0',
        },
      })
    ).rejects.toThrow(); // Unique constraint violation
  });
});
```

## Monitoring & Analytics

### Dashboard de Performance da IA

```typescript
// src/app/api/insights/stats/route.ts
export async function GET() {
  // Stats gerais
  const generalStats = await prisma.activityInsight.aggregate({
    _avg: {
      businessScore: true,
      maScore: true,
      aiConfidence: true,
      processingTime: true,
    },
    _count: true,
  });

  // Por modelo
  const modelStats = await prisma.activityInsight.groupBy({
    by: ['aiModel'],
    _avg: {
      aiConfidence: true,
      processingTime: true,
    },
    _count: true,
  });

  // Top métricas (raw query)
  const topMetrics = await prisma.$queryRaw`
    SELECT
      metric->>'name' as metric_name,
      COUNT(*) as occurrence_count,
      AVG((metric->>'impact')::int) as avg_impact,
      AVG(ai_confidence) as avg_confidence
    FROM activity_insights,
      jsonb_array_elements(ma_metrics) as metric
    GROUP BY metric->>'name'
    ORDER BY occurrence_count DESC
    LIMIT 10;
  `;

  return Response.json({
    general: generalStats,
    byModel: modelStats,
    topMetrics,
  });
}
```

Resultado:
```json
{
  "general": {
    "_avg": {
      "businessScore": 72.5,
      "maScore": 65.3,
      "aiConfidence": 0.834,
      "processingTime": 1842
    },
    "_count": 247
  },
  "byModel": [
    {
      "aiModel": "gemini-1.5-flash",
      "_avg": {
        "aiConfidence": 0.823,
        "processingTime": 1240
      },
      "_count": 198
    },
    {
      "aiModel": "gemini-1.5-pro",
      "_avg": {
        "aiConfidence": 0.912,
        "processingTime": 2850
      },
      "_count": 49
    }
  ],
  "topMetrics": [
    {
      "metric_name": "Customer Churn Rate",
      "occurrence_count": 156,
      "avg_impact": 68,
      "avg_confidence": 0.812
    },
    {
      "metric_name": "NPS Score",
      "occurrence_count": 142,
      "avg_impact": 64,
      "avg_confidence": 0.789
    }
  ]
}
```

---

**Pronto para produção!**
