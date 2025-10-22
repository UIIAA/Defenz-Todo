/**
 * Type Definitions para Gemini AI Analysis Service
 */

export interface ActivityInput {
  title: string;
  description?: string;
  area: string;
  priority: number;
  responsible?: string;
  how?: string;
  cost?: string;
}

export interface BusinessMetricConnection {
  name: string;
  category: 'operational' | 'sales' | 'customer_service' | 'productivity' | 'quality';
  impact: number;
  confidence: 'low' | 'medium' | 'high';
  explanation: string;
}

export interface MAMetricConnection {
  name: string;
  type: 'financial' | 'customer' | 'engagement' | 'product_health' | 'sales';
  impact: number;
  confidence: 'low' | 'medium' | 'high';
  explanation: string;
}

export interface ActivityAnalysis {
  businessMetrics: BusinessMetricConnection[];
  businessMetricScore: number;
  maMetrics: MAMetricConnection[];
  maScore: number;
  overallScore: number;
  aiConfidence: number;
  processingTime: number;
  tokenCount?: number;
  rawResponse: string;
}

export interface GeminiConfig {
  model: 'gemini-1.5-flash' | 'gemini-1.5-pro';
  temperature: number;
  maxOutputTokens: number;
}

export interface AnalysisCache {
  activityHash: string;
  result: ActivityAnalysis;
  timestamp: number;
  expiresAt: number;
}

export interface RateLimitState {
  userId: string;
  requestCount: number;
  windowStart: number;
  dailyCount: number;
  dailyStart: number;
}

/**
 * Tipos de erro personalizados
 */

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class GeminiAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'GeminiAPIError';
  }
}

export class GeminiValidationError extends Error {
  constructor(
    message: string,
    public rawResponse?: string,
    public validationDetails?: any
  ) {
    super(message);
    this.name = 'GeminiValidationError';
  }
}

/**
 * Configurações padrão
 */

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface ScoreWeights {
  businessWeight: number;
  maWeight: number;
  confidenceWeights: Record<ConfidenceLevel, number>;
}

export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  businessWeight: 0.4,
  maWeight: 0.6,
  confidenceWeights: {
    low: 0.5,
    medium: 0.75,
    high: 1.0,
  },
};

export interface RateLimit {
  maxPerMinute: number;
  maxPerDay: number;
}

export const DEFAULT_RATE_LIMIT: RateLimit = {
  maxPerMinute: 10,
  maxPerDay: 100
};

export interface CacheEntry {
  analysis: ActivityAnalysis;
  timestamp: number;
  expiresAt: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}
