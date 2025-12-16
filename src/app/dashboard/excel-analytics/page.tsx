'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { analyzeExcelData, AIAnalysisResult } from '@/actions/excel-dashboard'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { FileSpreadsheet, Upload, Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export default function ExcelAnalyticsPage() {
    const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsAnalyzing(true)
        setAnalysis(null)

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

                    toast.info('Enviando dados para análise da IA...')
                    // Sanitizar dados para garantir que são objetos planos (remove protótipos e métodos)
                    const plainData = JSON.parse(JSON.stringify(data))
                    const result = await analyzeExcelData(plainData)
                    setAnalysis(result)
                    toast.success('Análise concluída com sucesso!')
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

    const triggerFileInput = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="space-y-8 p-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Sparkles className="h-8 w-8 text-primary" />
                    Excel Analytics AI
                </h1>
                <p className="text-muted-foreground mt-2">
                    Transforme suas planilhas em dashboards executivos instantaneamente com Inteligência Artificial.
                </p>
            </div>

            {/* Upload Section */}
            {!analysis && (
                <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="p-4 bg-muted rounded-full">
                            {isAnalyzing ? (
                                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                            ) : (
                                <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                            )}
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold">
                                {isAnalyzing ? 'Analisando seus dados...' : 'Faça upload da sua planilha'}
                            </h3>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                {isAnalyzing
                                    ? 'O Gemini está processando suas informações para gerar insights e gráficos.'
                                    : 'Suportamos arquivos .xlsx e .csv. A IA identificará automaticamente as melhores métricas.'}
                            </p>
                        </div>
                        {!isAnalyzing && (
                            <Button onClick={triggerFileInput}>
                                <Upload className="h-4 w-4 mr-2" />
                                Selecionar Arquivo
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

            {/* Dashboard Section */}
            {analysis && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Action Bar */}
                    <div className="flex justify-end">
                        <Button onClick={triggerFileInput} variant="outline">
                            <Upload className="h-4 w-4 mr-2" />
                            Analisar Nova Planilha
                        </Button>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {analysis.summary.map((item, index) => (
                            <Card key={index}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {item.title}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{item.value}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {item.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Charts Row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Bar Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Análise Comparativa</CardTitle>
                                <CardDescription>
                                    Distribuição por categoria
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analysis.charts.bar}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                                            <Bar dataKey="value" fill="#dc2626" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pie Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Composição</CardTitle>
                                <CardDescription>
                                    Distribuição percentual
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analysis.charts.pie}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {analysis.charts.pie.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#dc2626' : '#1e293b'} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Row 2 & Insights */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Line Chart */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Tendência</CardTitle>
                                <CardDescription>
                                    Evolução temporal ou sequencial
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={analysis.charts.line}>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                                            <Line type="monotone" dataKey="value" stroke="#1e293b" strokeWidth={2} dot={{ fill: '#1e293b' }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* AI Insights */}
                        <Card className="border-l-4 border-l-primary">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-primary" />
                                    Insights da IA
                                </CardTitle>
                                <CardDescription>
                                    Análise qualitativa dos dados
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-4">
                                    {analysis.insights.map((insight, index) => (
                                        <li key={index} className="flex gap-3 text-sm">
                                            <span className="text-primary font-bold">•</span>
                                            {insight}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}
