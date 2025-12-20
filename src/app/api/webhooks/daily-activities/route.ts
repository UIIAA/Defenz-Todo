import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { z } from "zod"
import { startOfDay, endOfDay } from "date-fns"

// Schema de validação do payload
const activitySchema = z.object({
    userEmail: z.string().email(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
    calls: z.number().int().min(0).default(0),
    emails: z.number().int().min(0).default(0),
    meetings: z.number().int().min(0).default(0),
    proposals: z.number().int().min(0).default(0),
    notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
    try {
        // 1. Verificação de Segurança (API Key)
        const apiKey = req.headers.get("x-api-key")

        // Se a variável de ambiente não estiver definida, bloqueia por segurança
        if (!process.env.API_KEY) {
            console.error("API_KEY não definida no servidor.")
            return NextResponse.json({ error: "Erro de configuração do servidor" }, { status: 500 })
        }

        if (apiKey !== process.env.API_KEY) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
        }

        // 2. Parse do Body
        const body = await req.json()
        const validation = activitySchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({ error: "Dados inválidos", details: validation.error.format() }, { status: 400 })
        }

        const { userEmail, date, calls, emails, meetings, proposals, notes } = validation.data

        // 3. Buscar Usuário
        const user = await db.user.findUnique({
            where: { email: userEmail }
        })

        if (!user) {
            return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
        }

        // 4. Normalizar Data (Meio-dia para evitar problemas de timezone UTC vs Local)
        // O formato YYYY-MM-DD é UTC safe se criarmos com strings
        const [year, month, day] = date.split('-').map(Number)
        // Criar data no "meio" do dia localmente para garantir que caia no dia certo
        const normalizedDate = new Date(year, month - 1, day, 12, 0, 0)

        const dateStart = startOfDay(normalizedDate)
        const dateEnd = endOfDay(normalizedDate)

        // 5. Upsert (Atualizar ou Criar)
        const existingLog = await db.dailyActivityLog.findFirst({
            where: {
                userId: user.id,
                date: {
                    gte: dateStart,
                    lte: dateEnd
                }
            }
        })

        let result;

        if (existingLog) {
            result = await db.dailyActivityLog.update({
                where: { id: existingLog.id },
                data: {
                    calls,
                    emails,
                    meetings,
                    proposals,
                    notes: notes || existingLog.notes, // Mantém notas antigas se não enviar novas
                    updatedAt: new Date()
                }
            })
        } else {
            result = await db.dailyActivityLog.create({
                data: {
                    userId: user.id,
                    date: normalizedDate,
                    calls,
                    emails,
                    meetings,
                    proposals,
                    notes
                }
            })
        }

        return NextResponse.json({
            success: true,
            message: "Atividades registradas com sucesso",
            data: {
                id: result.id,
                date: result.date,
                userId: user.id
            }
        })

    } catch (error) {
        console.error("Webhook Error:", error)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}
