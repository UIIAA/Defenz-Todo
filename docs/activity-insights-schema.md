# ActivityInsight Schema Documentation

## Overview

O modelo `ActivityInsight` armazena análises de IA (Google Gemini) sobre atividades, identificando conexões com indicadores de negócio e métricas M&A.

## Relacionamentos

```
Activity (1) ←→ (1) ActivityInsight
User (1) ←→ (N) ActivityInsight [createdBy]
```

- **1:1 com Activity**: Cada atividade tem no máximo 1 insight
- **Cascade delete**: Quando activity é deletada, insight também é
- **Audit trail**: Quem criou o insight é rastreado via `createdBy`

## Schema Definition

```prisma
model ActivityInsight {
  id         String   @id @default(cuid())
  activityId String   @unique

  // Business Impact
  businessIndicators Json @db.JsonB
  businessScore      Int  // 0-100

  // M&A Impact
  maMetrics Json @db.JsonB
  maScore   Int  // 0-100

  // AI Metadata
  aiModel        String
  aiConfidence   Decimal @db.Decimal(4, 3) // 0.000-1.000
  processingTime Int
  tokenCount     Int?

  // Analysis Context
  analysisPrompt  String @db.Text
  rawResponse     String @db.Text
  analysisVersion String @default("1.0")

  // Audit
  createdBy String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  activity Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [createdBy], references: [id])

  // Indexes
  @@index([activityId])
  @@index([businessScore(sort: Desc)])
  @@index([maScore(sort: Desc)])
  @@index([createdAt(sort: Desc)])
  @@index([aiModel])
  @@map("activity_insights")
}
```

## Field Details

### Core IDs
- **id**: CUID único do insight
- **activityId**: Referência única à atividade (1:1)

### Business Indicators (JSONB)
Array de objetos identificando indicadores operacionais:
```typescript
[
  {
    "name": "Tempo de Resposta",
    "impact": 85,
    "confidence": "high",
    "explanation": "Chatbot reduz tempo médio de resposta em 60%"
  },
  {
    "name": "Satisfação do Cliente",
    "impact": 72,
    "confidence": "medium",
    "explanation": "Atendimento 24/7 melhora NPS"
  }
]
```

### MA Metrics (JSONB)
Array de objetos identificando métricas de valorização:
```typescript
[
  {
    "name": "Customer Churn Rate",
    "impact": 78,
    "confidence": "high",
    "explanation": "Redução de churn por melhor suporte"
  },
  {
    "name": "NPS Score",
    "impact": 65,
    "confidence": "medium",
    "explanation": "Experiência melhorada aumenta NPS"
  }
]
```

### Scores
- **businessScore**: 0-100, agregação dos impacts de business indicators
- **maScore**: 0-100, agregação dos impacts de M&A metrics

### AI Metadata
- **aiModel**: Modelo usado (ex: "gemini-1.5-flash")
- **aiConfidence**: 0.000-1.000, confiança geral da análise
- **processingTime**: Milissegundos para processar
- **tokenCount**: Tokens consumidos (tracking de custo)

### Analysis Context
- **analysisPrompt**: Prompt completo enviado à IA
- **rawResponse**: Resposta JSON bruta da IA (debug/audit)
- **analysisVersion**: Versão do algoritmo ("1.0", "2.0", etc.)

### Audit Trail
- **createdBy**: userId que solicitou análise
- **createdAt**: Timestamp de criação
- **updatedAt**: Última atualização

## Indexes & Performance

### Index Strategy

1. **activityId**: Lookup direto por atividade
   - Query pattern: "Mostrar insight desta atividade"
   - Performance: O(1) lookup

2. **businessScore DESC**: Top impactos de negócio
   - Query pattern: "Atividades com maior impacto operacional"
   - Performance: Range scan otimizado

3. **maScore DESC**: Top impactos M&A
   - Query pattern: "Atividades que mais afetam valorização"
   - Performance: Range scan otimizado

4. **createdAt DESC**: Análises recentes
   - Query pattern: "Últimas análises realizadas"
   - Performance: Range scan otimizado

