'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '')

export interface MappedEntry {
    client: {
        name: string
        email?: string
        phone?: string
        companyName?: string
        notes?: string
    }
    opportunity?: {
        title: string
        value: number
        status: 'OPEN' | 'WON' | 'LOST'
        description?: string
    }
}

export async function mapImportData(data: any[]): Promise<MappedEntry[]> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' })

        // Limitar amostra para análise se for muito grande, mas para mapeamento precisamos processar tudo?
        // Não, o ideal para "mapeamento" é a IA entender a estrutura e retornar os dados normalizados.
        // Se a planilha for gigante, o contexto estoura.
        // Estratégia: Enviar em lotes ou pedir para a IA processar tudo se for pequeno (< 50 linhas).
        // Se for grande, o ideal seria a IA retornar o "Schema Mapping" (qual coluna é qual) e o código aplicar.
        // Mas para simplificar e usar o poder da IA em lidar com dados sujos, vamos limitar a 50 itens por vez na UI ou avisar o limite.
        // Vamos assumir um limite razoável de 50 itens para esta versão "Smart Import".

        const processData = data.slice(0, 50)
        const dataString = JSON.stringify(processData)

        const prompt = `
      Atue como um especialista em CRM e limpeza de dados.
      Analise os seguintes dados brutos (JSON) provenientes de uma planilha de importação.
      
      Seu objetivo é extrair informações de CLIENTES e OPORTUNIDADES (Negócios) para importar no sistema.
      
      Dados Brutos: ${dataString}

      Para cada item da lista, extraia:
      1. Dados do Cliente: Nome (obrigatório, se não tiver, invente algo como "Sem Nome" ou use a empresa), Email, Telefone, Nome da Empresa.
      2. Dados da Oportunidade (se houver indícios de venda/negócio): Título do negócio, Valor (numérico), Status (tente mapear para OPEN, WON ou LOST, default OPEN).

      Retorne APENAS um JSON Array válido com objetos no seguinte formato:
      [
        {
          "client": {
            "name": "Nome da Pessoa",
            "email": "email@exemplo.com", // ou null
            "phone": "telefone", // ou null
            "companyName": "Nome da Empresa", // ou null
            "notes": "Outras infos úteis"
          },
          "opportunity": { // Opcional, apenas se houver dados de negócio
            "title": "Venda de Software",
            "value": 1000.00,
            "status": "OPEN", // OPEN, WON, LOST
            "description": "Detalhes"
          }
        }
      ]

      Regras:
      - Normalize telefones e emails se possível.
      - Se houver apenas nome de empresa, use como nome do cliente também ou vice-versa.
      - Se o valor for texto (ex: "R$ 1.000"), converta para number (1000).
      - Ignore linhas totalmente vazias ou cabeçalhos repetidos.
    `

        console.log('Mapping data with model: gemini-2.0-flash-001')

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim()

        const firstBrace = cleanText.indexOf('[')
        const lastBrace = cleanText.lastIndexOf(']')

        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanText = cleanText.substring(firstBrace, lastBrace + 1)
        }

        return JSON.parse(cleanText)
    } catch (error) {
        console.error('Error mapping data:', error)
        throw new Error(`Falha no mapeamento inteligente: ${(error as Error).message}`)
    }
}

export async function saveImportedData(entries: MappedEntry[]) {
    const user = await requireAuth()
    let createdCount = 0

    for (const entry of entries) {
        try {
            // 1. Criar ou Atualizar Cliente
            // Vamos tentar buscar por email primeiro, se não tiver email, cria novo.
            let client: any = null

            if (entry.client.email) {
                client = await db.client.findFirst({
                    where: {
                        email: entry.client.email,
                        userId: user.id
                    }
                })
            }

            if (!client) {
                client = await db.client.create({
                    data: {
                        name: entry.client.name || entry.client.companyName || 'Cliente Desconhecido',
                        email: entry.client.email,
                        phone: entry.client.phone,
                        company: entry.client.companyName,
                        notes: entry.client.notes,
                        userId: user.id
                    }
                })
            }

            // 2. Criar Oportunidade se houver e se o cliente foi criado/encontrado
            if (entry.opportunity && client) {
                await db.opportunity.create({
                    data: {
                        title: entry.opportunity.title || `Oportunidade - ${client.name}`,
                        value: entry.opportunity.value || 0,
                        status: entry.opportunity.status || 'OPEN',
                        description: entry.opportunity.description,
                        clientId: client.id,
                        userId: user.id
                    }
                })
            }

            createdCount++
        } catch (error) {
            console.error('Error saving entry:', entry, error)
            // Continua para o próximo mesmo com erro
        }
    }

    return { success: true, count: createdCount }
}
