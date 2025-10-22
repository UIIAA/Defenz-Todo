/**
 * Exemplos de uso do Gemini AI Service
 *
 * Demonstra diferentes cenários de uso do serviço de análise de atividades.
 * Este arquivo serve como referência e não deve ser importado em produção.
 */

import {
  analyzeActivity,
  GeminiAnalysisService
} from './gemini-service';

import {
  RateLimitError,
  GeminiValidationError,
  GeminiAPIError
} from './gemini-types';

import type { ActivityInput, ActivityAnalysis } from './gemini-types';

/**
 * EXEMPLO 1: Uso básico (mais simples)
 *
 * Usa a função helper que cria instância singleton automaticamente.
 */
export async function example1_basicUsage() {
  console.log('=== EXEMPLO 1: Uso Básico ===\n');

  const activity: ActivityInput = {
    title: 'Implementar chatbot de atendimento',
    description: 'Automatizar respostas frequentes para reduzir tempo de espera',
    area: 'Customer Service',
    priority: 0,
    responsible: 'João Silva',
    how: 'Integrar GPT-4 com base de conhecimento',
    cost: 'R$ 5.000'
  };

  try {
    const result = await analyzeActivity(activity);

    console.log('✅ Análise concluída!');
    console.log('Overall Score:', result.overallScore);
    console.log('Business Score:', result.businessMetricScore);
    console.log('M&A Score:', result.maScore);
    console.log('AI Confidence:', result.aiConfidence);
    console.log('Processing Time:', result.processingTime, 'ms');

    console.log('\n📊 Business Metrics:');
    result.businessMetrics.forEach(metric => {
      console.log(`  - ${metric.name} (${metric.category})`);
      console.log(`    Impact: ${metric.impact}/100`);
      console.log(`    Confidence: ${metric.confidence}`);
      console.log(`    ${metric.explanation}`);
    });

    console.log('\n💰 M&A Metrics:');
    result.maMetrics.forEach(metric => {
      console.log(`  - ${metric.name} (${metric.type})`);
      console.log(`    Impact: ${metric.impact}/100`);
      console.log(`    Confidence: ${metric.confidence}`);
      console.log(`    ${metric.explanation}`);
    });
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

/**
 * EXEMPLO 2: Tratamento completo de erros
 *
 * Demonstra como tratar diferentes tipos de erros.
 */
export async function example2_errorHandling() {
  console.log('=== EXEMPLO 2: Tratamento de Erros ===\n');

  const activity: ActivityInput = {
    title: 'Otimizar processo de vendas',
    area: 'Sales',
    priority: 1
  };

  try {
    const result = await analyzeActivity(activity, 'user-123');
    console.log('✅ Sucesso:', result.overallScore);
  } catch (error) {
    if (error instanceof RateLimitError) {
      console.error(`⏱️ Rate limit excedido!`);
      console.error(`   Retry em: ${error.retryAfter} segundos`);

      // Em produção, você pode implementar retry automático
      // await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000));
      // return analyzeActivity(activity, 'user-123');
    } else if (error instanceof GeminiValidationError) {
      console.error(`❌ Resposta inválida do Gemini`);
      console.error(`   Detalhes de validação:`, error.validationDetails);
      console.error(`   Raw response:`, error.rawResponse);

      // Em produção, você pode tentar novamente ou usar fallback
    } else if (error instanceof GeminiAPIError) {
      console.error(`❌ Erro na API do Gemini`);
      console.error(`   Status code:`, error.statusCode);
      console.error(`   Mensagem:`, error.message);

      // Em produção, você pode usar cache ou análise padrão
    } else {
      console.error(`❌ Erro desconhecido:`, error);
    }
  }
}

/**
 * EXEMPLO 3: Configuração customizada
 *
 * Cria instância com configurações específicas.
 */
export async function example3_customConfig() {
  console.log('=== EXEMPLO 3: Configuração Customizada ===\n');

  // Criar serviço com configurações específicas
  const service = new GeminiAnalysisService({
    apiKey: process.env.GEMINI_API_KEY!,
    model: 'gemini-1.5-flash', // Pode usar gemini-1.5-pro para melhor qualidade
    enableCache: true,
    cacheTTL: 12 * 60 * 60 * 1000, // 12 horas
    maxRequestsPerMinute: 20,      // Mais requisições
    maxRequestsPerDay: 200,
    timeout: 45000,                // 45 segundos
    maxRetries: 3,                 // 3 tentativas
    scoreWeights: {
      businessWeight: 0.3,         // Menos peso para business
      maWeight: 0.7,               // Mais peso para M&A (foco em exit)
      confidenceWeights: {
        low: 0.4,
        medium: 0.7,
        high: 1.0
      }
    }
  });

  const activity: ActivityInput = {
    title: 'Redesenhar onboarding de clientes',
    description: 'Reduzir tempo de ativação de 30 para 7 dias',
    area: 'Product',
    priority: 0,
    how: 'Criar fluxo automatizado com checklist e tutoriais'
  };

  try {
    const result = await service.analyzeActivity(activity, 'user-456');
    console.log('✅ Score geral:', result.overallScore);
    console.log('   (com pesos customizados: 30% business, 70% M&A)');
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

/**
 * EXEMPLO 4: Cache e performance
 *
 * Demonstra como o cache funciona.
 */
export async function example4_cacheDemo() {
  console.log('=== EXEMPLO 4: Cache e Performance ===\n');

  const service = new GeminiAnalysisService({
    apiKey: process.env.GEMINI_API_KEY!,
    enableCache: true
  });

  const activity: ActivityInput = {
    title: 'Implementar dashboard de analytics',
    area: 'Product',
    priority: 1
  };

  // Primeira chamada - vai para API
  console.log('1️⃣ Primeira análise (API call)...');
  const start1 = Date.now();
  const result1 = await service.analyzeActivity(activity);
  const time1 = Date.now() - start1;
  console.log(`   ✅ Concluído em ${time1}ms`);
  console.log(`   Score: ${result1.overallScore}`);

  // Segunda chamada - cache hit
  console.log('\n2️⃣ Segunda análise (cache hit)...');
  const start2 = Date.now();
  const result2 = await service.analyzeActivity(activity);
  const time2 = Date.now() - start2;
  console.log(`   ✅ Concluído em ${time2}ms`);
  console.log(`   Score: ${result2.overallScore}`);
  console.log(`   🚀 ${Math.round(time1 / time2)}x mais rápido!`);

  // Estatísticas do cache
  const stats = service.getCacheStats();
  console.log('\n📊 Cache stats:', stats);
}

/**
 * EXEMPLO 5: Análise em batch
 *
 * Analisa múltiplas atividades respeitando rate limits.
 */
export async function example5_batchAnalysis() {
  console.log('=== EXEMPLO 5: Análise em Batch ===\n');

  const activities: ActivityInput[] = [
    {
      title: 'Implementar autenticação OAuth',
      area: 'Security',
      priority: 0
    },
    {
      title: 'Criar API de integrações',
      area: 'Product',
      priority: 0
    },
    {
      title: 'Otimizar queries do banco',
      area: 'Engineering',
      priority: 1
    }
  ];

  const results: ActivityAnalysis[] = [];

  for (let i = 0; i < activities.length; i++) {
    const activity = activities[i];
    console.log(`\n📝 Analisando atividade ${i + 1}/${activities.length}...`);
    console.log(`   ${activity.title}`);

    try {
      const result = await analyzeActivity(activity, 'batch-user');
      results.push(result);
      console.log(`   ✅ Score: ${result.overallScore}`);
    } catch (error) {
      if (error instanceof RateLimitError) {
        console.log(`   ⏱️ Rate limit. Aguardando ${error.retryAfter}s...`);
        await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000));
        i--; // Retry
      } else {
        console.error(`   ❌ Erro:`, error);
      }
    }
  }

  // Análise agregada
  console.log('\n📊 RESUMO:');
  console.log(`   Total analisadas: ${results.length}`);
  const avgScore = results.reduce((sum, r) => sum + r.overallScore, 0) / results.length;
  console.log(`   Score médio: ${Math.round(avgScore)}`);

  const topActivity = results.sort((a, b) => b.overallScore - a.overallScore)[0];
  console.log(`   🏆 Maior impacto: Score ${topActivity.overallScore}`);
}

/**
 * EXEMPLO 6: Integração com API route
 *
 * Como usar no contexto de um API endpoint Next.js.
 */
export async function example6_apiIntegration() {
  console.log('=== EXEMPLO 6: Integração com API ===\n');

  // Exemplo de código para API route
  const exampleCode = `
// src/app/api/activities/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { analyzeActivity } from '@/lib/ai/gemini-service';
import { handleApiError } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar input
    if (!body.title || !body.area) {
      return NextResponse.json(
        { success: false, error: 'Título e área são obrigatórios' },
        { status: 400 }
      );
    }

    // Analisar
    const analysis = await analyzeActivity(body, 'api-user');

    return NextResponse.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    return handleApiError(error);
  }
}
`;

  console.log(exampleCode);
}

/**
 * EXEMPLO 7: Comparação de atividades
 *
 * Compara múltiplas atividades para priorização.
 */
export async function example7_comparison() {
  console.log('=== EXEMPLO 7: Comparação de Atividades ===\n');

  const activities: ActivityInput[] = [
    {
      title: 'Implementar chatbot',
      description: 'Automatizar atendimento',
      area: 'Customer Service',
      priority: 0
    },
    {
      title: 'Redesenhar onboarding',
      description: 'Reduzir tempo de ativação',
      area: 'Product',
      priority: 0
    },
    {
      title: 'Criar programa de referral',
      description: 'Incentivar indicações de clientes',
      area: 'Growth',
      priority: 1
    }
  ];

  console.log('📊 Analisando atividades para priorização...\n');

  const results = await Promise.all(
    activities.map(async (activity, i) => {
      console.log(`${i + 1}. ${activity.title}`);
      try {
        const analysis = await analyzeActivity(activity);
        console.log(`   ✅ Overall: ${analysis.overallScore}`);
        console.log(`   📈 Business: ${analysis.businessMetricScore}`);
        console.log(`   💰 M&A: ${analysis.maScore}`);
        return { activity, analysis };
      } catch (error) {
        console.log(`   ❌ Erro na análise`);
        return null;
      }
    })
  );

  // Ordenar por overall score
  const sorted = results
    .filter(r => r !== null)
    .sort((a, b) => b!.analysis.overallScore - a!.analysis.overallScore);

  console.log('\n🏆 RANKING (prioridade sugerida):');
  sorted.forEach((item, i) => {
    if (item) {
      console.log(`\n${i + 1}º. ${item.activity.title}`);
      console.log(`    Score: ${item.analysis.overallScore}/100`);
      console.log(`    Business Impact: ${item.analysis.businessMetricScore}/100`);
      console.log(`    M&A Impact: ${item.analysis.maScore}/100`);
    }
  });
}

/**
 * EXEMPLO 8: Análise de atividade mínima
 *
 * Demonstra análise com campos mínimos obrigatórios.
 */
export async function example8_minimalActivity() {
  console.log('=== EXEMPLO 8: Atividade Mínima ===\n');

  const activity: ActivityInput = {
    title: 'Melhorar performance do app',
    area: 'Engineering',
    priority: 1
  };

  try {
    const result = await analyzeActivity(activity);

    console.log('✅ Análise de atividade com campos mínimos:');
    console.log(`   Score: ${result.overallScore}/100`);
    console.log(`   Métricas identificadas: ${result.businessMetrics.length + result.maMetrics.length}`);
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

/**
 * Executa todos os exemplos
 */
export async function runAllExamples() {
  try {
    await example1_basicUsage();
    console.log('\n' + '='.repeat(50) + '\n');

    await example2_errorHandling();
    console.log('\n' + '='.repeat(50) + '\n');

    await example3_customConfig();
    console.log('\n' + '='.repeat(50) + '\n');

    await example4_cacheDemo();
    console.log('\n' + '='.repeat(50) + '\n');

    await example5_batchAnalysis();
    console.log('\n' + '='.repeat(50) + '\n');

    await example6_apiIntegration();
    console.log('\n' + '='.repeat(50) + '\n');

    await example7_comparison();
    console.log('\n' + '='.repeat(50) + '\n');

    await example8_minimalActivity();
  } catch (error) {
    console.error('Erro ao executar exemplos:', error);
  }
}

// Para testar:
// npx tsx src/lib/ai/example-usage.ts
if (require.main === module) {
  runAllExamples();
}
