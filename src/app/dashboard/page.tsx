'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  BarChart3,
  Target,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Briefcase,
  Phone
} from 'lucide-react'
import { getDashboardMetrics } from '@/actions/dashboard'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await getDashboardMetrics()
        setMetrics(data)
      } catch (error) {
        console.error('Error fetching metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  if (loading) {
    return <div className="p-8 text-muted-foreground">Carregando dashboard...</div>
  }

  if (!metrics) {
    return <div className="p-8 text-muted-foreground">Erro ao carregar dados.</div>
  }

  const { pipeline, actionableItems, recentInteractions } = metrics

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const STATUS_LABELS: Record<string, string> = {
    prospecting: 'Prospecção',
    qualification: 'Qualificação',
    proposal: 'Proposta',
    negotiation: 'Negociação',
    closed_won: 'Fechado Ganho',
    closed_lost: 'Perdido',
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Executivo</h1>
        <p className="text-muted-foreground mt-2">Indicadores chave de performance e priorização comercial</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline Total</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pipeline.totalValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Valor total em oportunidades</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Oportunidades Ativas</CardTitle>
            <Briefcase className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipeline.totalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Casos em andamento</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipeline.winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Win Rate (Ganho / Fechados)</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ações Prioritárias</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{actionableItems.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Alta prioridade em aberto</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Status (Funnel) */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Status Real das Oportunidades</CardTitle>
            <CardDescription>Distribuição de casos por estágio do funil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(STATUS_LABELS).map(([key, label]) => {
              const count = pipeline.statusCounts[key] || 0
              const percentage = pipeline.totalCount > 0 ? (count / pipeline.totalCount) * 100 : 0

              if (count === 0 && percentage === 0) return null

              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
            {pipeline.totalCount === 0 && (
              <div className="text-center py-4 text-muted-foreground">Nenhuma oportunidade registrada</div>
            )}
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Priorização</CardTitle>
            <CardDescription>Distribuição por nível de prioridade</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium">Alta</span>
              </div>
              <Badge variant="secondary" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">
                {pipeline.priorityCounts['high'] || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium">Média</span>
              </div>
              <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">
                {pipeline.priorityCounts['medium'] || 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">Baixa</span>
              </div>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                {pipeline.priorityCounts['low'] || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actionable Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Atenção Necessária
            </CardTitle>
            <CardDescription>Casos de alta prioridade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {actionableItems.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">Nenhum item crítico pendente</div>
              ) : (
                actionableItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                    <div>
                      <h3 className="font-medium">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.client.name}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-red-500 border-red-500/30 mb-1">Alta Prioridade</Badge>
                      <p className="text-xs text-muted-foreground">
                        Atualizado em {format(new Date(item.updatedAt), "dd/MM", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Interactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-500" />
              Últimas Interações
            </CardTitle>
            <CardDescription>Histórico recente de contatos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentInteractions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">Nenhuma interação recente</div>
              ) : (
                recentInteractions.map((interaction: any) => (
                  <div key={interaction.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border">
                    <div className="mt-1">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium capitalize">{interaction.type}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(interaction.date), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{interaction.content}</p>
                      <p className="text-xs text-muted-foreground mt-1 italic">{interaction.opportunity.title}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}