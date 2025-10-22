# ActivityInsight - Migration Guide

## Summary

O modelo `ActivityInsight` foi adicionado ao schema Prisma para armazenar análises de IA sobre atividades.

**Status**: ✅ Schema validado e pronto para migration

## Changes Made

### 1. Prisma Schema (`prisma/schema.prisma`)

**Added to User model:**
```diff
model User {
  // ... existing fields
+ activityInsights ActivityInsight[]
}
```

**Added to Activity model:**
```diff
model Activity {
  // ... existing fields
+ insight ActivityInsight? // 1:1 relationship
}
```

**New model added:**
```prisma
model ActivityInsight {
  id         String   @id @default(cuid())
  activityId String   @unique

  businessIndicators Json @db.JsonB
  businessScore      Int

  maMetrics Json @db.JsonB
  maScore   Int

  aiModel        String
  aiConfidence   Decimal @db.Decimal(4, 3)
  processingTime Int
  tokenCount     Int?

  analysisPrompt  String @db.Text
  rawResponse     String @db.Text
  analysisVersion String @default("1.0")

  createdBy String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  activity Activity @relation(fields: [activityId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [createdBy], references: [id])

  @@index([activityId])
  @@index([businessScore(sort: Desc)])
  @@index([maScore(sort: Desc)])
  @@index([createdAt(sort: Desc)])
  @@index([aiModel])
  @@map("activity_insights")
}
```

### 2. TypeScript Types (`src/types/activity-insight.ts`)

Complete type definitions including:
- `BusinessIndicator`
- `MAMetric`
- `MAMetricName` (standardized metric names)
- `ActivityInsight` (matches Prisma model)
- API request/response types
- Query filter types
- Validation helpers

### 3. Documentation

**Created files:**
- `/docs/activity-insights-schema.md` - Complete schema documentation
- `/docs/activity-insights-examples.md` - Practical usage examples
- `/docs/activity-insights-migration.md` - This file

## Migration Steps

### Pre-Migration Checklist

- [x] Prisma schema validated (`npx prisma validate`)
- [ ] Backup database
- [ ] Review migration SQL
- [ ] Test in development first
- [ ] Notify team about downtime (if any)

### Development Migration

```bash
# 1. Ensure clean working directory
git status

# 2. Backup .env files
cp .env.local .env.backup

# 3. Create migration
npx prisma migrate dev --name add_activity_insights

# 4. Generate Prisma Client
npx prisma generate

# 5. Verify database schema
npx prisma studio
# Check if activity_insights table was created

# 6. Test TypeScript compilation
npm run build
```

### Expected Migration SQL

The migration will generate SQL similar to:

```sql
-- CreateTable
CREATE TABLE "activity_insights" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "businessIndicators" JSONB NOT NULL,
    "businessScore" INTEGER NOT NULL,
    "maMetrics" JSONB NOT NULL,
    "maScore" INTEGER NOT NULL,
    "aiModel" TEXT NOT NULL,
    "aiConfidence" DECIMAL(4,3) NOT NULL,
    "processingTime" INTEGER NOT NULL,
    "tokenCount" INTEGER,
    "analysisPrompt" TEXT NOT NULL,
    "rawResponse" TEXT NOT NULL,
    "analysisVersion" TEXT NOT NULL DEFAULT '1.0',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activity_insights_activityId_key" ON "activity_insights"("activityId");

-- CreateIndex
CREATE INDEX "activity_insights_activityId_idx" ON "activity_insights"("activityId");

-- CreateIndex
CREATE INDEX "activity_insights_businessScore_idx" ON "activity_insights"("businessScore" DESC);

-- CreateIndex
CREATE INDEX "activity_insights_maScore_idx" ON "activity_insights"("maScore" DESC);

-- CreateIndex
CREATE INDEX "activity_insights_createdAt_idx" ON "activity_insights"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "activity_insights_aiModel_idx" ON "activity_insights"("aiModel");

-- AddForeignKey
ALTER TABLE "activity_insights"
ADD CONSTRAINT "activity_insights_activityId_fkey"
FOREIGN KEY ("activityId")
REFERENCES "activities"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_insights"
ADD CONSTRAINT "activity_insights_createdBy_fkey"
FOREIGN KEY ("createdBy")
REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
```

### Post-Migration: Add Custom Constraints

After initial migration, optionally add custom constraints:

```bash
# Create a new migration for constraints
npx prisma migrate dev --name add_insight_constraints --create-only
```

Edit the generated SQL file to add:

