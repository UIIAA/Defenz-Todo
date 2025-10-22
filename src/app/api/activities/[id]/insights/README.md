# Activity Insights API

Endpoints para gerenciamento de insights de atividades gerados por IA (Google Gemini).

## Visão Geral

Os insights conectam atividades do projeto Defenz com:
- **Business Metrics** (métricas operacionais)
- **M&A Metrics** (métricas de valorização)

Cada atividade pode ter um único insight (relação 1:1).

## Endpoints

### GET /api/activities/[id]/insights

Busca o insight existente de uma atividade.

**Autenticação**: Requerida

**Response 200**:
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "activityId": "cuid",
    "businessMetrics": [
      {
        "name": "Tempo Médio de Resposta",
        "category": "customer_service",
        "impact": 75,
        "confidence": "high",
        "explanation": "Implementar chatbot reduz tempo de resposta..."
      }
    ],
    "businessMetricScore": 78,
    "maMetrics": [
      {
        "name": "NPS",
        "type": "product_health",
        "impact": 60,
        "confidence": "medium",
        "explanation": "Melhora na experiência aumenta satisfação..."
      }
    ],
    "maScore": 55,
    "overallScore": 64,
    "aiModel": "gemini-1.5-flash",
    "aiConfidence": 0.850,
    "processingTime": 1250,
    "tokenCount": 450,
    "analysisVersion": "1.0",
    "createdAt": "2025-01-21T12:00:00Z",
    "updatedAt": "2025-01-21T12:00:00Z",
    "activity": {
      "id": "cuid",
      "title": "Implementar chatbot de atendimento",
      "description": "...",
      "area": "Marketing",
      "priority": 0,
      "status": "pending"
    },
    "user": {
      "id": "cuid",
      "name": "João Silva",
      "email": "joao@example.com"
    }
  }
}
```

**Response 401**:
```json
{
  "success": false,
  "error": "Autenticação necessária"
}
```

**Response 404**:
```json
{
  "success": false,
  "error": "Insight não encontrado para esta atividade"
}
```

---

### POST /api/activities/[id]/insights

Gera um novo insight usando Google Gemini AI.

**Autenticação**: Requerida

**Comportamento**:
- Se insight já existe, retorna o existente (idempotente, status 200)
- Se não existe, gera novo com IA (status 201)

**Rate Limiting**:
- 10 requisições por minuto por usuário
- 100 requisições por dia por usuário

**Response 201** (Criado):
```json
{
  "success": true,
  "data": {
    "id": "cuid",
    "activityId": "cuid",
    "businessMetrics": [...],
    "businessMetricScore": 78,
    "maMetrics": [...],
    "maScore": 55,
    "overallScore": 64,
    "aiModel": "gemini-1.5-flash",
    "aiConfidence": 0.850,
    "processingTime": 1250,
    "tokenCount": 450,
    "analysisVersion": "1.0",
    "createdAt": "2025-01-21T12:00:00Z",
    "updatedAt": "2025-01-21T12:00:00Z",
    "activity": {...},
    "user": {...}
  },
  "message": "Insight gerado com sucesso"
}
```

**Response 200** (Já existe):
```json
{
  "success": true,
  "data": {...},
  "message": "Insight já existe para esta atividade"
}
```

**Response 401**:
```json
{
  "success": false,
  "error": "Autenticação necessária"
}
```

**Response 404**:
```json
{
  "success": false,
  "error": "Atividade não encontrada"
}
```

**Response 429** (Rate Limit):
```json
{
  "success": false,
  "error": "Rate limit excedido. Tente novamente em 45s",
  "retryAfter": 45
}
```

**Response 500** (Erro do Gemini):
```json
{
  "success": false,
  "error": "Erro ao analisar atividade com IA",
  "details": "Timeout na chamada do Gemini"
}
```

---

### DELETE /api/activities/[id]/insights

Deleta o insight de uma atividade (para permitir reanalise).

**Autenticação**: Requerida

**Permissões**:
- Apenas o criador do insight pode deletar
- Admins podem deletar qualquer insight

**Response 200**:
```json
{
  "success": true,
  "message": "Insight deletado com sucesso. Você pode gerar uma nova análise."
}
```

**Response 401**:
```json
{
  "success": false,
  "error": "Autenticação necessária"
}
```

**Response 403**:
```json
{
  "success": false,
  "error": "Sem permissão para deletar este insight"
}
```

**Response 404**:
```json
{
  "success": false,
  "error": "Insight não encontrado"
}
```

---

## Estrutura de Dados

### Business Metrics (Métricas Operacionais)

Métricas do dia-a-dia do negócio:

```typescript
interface BusinessMetricConnection {
  name: string;                    // "Tempo de Resposta", "Produtividade"
  category: 'operational' | 'sales' | 'customer_service' | 'productivity' | 'quality';
  impact: number;                  // 0-100: quanto a atividade impacta esta métrica
  confidence: 'low' | 'medium' | 'high';  // confiança da IA na análise
  explanation: string;             // como a atividade impacta esta métrica
}
```

**Categorias**:
- `operational`: Operações gerais
- `sales`: Vendas
- `customer_service`: Atendimento ao cliente
- `productivity`: Produtividade
- `quality`: Qualidade

### M&A Metrics (Métricas de Valorização)

Métricas que impactam valuation para M&A:

```typescript
interface MAMetricConnection {
  name: string;                    // "ARR", "Churn", "NPS"
  type: 'financial' | 'customer' | 'engagement' | 'product_health' | 'sales';
  impact: number;                  // 0-100: quanto a atividade impacta esta métrica
  confidence: 'low' | 'medium' | 'high';
  explanation: string;
}
```

**Tipos**:
- `financial`: ARR, MRR, EBITDA, Gross Margin
- `customer`: Churn, LTV:CAC, NRR
- `engagement`: DAU/MAU, Activation, Retention
- `product_health`: NPS, CSAT, Uptime
- `sales`: CAC, Conversion Rate, Pipeline

### Scores

- **businessMetricScore**: 0-100, média ponderada do impacto em métricas operacionais
- **maScore**: 0-100, média ponderada do impacto em métricas de M&A
- **overallScore**: 0-100, score geral (40% business + 60% M&A)
- **aiConfidence**: 0-1, confiança média da IA na análise

**Ponderação**:
- Confidence `high`: peso 1.0
- Confidence `medium`: peso 0.75
- Confidence `low`: peso 0.5

---

## Fluxo de Uso

### 1. Gerar Insight (primeira vez)

```bash
POST /api/activities/abc123/insights
```

A IA analisa a atividade e retorna métricas conectadas.

### 2. Consultar Insight

```bash
GET /api/activities/abc123/insights
```

Retorna o insight existente (rápido, do banco).

### 3. Reanalisar (opcional)

```bash
# Deletar insight antigo
DELETE /api/activities/abc123/insights

