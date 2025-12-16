'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { createInteraction } from '@/actions/crm'
import { toast } from 'sonner'
import { Phone, Mail, MessageCircle, Calendar, FileText, Send } from 'lucide-react'

const formSchema = z.object({
    type: z.string(),
    content: z.string().min(1, 'Digite o conteúdo da interação'),
})

export function AddInteractionForm({ opportunityId }: { opportunityId: string }) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            type: 'note',
            content: '',
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true)
        try {
            await createInteraction({
                opportunityId,
                ...values,
            })
            toast.success('Interação registrada!')
            form.reset({ type: values.type, content: '' })
        } catch (error) {
            toast.error('Erro ao registrar interação')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="bg-muted/30 p-4 rounded-lg border">
            <h3 className="text-sm font-medium mb-3">Registrar Interação</h3>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                    <div className="flex gap-2">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem className="w-[140px]">
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="note"><div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Nota</div></SelectItem>
                                            <SelectItem value="call"><div className="flex items-center gap-2"><Phone className="h-4 w-4" /> Ligação</div></SelectItem>
                                            <SelectItem value="email"><div className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email</div></SelectItem>
                                            <SelectItem value="whatsapp"><div className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> WhatsApp</div></SelectItem>
                                            <SelectItem value="meeting"><div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Reunião</div></SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex-1 flex gap-2">
                            <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Textarea
                                                placeholder="Descreva o que foi conversado..."
                                                className="min-h-[38px] h-[38px] py-2 resize-none focus:h-[80px] transition-all"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" size="icon" disabled={isSubmitting}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    )
}
