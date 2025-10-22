import { z } from 'zod';

const businessIndicatorSchema = z.object({
  name: z.string().min(1).max(100),
  impact: z.number().int().min(0).max(100),
  confidence: z.enum(['low', 'medium', 'high']),
  explanation: z.string().min(1).max(500),
});

const maMetricSchema = z.object({
  name: z.string().min(1).max(100),
  impact: z.number().int().min(0).max(100),
  confidence: z.enum(['low', 'medium', 'high']),
  explanation: z.string().min(1).max(500),
});

export const insightDataSchema = z.object({
  businessMetrics: z.array(businessIndicatorSchema).max(20),
  maMetrics: z.array(maMetricSchema).max(20),
});

// Schema for score validation
export const scoreSchema = z.number().int().min(0).max(100);

// Type exports
export type BusinessIndicator = z.infer<typeof businessIndicatorSchema>;
export type MAMetric = z.infer<typeof maMetricSchema>;
export type InsightData = z.infer<typeof insightDataSchema>;