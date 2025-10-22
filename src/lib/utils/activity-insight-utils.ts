/**
 * Utility function to calculate the overall score based on business and M&A scores
 * Uses a weighted average: 40% business metrics + 60% M&A metrics
 */
export function calculateOverallScore(businessMetricScore: number, maScore: number): number {
  return Math.round(businessMetricScore * 0.4 + maScore * 0.6);
}

/**
 * Validates if scores are within the valid range (0-100)
 */
export function validateScore(score: number, name: string): number {
  const rounded = Math.round(score);
  if (rounded < 0 || rounded > 100) {
    throw new Error(`${name} deve estar entre 0-100, recebido: ${rounded}`);
  }
  return rounded;
}