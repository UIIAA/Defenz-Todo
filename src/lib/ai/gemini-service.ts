/**
 * Serviço de análise de atividades com Google Gemini AI
 *
 * Analisa atividades do projeto Defenz e identifica conexões com:
 * - Métricas de negócio (operacionais)
 * - Métricas de M&A (valuation)
 *
 * Features:
 * - Rate limiting (10 req/min, 100 req/dia)
 * - Cache de 24h (mesmo hash de atividade)
 * - Retry automático (max 2 tentativas)
 * - Validação estrita com Zod
 * - Content safety
 */

import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import crypto from 'crypto';

import type {
  ActivityInput,
  ActivityAnalysis,
  BusinessMetricConnection,
  MAMetricConnection,
  ScoreWeights,
  ConfidenceLevel,
  CacheEntry,
  CacheStats
} from './gemini-types';

import {
  GeminiAPIError,
  GeminiValidationError,
  RateLimitError,
  DEFAULT_SCORE_WEIGHTS
} from './gemini-types';

import {
  validateAndSanitizeInput,
  parseAndValidateGeminiResponse,
  type ValidatedGeminiResponse
} from './gemini-validation';

import {
  buildAnalysisPrompt,
  RETRY_PROMPT,
  SAFETY_SETTINGS,
  GENERATION_CONFIG
} from './gemini-prompts';

/**
 * Configuração do serviço
 */
interface GeminiServiceConfig {
  /** API Key do Google Gemini */
  apiKey: string;

  /** Modelo a usar (padrão: gemini-1.5-flash) */
  model?: string;

  /** Habilitar cache (padrão: true) */
  enableCache?: boolean;

  /** TTL do cache em ms (padrão: 24h) */
  cacheTTL?: number;

  /** Habilitar rate limiting (padrão: true) */
  enableRateLimit?: boolean;

  /** Max requests por minuto (padrão: 10) */
  maxRequestsPerMinute?: number;

  /** Max requests por dia (padrão: 100) */
  maxRequestsPerDay?: number;

  /** Pesos customizados para scoring */
  scoreWeights?: Partial<ScoreWeights>;

  /** Timeout em ms (padrão: 30s) */
  timeout?: number;

  /** Máximo de retries (padrão: 2) */
  maxRetries?: number;
}

/**
 * Rate limiter simples em memória
 */
class RateLimiter {
  private minuteRequests: Map<string, number[]> = new Map();
  private dayRequests: Map<string, number[]> = new Map();

  constructor(
    private maxPerMinute: number,
    private maxPerDay: number
  ) {}

  /**
   * Verifica se pode fazer requisição
   */
  canMakeRequest(userId: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Limpar requisições antigas
    this.cleanOldRequests(userId, oneMinuteAgo, oneDayAgo);

    const minuteReqs = this.minuteRequests.get(userId) || [];
    const dayReqs = this.dayRequests.get(userId) || [];

    // Verificar limite por minuto
    if (minuteReqs.length >= this.maxPerMinute) {
      const oldestRequest = minuteReqs[0];
      const retryAfter = Math.ceil((oldestRequest + 60 * 1000 - now) / 1000);
      return { allowed: false, retryAfter };
    }

    // Verificar limite por dia
    if (dayReqs.length >= this.maxPerDay) {
      const oldestRequest = dayReqs[0];
      const retryAfter = Math.ceil((oldestRequest + 24 * 60 * 60 * 1000 - now) / 1000);
      return { allowed: false, retryAfter };
    }

    return { allowed: true };
  }

  /**
   * Registra uma requisição
   */
  recordRequest(userId: string): void {
    const now = Date.now();

    const minuteReqs = this.minuteRequests.get(userId) || [];
    minuteReqs.push(now);
    this.minuteRequests.set(userId, minuteReqs);

    const dayReqs = this.dayRequests.get(userId) || [];
    dayReqs.push(now);
    this.dayRequests.set(userId, dayReqs);
  }

