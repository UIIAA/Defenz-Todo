import { z } from 'zod';

/**
 * Schema de validação para métricas financeiras (EBITDA, ARR, MRR)
 *
 * Valida todas as métricas relacionadas a receita, crescimento, EBITDA e Rule of 40.
 * Essencial para M&A - mostra saúde financeira e crescimento do negócio.
 */
export const createFinancialMetricSchema = z.object({
  period: z.string()
    .regex(/^\d{4}-\d{2}-01$/, 'Period deve ser primeiro dia do mês (YYYY-MM-01)'),

  // ARR (Annual Recurring Revenue)
  mrr: z.number().min(0, 'MRR não pode ser negativo'),
  arr: z.number().min(0, 'ARR não pode ser negativo'),
  newMrr: z.number().min(0, 'New MRR não pode ser negativo'),
  expansionMrr: z.number().min(0, 'Expansion MRR não pode ser negativo'),
  contractionMrr: z.number().min(0, 'Contraction MRR não pode ser negativo'),
  churnedMrr: z.number().min(0, 'Churned MRR não pode ser negativo'),
  netNewMrr: z.number(),

  // Growth Metrics
  mrrGrowthRate: z.number().min(-100, 'Growth rate inválido').max(1000, 'Growth rate muito alto'),
  arrGrowthRate: z.number().min(-100, 'Growth rate inválido').max(1000, 'Growth rate muito alto'),

  // EBITDA
  revenue: z.number().min(0, 'Revenue não pode ser negativo'),
  cogs: z.number().min(0, 'COGS não pode ser negativo'),
  operatingExpenses: z.number().min(0, 'Operating expenses não pode ser negativo'),
  ebitda: z.number(),
  ebitdaMargin: z.number().min(-100, 'Margin inválida').max(100, 'Margin inválida'),

  // Gross Margin
  grossProfit: z.number(),
  grossMargin: z.number().min(-100, 'Margin inválida').max(100, 'Margin inválida'),

  // Burn Rate & Runway
  burnRate: z.number().min(0, 'Burn rate não pode ser negativo'),
  cashBalance: z.number().min(0, 'Cash balance não pode ser negativo'),
  runway: z.number().int('Runway deve ser inteiro').min(0, 'Runway não pode ser negativo'),

  // Rule of 40
  ruleOf40Score: z.number(),

  // Audit Trail
  source: z.enum(['manual', 'api', 'import', 'calculated']).default('manual'),
  notes: z.string().max(5000, 'Notes muito longo').optional().nullable(),
});

/**
 * Schema de validação para métricas de clientes (Churn, LTV:CAC)
 *
 * Valida métricas de aquisição, retenção e valor de vida do cliente.
 * Crítico para M&A - mostra eficiência de aquisição e retenção.
 */
export const createCustomerMetricSchema = z.object({
  period: z.string()
    .regex(/^\d{4}-\d{2}-01$/, 'Period deve ser primeiro dia do mês (YYYY-MM-01)'),

  // Customer Counts
  activeCustomers: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),
  newCustomers: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),
  churnedCustomers: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),
  netNewCustomers: z.number().int('Deve ser inteiro'),

  // Churn Metrics
  customerChurnRate: z.number().min(0, 'Churn rate inválido').max(100, 'Churn rate inválido'),
  revenueChurnRate: z.number().min(0, 'Churn rate inválido').max(100, 'Churn rate inválido'),
  netRevenueRetention: z.number().min(0, 'NRR inválido'),

  // LTV:CAC Ratio
  averageLtv: z.number().min(0, 'LTV não pode ser negativo'),
  averageCac: z.number().min(0, 'CAC não pode ser negativo'),
  ltvCacRatio: z.number().min(0, 'Ratio inválido'),
  cacPaybackMonths: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),

  // ARPU
  arpu: z.number().min(0, 'ARPU não pode ser negativo'),
  arpuGrowth: z.number().min(-100, 'Growth rate inválido'),

  // Cohort Analysis
  cohortMonth: z.string()
    .regex(/^\d{4}-\d{2}-01$/, 'Cohort month deve ser primeiro dia do mês')
    .optional()
    .nullable(),
  cohortSize: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo').optional().nullable(),
  cohortRetentionRate: z.number().min(0, 'Rate inválido').max(100, 'Rate inválido').optional().nullable(),

  // Customer Growth
  customerGrowthRate: z.number().min(-100, 'Growth rate inválido'),

  // Audit Trail
  source: z.enum(['manual', 'api', 'import', 'calculated']).default('manual'),
  notes: z.string().max(5000, 'Notes muito longo').optional().nullable(),
});

