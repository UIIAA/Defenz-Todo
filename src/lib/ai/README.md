# Gemini AI Service - Análise de Atividades

Serviço completo de análise de atividades usando Google Gemini AI para identificar conexões com métricas de negócio e M&A.

## Visão Geral

O serviço analisa atividades do projeto Defenz e identifica automaticamente:

1. **Métricas de Negócio (Operacionais)**: Impacto no dia a dia
   - Operational, Sales, Customer Service, Productivity, Quality

2. **Métricas de M&A (Valuation)**: Impacto na avaliação da empresa
   - Financial, Customer, Engagement, Product Health, Sales

## Arquitetura

```
gemini-types.ts       → Tipos TypeScript e interfaces
gemini-validation.ts  → Schemas Zod e sanitização
gemini-prompts.ts     → Prompts estruturados
gemini-service.ts     → Serviço principal (API calls)
```

## Instalação

### 1. Instalar Dependências

```bash
npm install @google/generative-ai
```

### 2. Configurar API Key

Obtenha sua API key em: https://makersuite.google.com/app/apikey

Adicione ao `.env.local`:

```env
GEMINI_API_KEY="AIzaSy..."
```

## Uso Básico

### Exemplo Simples

```typescript
import { analyzeActivity } from '@/lib/ai/gemini-service';

const result = await analyzeActivity({
  title: "Implementar chatbot de atendimento",
  description: "Automatizar respostas frequentes",
  area: "Customer Service",
  priority: 0,
  how: "Integrar GPT-4 com base de conhecimento",
  cost: "R$ 5.000"
});

console.log('Overall Score:', result.overallScore); // 0-100
console.log('Business Metrics:', result.businessMetrics);
console.log('M&A Metrics:', result.maMetrics);
```

### Exemplo com Tratamento de Erros

```typescript
import {
  analyzeActivity,
  RateLimitError,
  GeminiValidationError,
  GeminiAPIError
} from '@/lib/ai/gemini-service';

try {
  const result = await analyzeActivity(activity, userId);

  // Sucesso
  console.log('Análise:', result);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.error(`Rate limit. Retry em ${error.retryAfter}s`);
  } else if (error instanceof GeminiValidationError) {
    console.error('Resposta inválida:', error.rawResponse);
  } else if (error instanceof GeminiAPIError) {
    console.error('Erro na API:', error.message);
  } else {
    console.error('Erro desconhecido:', error);
  }
}
```

### Exemplo com Serviço Customizado

```typescript
import { GeminiAnalysisService } from '@/lib/ai/gemini-service';

const service = new GeminiAnalysisService({
  apiKey: process.env.GEMINI_API_KEY!,
  model: 'gemini-1.5-pro', // Modelo mais avançado
  enableCache: true,
  cacheTTL: 12 * 60 * 60 * 1000, // 12h
  maxRequestsPerMinute: 20,
  scoreWeights: {
    businessWeight: 0.3,
    maWeight: 0.7 // Mais peso para M&A
  }
});

const result = await service.analyzeActivity(activity);
```

## API Reference

### `analyzeActivity(activity, userId?)`

Analisa uma atividade e retorna métricas conectadas.

**Parâmetros:**
- `activity: ActivityInput` - Dados da atividade
- `userId?: string` - ID do usuário para rate limiting (default: 'default')

**Retorna:** `Promise<ActivityAnalysis>`

**Throws:**
- `RateLimitError` - Rate limit excedido
- `GeminiValidationError` - Resposta inválida do Gemini
- `GeminiAPIError` - Erro na chamada da API

### `ActivityInput`

```typescript
interface ActivityInput {
  title: string;              // Obrigatório
  description?: string;       // Opcional
  area: string;               // Obrigatório
  priority: number;           // 0-2 (0=Alta, 1=Média, 2=Baixa)
  responsible?: string;       // Opcional
  how?: string;               // Opcional
  cost?: string;              // Opcional
}
```

### `ActivityAnalysis`

```typescript
interface ActivityAnalysis {
  businessMetrics: BusinessMetricConnection[];
  businessMetricScore: number;       // 0-100
  maMetrics: MAMetricConnection[];
  maScore: number;                   // 0-100
  overallScore: number;              // 0-100 (weighted)
  aiConfidence: number;              // 0-100
  processingTime: number;            // ms
  tokenCount?: number;               // tokens usados
  rawResponse: string;               // JSON bruto
}
```

### `BusinessMetricConnection`

```typescript
interface BusinessMetricConnection {
  name: string;
  category: 'operational' | 'sales' | 'customer_service' | 'productivity' | 'quality';
  impact: number;                    // 0-100
  confidence: 'low' | 'medium' | 'high';
  explanation: string;
}
```

### `MAMetricConnection`

```typescript
interface MAMetricConnection {
  name: string;
  type: 'financial' | 'customer' | 'engagement' | 'product_health' | 'sales';
  impact: number;                    // 0-100
  confidence: 'low' | 'medium' | 'high';
  explanation: string;
}
```

## Features

### ✅ Rate Limiting

- **10 requests/minuto** por usuário
- **100 requests/dia** por usuário
- Configurável via construtor

```typescript
const service = new GeminiAnalysisService({
  apiKey: '...',
  maxRequestsPerMinute: 20,
  maxRequestsPerDay: 200
});
```

