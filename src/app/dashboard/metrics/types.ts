/**
 * Types para Investor Metrics Dashboard
 *
 * Define os tipos de resposta das APIs de métricas
 * e tipos auxiliares para o dashboard
 */

// ============================================
// Financial Metrics Types
// ============================================

export interface FinancialMetric {
  id: string;
  period: string;

  // ARR Metrics
  mrr: number;
  arr: number;
  newMrr: number;
  expansionMrr: number;
  contractionMrr: number;
  churnedMrr: number;
  netNewMrr: number;

  // Growth
  mrrGrowthRate: number;
  arrGrowthRate: number;

  // EBITDA
  revenue: number;
  cogs: number;
  operatingExpenses: number;
  ebitda: number;
  ebitdaMargin: number;

  // Gross Margin
  grossProfit: number;
  grossMargin: number;

  // Burn Rate & Runway
  burnRate: number;
  cashBalance: number;
  runway: number;

  // Rule of 40
  ruleOf40Score: number;

  // Metadata
  version: number;
  source: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface FinancialMetricsResponse {
  success: boolean;
  data: FinancialMetric[];
  summary: {
    count: number;
    latestPeriod: string | null;
    latestArr: number;
    latestEbitdaMargin: number;
    latestRuleOf40: number;
    avgArrGrowth: number;
  };
  count: number;
}

// ============================================
// Customer Metrics Types
// ============================================

export interface CustomerMetric {
  id: string;
  period: string;

  // Customer Counts
  activeCustomers: number;
  newCustomers: number;
  churnedCustomers: number;
  netNewCustomers: number;

  // Churn Metrics
  customerChurnRate: number;
  revenueChurnRate: number;
  netRevenueRetention: number;

  // LTV:CAC
  averageLtv: number;
  averageCac: number;
  ltvCacRatio: number;
  cacPaybackMonths: number;

  // ARPU
  arpu: number;
  arpuGrowth: number;

  // Cohort (opcional)
  cohortMonth: string | null;
  cohortSize: number | null;
  cohortRetentionRate: number | null;

  // Growth
  customerGrowthRate: number;

  // Metadata
  version: number;
  source: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CustomerMetricsResponse {
  success: boolean;
  data: CustomerMetric[];
  summary: {
    count: number;
    latestPeriod: string | null;
    latestActiveCustomers: number;
    latestChurnRate: number;
    latestLtvCacRatio: number;
    latestNrr: number;
    avgChurnRate: number;
  };
  count: number;
}

// ============================================
// Engagement Metrics Types
// ============================================

export interface EngagementMetric {
  id: string;
  period: string;

  // Activation & Usage
  dau: number;
  mau: number;
  wau: number;
  dauMauRatio: number;

  // Engagement Depth
  avgSessionsPerUser: number;
  avgSessionDuration: number;
  avgActivitiesPerUser: number;

  // Time to Value
  avgTimeToFirstValue: number;
  activationRate: number;

  // Retention
  weeklyRetention: number;
  monthlyRetention: number;
  quarterlyRetention: number;

  // Feature Adoption
  featureAdoptionRates: Record<string, number> | null;
  powerUserPercentage: number;

  // Metadata
  version: number;
  source: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface EngagementMetricsResponse {
  success: boolean;
  data: EngagementMetric[];
  summary: {
    count: number;
    latestPeriod: string | null;
    latestDauMauRatio: number;
    latestMonthlyRetention: number;
    latestActivationRate: number;
    latestPowerUserPct: number;
    avgDauMauRatio: number;
  };
  count: number;
}

// ============================================
// Product Health Metrics Types
// ============================================

export interface ProductHealthMetric {
  id: string;
  period: string;

  // Customer Satisfaction
  npsScore: number;
  npsPromoters: number;
  npsDetractors: number;
  csatScore: number;

  // System Health
  uptime: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;

  // Product Quality
  bugCount: number;
  criticalBugsCount: number;
  avgTimeToResolution: number;

  // Support
  avgFirstResponseTime: number;
  ticketsResolved: number;
  ticketsCreated: number;

  // Metadata
  version: number;
  source: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface ProductHealthMetricsResponse {
  success: boolean;
  data: ProductHealthMetric[];
  summary: {
    count: number;
    latestPeriod: string | null;
    latestNps: number;
    latestCsat: number;
    latestUptime: number;
    avgNps: number;
  };
  count: number;
}

// ============================================
// Sales Metrics Types
// ============================================

export interface SalesMetric {
  id: string;
  period: string;

  // CAC
  salesMarketingSpend: number;
  newCustomers: number;
  cac: number;

  // Pipeline
  pipelineValue: number;
  pipelineCoverage: number;
  avgDealSize: number;
  avgSalesCycle: number;

  // Conversion
  leadToMql: number;
  mqlToSql: number;
  sqlToWon: number;
  overallConversionRate: number;

  // Win Rate
  winRate: number;
  dealsWon: number;
  dealsLost: number;

  // Metadata
  version: number;
  source: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface SalesMetricsResponse {
  success: boolean;
  data: SalesMetric[];
  summary: {
    count: number;
    latestPeriod: string | null;
    latestCac: number;
    latestWinRate: number;
    latestPipelineValue: number;
    avgCac: number;
  };
  count: number;
}

// ============================================
// Dashboard Types
// ============================================

export type PeriodFilter = '3m' | '6m' | '12m' | 'all';

export interface PeriodOption {
  value: PeriodFilter;
  label: string;
  months: number | null; // null para 'all'
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number; // Percentual de mudança
  changeLabel?: string;
  target?: number;
  targetLabel?: string;
  icon?: React.ReactNode;
  tooltip?: string;
  format?: 'number' | 'currency' | 'percentage';
  loading?: boolean;
}

export interface ChartDataPoint {
  period: string;
  value: number;
  label?: string;
}

export interface MRRBreakdownDataPoint {
  period: string;
  newMrr: number;
  expansion: number;
  contraction: number;
  churn: number;
}

// ============================================
// API Query Params
// ============================================

export interface MetricsQueryParams {
  limit?: number;
  startDate?: string;
  endDate?: string;
  version?: number;
}
