import { ActivityInput } from './gemini-types';

export const SYSTEM_PROMPT = `Você é um especialista em análise de negócios SaaS e métricas M&A.

CONTEXTO:
- Empresa: Defenz (gestão estratégica de atividades)
- Meta: Venda/Exit em 2 anos
- Foco: Performance operacional E valorização para M&A

SUA TAREFA: Analisar uma atividade e identificar conexões com:

1. BUSINESS METRICS (Operacionais):
   - operational, sales, customer_service, productivity, quality

2. M&A METRICS (Valorização):
   - financial: ARR, MRR, EBITDA
   - customer: Churn, LTV:CAC, NRR
   - engagement: DAU/MAU, Retention
   - product_health: NPS, CSAT, Uptime
   - sales: CAC, Win Rate, Pipeline

REGRAS:
- 2-5 business metrics por atividade
- 1-3 M&A metrics (nem todas atividades afetam M&A!)
- impact: 0-100, confidence: low/medium/high
- Seja criterioso: impact alto (70+) só se realmente impacta

RETORNE APENAS JSON:
{
  "businessMetrics": [{"name": "...", "category": "...", "impact": 0-100, "confidence": "...", "explanation": "..."}],
  "maMetrics": [{"name": "...", "type": "...", "impact": 0-100, "confidence": "...", "explanation": "..."}]
}`;

export function buildActivityPrompt(activity: ActivityInput): string {
  const priority = ['Alta', 'Média', 'Baixa'][activity.priority] || 'Média';
  const parts = [`TÍTULO: ${activity.title}`];
  if (activity.description) parts.push(`DESCRIÇÃO: ${activity.description}`);
  parts.push(`ÁREA: ${activity.area}`, `PRIORIDADE: ${priority}`);
  if (activity.responsible) parts.push(`RESPONSÁVEL: ${activity.responsible}`);
  if (activity.how) parts.push(`COMO: ${activity.how}`);
  if (activity.cost) parts.push(`CUSTO: ${activity.cost}`);
  return parts.join('\n\n');
}


/**
 * Builds the complete analysis prompt for Gemini AI
 */
export function buildAnalysisPrompt(activity: ActivityInput): string {
  const activityContext = buildActivityPrompt(activity);
  return `${SYSTEM_PROMPT}\n\nATIVIDADE PARA ANALISAR:\n${activityContext}\n\nANALISE E RETORNE APENAS JSON NO FORMATO ESPECIFICADO:`;
}

/**
 * Configurações de segurança para o Gemini
 */
export const SAFETY_SETTINGS = [
  {
    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
    threshold: "BLOCK_MEDIUM_AND_ABOVE",
  },
  {
    category: "HARM_CATEGORY_HATE_SPEECH",
    threshold: "BLOCK_MEDIUM_AND_ABOVE",
  },
  {
    category: "HARM_CATEGORY_HARASSMENT",
    threshold: "BLOCK_MEDIUM_AND_ABOVE",
  },
  {
    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
    threshold: "BLOCK_MEDIUM_AND_ABOVE",
  },
];

/**
 * Configuração de geração para o Gemini
 */
export const GENERATION_CONFIG = {
  temperature: 0.7,
  maxOutputTokens: 2000,
  responseMimeType: "application/json",
};

/**
 * Prompt para retry quando a resposta inicial falha
 */
export const RETRY_PROMPT = `A resposta anterior não estava no formato JSON esperado. 
Por favor, retorne APENAS o JSON no formato solicitado:
{
  "businessMetrics": [{"name": "...", "category": "...", "impact": 0-100, "confidence": "...", "explanation": "..."}],
  "maMetrics": [{"name": "...", "type": "...", "impact": 0-100, "confidence": "...", "explanation": "..."}]
}`;
