/**
 * Gemini AI Service - Barrel Export
 *
 * Exporta todos os tipos, funções e classes do serviço de análise.
 * Facilita imports em outros arquivos do projeto.
 */

// Service principal
export {
  GeminiAnalysisService,
  getGeminiService,
  analyzeActivity
} from './gemini-service';

// Tipos
export type {
  ActivityInput,
  ActivityAnalysis,
  BusinessMetricConnection,
  MAMetricConnection,
  ConfidenceLevel,
  ScoreWeights,
  CacheStats,
  CacheEntry,
  RateLimit
} from './gemini-types';

// Erros
export {
  RateLimitError,
  GeminiValidationError,
  GeminiAPIError,
  DEFAULT_SCORE_WEIGHTS
} from './gemini-types';

// Validação
export {
  businessMetricSchema,
  maMetricSchema,
  geminiResponseSchema,
  activityInputSchema,
  sanitizeString,
  sanitizeActivityInput,
  validateAndSanitizeInput,
  validateGeminiResponse,
  parseAndValidateGeminiResponse,
  KNOWN_BUSINESS_METRICS,
  KNOWN_MA_METRICS
} from './gemini-validation';

// Tipos validados
export type {
  ValidatedActivityInput,
  ValidatedGeminiResponse,
  ValidatedBusinessMetric,
  ValidatedMAMetric
} from './gemini-validation';

// Prompts (normalmente não precisa exportar, mas pode ser útil)
export {
  SYSTEM_PROMPT,
  buildActivityPrompt,
  buildAnalysisPrompt,
  RETRY_PROMPT,
  SAFETY_SETTINGS,
  GENERATION_CONFIG
} from './gemini-prompts';
