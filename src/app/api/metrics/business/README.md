# Business Metrics API

API completa para gerenciamento de métricas operacionais de negócio (não M&A).

## Modelo de Dados

```typescript
BusinessMetric {
  id: string
  period: Date              // Mês de referência (YYYY-MM-01)
  category: string          // operational, sales, customer_service, productivity, quality
  metricName: string        // Nome da métrica
  metricValue: Decimal      // Valor medido
  metricUnit: string        // Unidade (ex: "minutos", "%", "unidades")
  target: Decimal?          // Meta desejada (opcional)
  description: string?      // Descrição do que mede
  area: string              // Marketing, Vendas, Gestão, etc.
  userId: string
  source: string            // manual, api, import, calculated
  notes: string?
  version: int              // Auto-incrementado para period + metricName
  createdAt: DateTime
  updatedAt: DateTime
}
```

## Endpoints

### GET /api/metrics/business

Lista métricas operacionais com filtros e agregações.

**Query Parameters:**
- `limit` (number, padrão: 100) - Limite de registros
- `startDate` (string, YYYY-MM-01) - Data inicial
- `endDate` (string, YYYY-MM-01) - Data final
- `category` (string) - Filtro por categoria
- `area` (string) - Filtro por área
- `metricName` (string) - Filtro por nome da métrica
- `version` (number) - Versão específica

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "cm50abc123",
      "period": "2025-01-01",
      "category": "productivity",
      "metricName": "Tarefas Completadas por Pessoa",
      "metricValue": 12.5,
      "metricUnit": "tarefas/dia",
      "target": 15,
      "description": "Média diária de tarefas finalizadas por colaborador",
      "area": "Gestão",
      "userId": "cm50xyz789",
      "source": "manual",
      "notes": null,
      "version": 1,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z",
      "user": {
        "id": "cm50xyz789",
        "name": "João Silva",
        "email": "joao@example.com"
      }
    }
  ],
  "summary": {
    "count": 15,
    "latestPeriod": "2025-01-01",
    "categories": {
      "operational": 5,
      "sales": 3,
      "customer_service": 4,
      "productivity": 2,
      "quality": 1
    },
    "areas": {
      "Marketing": 5,
      "Vendas": 4,
      "Gestão": 6
    },
    "uniqueMetrics": 12,
    "metricsWithTargets": 10,
    "metricsAboveTarget": 7
  },
  "count": 15
}
```

### POST /api/metrics/business

Cria nova métrica operacional.

**Body:**
```json
{
  "period": "2025-01-01",
  "category": "productivity",
  "metricName": "Tarefas Completadas por Pessoa",
  "metricValue": 12.5,
  "metricUnit": "tarefas/dia",
  "target": 15,
  "description": "Média diária de tarefas finalizadas por colaborador",
  "area": "Gestão",
  "source": "manual",
  "notes": "Primeira medição do ano"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm50abc123",
    "period": "2025-01-01",
    "category": "productivity",
    "metricName": "Tarefas Completadas por Pessoa",
    "metricValue": 12.5,
    "metricUnit": "tarefas/dia",
    "target": 15,
    "description": "Média diária de tarefas finalizadas por colaborador",
    "area": "Gestão",
    "userId": "cm50xyz789",
    "source": "manual",
    "notes": "Primeira medição do ano",
    "version": 1,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z",
    "user": {
      "id": "cm50xyz789",
      "name": "João Silva",
      "email": "joao@example.com"
    }
  },
  "message": "Métrica operacional criada com sucesso"
}
```

### GET /api/metrics/business/:id

Retorna métrica específica por ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm50abc123",
    "period": "2025-01-01",
    "category": "productivity",
    // ... todos os campos
  }
}
```

### PUT /api/metrics/business/:id

Atualiza métrica existente.

**Nota:** `period` e `metricName` NÃO podem ser alterados (campos de versionamento).

