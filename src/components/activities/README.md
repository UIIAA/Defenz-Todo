# Activity Insights Components

Componentes React para exibir análises de IA (Google Gemini) sobre atividades estratégicas do Defenz.

## Visão Geral

Este módulo fornece uma interface completa para visualização de insights gerados por IA, incluindo:
- Scores de impacto (operacional e estratégico)
- Conexões com métricas de negócio
- Conexões com métricas de M&A (valorização)
- Geração sob demanda de análises

## Componentes

### 1. ActivityInsightCard

**Arquivo**: `ActivityInsightCard.tsx`

Componente principal que exibe toda a análise de IA de uma atividade.

#### Props

```typescript
interface ActivityInsightCardProps {
  activityId: string;
  className?: string;
}
```

#### Features

- Carregamento automático do insight via API
- Estados: loading, error, empty, success
- Seções expansíveis (Business Metrics e M&A Metrics)
- Ações: refresh e delete
- Metadata da análise (modelo, versão, timestamp)

#### Estados

1. **Loading**: Skeleton placeholders
2. **Error**: Mensagem de erro com botão de retry
3. **Empty**: Call-to-action para gerar insight
4. **Success**: Exibição completa dos dados

#### Exemplo de Uso

```tsx
import { ActivityInsightCard } from '@/components/activities';

<ActivityInsightCard activityId={activity.id} />
```

---

### 2. InsightScoreDisplay

**Arquivo**: `InsightScoreDisplay.tsx`

Exibe os três scores principais: Business, M&A e Overall.

#### Props

```typescript
interface InsightScoreDisplayProps {
  businessScore: number;        // 0-100
  maScore: number;              // 0-100
  overallScore: number;         // 0-100 (calculado: 40% business + 60% M&A)
  aiConfidence: number;         // 0.0-1.0
  processingTime?: number;      // milliseconds
}
```

#### Features

- Overall Score em destaque com cores indicativas
- Barras de progresso animadas
- Badge de confiança da IA
- Tempo de processamento (se >= 1s)
- Fórmula de cálculo visual

#### Cores dos Scores

- **70-100**: Verde (alto impacto)
- **40-69**: Amarelo (médio impacto)
- **0-39**: Vermelho (baixo impacto)

#### Exemplo de Uso

```tsx
<InsightScoreDisplay
  businessScore={75}
  maScore={82}
  overallScore={79}
  aiConfidence={0.92}
  processingTime={2450}
/>
```

---

### 3. MetricConnectionBadge

**Arquivo**: `MetricConnectionBadge.tsx`

Badge individual para exibir conexão com uma métrica específica.

#### Props

```typescript
interface MetricConnectionBadgeProps {
  metric: BusinessIndicator | MAMetric;
  type: 'business' | 'ma';
}
```

#### Features

- Nome da métrica
- Impact score (0-100) com barra de progresso
- Confidence level (low/medium/high)
- Tooltip com explicação detalhada
- Cores por confidence level

#### Confidence Levels

| Level | Cor | Descrição |
|-------|-----|-----------|
| `high` | Verde | AI confidence >= 85% |
| `medium` | Azul | AI confidence >= 60% |
| `low` | Amarelo | AI confidence < 60% |

#### Exemplo de Uso

```tsx
<MetricConnectionBadge
  metric={{
    name: "Customer Churn Rate",
    impact: 85,
    confidence: "high",
    explanation: "Esta atividade reduz churn ao melhorar onboarding..."
  }}
  type="ma"
/>
```

---

### 4. GenerateInsightButton

**Arquivo**: `GenerateInsightButton.tsx`

Botão para disparar geração de insights via API.

#### Props

```typescript
interface GenerateInsightButtonProps {
  activityId: string;
  hasExistingInsight?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}
```

#### Features

- Estados: idle, loading, success, error
- Rate limit handling (10 req/min)
- Feedback visual com ícones animados
- Toast notifications
- Callbacks de sucesso/erro

#### Estados do Botão

