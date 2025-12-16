'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { mapImportData, saveImportedData, MappedEntry } from '@/actions/crm-import'
import { FileSpreadsheet, Upload, Sparkles, Loader2, CheckCircle2, AlertCircle, ArrowRight, Database } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { useRouter } from 'next/navigation'

export default function SmartImportPage() {
    const [mappedData, setMappedData] = useState<MappedEntry[] | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsAnalyzing(true)
        setMappedData(null)

        try {
            const reader = new FileReader()
            reader.onload = async (evt) => {
                try {
                    const bstr = evt.target?.result
                    const wb = XLSX.read(bstr, { type: 'binary' })
                    const wsname = wb.SheetNames[0]
                    const ws = wb.Sheets[wsname]
                    const data = XLSX.utils.sheet_to_json(ws)

                    if (data.length === 0) {
                        toast.error('A planilha parece estar vazia.')
                        setIsAnalyzing(false)
                        return
                    }

                    toast.info('A IA está analisando e mapeando seus dados...')

                    // Sanitizar dados
                    const plainData = JSON.parse(JSON.stringify(data))
                    const result = await mapImportData(plainData)

                    setMappedData(result)
                    toast.success(`${result.length} registros mapeados com sucesso!`)
                } catch (error) {
                    console.error('Error processing file:', error)
                    toast.error('Erro ao processar o arquivo. Verifique o formato.')
                } finally {
                    setIsAnalyzing(false)
                }
            }
            reader.readAsBinaryString(file)
        } catch (error) {
            console.error('Error reading file:', error)
            toast.error('Erro ao ler o arquivo.')
            setIsAnalyzing(false)
        }
    }

    const handleSave = async () => {
        if (!mappedData) return

        setIsSaving(true)
        try {
            const result = await saveImportedData(mappedData)
            if (result.success) {
                toast.success(`${result.count} registros importados com sucesso!`)
                router.push('/dashboard/crm/clients')
            }
        } catch (error) {
            console.error('Error saving data:', error)
            toast.error('Erro ao salvar os dados.')
        } finally {
            setIsSaving(false)
        }
    }

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="space-y-8 p-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Sparkles className="h-8 w-8 text-primary" />
                    Importação Inteligente
                </h1>
                <p className="text-muted-foreground mt-2">
                    Faça upload de qualquer planilha e deixe a IA organizar seus Clientes e Oportunidades.
                </p>
            </div>

            {/* Upload Section */}
            {!mappedData && (
                <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="p-4 bg-muted rounded-full">
                            {isAnalyzing ? (
                                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                            ) : (
                                <Database className="h-12 w-12 text-muted-foreground" />
                            )}
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold">
                                {isAnalyzing ? 'Mapeando dados com IA...' : 'Upload de Dados Brutos'}
                            </h3>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                {isAnalyzing
                                    ? 'O Gemini está identificando nomes, emails, empresas e valores automaticamente.'
                                    : 'Suportamos arquivos .xlsx e .csv despadronizados. A IA fará o trabalho pesado de limpeza e organização.'}
                            </p>
                        </div>
                        {!isAnalyzing && (
                            <Button onClick={triggerFileInput}>
                                <Upload className="h-4 w-4 mr-2" />
                                Selecionar Planilha
                            </Button>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            accept=".xlsx, .xls, .csv"
                            className="hidden"
                        />
                    </CardContent>
                </Card>
            )}

            {/* Preview Section */}
            {mappedData && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            Pré-visualização da Importação
                        </h2>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setMappedData(null)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white">
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Confirmar Importação ({mappedData.length})
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {mappedData.map((entry, index) => (
                            <Card key={index}>
                                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                                    {/* Client Info */}
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-primary uppercase tracking-wider">Cliente</span>
                                            <h3 className="font-medium">{entry.client.name}</h3>
                                        </div>
                                        <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                                            {entry.client.email && <span>{entry.client.email}</span>}
                                            {entry.client.phone && <span>{entry.client.phone}</span>}
                                            {entry.client.companyName && <span>{entry.client.companyName}</span>}
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <ArrowRight className="h-5 w-5 text-muted-foreground hidden md:block" />

                                    {/* Opportunity Info */}
                                    <div className="flex-1 space-y-1 md:text-right">
                                        {entry.opportunity ? (
                                            <>
                                                <div className="flex items-center gap-2 md:justify-end">
                                                    <span className="text-xs font-bold text-secondary-foreground uppercase tracking-wider">Oportunidade</span>
                                                    <h3 className="font-medium">{entry.opportunity.title}</h3>
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    <span className="text-green-500 font-medium">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.opportunity.value)}
                                                    </span>
                                                    <span className="mx-2">•</span>
                                                    <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                                                        {entry.opportunity.status}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-sm text-muted-foreground italic md:text-right">
                                                Sem oportunidade vinculada
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