5. **aiModel**: Estatísticas por modelo
   - Query pattern: "Comparar performance dos modelos"
   - Performance: Group by otimizado

### JSONB Indexing

PostgreSQL permite índices GIN em campos JSONB para queries complexas:

```sql
-- Criar índice GIN para queries em businessIndicators
CREATE INDEX idx_business_indicators_gin
ON activity_insights USING GIN (business_indicators);

-- Criar índice GIN para queries em maMetrics
CREATE INDEX idx_ma_metrics_gin
ON activity_insights USING GIN (ma_metrics);
```

Esses índices permitem queries como:
```sql
-- Encontrar insights que mencionam "ARR"
SELECT * FROM activity_insights
WHERE ma_metrics @> '[{"name": "ARR"}]';

-- Encontrar insights com high confidence
SELECT * FROM activity_insights
WHERE business_indicators @> '[{"confidence": "high"}]';
```

## Query Examples

### 1. Buscar insight de uma atividade

```typescript
const insight = await prisma.activityInsight.findUnique({
  where: { activityId: 'clxxx' },
  include: {
    activity: {
      select: {
        title: true,
        description: true,
        area: true,
        priority: true,
      },
    },
  },
});
```

### 2. Top atividades por impacto M&A

```typescript
const topMaImpact = await prisma.activityInsight.findMany({
  orderBy: { maScore: 'desc' },
  take: 10,
  include: {
    activity: {
      select: {
        id: true,
        title: true,
        area: true,
        priority: true,
      },
    },
  },
});
```

### 3. Top atividades por impacto operacional

```typescript
const topBusinessImpact = await prisma.activityInsight.findMany({
  orderBy: { businessScore: 'desc' },
  take: 10,
  where: {
    aiConfidence: { gte: 0.7 }, // Apenas alta confiança
  },
  include: {
    activity: {
      select: {
        id: true,
        title: true,
        area: true,
        responsible: true,
      },
    },
  },
});
```

### 4. Filtrar por métrica específica (JSONB query)

```typescript
// Encontrar atividades que impactam Churn Rate
const churnImpact = await prisma.$queryRaw`
  SELECT ai.*, a.title, a.area
  FROM activity_insights ai
  JOIN activities a ON a.id = ai.activity_id
  WHERE ai.ma_metrics @> '[{"name": "Customer Churn Rate"}]'::jsonb
  AND ai.ma_score >= 70
  ORDER BY ai.ma_score DESC;
`;
```

### 5. Análises recentes com alta confiança

```typescript
const recentHighConfidence = await prisma.activityInsight.findMany({
  where: {
    aiConfidence: { gte: 0.85 },
    createdAt: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Última semana
    },
  },
  orderBy: { createdAt: 'desc' },
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
```

### 6. Estatísticas agregadas

```typescript
const stats = await prisma.activityInsight.aggregate({
  _avg: {
    businessScore: true,
    maScore: true,
    aiConfidence: true,
    processingTime: true,
  },
  _count: true,
  where: {
    createdAt: {
      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Último mês
    },
  },
});

console.log({
  totalInsights: stats._count,
  avgBusinessScore: stats._avg.businessScore,
  avgMaScore: stats._avg.maScore,
  avgConfidence: stats._avg.aiConfidence,
  avgProcessingTime: stats._avg.processingTime,
});
```

### 7. Comparar modelos de IA

```typescript
const modelComparison = await prisma.activityInsight.groupBy({
  by: ['aiModel'],
  _avg: {
    aiConfidence: true,
    processingTime: true,
    businessScore: true,
    maScore: true,
  },
  _count: true,
});

// Resultado:
// [
//   {
//     aiModel: "gemini-1.5-flash",
//     _count: 150,
//     _avg: { aiConfidence: 0.823, processingTime: 1240, ... }
//   },
//   {
//     aiModel: "gemini-1.5-pro",
//     _count: 45,
//     _avg: { aiConfidence: 0.912, processingTime: 2850, ... }
//   }
// ]
```

### 8. Buscar por nome de indicador (full-text)