1. **Idle (sem insight)**: "Gerar Análise IA" + ícone Sparkles
2. **Loading**: "Analisando..." + ícone Loader (spinning)
3. **Success**: "Análise Concluída!" + ícone CheckCircle (3s)
4. **Has Insight**: "Análise Existente" + ícone AlertCircle (disabled)

#### Rate Limiting

- Limite: **10 análises por minuto**
- Mensagem: Toast com instruções de retry
- HTTP 429: Tratado automaticamente

#### Exemplo de Uso

```tsx
<GenerateInsightButton
  activityId={activity.id}
  onSuccess={() => {
    refetchInsight();
    toast.success('Análise concluída!');
  }}
  size="lg"
/>
```

---

### 5. InsightScoreBadge

**Arquivo**: `InsightScoreBadge.tsx`

Badge compacto para exibir score na lista/tabela de atividades.

#### Props

```typescript
interface InsightScoreBadgeProps {
  activityId: string;
  className?: string;
}
```

#### Features

- Carregamento automático do score
- Estados: loading, empty, success
- Ícone Sparkles
- Cores baseadas no overall score

#### Estados

1. **Loading**: Skeleton com ícone Loader
2. **Empty**: "Sem IA" + ícone Sparkles (cinza)
3. **Success**: Score numérico + cor indicativa

#### Exemplo de Uso

```tsx
// Em tabela de atividades
<InsightScoreBadge activityId={activity.id} />
```

---

## Integração

### 1. Tabela de Atividades

**Arquivo**: `src/components/ActivitiesTable.tsx`

```tsx
import { ActivityInsightCard, InsightScoreBadge } from '@/components/activities';

// Na coluna da tabela
<InsightScoreBadge activityId={activity.id} />

// Na área expandida
<ActivityInsightCard activityId={activity.id} />
```

### 2. Modal de Visualização

**Arquivo**: `src/app/dashboard/activities/page.tsx`

```tsx
import { ActivityInsightCard } from '@/components/activities';

<Dialog>
  <DialogContent>
    <ActivityInsightCard activityId={viewingActivity.id} />
    {/* ... outros detalhes ... */}
  </DialogContent>
</Dialog>
```

### 3. Criação de Atividade

Opcional: Auto-gerar insight após criar atividade de alta prioridade.

```tsx
const handleSubmit = async (formData) => {
  const newActivity = await createActivity(formData);

  // Auto-gerar para prioridade alta
  if (formData.priority === 0) {
    await fetch(`/api/activities/${newActivity.id}/insights`, {
      method: 'POST'
    });
  }
};
```

---

## API Endpoints

### GET /api/activities/{id}/insights

Retorna insight existente ou 404 se não existir.

```typescript
// Response (200)
{
  id: string;
  activityId: string;
  businessIndicators: BusinessIndicator[];
  businessScore: number;
  maMetrics: MAMetric[];
  maScore: number;
  aiModel: string;
  aiConfidence: number;
  processingTime: number;
  // ...
}

// Response (404)
{
  error: "Insight not found"
}
```

### POST /api/activities/{id}/insights

Gera novo insight (idempotente).

```typescript
// Request body (opcional)
{
  forceReanalysis?: boolean; // Regenerar se já existir
}

// Response (200)
{
  // Same as GET
}

// Response (429 - Rate Limit)
{
  error: "Rate limit exceeded",
  retryAfter: 60
}
```

### DELETE /api/activities/{id}/insights

Remove insight existente.

```typescript
// Response (200)
{
  message: "Insight deleted successfully"
}
```

---

## Performance

### Otimizações Implementadas

1. **React.memo**: Todos componentes são memoized
2. **Lazy Loading**: Insights carregados sob demanda
3. **Caching**: Dados mantidos em memória após fetch
4. **Progressive Enhancement**: UI funcional mesmo sem insights

### Métricas Esperadas

- **Tempo de geração**: 1-3 segundos (Google Gemini)
- **Tamanho da resposta**: ~2-5 KB (JSON)
- **FCP (First Contentful Paint)**: < 200ms (skeleton)
- **TTI (Time to Interactive)**: < 500ms