```sql
-- Scores must be 0-100
ALTER TABLE activity_insights
ADD CONSTRAINT check_business_score
CHECK (business_score >= 0 AND business_score <= 100);

ALTER TABLE activity_insights
ADD CONSTRAINT check_ma_score
CHECK (ma_score >= 0 AND ma_score <= 100);

-- AI confidence must be 0.0-1.0
ALTER TABLE activity_insights
ADD CONSTRAINT check_ai_confidence
CHECK (ai_confidence >= 0.0 AND ai_confidence <= 1.0);

-- Processing time must be positive
ALTER TABLE activity_insights
ADD CONSTRAINT check_processing_time
CHECK (processing_time > 0);

-- Token count must be positive or NULL
ALTER TABLE activity_insights
ADD CONSTRAINT check_token_count
CHECK (token_count IS NULL OR token_count > 0);
```

Then apply:
```bash
npx prisma migrate dev
```

### Optional: JSONB Indexes for Advanced Queries

For better JSONB query performance:

```sql
-- Create GIN indexes for JSONB fields
CREATE INDEX idx_business_indicators_gin
ON activity_insights USING GIN (business_indicators);

CREATE INDEX idx_ma_metrics_gin
ON activity_insights USING GIN (ma_metrics);
```

This enables fast queries like:
```sql
-- Find insights mentioning specific metric
SELECT * FROM activity_insights
WHERE ma_metrics @> '[{"name": "ARR"}]';

-- Find high confidence business indicators
SELECT * FROM activity_insights
WHERE business_indicators @> '[{"confidence": "high"}]';
```

### Production Migration

**CRITICAL: DO NOT RUN DIRECTLY IN PRODUCTION**

1. **Schedule maintenance window** (if needed)
   - Estimated downtime: ~5-10 seconds
   - Low risk: only adds new table, no data changes

2. **Backup database**
   ```bash
   # For Neon DB, create a branch backup
   # Via Neon Console or CLI
   ```

3. **Deploy migration**
   ```bash
   # Option 1: Via Vercel deployment
   git push origin main
   # Migration runs automatically via build process

   # Option 2: Manual deployment
   npx prisma migrate deploy
   ```

4. **Verify deployment**
   ```bash
   # Check if table exists
   npx prisma studio

   # Or via SQL
   psql $DATABASE_URL -c "\dt activity_insights"
   ```

5. **Monitor errors**
   - Check Vercel logs
   - Check Neon database logs
   - Monitor application error tracking (Sentry, etc.)

## Rollback Strategy

If migration fails or causes issues:

### Development Rollback

```bash
# 1. Reset database to previous state
npx prisma migrate reset

# 2. Or manually delete migration
rm -rf prisma/migrations/<migration_folder>

# 3. Revert schema changes
git checkout HEAD~1 prisma/schema.prisma

# 4. Regenerate client
npx prisma generate
```

### Production Rollback

**Option 1: Neon Branch Restore**
```bash
# Restore from backup branch (via Neon Console)
# This is the safest option
```

**Option 2: Drop Table (if no data exists)**
```sql
DROP TABLE IF EXISTS activity_insights CASCADE;
```

**Option 3: Prisma Migrate Resolve**
```bash
# Mark migration as rolled back
npx prisma migrate resolve --rolled-back <migration_name>

# Deploy previous migration
git checkout HEAD~1
npx prisma migrate deploy
```

## Post-Migration Tasks

### 1. Update Application Code

**API Route for creating insights:**
```typescript
// src/app/api/insights/route.ts
import { analyzeActivity } from '@/lib/ai/analyze-activity';

export async function POST(req: Request) {
  const { activityId, userId } = await req.json();
  const analysis = await analyzeActivity(activityId, userId);
  return Response.json(analysis);
}
```

**Frontend component:**
```typescript
// src/components/insights/InsightButton.tsx
export function InsightButton({ activityId }: { activityId: string }) {
  const [loading, setLoading] = useState(false);

  const generateInsight = async () => {
    setLoading(true);
    try {
      await fetch('/api/insights', {
        method: 'POST',
        body: JSON.stringify({ activityId }),
      });
      // Refresh or navigate to insights page
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={generateInsight} disabled={loading}>
      {loading ? 'Analisando...' : 'Gerar Insight com IA'}
    </button>
  );
}
```

### 2. Environment Variables

Add to `.env.local`:
```bash
# Google Gemini AI
GEMINI_API_KEY=your_api_key_here
```

Update `.env.example`:
```bash
# AI Configuration
GEMINI_API_KEY=
```

### 3. Install Dependencies

```bash
npm install @google/generative-ai
```

### 4. Testing

**Unit tests:**
```bash
npm run test src/__tests__/insights/
```

**Integration tests:**
```bash
# Test activity creation + insight generation
npm run test:integration
```

**Manual testing:**
1. Create activity
2. Generate insight
3. View insight details
4. Check database records

## Performance Considerations

### Expected Load

- **Writes**: Low (only when generating insights)
- **Reads**: High (dashboard queries)
- **Storage**: ~5KB per insight (with JSONB)

### Indexing Strategy

