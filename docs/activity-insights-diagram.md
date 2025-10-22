# ActivityInsight - Schema Diagram

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Activity : creates
    User ||--o{ ActivityInsight : creates
    Activity ||--o| ActivityInsight : has

    User {
        string id PK
        string email UK
        string name
        string password
        string role
        datetime createdAt
        datetime updatedAt
    }

    Activity {
        string id PK
        string title
        string description
        string area
        int priority
        string status
        string responsible
        string deadline
        string location
        string how
        string cost
        datetime deletedAt
        string userId FK
        datetime createdAt
        datetime updatedAt
    }

    ActivityInsight {
        string id PK
        string activityId FK_UK
        jsonb businessIndicators
        int businessScore
        jsonb maMetrics
        int maScore
        string aiModel
        decimal aiConfidence
        int processingTime
        int tokenCount
        text analysisPrompt
        text rawResponse
        string analysisVersion
        string createdBy FK
        datetime createdAt
        datetime updatedAt
    }
```

## Data Flow Diagram

```mermaid
flowchart TB
    User[👤 User] -->|1. Creates| Activity[📋 Activity]
    Activity -->|2. Triggers| Analysis[🤖 AI Analysis]
    Analysis -->|3. Calls| Gemini[Google Gemini API]
    Gemini -->|4. Returns| Response[📊 Analysis Response]
    Response -->|5. Saved as| Insight[💡 ActivityInsight]
    Insight -->|6. Displayed to| User

    subgraph "AI Processing"
        Analysis
        Gemini
        Response
    end

    subgraph "Database"
        Activity
        Insight
    end

    style User fill:#e1f5ff
    style Activity fill:#fff4e1
    style Insight fill:#e8f5e9
    style Gemini fill:#f3e5f5
```

## JSONB Structure

### businessIndicators JSONB

```mermaid
graph TD
    A[businessIndicators Array] --> B1[Indicator 1]
    A --> B2[Indicator 2]
    A --> B3[Indicator N]

    B1 --> C1[name: string]
    B1 --> C2[impact: 0-100]
    B1 --> C3[confidence: low/medium/high]
    B1 --> C4[explanation: string]

    style A fill:#e3f2fd
    style B1 fill:#f1f8e9
    style C1 fill:#fff9c4
    style C2 fill:#fff9c4
    style C3 fill:#fff9c4
    style C4 fill:#fff9c4
```

**Example JSON:**
```json
[
  {
    "name": "Tempo de Resposta ao Cliente",
    "impact": 90,
    "confidence": "high",
    "explanation": "Chatbot 24/7 reduz tempo médio de resposta de 4h para <1min"
  },
  {
    "name": "Satisfação do Cliente (CSAT)",
    "impact": 68,
    "confidence": "medium",
    "explanation": "Atendimento instantâneo melhora experiência"
  }
]
```

### maMetrics JSONB

```mermaid
graph TD
    A[maMetrics Array] --> B1[Metric 1]
    A --> B2[Metric 2]
    A --> B3[Metric N]

    B1 --> C1[name: MAMetricName]
    B1 --> C2[impact: 0-100]
    B1 --> C3[confidence: low/medium/high]
    B1 --> C4[explanation: string]

    style A fill:#e8f5e9
    style B1 fill:#f3e5f5
    style C1 fill:#ffe0b2
    style C2 fill:#ffe0b2
    style C3 fill:#ffe0b2
    style C4 fill:#ffe0b2
```

**Example JSON:**
```json
[
  {
    "name": "Customer Churn Rate",
    "impact": 72,
    "confidence": "medium",
    "explanation": "Melhor suporte reduz frustração e churn em 15-25%"
  },
  {
    "name": "NPS Score",
    "impact": 65,
    "confidence": "medium",
    "explanation": "Atendimento 24/7 e respostas rápidas melhoram NPS"
  }
]
```

## Index Strategy

```mermaid
graph LR
    A[activity_insights Table] --> B[Primary Index: id]
    A --> C[Unique Index: activityId]
    A --> D[Index: businessScore DESC]
    A --> E[Index: maScore DESC]
    A --> F[Index: createdAt DESC]
    A --> G[Index: aiModel]
    A --> H[Optional: GIN businessIndicators]
    A --> I[Optional: GIN maMetrics]

    B -.->|O1 lookup| J[Single record fetch]
    C -.->|O1 lookup| K[Find by activity]
    D -.->|Range scan| L[Top business impact]
    E -.->|Range scan| M[Top M&A impact]
    F -.->|Range scan| N[Recent analyses]
    G -.->|Group by| O[Model comparison]
    H -.->|JSONB ops| P[Metric name search]
    I -.->|JSONB ops| Q[Indicator search]

    style A fill:#bbdefb
    style B fill:#c8e6c9
    style C fill:#c8e6c9
    style D fill:#fff9c4
    style E fill:#fff9c4
    style F fill:#fff9c4
    style G fill:#fff9c4
    style H fill:#f8bbd0
    style I fill:#f8bbd0
```

## Query Patterns

### Pattern 1: Get Insight for Activity

```mermaid
sequenceDiagram
    participant App
    participant Prisma
    participant DB

    App->>Prisma: findUnique({ where: { activityId } })
    Prisma->>DB: SELECT * FROM activity_insights WHERE activity_id = ?
    DB-->>Prisma: Single row (or null)
    Prisma-->>App: ActivityInsight

    Note over DB: Uses UNIQUE INDEX<br/>O(1) lookup
```

### Pattern 2: Top Activities by M&A Impact

```mermaid
sequenceDiagram
    participant App
    participant Prisma
    participant DB

    App->>Prisma: findMany({ orderBy: { maScore: 'desc' }, take: 10 })
    Prisma->>DB: SELECT * FROM activity_insights<br/>ORDER BY ma_score DESC LIMIT 10
    DB-->>Prisma: Top 10 rows
    Prisma-->>App: ActivityInsight[]

    Note over DB: Uses INDEX on ma_score DESC<br/>Efficient range scan
```

### Pattern 3: Find by Metric Name (JSONB)

```mermaid
sequenceDiagram
    participant App
    participant Prisma
    participant DB

    App->>Prisma: $queryRaw`... WHERE ma_metrics @> '[{"name": "ARR"}]'`
    Prisma->>DB: SELECT * FROM activity_insights<br/>WHERE ma_metrics @> '...'::jsonb
    DB-->>Prisma: Matching rows
    Prisma-->>App: ActivityInsight[]

    Note over DB: Uses GIN INDEX (if created)<br/>JSONB containment operator
```

## Score Calculation Flow

```mermaid
flowchart TD
    A[AI Analysis Response] --> B{Parse Indicators}
    B -->|businessIndicators| C[Calculate Business Score]
    B -->|maMetrics| D[Calculate M&A Score]

    C --> E[Apply Confidence Weights]
    D --> F[Apply Confidence Weights]

    E --> G[High: 1.0<br/>Medium: 0.8<br/>Low: 0.5]
    F --> H[High: 1.0<br/>Medium: 0.8<br/>Low: 0.5]

    G --> I[Weighted Average]
    H --> J[Weighted Average]

    I --> K[businessScore: 0-100]
    J --> L[maScore: 0-100]

    K --> M[Save to DB]
    L --> M

    style A fill:#e1f5ff
    style K fill:#c8e6c9
    style L fill:#c8e6c9
    style M fill:#fff9c4
```

**Formula:**
```
score = round(
  sum(impact_i * weight_i) / sum(weight_i)
)

where:
  weight_high   = 1.0
  weight_medium = 0.8
  weight_low    = 0.5
```

## Performance Characteristics

```mermaid
graph TB
    subgraph "Write Performance (Low Volume)"
        W1[Create Insight]
        W2[~5ms DB write]
        W3[Multiple indexes updated]
        W1 --> W2 --> W3
    end

    subgraph "Read Performance (High Volume)"
        R1[Get by activityId]
        R2[Top N queries]
        R3[JSONB searches]
        R4[<10ms]
        R5[<50ms]
        R6[<100ms with GIN]
        R1 --> R4
        R2 --> R5
        R3 --> R6
    end

    subgraph "Storage"
        S1[~5KB per insight]
        S2[JSONB compression]
        S3[Efficient for 10k+ records]
        S1 --> S2 --> S3
    end

    style W1 fill:#ffccbc
    style R1 fill:#c8e6c9
    style R2 fill:#c8e6c9
    style R3 fill:#c8e6c9
    style S1 fill:#b3e5fc
```

## Data Integrity

```mermaid
flowchart TB
    A[Data Validation Layers]

    A --> B[Application Layer<br/>Zod Schemas]
    A --> C[Prisma Layer<br/>Type Safety]
    A --> D[Database Layer<br/>Constraints]

    B --> B1[✓ Score range 0-100]
    B --> B2[✓ Confidence 0.0-1.0]
    B --> B3[✓ JSONB structure]

    C --> C1[✓ Foreign keys]
    C --> C2[✓ Required fields]
    C --> C3[✓ Type enforcement]

    D --> D1[✓ UNIQUE activityId]
    D --> D2[✓ CASCADE delete]
    D --> D3[✓ CHECK constraints]

    style A fill:#e1f5ff
    style B fill:#fff9c4
    style C fill:#f1f8e9
    style D fill:#ffe0b2
```

## M&A Metric Categories

```mermaid
mindmap
  root((M&A Metrics))
    Revenue
      ARR
      MRR
      MRR Growth Rate
      Net New MRR
    Profitability
      EBITDA
      EBITDA Margin
      Gross Margin
      Burn Rate
      Rule of 40
    Customer
      Customer Churn Rate
      Revenue Churn Rate
      Net Revenue Retention
      LTV:CAC Ratio
      CAC Payback Period
      ARPU
      Customer Growth Rate
    Engagement
      DAU/MAU Ratio
      Activation Rate
      Weekly Retention
      Monthly Retention
      Time to First Value
    Product Health
      NPS Score
      CSAT Score
      CES Score
      Product Uptime
      API Response Time
      Error Rate
    Sales & Marketing
      Lead Conversion Rate
      Sales Cycle Length
      Pipeline Coverage
      CAC
      Lead Velocity Rate
```

## Use Case: Impact Dashboard

```mermaid
flowchart LR
    A[Dashboard Page] --> B{Load Top Insights}

    B --> C[Top M&A Impact<br/>ORDER BY maScore DESC]
    B --> D[Top Business Impact<br/>ORDER BY businessScore DESC]
    B --> E[Recent Analyses<br/>ORDER BY createdAt DESC]

    C --> F[Display Cards]
    D --> F
    E --> F

    F --> G[User Clicks Activity]
    G --> H[Load Full Insight]
    H --> I[Show All Indicators & Metrics]

    subgraph "Database Queries"
        C
        D
        E
        H
    end

    style A fill:#e1f5ff
    style F fill:#c8e6c9
    style I fill:#fff9c4
```

## Migration Timeline

```mermaid
gantt
    title ActivityInsight Migration Timeline
    dateFormat YYYY-MM-DD
    section Planning
    Schema Design           :done, des1, 2025-10-20, 1d
    Documentation          :done, doc1, 2025-10-20, 1d
    section Development
    Schema Validation      :done, val1, 2025-10-20, 1h
    Dev Migration         :active, mig1, 2025-10-20, 2h
    Testing               :test1, after mig1, 4h
    section Staging
    Staging Migration     :stg1, after test1, 1h
    Integration Tests     :stg2, after stg1, 2h
    section Production
    Prod Migration        :prod1, after stg2, 10m
    Monitoring            :prod2, after prod1, 1d
```

## Security Model

```mermaid
flowchart TD
    A[User Request] --> B{Authenticated?}
    B -->|No| C[401 Unauthorized]
    B -->|Yes| D{Owns Activity?}
    D -->|No| E[403 Forbidden]
    D -->|Yes| F{Rate Limit OK?}
    F -->|No| G[429 Too Many Requests]
    F -->|Yes| H[Generate Insight]

    H --> I{Validation}
    I -->|Fail| J[400 Bad Request]
    I -->|Pass| K[Save to DB]

    K --> L[Log Audit Trail<br/>userId, timestamp]
    L --> M[Return Insight]

    style A fill:#e1f5ff
    style H fill:#c8e6c9
    style K fill:#fff9c4
    style M fill:#c8e6c9
    style C fill:#ffcdd2
    style E fill:#ffcdd2
    style G fill:#ffcdd2
    style J fill:#ffcdd2
```

---

**Diagrams Generated**: 2025-10-20
**Tools**: Mermaid.js
**Version**: 1.0