---

## Acessibilidade

### ARIA Labels

Todos botões e elementos interativos possuem `aria-label`:

```tsx
<Button aria-label="Gerar análise de IA">
<Button aria-label="Recarregar análise">
<Button aria-label="Remover análise">
```

### Navegação por Teclado

- Tab: Navegar entre elementos
- Enter/Space: Ativar botões
- Esc: Fechar tooltips

### Screen Readers

- Tooltips com explicações completas
- Estados anunciados (loading, error, success)
- Scores lidos como porcentagens

---

## Troubleshooting

### Insight não carrega

1. Verificar se API endpoint existe: `GET /api/activities/{id}/insights`
2. Verificar console do browser (erros de CORS, 404, etc)
3. Verificar se activityId é válido

### Rate Limit Error

- Aguardar 1 minuto antes de tentar novamente
- Limite: 10 análises por minuto (Google Gemini Free Tier)

### Scores aparecem como 0

- Verificar se a análise foi completada com sucesso
- Verificar logs do servidor (processamento da IA)
- Regenerar análise com `forceReanalysis: true`

### Performance Lenta

- Verificar network tab (tempo de resposta da API)
- Verificar se há muitos insights sendo carregados simultaneamente
- Considerar pagination ou lazy loading

---

## TypeScript

### Tipos Principais

```typescript
// De @/types/activity-insight
import type {
  ActivityInsight,
  BusinessIndicator,
  MAMetric,
  ConfidenceLevel,
  MAMetricName
} from '@/types/activity-insight';
```

### Type Safety

- **100% TypeScript strict mode**
- Todos props tipados
- Sem `any` types
- Validação em runtime (Zod no backend)

---

## Testes

### Cenários de Teste

1. **Empty State**: Atividade sem insight
2. **Loading State**: Insight sendo carregado
3. **Success State**: Insight carregado com sucesso
4. **Error State**: Erro ao carregar insight
5. **Rate Limit**: Limite de API atingido
6. **Regeneration**: Forçar nova análise
7. **Delete**: Remover insight existente

### Dados de Teste

```typescript
const mockInsight: ActivityInsight = {
  id: "test-insight-1",
  activityId: "test-activity-1",
  businessIndicators: [
    {
      name: "Tempo de Resposta",
      impact: 75,
      confidence: "high",
      explanation: "Reduz tempo médio de resposta em 30%"
    }
  ],
  businessScore: 75,
  maMetrics: [
    {
      name: "Customer Churn Rate",
      impact: 85,
      confidence: "high",
      explanation: "Melhora retenção ao otimizar onboarding"
    }
  ],
  maScore: 82,
  aiModel: "gemini-1.5-flash",
  aiConfidence: 0.92,
  processingTime: 2450,
  // ...
};
```

---

## Roadmap

### Futuras Melhorias

- [ ] Filtros por score range na tabela
- [ ] Comparação de insights entre atividades
- [ ] Histórico de análises (versioning)
- [ ] Export de insights (PDF, CSV)
- [ ] Análise batch (múltiplas atividades)
- [ ] Sugestões de melhorias baseadas em insights
- [ ] Integração com dashboard de analytics

---

## Contribuindo

### Adicionando Novos Componentes

1. Criar arquivo em `src/components/activities/`
2. Seguir padrões: TypeScript strict, React.memo, comentários em português
3. Exportar em `index.ts`
4. Adicionar documentação neste README
5. Adicionar testes (quando aplicável)

### Code Style

- **TypeScript strict mode**: Obrigatório
- **Componentes funcionais**: Sempre
- **Tailwind CSS**: 100% utility-first
- **Comentários**: Português
- **Nomes**: PascalCase para componentes, camelCase para funções

---

## Licença

Projeto Defenz - Uso interno

---

**Desenvolvido com React 19, Next.js 15, TypeScript e Google Gemini AI**
