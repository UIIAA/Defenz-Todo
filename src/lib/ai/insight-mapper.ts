import type { ActivityInsight } from '@prisma/client';

export interface ActivityInsightResponse {
  id: string;
  activityId: string;
  businessIndicators: any;
  businessScore: number;
  maMetrics: any;
  maScore: number;
  overallScore: number;
  aiModel: string;
  aiConfidence: number;
  processingTime: number;
  tokenCount: number | null;
  analysisPrompt: string;
  rawResponse: string;
  analysisVersion: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export function mapInsightToResponse(insight: ActivityInsight): ActivityInsightResponse {
  return {
    id: insight.id,
    activityId: insight.activityId,
    businessIndicators: insight.businessMetrics,
    businessScore: insight.businessMetricScore,
    maMetrics: insight.maMetrics,
    maScore: insight.maScore,
    overallScore: insight.overallScore,
    aiModel: insight.aiModel,
    aiConfidence: Number(insight.aiConfidence),
    processingTime: insight.processingTime,
    tokenCount: insight.tokenCount,
    analysisPrompt: insight.analysisPrompt,
    rawResponse: insight.rawResponse,
    analysisVersion: insight.analysisVersion,
    createdBy: insight.createdBy,
    createdAt: insight.createdAt,
    updatedAt: insight.updatedAt,
  };
}