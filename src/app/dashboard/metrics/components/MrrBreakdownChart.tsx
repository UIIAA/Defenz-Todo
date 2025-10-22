'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { FinancialMetric } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MrrBreakdownChartProps {
  data: FinancialMetric[];
  loading?: boolean;
}

/**
 * MrrBreakdownChart - Gráfico de breakdown do MRR
 *
 * Exibe stacked bar chart com componentes do MRR:
 * - New MRR (novos clientes)
 * - Expansion MRR (upsells)
 * - Contraction MRR (downgrades)
 * - Churned MRR (cancelamentos)
 */
export const MrrBreakdownChart: React.FC<MrrBreakdownChartProps> = React.memo(({ data, loading = false }) => {
  // Preparar dados para o gráfico
  const chartData = React.useMemo(() => {
    return [...data]
      .reverse()
      .map((metric) => ({
        period: format(new Date(metric.period), 'MMM/yy', { locale: ptBR }),
        new: Number(metric.newMrr),
        expansion: Number(metric.expansionMrr),
        contraction: -Math.abs(Number(metric.contractionMrr)), // Negativo para exibir para baixo
        churn: -Math.abs(Number(metric.churnedMrr)), // Negativo para exibir para baixo
      }));
  }, [data]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const formatCurrency = (value: number) =>
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
      }).format(Math.abs(value));

    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-sm font-medium text-slate-100 mb-2">{payload[0].payload.period}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-green-400">Novos:</span>
            <span className="text-sm font-bold text-green-400">
              {formatCurrency(payload[0].payload.new)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-blue-400">Expansão:</span>
            <span className="text-sm font-bold text-blue-400">
              {formatCurrency(payload[0].payload.expansion)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-orange-400">Contração:</span>
            <span className="text-sm font-bold text-orange-400">
              -{formatCurrency(payload[0].payload.contraction)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-red-400">Churn:</span>
            <span className="text-sm font-bold text-red-400">
              -{formatCurrency(payload[0].payload.churn)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            Breakdown do MRR
          </CardTitle>
          <CardDescription className="text-slate-400">
            Composição do Monthly Recurring Revenue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400 mb-2">Nenhum dado disponível</p>
              <p className="text-xs text-slate-500">
                Adicione métricas financeiras para visualizar o breakdown do MRR
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-100">
          <BarChart3 className="h-5 w-5 text-blue-400" />
          Breakdown do MRR
        </CardTitle>
        <CardDescription className="text-slate-400">
          Composição do Monthly Recurring Revenue (novos, expansão, contração, churn)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="period"
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#94a3b8' }}
              tickFormatter={(value) =>
                new Intl.NumberFormat('pt-BR', {
                  notation: 'compact',
                  compactDisplay: 'short',
                }).format(value)
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
              iconType="rect"
            />
            <Bar dataKey="new" stackId="mrr" fill="#10b981" name="Novos" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expansion" stackId="mrr" fill="#3b82f6" name="Expansão" />
            <Bar dataKey="contraction" stackId="mrr" fill="#f97316" name="Contração" />
            <Bar dataKey="churn" stackId="mrr" fill="#ef4444" name="Churn" radius={[0, 0, 4, 4]} />
          </BarChart>
        </ResponsiveContainer>

        {/* Legenda de cores */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-slate-400">Novos clientes (positivo)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-slate-400">Expansão/Upsell (positivo)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span className="text-slate-400">Contração/Downsell (negativo)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-slate-400">Churn (negativo)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

MrrBreakdownChart.displayName = 'MrrBreakdownChart';
