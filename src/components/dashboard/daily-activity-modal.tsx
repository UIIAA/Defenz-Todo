"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { upsertDailyActivity, getDailyActivity } from "@/actions/daily-activities"
import { Phone, Mail, Users, FileText, Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

interface DailyActivityModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
    marketingLists?: Array<{ id: string; name: string }>
    opportunities?: Array<{ id: string; title: string }>
}

export function DailyActivityModal({
    open,
    onOpenChange,
    onSuccess,
    marketingLists = [],
    opportunities = [],
}: DailyActivityModalProps) {
    const [loading, setLoading] = useState(false)
    const [loadingData, setLoadingData] = useState(false)
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [calls, setCalls] = useState("")
    const [emails, setEmails] = useState("")
    const [meetings, setMeetings] = useState("")
    const [proposals, setProposals] = useState("")
    const [notes, setNotes] = useState("")
    const [marketingListId, setMarketingListId] = useState<string | undefined>()
    const [opportunityId, setOpportunityId] = useState<string | undefined>()

    // Carregar dados existentes quando o modal abre
    useEffect(() => {
        if (open) {
            loadExistingData()
        }
    }, [open, date])

    const loadExistingData = async () => {
        try {
            setLoadingData(true)
            // Criar data no timezone local
            const [year, month, day] = date.split('-').map(Number)
            const localDate = new Date(year, month - 1, day, 12, 0, 0)

            const existingActivity = await getDailyActivity(localDate)

            if (existingActivity) {
                setCalls(existingActivity.calls.toString())
                setEmails(existingActivity.emails.toString())
                setMeetings(existingActivity.meetings.toString())
                setProposals(existingActivity.proposals.toString())
                setNotes(existingActivity.notes || "")
                setMarketingListId(existingActivity.marketingListId || undefined)
                setOpportunityId(existingActivity.opportunityId || undefined)
            } else {
                // Limpar campos se não houver dados
                resetForm()
            }
        } catch (error) {
            console.error("Erro ao carregar dados:", error)
        } finally {
            setLoadingData(false)
        }
    }

    const resetForm = () => {
        setCalls("")
        setEmails("")
        setMeetings("")
        setProposals("")
        setNotes("")
        setMarketingListId(undefined)
        setOpportunityId(undefined)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            setLoading(true)

            // Criar data no timezone local (não UTC) para evitar problemas de fuso horário
            const [year, month, day] = date.split('-').map(Number)
            const localDate = new Date(year, month - 1, day, 12, 0, 0) // Meio-dia para evitar problemas de timezone

            await upsertDailyActivity({
                date: localDate,
                calls: parseInt(calls) || 0,
                emails: parseInt(emails) || 0,
                meetings: parseInt(meetings) || 0,
                proposals: parseInt(proposals) || 0,
                notes: notes || undefined,
                marketingListId,
                opportunityId,
            })

            toast.success("Produtividade registrada com sucesso!")
            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            console.error("Erro ao salvar atividades:", error)
            toast.error("Erro ao salvar atividades. Tente novamente.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Registrar Produtividade Diária
                    </DialogTitle>
                    <DialogDescription>
                        Registre rapidamente a produtividade realizada no dia.
                    </DialogDescription>
                </DialogHeader>

                {loadingData ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Data */}
                        <div className="space-y-2">
                            <Label htmlFor="date">Data</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                                max={format(new Date(), 'yyyy-MM-dd')}
                            />
                        </div>

                        {/* Contadores de Atividades */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Ligações */}
                            <div className="space-y-2">
                                <Label htmlFor="calls" className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-blue-500" />
                                    Ligações
                                </Label>
                                <Input
                                    id="calls"
                                    type="number"
                                    min="0"
                                    value={calls}
                                    onChange={(e) => setCalls(e.target.value)}
                                    placeholder="0"
                                    className="text-lg font-semibold"
                                />
                            </div>

                            {/* Emails */}
                            <div className="space-y-2">
                                <Label htmlFor="emails" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-green-500" />
                                    Emails
                                </Label>
                                <Input
                                    id="emails"
                                    type="number"
                                    min="0"
                                    value={emails}
                                    onChange={(e) => setEmails(e.target.value)}
                                    placeholder="0"
                                    className="text-lg font-semibold"
                                />
                            </div>

                            {/* Reuniões */}
                            <div className="space-y-2">
                                <Label htmlFor="meetings" className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-purple-500" />
                                    Reuniões
                                </Label>
                                <Input
                                    id="meetings"
                                    type="number"
                                    min="0"
                                    value={meetings}
                                    onChange={(e) => setMeetings(e.target.value)}
                                    placeholder="0"
                                    className="text-lg font-semibold"
                                />
                            </div>

                            {/* Propostas */}
                            <div className="space-y-2">
                                <Label htmlFor="proposals" className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-orange-500" />
                                    Propostas
                                </Label>
                                <Input
                                    id="proposals"
                                    type="number"
                                    min="0"
                                    value={proposals}
                                    onChange={(e) => setProposals(e.target.value)}
                                    placeholder="0"
                                    className="text-lg font-semibold"
                                />
                            </div>
                        </div>

                        {/* Vinculação Opcional */}
                        <div className="space-y-4 pt-4 border-t">
                            <h4 className="text-sm font-medium text-muted-foreground">
                                Vinculação Opcional
                            </h4>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Lista de Marketing */}
                                <div className="space-y-2">
                                    <Label htmlFor="marketingList">Lista de Marketing</Label>
                                    <Select
                                        value={marketingListId}
                                        onValueChange={(value) =>
                                            setMarketingListId(value === "none" ? undefined : value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Nenhuma" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhuma</SelectItem>
                                            {marketingLists.map((list) => (
                                                <SelectItem key={list.id} value={list.id}>
                                                    {list.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Oportunidade */}
                                <div className="space-y-2">
                                    <Label htmlFor="opportunity">Oportunidade</Label>
                                    <Select
                                        value={opportunityId}
                                        onValueChange={(value) =>
                                            setOpportunityId(value === "none" ? undefined : value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Nenhuma" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Nenhuma</SelectItem>
                                            {opportunities.map((opp) => (
                                                <SelectItem key={opp.id} value={opp.id}>
                                                    {opp.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Observações */}
                        <div className="space-y-2">
                            <Label htmlFor="notes">Observações (opcional)</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Adicione notas ou contexto sobre as atividades do dia..."
                                rows={3}
                            />
                        </div>

                        {/* Botões */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading} className="gap-2">
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Salvar
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
