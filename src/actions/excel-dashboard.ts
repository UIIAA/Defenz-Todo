'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')

export interface AIAnalysisResult {
  summary: {
    title: string
    value: string | number
    description: string
  }[]
  insights: string[]
  charts: {
    bar: { name: string; value: number }[]
    pie: { name: string; value: number; color: string }[]
    line: { name: string; value: number }[]
  }
}

export async function analyzeExcelData(data: any[]): Promise<AIAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' })

    // Limitar o tamanho dos dados para não estourar o contexto (pegar as primeiras 50 linhas se for muito grande)
    const sampleData = data.length > 100 ? data.slice(0, 100) : data
    const dataString = JSON.stringify(sampleData)

    const prompt = `
      Atue como um analista de dados sênior. Analise os seguintes dados JSON provenientes de uma planilha Excel e gere um dashboard executivo.
      
      Dados: ${dataString}

      Retorne APENAS um JSON válido (sem markdown, sem \`\`\`) com a seguinte estrutura:
      {
        "summary": [
          { "title": "Nome da Métrica (ex: Total Vendas)", "value": "Valor Formatado", "description": "Breve contexto" },
          { "title": "Métrica 2", "value": "Valor", "description": "Contexto" },
          { "title": "Métrica 3", "value": "Valor", "description": "Contexto" }
        ],
        "insights": [
          "Insight relevante 1 sobre tendências ou anomalias",
          "Insight relevante 2",
          "Insight relevante 3"
        ],
        "charts": {
          "bar": [
            { "name": "Categoria A", "value": 100 },
            { "name": "Categoria B", "value": 150 }
          ],
          "pie": [
            { "name": "Seguimento X", "value": 30, "color": "#3b82f6" },
            { "name": "Seguimento Y", "value": 70, "color": "#a855f7" }
          ],
          "line": [
            { "name": "Jan", "value": 10 },
            { "name": "Fev", "value": 20 }
          ]
        }
      }

      Regras:
      1. Identifique automaticamente as colunas mais relevantes para métricas.
      2. Para o gráfico de barras, use uma categoria categórica vs numérica.
      3. Para o gráfico de pizza, use uma distribuição percentual ou categórica.
      4. Para o gráfico de linha, tente identificar uma coluna de data ou sequência. Se não houver data, use o índice ou outra métrica sequencial.
      5. Gere cores hexadecimais atraentes para o gráfico de pizza.
    `

    console.log('Analyzing data with model: gemini-2.0-flash-001')
    console.log('Data sample size:', sampleData.length)

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    console.log('Raw AI response:', text)

    // Limpar markdown se houver
    let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()

    // Tentar encontrar o primeiro { e o último } para garantir que é um JSON válido
    const firstBrace = cleanText.indexOf('{')
    const lastBrace = cleanText.lastIndexOf('}')

    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanText = cleanText.substring(firstBrace, lastBrace + 1)
    }

    return JSON.parse(cleanText)
  } catch (error) {
    console.error('Error analyzing data with AI:', error)
    if (!process.env.GOOGLE_API_KEY) {
      console.error('GOOGLE_API_KEY is missing in environment variables.')
      throw new Error('Chave de API do Google não configurada.')
    }
    throw new Error(`Falha na análise dos dados: ${(error as Error).message}`)
  }
}
