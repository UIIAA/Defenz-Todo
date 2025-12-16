'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Phone, Mail, MessageCircle, Calendar, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface Interaction {
    id: string
    type: string
    content: string
    date: Date
    user: { name: string | null }
}

const ICONS: Record<string, any> = {
    call: Phone,
    email: Mail,
    whatsapp: MessageCircle,
    meeting: Calendar,
    note: FileText,
}

const COLORS: Record<string, string> = {
    call: 'bg-blue-100 text-blue-600',
    email: 'bg-yellow-100 text-yellow-600',
    whatsapp: 'bg-green-100 text-green-600',
    meeting: 'bg-purple-100 text-purple-600',
    note: 'bg-gray-100 text-gray-600',
}

export function InteractionTimeline({ interactions }: { interactions: Interaction[] }) {
    if (interactions.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Nenhuma interação registrada ainda.
            </div>
        )
    }

    return (
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
            {interactions.map((interaction) => {
                const Icon = ICONS[interaction.type] || FileText
                const colorClass = COLORS[interaction.type] || COLORS.note

                return (
                    <div key={interaction.id} className="relative flex items-start group">
                        <div className={`absolute left-0 ml-2 h-6 w-6 rounded-full border-2 border-white ${colorClass} flex items-center justify-center z-10`}>
                            <Icon className="h-3 w-3" />
                        </div>
                        <div className="ml-12 w-full">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="font-semibold text-sm capitalize mr-2">
                                                {interaction.type === 'whatsapp' ? 'WhatsApp' : interaction.type}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                por {interaction.user.name || 'Usuário'}
                                            </span>
                                        </div>
                                        <time className="text-xs text-muted-foreground">
                                            {format(new Date(interaction.date), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                                        </time>
                                    </div>
                                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                                        {interaction.content}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