```typescript
// Raw query com JSONB operators
const insightsWithNPS = await prisma.$queryRaw`
  SELECT
    ai.*,
    a.title,
    a.area
  FROM activity_insights ai
  JOIN activities a ON a.id = ai.activity_id
  WHERE
    ai.ma_metrics::text LIKE '%NPS Score%'
    OR ai.business_indicators::text LIKE '%NPS%'
  ORDER BY ai.created_at DESC;
`;
```

### 9. Criar insight

```typescript
const insight = await prisma.activityInsight.create({
  data: {
    activityId: 'clxxx',
    createdBy: 'cluserxxx',
    businessIndicators: [
      {
        name: 'Tempo de Resposta',
        impact: 85,
        confidence: 'high',
        explanation: 'Chatbot reduz tempo médio de resposta',
      },
    ],
    businessScore: 85,
    maMetrics: [
      {
        name: 'Customer Churn Rate',
        impact: 78,
        confidence: 'high',
        explanation: 'Redução de churn por melhor suporte',
      },
    ],
    maScore: 78,
    aiModel: 'gemini-1.5-flash',
    aiConfidence: 0.892,
    processingTime: 1420,
    tokenCount: 2340,
    analysisPrompt: 'Analyze the business impact of...',
    rawResponse: '{"analysis": {...}}',
    analysisVersion: '1.0',
  },
  include: {
    activity: true,
  },
});
```

### 10. Atualizar insight existente (re-análise)

```typescript
const updated = await prisma.activityInsight.update({
  where: { activityId: 'clxxx' },
  data: {
    businessIndicators: newIndicators,
    businessScore: newBusinessScore,
    maMetrics: newMetrics,
    maScore: newMaScore,
    aiConfidence: newConfidence,
    processingTime: newProcessingTime,
    rawResponse: newRawResponse,
    analysisVersion: '2.0', // Nova versão do algoritmo
    updatedAt: new Date(),
  },
});
```

## Migration Considerations

### Initial Migration

```bash
# Criar migration
npx prisma migrate dev --name add_activity_insights

# Gerar Prisma Client
npx prisma generate
```

### Migration Steps

1. **Backup database** (importante!)
   ```bash
   pg_dump -h your-neon-host -U user -d dbname > backup.sql
   ```

2. **Test migration em dev primeiro**
   ```bash
   # Dev environment
   npx prisma migrate dev --name add_activity_insights
   ```

3. **Verificar schema gerado**
   ```sql
   \d activity_insights  -- Verificar colunas, tipos, constraints
   ```

4. **Deploy para produção**
   ```bash
   # Production
   npx prisma migrate deploy
   ```

### Rollback Strategy

Se necessário reverter:

```sql
-- Drop table
DROP TABLE IF EXISTS activity_insights CASCADE;

-- Revert Prisma migration
-- Remover migration de prisma/migrations/
-- Rodar: npx prisma migrate resolve --rolled-back <migration_name>
```

## Data Integrity

### Constraints Automáticos (Prisma)
- ✅ `activityId` é UNIQUE (1:1 relationship)
- ✅ `activityId` tem ON DELETE CASCADE
- ✅ `createdBy` referencia User
- ✅ Timestamps automáticos (createdAt, updatedAt)

### Constraints Recomendados (Custom)

Adicionar constraints customizados via migration:

```sql
-- Scores devem estar entre 0-100
ALTER TABLE activity_insights
ADD CONSTRAINT check_business_score
CHECK (business_score >= 0 AND business_score <= 100);

ALTER TABLE activity_insights
ADD CONSTRAINT check_ma_score
CHECK (ma_score >= 0 AND ma_score <= 100);

-- AI confidence deve estar entre 0-1
ALTER TABLE activity_insights
ADD CONSTRAINT check_ai_confidence
CHECK (ai_confidence >= 0.0 AND ai_confidence <= 1.0);

-- Processing time deve ser positivo
ALTER TABLE activity_insights
ADD CONSTRAINT check_processing_time
CHECK (processing_time > 0);

-- Token count deve ser positivo ou NULL
ALTER TABLE activity_insights
ADD CONSTRAINT check_token_count
CHECK (token_count IS NULL OR token_count > 0);
```