**Body:**
```json
{
  "metricValue": 13.2,
  "target": 16,
  "notes": "Valor corrigido após revisão"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm50abc123",
    // ... dados atualizados
  },
  "message": "Métrica operacional atualizada com sucesso"
}
```

### DELETE /api/metrics/business/:id

Deleta métrica.

**Response:**
```json
{
  "success": true,
  "message": "Métrica operacional deletada com sucesso"
}
```

## Categorias Disponíveis

- `operational` - Métricas operacionais gerais
- `sales` - Métricas de vendas e conversão
- `customer_service` - Métricas de atendimento
- `productivity` - Métricas de produtividade
- `quality` - Métricas de qualidade

## Versionamento

O sistema mantém versões para cada combinação de `period` + `metricName`:

1. Ao criar métrica com `period` e `metricName` existentes, `version` é auto-incrementado
2. Permite correções e ajustes mantendo histórico
3. Query pode filtrar por `version` específica
4. Por padrão, retorna última versão (`ORDER BY version DESC`)

## Exemplos de Uso

### Criar métrica de tempo de resposta

```bash
POST /api/metrics/business
{
  "period": "2025-01-01",
  "category": "customer_service",
  "metricName": "Tempo Médio de Resposta",
  "metricValue": 45,
  "metricUnit": "minutos",
  "target": 30,
  "area": "Atendimento",
  "source": "manual"
}
```

### Listar métricas de produtividade

```bash
GET /api/metrics/business?category=productivity&startDate=2025-01-01&endDate=2025-03-01
```

### Buscar métricas de uma área específica

```bash
GET /api/metrics/business?area=Marketing&limit=50
```

### Corrigir valor de métrica (cria nova versão)

```bash
POST /api/metrics/business
{
  "period": "2025-01-01",
  "category": "productivity",
  "metricName": "Tarefas Completadas por Pessoa",
  "metricValue": 13.8,  // valor corrigido
  "metricUnit": "tarefas/dia",
  "target": 15,
  "area": "Gestão",
  "source": "manual",
  "notes": "Correção após auditoria"
}
// Versão será incrementada automaticamente (version: 2)
```

## Validação

Todos os endpoints validam dados com Zod:

- `period` deve ser primeiro dia do mês (YYYY-MM-01)
- `category` deve ser uma das 5 categorias válidas
- `metricName` é obrigatório (1-100 caracteres)
- `metricValue` é obrigatório (número)
- `metricUnit` é obrigatório (1-50 caracteres)
- `area` é obrigatório (1-100 caracteres)
- `source` deve ser: manual, api, import ou calculated
- `notes` máximo 5000 caracteres

## Autenticação

Todos os endpoints requerem autenticação via NextAuth.

## Erros

### 400 - Bad Request
```json
{
  "success": false,
  "error": "Dados inválidos",
  "details": [
    {
      "field": "category",
      "message": "Categoria inválida"
    }
  ]
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "error": "Não autorizado"
}
```

### 404 - Not Found
```json
{
  "success": false,
  "error": "Métrica não encontrada"
}
```

### 500 - Internal Server Error
```json
{
  "success": false,
  "error": "Erro interno do servidor"
}
```

## Diferença: Business Metrics vs M&A Metrics

### Business Metrics (Esta API)
- **Foco:** Performance operacional do dia-a-dia
- **Exemplos:** Tempo de resposta, produtividade, taxa de conversão
- **Uso:** Gestão operacional, melhoria contínua

### M&A Metrics (Outras APIs)
- **Foco:** Valorização e atração de investidores
- **Exemplos:** ARR, MRR, Churn, LTV:CAC, EBITDA, NPS
- **Uso:** Due diligence, valuation, M&A readiness

## Arquivo de Validação

Schemas Zod: `/src/lib/validations/metrics.ts`
- `createBusinessMetricSchema` - Para criação
- `updateBusinessMetricSchema` - Para atualização