### ✅ Cache Inteligente

- Cache em memória de **24h** (padrão)
- Hash baseado no conteúdo da atividade
- Cleanup automático de entradas expiradas

```typescript
// Limpar cache manualmente
service.clearCache();

// Ver estatísticas
const stats = service.getCacheStats();
console.log(stats); // { hits: 0, misses: 0, size: 5 }
```

### ✅ Retry Automático

- Máximo de **2 retries** em caso de erro
- Delay de 1s entre tentativas
- Configurável via construtor

### ✅ Validação Estrita

- Validação com Zod de todos os inputs
- Sanitização para prevenir prompt injection
- Validação da resposta do Gemini

### ✅ Content Safety

- Safety settings: `BLOCK_MEDIUM_AND_ABOVE`
- Sanitização de strings
- Proteção contra XSS

### ✅ Timeout

- Timeout padrão: **30 segundos**
- Previne hanging requests
- Configurável via construtor

## Scoring Algorithm

### Business Score (0-100)

```typescript
businessScore = weightedAverage(
  metrics.map(m => m.impact * confidenceWeight(m.confidence))
)

confidenceWeight('low')    = 0.5
confidenceWeight('medium') = 0.75
confidenceWeight('high')   = 1.0
```

### M&A Score (0-100)

```typescript
maScore = weightedAverage(
  metrics.map(m => m.impact * confidenceWeight(m.confidence))
)
```

### Overall Score (0-100)

```typescript
// M&A tem mais peso (60%) pois objetivo é exit
overallScore = (businessScore * 0.4) + (maScore * 0.6)
```

## Métricas Suportadas

### Business Metrics

**Operational**
- Tempo de Resposta
- Taxa de Erro
- Eficiência Operacional
- Tempo de Ciclo

**Sales**
- Taxa de Conversão
- Tamanho do Pipeline
- Número de Deals
- Ciclo de Vendas

**Customer Service**
- Satisfação do Cliente (CSAT)
- Tempo de Primeira Resposta
- Taxa de Resolução

**Productivity**
- Output por Pessoa/Hora
- Taxa de Utilização
- Velocidade de Entrega

**Quality**
- Taxa de Defeitos
- Taxa de Retrabalho
- Precisão

### M&A Metrics (Prioridade para Exit)

**Financial** 🔥
- ARR (Annual Recurring Revenue)
- MRR (Monthly Recurring Revenue)
- EBITDA Margin
- Rule of 40

**Customer** 🔥
- Customer Churn Rate
- Revenue Churn Rate
- LTV:CAC Ratio
- CAC Payback Period

**Engagement**
- DAU/MAU Ratio
- User Stickiness
- Session Duration

**Product Health**
- NPS Score
- Feature Adoption
- Time to Value

**Sales**
- Win Rate
- Sales Cycle Length
- Pipeline Value

## Melhores Práticas

### ✅ DO

- Use cache para atividades similares
- Implemente rate limiting por usuário
- Trate erros específicos (RateLimitError, etc.)
- Valide inputs antes de enviar
- Log erros com contexto

### ❌ DON'T

- Não exponha API key no frontend
- Não ignore rate limits
- Não confie em dados não validados
- Não ignore timeouts
- Não commit API keys

## Troubleshooting

### Erro: "GEMINI_API_KEY não está configurada"

**Solução:** Adicione a key no `.env.local`:
```env
GEMINI_API_KEY="AIzaSy..."
```

### Erro: "Rate limit excedido"

**Solução:** Aguarde o tempo indicado em `retryAfter` ou aumente limites:
```typescript
const service = new GeminiAnalysisService({
  apiKey: '...',
  maxRequestsPerMinute: 20
});
```

### Erro: "Resposta inválida do Gemini"

**Solução:** Geralmente resolvido com retry automático. Se persistir, verifique:
- Prompt não está muito longo
- Descrição da atividade não tem caracteres especiais
- Model está disponível

### Erro: "Timeout na chamada do Gemini"

**Solução:** Aumente o timeout:
```typescript
const service = new GeminiAnalysisService({
  apiKey: '...',
  timeout: 60000 // 60s
});
```

## Performance

### Benchmarks

- **Tempo médio de resposta**: 2-4 segundos
- **Cache hit**: < 1ms
- **Rate limit overhead**: < 1ms
- **Validação overhead**: < 10ms

### Custos

Usando `gemini-1.5-flash`:
- **Input**: $0.075 / 1M tokens
- **Output**: $0.30 / 1M tokens

Estimativa por análise:
- Input: ~500 tokens
- Output: ~300 tokens
- **Custo**: ~$0.0001 por análise

## Roadmap

- [ ] Suporte para análise em batch
- [ ] Cache em Redis (para produção)
- [ ] Métricas e monitoring
- [ ] Suporte para outros modelos (Claude, GPT-4)
- [ ] Fine-tuning com exemplos específicos
- [ ] WebSocket para análise em tempo real

## Suporte

Para issues ou dúvidas:
1. Verifique este README
2. Veja exemplos em `src/app/api/activities/analyze/route.ts`
3. Abra issue no GitHub

---

**Desenvolvido para o projeto Defenz com foco em exit/M&A**
