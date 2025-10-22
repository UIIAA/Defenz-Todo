/**
 * ACTIVITY INSIGHT TYPES
 *
 * Type definitions for AI-generated insights on activities
 * Integrates with Google Gemini AI for business impact analysis
 */

// ============================================================
// CORE INSIGHT TYPES
// ============================================================

/**
 * Confidence level for AI predictions
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high';

/**
 * Business Indicator identified by AI
 * Represents operational metrics impacted by the activity
 */
export interface BusinessIndicator {
  name: string; // e.g., "Tempo de Resposta", "Satisfação Cliente"
  impact: number; // 0-100: severity/importance of impact
  confidence: ConfidenceLevel; // AI confidence in this prediction
  explanation: string; // Why this indicator is impacted
}

/**
 * M&A Metric identified by AI
 * Represents financial/valuation metrics impacted by the activity
 */
export interface MAMetric {
  name: MAMetricName; // Standardized metric names
  impact: number; // 0-100: severity/importance of impact
  confidence: ConfidenceLevel; // AI confidence in this prediction
  explanation: string; // Why this metric is impacted
}

/**
 * Standardized M&A Metric Names
 * Aligned with models in prisma/schema.prisma
 */
export type MAMetricName =
  // Revenue Metrics
  | 'ARR'
  | 'MRR'
  | 'MRR Growth Rate'
  | 'Net New MRR'

  // Profitability Metrics
  | 'EBITDA'
  | 'EBITDA Margin'
  | 'Gross Margin'
  | 'Burn Rate'
  | 'Rule of 40'

  // Customer Metrics
  | 'Customer Churn Rate'
  | 'Revenue Churn Rate'
  | 'Net Revenue Retention'
  | 'LTV:CAC Ratio'
  | 'CAC Payback Period'
  | 'ARPU'
  | 'Customer Growth Rate'

  // Engagement Metrics
  | 'DAU/MAU Ratio'
  | 'Activation Rate'
  | 'Weekly Retention'
  | 'Monthly Retention'
  | 'Time to First Value'

  // Product Health Metrics
  | 'NPS Score'
  | 'CSAT Score'
  | 'CES Score'
  | 'Product Uptime'
  | 'API Response Time'
  | 'Error Rate'

  // Sales & Marketing Metrics
  | 'Lead Conversion Rate'
  | 'Sales Cycle Length'
  | 'Pipeline Coverage'
  | 'CAC'
  | 'Lead Velocity Rate';

// ============================================================
// ACTIVITY INSIGHT MODEL
// ============================================================

/**
 * Complete ActivityInsight as stored in database
 * Matches prisma/schema.prisma ActivityInsight model
 */
export interface ActivityInsight {
  id: string;
  activityId: string;

  // Business Impact
  businessIndicators: BusinessIndicator[];
  businessScore: number; // 0-100

  // M&A Impact
  maMetrics: MAMetric[];
  maScore: number; // 0-100

  // AI Metadata
  aiModel: string; // e.g., "gemini-1.5-flash"
  aiConfidence: number; // 0.0-1.0
  processingTime: number; // milliseconds
  tokenCount?: number; // tokens consumed

  // Analysis Context
  analysisPrompt: string;
  rawResponse: string;
  analysisVersion: string;

  // Audit Trail
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// API REQUEST/RESPONSE TYPES
// ============================================================

/**
 * Request to create/update an insight
 */
export interface CreateInsightRequest {
  activityId: string;
  userId: string; // createdBy
  forceReanalysis?: boolean; // Re-analyze even if exists
}

/**
 * Response from AI analysis
 */
export interface InsightAnalysisResponse {
  businessIndicators: BusinessIndicator[];
  businessScore: number;
  maMetrics: MAMetric[];
  maScore: number;
  aiConfidence: number;
  processingTime: number;
  tokenCount?: number;
}

/**
 * Insight with activity details (for API responses)
 */
export interface ActivityInsightWithActivity extends ActivityInsight {
  activity: {
    id: string;
    title: string;
    description?: string;
    area: string;
    priority: number;
    status: string;
  };
}

// ============================================================
// QUERY FILTER TYPES
// ============================================================

/**
 * Filters for querying insights
 */
export interface InsightFilters {
  minBusinessScore?: number;
  minMaScore?: number;
  minAiConfidence?: number;
  metricNames?: MAMetricName[];
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Sort options for insight queries
 */
export type InsightSortBy =
  | 'businessScore'
  | 'maScore'
  | 'aiConfidence'
  | 'createdAt'
  | 'processingTime';

export interface InsightQueryOptions extends InsightFilters {
  sortBy?: InsightSortBy;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// ============================================================
// AI PROMPT TYPES
// ============================================================

/**
 * Context passed to AI for analysis
 */
export interface ActivityAnalysisContext {
  activity: {
    title: string;
    description?: string;
    area: string;
    priority: number;
    responsible?: string;
    deadline?: string;
    location?: string;
    how?: string;
    cost?: string;
  };
  existingMetrics?: {
    hasFinancialData: boolean;
    hasCustomerData: boolean;
    hasEngagementData: boolean;
  };
}

/**
 * AI model configuration
 */
export interface AIModelConfig {
  modelName: string; // "gemini-1.5-flash", "gemini-1.5-pro"
  temperature?: number; // 0.0-1.0
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

// ============================================================
// STATISTICS & AGGREGATIONS
// ============================================================

/**
 * Aggregated statistics for insights
 */
export interface InsightStatistics {
  totalInsights: number;
  averageBusinessScore: number;
  averageMaScore: number;
  averageAiConfidence: number;
  averageProcessingTime: number;

  // Top metrics
  topBusinessIndicators: Array<{ name: string; count: number; avgImpact: number }>;
  topMaMetrics: Array<{ name: MAMetricName; count: number; avgImpact: number }>;

  // By model
  byAiModel: Array<{
    model: string;
    count: number;
    avgConfidence: number;
    avgProcessingTime: number;
  }>;
}

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

/**
 * Score validation constraints
 */
export const SCORE_CONSTRAINTS = {
  MIN: 0,
  MAX: 100,
} as const;

/**
 * AI confidence validation constraints
 */
export const CONFIDENCE_CONSTRAINTS = {
  MIN: 0.0,
  MAX: 1.0,
  DECIMALS: 3,
} as const;

/**
 * Confidence level thresholds
 */
export const CONFIDENCE_THRESHOLDS = {
  LOW: 0.0,
  MEDIUM: 0.6,
  HIGH: 0.85,
} as const;

/**
 * Helper to determine confidence level from numeric confidence
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'high';
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'medium';
  return 'low';
}

/**
 * Helper to validate score
 */
export function isValidScore(score: number): boolean {
  return (
    Number.isInteger(score) &&
    score >= SCORE_CONSTRAINTS.MIN &&
    score <= SCORE_CONSTRAINTS.MAX
  );
}

/**
 * Helper to validate AI confidence
 */
export function isValidConfidence(confidence: number): boolean {
  return (
    confidence >= CONFIDENCE_CONSTRAINTS.MIN &&
    confidence <= CONFIDENCE_CONSTRAINTS.MAX
  );
}