  /**
   * Limpa requisições antigas
   */
  private cleanOldRequests(userId: string, oneMinuteAgo: number, oneDayAgo: number): void {
    const minuteReqs = this.minuteRequests.get(userId) || [];
    this.minuteRequests.set(
      userId,
      minuteReqs.filter(t => t > oneMinuteAgo)
    );

    const dayReqs = this.dayRequests.get(userId) || [];
    this.dayRequests.set(
      userId,
      dayReqs.filter(t => t > oneDayAgo)
    );
  }
}

/**
 * Cache simples em memória
 */
class AnalysisCache {
  private cache: Map<string, CacheEntry> = new Map();
  private hits: number = 0;
  private misses: number = 0;

  constructor(private ttl: number) {}

  /**
   * Busca no cache
   */
  get(key: string): ActivityAnalysis | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Verificar expiração
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.analysis;
  }

  /**
   * Adiciona ao cache
   */
  set(key: string, analysis: ActivityAnalysis): void {
    const entry: CacheEntry = {
      analysis,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.ttl
    };

    this.cache.set(key, entry);
  }

  /**
   * Limpa entradas expiradas
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Estatísticas do cache
   */
  getStats(): CacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size
    };
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

/**
 * Serviço principal de análise com Gemini AI
 */
export class GeminiAnalysisService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private config: Required<GeminiServiceConfig>;
  private cache: AnalysisCache;
  private rateLimiter: RateLimiter;
  private scoreWeights: ScoreWeights;

  constructor(config: GeminiServiceConfig) {
    // Validar API key
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new Error('GEMINI_API_KEY é obrigatório');
    }

    // Configuração com defaults
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'gemini-1.5-flash',
      enableCache: config.enableCache ?? true,
      cacheTTL: config.cacheTTL || 24 * 60 * 60 * 1000, // 24h
      enableRateLimit: config.enableRateLimit ?? true,
      maxRequestsPerMinute: config.maxRequestsPerMinute || 10,
      maxRequestsPerDay: config.maxRequestsPerDay || 100,
      scoreWeights: { ...DEFAULT_SCORE_WEIGHTS, ...config.scoreWeights },
      timeout: config.timeout || 30000, // 30s
      maxRetries: config.maxRetries || 2
    };

    // Inicializar Google Generative AI
    this.genAI = new GoogleGenerativeAI(this.config.apiKey);

    // Configurar modelo
    this.model = this.genAI.getGenerativeModel({
      model: this.config.model,
      safetySettings: SAFETY_SETTINGS.map(s => ({
        category: s.category as HarmCategory,
        threshold: s.threshold as HarmBlockThreshold
      })),
      generationConfig: GENERATION_CONFIG
    });

    // Inicializar cache
    this.cache = new AnalysisCache(this.config.cacheTTL);

    // Inicializar rate limiter
    this.rateLimiter = new RateLimiter(
      this.config.maxRequestsPerMinute,
      this.config.maxRequestsPerDay
    );

    this.scoreWeights = this.config.scoreWeights as ScoreWeights;

    // Cleanup periódico do cache (a cada hora)
    setInterval(() => this.cache.cleanup(), 60 * 60 * 1000);
  }

  /**
   * Analisa uma atividade e retorna métricas conectadas
   *
   * @param activity - Dados da atividade
   * @param userId - ID do usuário (para rate limiting, padrão: 'default')
   * @returns Análise completa com métricas e scores
   */
  async analyzeActivity(
    activity: ActivityInput,
    userId: string = 'default'
  ): Promise<ActivityAnalysis> {
    const startTime = Date.now();

    try {
      // 1. Validar e sanitizar input
      const validatedActivity = validateAndSanitizeInput(activity);

      // 2. Verificar cache
      if (this.config.enableCache) {
        const cacheKey = this.generateCacheKey(validatedActivity);
        const cached = this.cache.get(cacheKey);

        if (cached) {
          console.log('[Gemini] Cache hit:', cacheKey);
          return cached;
        }
      }

      // 3. Verificar rate limit
      if (this.config.enableRateLimit) {
        const { allowed, retryAfter } = this.rateLimiter.canMakeRequest(userId);

        if (!allowed) {
          throw new RateLimitError(
            `Rate limit excedido. Tente novamente em ${retryAfter}s`,
            retryAfter || 60
          );
        }

        this.rateLimiter.recordRequest(userId);
      }

      // 4. Chamar Gemini com retry
      const geminiResponse = await this.callGeminiWithRetry(validatedActivity);

      // 5. Calcular scores
      const businessMetricScore = this.calculateBusinessScore(geminiResponse.businessMetrics);
      const maScore = this.calculateMAScore(geminiResponse.maMetrics);
      const overallScore = this.calculateOverallScore(businessMetricScore, maScore);
      const aiConfidence = this.calculateAIConfidence(
        geminiResponse.businessMetrics,
        geminiResponse.maMetrics
      );

      // 6. Montar resultado
      const analysis: ActivityAnalysis = {
        businessMetrics: geminiResponse.businessMetrics,
        businessMetricScore,
        maMetrics: geminiResponse.maMetrics,
        maScore,
        overallScore,
        aiConfidence,
        processingTime: Date.now() - startTime,
        rawResponse: JSON.stringify(geminiResponse)
      };

      // 7. Salvar em cache
      if (this.config.enableCache) {
        const cacheKey = this.generateCacheKey(validatedActivity);
        this.cache.set(cacheKey, analysis);
      }

      console.log('[Gemini] Análise concluída:', {
        processingTime: analysis.processingTime,
        businessMetrics: analysis.businessMetrics.length,
        maMetrics: analysis.maMetrics.length,
        overallScore: analysis.overallScore
      });

      return analysis;
    } catch (error) {
      console.error('[Gemini] Erro na análise:', error);

      // Re-throw erros conhecidos
      if (
        error instanceof RateLimitError ||
        error instanceof GeminiValidationError ||
        error instanceof GeminiAPIError
      ) {
        throw error;
      }

      // Wrap outros erros
      throw new GeminiAPIError(
        error instanceof Error ? error.message : 'Erro desconhecido ao analisar atividade',
        undefined,
        error
      );
    }
  }

  /**
   * Chama Gemini API com retry automático
   */
  private async callGeminiWithRetry(
    activity: ActivityInput,
    attempt: number = 1
  ): Promise<ValidatedGeminiResponse> {
    try {
      const prompt = buildAnalysisPrompt(activity);

      console.log(`[Gemini] Chamando API (tentativa ${attempt}/${this.config.maxRetries + 1})...`);

      // Criar timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout na chamada do Gemini')), this.config.timeout);
      });

      // Chamar API
      const resultPromise = this.model.generateContent(prompt);

      // Race entre API call e timeout
      const result = await Promise.race([resultPromise, timeoutPromise]) as any;

      const response = result.response;
      const text = response.text();

      console.log('[Gemini] Resposta recebida:', text.substring(0, 200));

      // Validar resposta
      const validation = parseAndValidateGeminiResponse(text);

      if (!validation.success) {
        throw new GeminiValidationError(
          validation.error || 'Resposta inválida do Gemini',
          text,
          validation.details
        );
      }

      return validation.data!;
    } catch (error) {
      console.error(`[Gemini] Erro na tentativa ${attempt}:`, error);

      // Se tiver tentativas restantes, retry
      if (attempt < this.config.maxRetries + 1) {
        console.log(`[Gemini] Retrying em 1s...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.callGeminiWithRetry(activity, attempt + 1);
      }

      // Sem mais retries, lançar erro
      throw error;
    }
  }

  /**
   * Calcula score de métricas de negócio (0-100)
   *
   * Usa média ponderada: impact * confidenceWeight
   */
  private calculateBusinessScore(metrics: BusinessMetricConnection[]): number {
    if (metrics.length === 0) return 0;

    const weightedSum = metrics.reduce((sum, metric) => {
      const confidenceWeight = this.scoreWeights.confidenceWeights[metric.confidence];
      return sum + (metric.impact * confidenceWeight);
    }, 0);

    const totalWeight = metrics.reduce((sum, metric) => {
      return sum + this.scoreWeights.confidenceWeights[metric.confidence];
    }, 0);

    return Math.round(weightedSum / totalWeight);
  }

  /**
   * Calcula score de métricas de M&A (0-100)
   *
   * Usa média ponderada: impact * confidenceWeight
   */
  private calculateMAScore(metrics: MAMetricConnection[]): number {
    if (metrics.length === 0) return 0;

    const weightedSum = metrics.reduce((sum, metric) => {
      const confidenceWeight = this.scoreWeights.confidenceWeights[metric.confidence];
      return sum + (metric.impact * confidenceWeight);
    }, 0);

    const totalWeight = metrics.reduce((sum, metric) => {
      return sum + this.scoreWeights.confidenceWeights[metric.confidence];
    }, 0);

    return Math.round(weightedSum / totalWeight);
  }

  /**
   * Calcula score geral ponderado (0-100)
   *
   * Fórmula: (businessScore * 0.4) + (maScore * 0.6)
   * M&A tem mais peso pois objetivo é exit/venda
   */
  private calculateOverallScore(businessScore: number, maScore: number): number {
    const weighted =
      (businessScore * this.scoreWeights.businessWeight) +
      (maScore * this.scoreWeights.maWeight);

    return Math.round(weighted);
  }

  /**
   * Calcula confiança geral da análise (0-100)
   *
   * Baseado na média das confianças de todas as métricas
   */
  private calculateAIConfidence(
    businessMetrics: BusinessMetricConnection[],
    maMetrics: MAMetricConnection[]
  ): number {
    const allMetrics = [...businessMetrics, ...maMetrics];

    if (allMetrics.length === 0) return 0;

    const confidenceValues: Record<ConfidenceLevel, number> = {
      low: 33,
      medium: 66,
      high: 100
    };

    const sum = allMetrics.reduce((total, metric) => {
      return total + confidenceValues[metric.confidence];
    }, 0);

    return Math.round(sum / allMetrics.length);
  }

  /**
   * Gera chave de cache baseada no hash da atividade
   */
  private generateCacheKey(activity: ActivityInput): string {
    const content = JSON.stringify({
      title: activity.title,
      description: activity.description || '',
      area: activity.area,
      priority: activity.priority,
      responsible: activity.responsible || '',
      how: activity.how || '',
      cost: activity.cost || ''
    });

    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Limpa o cache manualmente
   */
  clearCache(): void {
    this.cache.clear();
    console.log('[Gemini] Cache limpo');
  }

  /**
   * Retorna estatísticas do cache
   */
  getCacheStats(): CacheStats {
    return this.cache.getStats();
  }
}

/**
 * Instância singleton do serviço (lazy initialization)
 */
let serviceInstance: GeminiAnalysisService | null = null;

/**
 * Retorna instância do serviço Gemini
 *
 * Usa singleton pattern com lazy initialization.
 * Requer GEMINI_API_KEY em variável de ambiente.
 *
 * @returns Instância do serviço
 * @throws Error se GEMINI_API_KEY não estiver definida
 */
export function getGeminiService(): GeminiAnalysisService {
  if (!serviceInstance) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não está configurada nas variáveis de ambiente');
    }

    serviceInstance = new GeminiAnalysisService({
      apiKey,
      enableCache: true,
      enableRateLimit: true
    });

    console.log('[Gemini] Serviço inicializado');
  }

  return serviceInstance;
}

/**
 * Helper: Analisa uma atividade (atalho para getGeminiService().analyzeActivity)
 *
 * @param activity - Dados da atividade
 * @param userId - ID do usuário (opcional)
 * @returns Análise completa
 */
export async function analyzeActivity(
  activity: ActivityInput,
  userId?: string
): Promise<ActivityAnalysis> {
  const service = getGeminiService();
  return service.analyzeActivity(activity, userId);
}