## Performance Optimization

### Read Optimization (Primary Use Case)

Insights serão lidos muito mais do que escritos:

1. **Use SELECT specific fields** em vez de `SELECT *`
2. **Indexes já otimizados** para queries comuns
3. **JSONB fields** permitem queries complexas sem joins
4. **Consider caching** insights em Redis/in-memory para hot data

### Write Optimization

Insights são gerados sob demanda, não em batch:

1. **Async analysis**: Criar insight em background job
2. **Idempotency**: Verificar se já existe antes de recriar
3. **Versioning**: Use `analysisVersion` para invalidar cache

### Example: Cached Query Pattern

```typescript
// Cache key: `insight:${activityId}`
async function getInsightWithCache(activityId: string) {
  // 1. Try cache first
  const cached = await redis.get(`insight:${activityId}`);
  if (cached) return JSON.parse(cached);

  // 2. Query database
  const insight = await prisma.activityInsight.findUnique({
    where: { activityId },
    include: {
      activity: {
        select: {
          title: true,
          area: true,
          priority: true,
        },
      },
    },
  });

  if (!insight) return null;

  // 3. Cache result (TTL: 1 hour)
  await redis.setex(`insight:${activityId}`, 3600, JSON.stringify(insight));

  return insight;
}
```

## Best Practices

### ✅ DO
- Validar scores (0-100) antes de salvar
- Validar aiConfidence (0.0-1.0) antes de salvar
- Armazenar `rawResponse` para debug/audit
- Incrementar `analysisVersion` quando algoritmo mudar
- Usar transactions ao criar activity + insight juntos
- Cache insights populares em Redis
- Logar performance de queries (slow query log)

### ❌ DON'T
- Não criar insights sem activity
- Não permitir múltiplos insights por activity (UNIQUE constraint)
- Não deletar activities sem considerar cascade
- Não esquecer de invalidar cache ao re-analisar
- Não fazer over-indexing (cada índice tem custo em writes)
- Não armazenar dados sensíveis em JSONB (logs, PII)

## Future Enhancements

### Possible Schema Additions

1. **Versioning System**
   ```prisma
   model ActivityInsightVersion {
     id         String @id @default(cuid())
     insightId  String
     version    Int
     data       Json @db.JsonB
     createdAt  DateTime @default(now())

     insight ActivityInsight @relation(...)
     @@unique([insightId, version])
   }
   ```

2. **User Feedback**
   ```prisma
   model InsightFeedback {
     id         String @id @default(cuid())
     insightId  String
     userId     String
     helpful    Boolean
     comment    String?
     createdAt  DateTime @default(now())

     insight ActivityInsight @relation(...)
     user    User @relation(...)
   }
   ```

3. **Batch Analysis Jobs**
   ```prisma
   model AnalysisJob {
     id              String @id @default(cuid())
     status          String // queued, processing, completed, failed
     activityIds     String[] // Array de IDs
     completedCount  Int @default(0)
     failedCount     Int @default(0)
     startedAt       DateTime?
     completedAt     DateTime?
     createdAt       DateTime @default(now())
   }
   ```

## Troubleshooting

### Common Issues

**Issue**: JSONB query não retorna resultados esperados
```sql
-- Verificar estrutura do JSON
SELECT business_indicators FROM activity_insights WHERE id = 'clxxx';

-- Usar operadores corretos
-- @> (contains) vs ? (has key) vs ?| (has any key)
```

**Issue**: Slow queries em JSONB fields
```sql
-- Criar índice GIN
CREATE INDEX idx_business_indicators_gin
ON activity_insights USING GIN (business_indicators);
```

**Issue**: Constraint violation em scores
```typescript
// Validar antes de salvar
if (score < 0 || score > 100) {
  throw new Error('Score must be between 0 and 100');
}
```

## Resources

- [Prisma JSONB Docs](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#json)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [PostgreSQL GIN Index](https://www.postgresql.org/docs/current/gin.html)
- [Neon Database Docs](https://neon.tech/docs)

---

**Last Updated**: 2025-10-20
**Schema Version**: 1.0
**Prisma Version**: 5.x