Current indexes optimize for:
- ✅ Finding insight by activity (O(1) lookup)
- ✅ Top N queries by score (efficient range scans)
- ✅ Recent analyses (time-based queries)
- ✅ Model comparison (grouping)

### Query Performance Targets

- Single insight lookup: <10ms
- Top 10 activities: <50ms
- Stats aggregation: <200ms
- JSONB queries (with GIN): <100ms

### Monitoring

Add to monitoring dashboard:
```typescript
// Track insight generation performance
console.log({
  metric: 'insight.generation',
  activityId,
  aiModel,
  processingTime,
  businessScore,
  maScore,
  aiConfidence,
});

// Track query performance
console.log({
  metric: 'insight.query',
  queryType: 'top_ma_impact',
  duration: queryEndTime - queryStartTime,
  resultCount,
});
```

## Data Validation

### Application-Level Validation

```typescript
// src/lib/validations/insight.ts
import { z } from 'zod';

export const businessIndicatorSchema = z.object({
  name: z.string().min(1).max(200),
  impact: z.number().int().min(0).max(100),
  confidence: z.enum(['low', 'medium', 'high']),
  explanation: z.string().min(10).max(1000),
});

export const maMetricSchema = z.object({
  name: z.string(),
  impact: z.number().int().min(0).max(100),
  confidence: z.enum(['low', 'medium', 'high']),
  explanation: z.string().min(10).max(1000),
});

export const createInsightSchema = z.object({
  activityId: z.string().cuid(),
  createdBy: z.string().cuid(),
  businessIndicators: z.array(businessIndicatorSchema).min(1).max(10),
  businessScore: z.number().int().min(0).max(100),
  maMetrics: z.array(maMetricSchema).min(1).max(10),
  maScore: z.number().int().min(0).max(100),
  aiModel: z.string().min(1),
  aiConfidence: z.number().min(0).max(1),
  processingTime: z.number().int().positive(),
  tokenCount: z.number().int().positive().optional(),
  analysisPrompt: z.string().min(10),
  rawResponse: z.string().min(10),
  analysisVersion: z.string().default('1.0'),
});
```

Use in API:
```typescript
export async function POST(req: Request) {
  const body = await req.json();
  const validated = createInsightSchema.parse(body);
  // ... create insight
}
```

## Security Considerations

### Data Privacy

- ✅ No PII in JSONB fields
- ✅ rawResponse may contain sensitive data (audit only)
- ✅ User IDs tracked for audit trail

### Access Control

```typescript
// Verify user owns the activity before generating insight
const activity = await prisma.activity.findFirst({
  where: {
    id: activityId,
    userId: currentUserId, // Only owner can generate insights
  },
});

if (!activity) {
  throw new Error('Unauthorized');
}
```

### Rate Limiting

```typescript
// Limit insight generation (AI API is expensive)
const recentInsights = await prisma.activityInsight.count({
  where: {
    createdBy: userId,
    createdAt: {
      gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
    },
  },
});

if (recentInsights >= 10) {
  throw new Error('Rate limit exceeded');
}
```

## Cost Tracking

### Token Usage

```typescript
// Track AI API costs
const costPerToken = 0.00001; // Example: $0.01 per 1000 tokens

const insight = await prisma.activityInsight.findMany({
  select: { tokenCount: true },
});

const totalTokens = insight.reduce((sum, i) => sum + (i.tokenCount || 0), 0);
const estimatedCost = totalTokens * costPerToken;

console.log(`Total AI cost: $${estimatedCost.toFixed(2)}`);
```

## Success Criteria

Migration is successful when:

- [x] Schema validates without errors
- [ ] Migration applies cleanly in dev
- [ ] All indexes created successfully
- [ ] TypeScript types compile
- [ ] Test suite passes
- [ ] Manual testing completed
- [ ] Production deployment successful
- [ ] No errors in production logs
- [ ] Performance metrics within targets

## Support & Troubleshooting

### Common Issues

**Issue**: Foreign key constraint violation
```
Error: Foreign key constraint failed on the field: `activityId`
```
**Solution**: Ensure activity exists before creating insight

**Issue**: JSONB parsing error
```
Error: Invalid JSON in businessIndicators
```
**Solution**: Validate JSON structure before inserting

**Issue**: Unique constraint violation
```
Error: Unique constraint failed on the fields: (`activityId`)
```
**Solution**: Update existing insight instead of creating new one

### Getting Help

1. Check documentation: `/docs/activity-insights-*.md`
2. Review Prisma logs: `npx prisma studio`
3. Check database logs: Neon Console
4. Review application logs: Vercel Dashboard

---

**Migration Prepared By**: Database Architect Agent
**Date**: 2025-10-20
**Schema Version**: 1.0
**Estimated Migration Time**: <1 minute
**Risk Level**: Low (additive only, no data changes)