/**
 * Schema de validação para métricas de engajamento (DAU/MAU, Stickiness)
 *
 * Valida métricas de uso e engajamento do produto.
 * Importante para M&A - mostra product-market fit e retenção orgânica.
 */
export const createEngagementMetricSchema = z.object({
  period: z.string()
    .regex(/^\d{4}-\d{2}-01$/, 'Period deve ser primeiro dia do mês (YYYY-MM-01)'),

  // Activation & Usage
  dau: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),
  mau: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),
  wau: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),
  dauMauRatio: z.number().min(0, 'Ratio inválido').max(1, 'Ratio deve ser <= 1'),

  // Engagement Depth
  avgSessionsPerUser: z.number().min(0, 'Não pode ser negativo'),
  avgSessionDuration: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),
  avgActivitiesPerUser: z.number().min(0, 'Não pode ser negativo'),

  // Time to Value
  avgTimeToFirstValue: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),
  activationRate: z.number().min(0, 'Rate inválido').max(100, 'Rate inválido'),

  // Retention
  weeklyRetention: z.number().min(0, 'Rate inválido').max(100, 'Rate inválido'),
  monthlyRetention: z.number().min(0, 'Rate inválido').max(100, 'Rate inválido'),
  quarterlyRetention: z.number().min(0, 'Rate inválido').max(100, 'Rate inválido'),

  // Feature Adoption
  featureAdoptionRates: z.record(z.string(), z.number()).optional().nullable(),
  powerUserPercentage: z.number().min(0, 'Percentage inválido').max(100, 'Percentage inválido'),

  // Audit Trail
  source: z.enum(['manual', 'api', 'import', 'calculated']).default('manual'),
  notes: z.string().max(5000, 'Notes muito longo').optional().nullable(),
});

/**
 * Schema de validação para métricas de saúde do produto (NPS, CSAT, Uptime)
 *
 * Valida métricas de qualidade, satisfação e saúde técnica.
 * Relevante para M&A - mostra qualidade do produto e risco técnico.
 */
export const createProductHealthMetricSchema = z.object({
  period: z.string()
    .regex(/^\d{4}-\d{2}-01$/, 'Period deve ser primeiro dia do mês (YYYY-MM-01)'),

  // Customer Satisfaction
  nps: z.number().min(-100, 'NPS inválido (-100 a 100)').max(100, 'NPS inválido (-100 a 100)'),
  csat: z.number().min(0, 'CSAT inválido (0-100)').max(100, 'CSAT inválido (0-100)'),
  ces: z.number().min(1, 'CES inválido (1-7)').max(7, 'CES inválido (1-7)'),

  // Product Quality
  bugCount: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),
  criticalBugCount: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),
  avgBugResolutionTime: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),

  // Feature Velocity
  featuresShipped: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),
  avgFeatureLeadTime: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),
  featureRequestBacklog: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),

  // Technical Health
  uptime: z.number().min(0, 'Uptime inválido').max(100, 'Uptime deve ser <= 100'),
  avgApiResponseTime: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),
  errorRate: z.number().min(0, 'Error rate inválido').max(100, 'Error rate inválido'),

  // Support Quality
  avgSupportResponseTime: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),
  avgSupportResolutionTime: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),
  supportTicketCount: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),
  firstContactResolution: z.number().min(0, 'Rate inválido').max(100, 'Rate inválido'),

  // Audit Trail
  source: z.enum(['manual', 'api', 'import', 'calculated']).default('manual'),
  notes: z.string().max(5000, 'Notes muito longo').optional().nullable(),
});

/**
 * Schema de validação para métricas de vendas (CAC, Funnel, Pipeline)
 *
 * Valida métricas de vendas, conversão e eficiência de marketing.
 * Importante para M&A - mostra eficiência do motor de crescimento.
 */