# Gerar novo
POST /api/activities/abc123/insights
```

---

## Caching

O serviço Gemini usa cache interno:
- **TTL**: 24 horas
- **Key**: Hash SHA-256 dos dados da atividade
- Atividades idênticas retornam análise em cache

---

## Variáveis de Ambiente

```env
GEMINI_API_KEY=your_google_gemini_api_key
```

Obter em: https://aistudio.google.com/app/apikey

---

## Exemplos de Uso

### Gerar insight para nova atividade

```typescript
const response = await fetch('/api/activities/abc123/insights', {
  method: 'POST',
});

const { data } = await response.json();

console.log('Overall Score:', data.overallScore);
console.log('Business Metrics:', data.businessMetrics);
console.log('M&A Metrics:', data.maMetrics);
```

### Verificar se tem insight

```typescript
const response = await fetch('/api/activities/abc123/insights');

if (response.status === 404) {
  console.log('Sem insight ainda. Gerar?');
} else {
  const { data } = await response.json();
  console.log('Insight:', data);
}
```

### Deletar e reanalisar

```typescript
// Deletar
await fetch('/api/activities/abc123/insights', {
  method: 'DELETE',
});

// Reanalisar
const response = await fetch('/api/activities/abc123/insights', {
  method: 'POST',
});

const { data } = await response.json();
console.log('Nova análise:', data);
```

---

## Performance

- **GET**: ~50ms (leitura do banco)
- **POST (cache hit)**: ~200ms (cache + gravação)
- **POST (cache miss)**: ~1-3s (chamada Gemini + gravação)
- **DELETE**: ~100ms

---

## Erros Comuns

### GEMINI_API_KEY não configurada

```json
{
  "success": false,
  "error": "Erro ao analisar atividade com IA",
  "details": "GEMINI_API_KEY não está configurada nas variáveis de ambiente"
}
```

**Solução**: Adicionar `GEMINI_API_KEY` no `.env.local`

### Rate limit excedido

```json
{
  "success": false,
  "error": "Rate limit excedido. Tente novamente em 45s",
  "retryAfter": 45
}
```

**Solução**: Aguardar o tempo indicado em `retryAfter`

### Atividade deletada

```json
{
  "success": false,
  "error": "Atividade foi deletada"
}
```

**Solução**: Restaurar atividade ou usar outra

---

## Segurança

- Todas as rotas requerem autenticação
- Rate limiting protege contra abuso
- DELETE protegido por ownership/admin role
- Inputs sanitizados antes de enviar à IA
- Content safety habilitado no Gemini

---

## Próximos Passos

- [ ] Adicionar webhooks para análise automática
- [ ] Dashboard de insights agregados
- [ ] Comparação de atividades por score
- [ ] Exportar relatório de impacto
- [ ] Sugestões de melhorias baseadas em IA