export const createSalesMetricSchema = z.object({
  period: z.string()
    .regex(/^\d{4}-\d{2}-01$/, 'Period deve ser primeiro dia do mês (YYYY-MM-01)'),

  // Sales Performance
  leads: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),
  qualifiedLeads: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),
  opportunities: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),
  closedWon: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),
  closedLost: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),

  // Conversion Rates
  leadToSqlRate: z.number().min(0, 'Rate inválido').max(100, 'Rate inválido'),
  sqlToOpportunityRate: z.number().min(0, 'Rate inválido').max(100, 'Rate inválido'),
  opportunityToWinRate: z.number().min(0, 'Rate inválido').max(100, 'Rate inválido'),
  overallConversionRate: z.number().min(0, 'Rate inválido').max(100, 'Rate inválido'),

  // CAC Breakdown
  marketingSpend: z.number().min(0, 'Spend não pode ser negativo'),
  salesSpend: z.number().min(0, 'Spend não pode ser negativo'),
  totalCacSpend: z.number().min(0, 'Spend não pode ser negativo'),
  blendedCac: z.number().min(0, 'CAC não pode ser negativo'),

  // Sales Cycle
  avgSalesCycleLength: z.number().int('Deve ser inteiro').min(0, 'Não pode ser negativo'),
  avgDealSize: z.number().min(0, 'Deal size não pode ser negativo'),

  // Pipeline Health
  pipelineValue: z.number().min(0, 'Pipeline value não pode ser negativo'),
  pipelineCoverage: z.number().min(0, 'Coverage inválido'),
  leadVelocityRate: z.number().min(-100, 'Rate inválido'),

  // Audit Trail
  source: z.enum(['manual', 'api', 'import', 'calculated']).default('manual'),
  notes: z.string().max(5000, 'Notes muito longo').optional().nullable(),
});

/**
 * Schemas para atualização (todos campos opcionais)
 */
export const updateFinancialMetricSchema = createFinancialMetricSchema.partial().omit({ period: true });
export const updateCustomerMetricSchema = createCustomerMetricSchema.partial().omit({ period: true });
export const updateEngagementMetricSchema = createEngagementMetricSchema.partial().omit({ period: true });
export const updateProductHealthMetricSchema = createProductHealthMetricSchema.partial().omit({ period: true });
export const updateSalesMetricSchema = createSalesMetricSchema.partial().omit({ period: true });

/**
 * Types inferidos dos schemas para TypeScript
 */
export type CreateFinancialMetricInput = z.infer<typeof createFinancialMetricSchema>;
export type CreateCustomerMetricInput = z.infer<typeof createCustomerMetricSchema>;
export type CreateEngagementMetricInput = z.infer<typeof createEngagementMetricSchema>;
export type CreateProductHealthMetricInput = z.infer<typeof createProductHealthMetricSchema>;
export type CreateSalesMetricInput = z.infer<typeof createSalesMetricSchema>;

export type UpdateFinancialMetricInput = z.infer<typeof updateFinancialMetricSchema>;
export type UpdateCustomerMetricInput = z.infer<typeof updateCustomerMetricSchema>;
export type UpdateEngagementMetricInput = z.infer<typeof updateEngagementMetricSchema>;
export type UpdateProductHealthMetricInput = z.infer<typeof updateProductHealthMetricSchema>;
export type UpdateSalesMetricInput = z.infer<typeof updateSalesMetricSchema>;

/**
 * Schema de validação para métricas operacionais de negócio (Business Metrics)
 *
 * Valida métricas operacionais do dia-a-dia como tempo de resposta, produtividade,
 * taxa de conversão, etc. (NÃO são métricas de M&A, são performance operacional pura).
 */
export const createBusinessMetricSchema = z.object({
  period: z.string()
    .regex(/^\d{4}-\d{2}-01$/, 'Period deve ser primeiro dia do mês (YYYY-MM-01)'),

  // Categoria da métrica
  category: z.enum(['operational', 'sales', 'customer_service', 'productivity', 'quality'], {
    errorMap: () => ({ message: 'Categoria inválida' })
  }),

  // Métrica
  metricName: z.string()
    .min(1, 'Nome da métrica é obrigatório')
    .max(100, 'Nome muito longo'),
  metricValue: z.number(),
  metricUnit: z.string()
    .min(1, 'Unidade é obrigatória')
    .max(50, 'Unidade muito longa'),
  target: z.number().optional().nullable(),

  // Contexto
  description: z.string()
    .max(500, 'Descrição muito longa')
    .optional()
    .nullable(),
  area: z.string()
    .min(1, 'Área é obrigatória')
    .max(100, 'Área muito longa'),

  // Audit Trail
  source: z.enum(['manual', 'api', 'import', 'calculated']).default('manual'),
  notes: z.string().max(5000, 'Notes muito longo').optional().nullable(),
});

/**
 * Schema para atualização de Business Metrics
 * Não permite alterar period ou metricName (campos chave de versionamento)
 */
export const updateBusinessMetricSchema = createBusinessMetricSchema
  .partial()
  .omit({ period: true, metricName: true });

/**
 * Types inferidos
 */
export type CreateBusinessMetricInput = z.infer<typeof createBusinessMetricSchema>;
export type UpdateBusinessMetricInput = z.infer<typeof updateBusinessMetricSchema>;
