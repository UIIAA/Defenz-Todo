'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { FinancialMetric } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ArrGrowthChartProps {
  data: FinancialMetric[];
  loading?: boolean;
}

/**
 * ArrGrowthChart - Gráfico de crescimento do ARR ao longo do tempo
 *
 * Exibe evolução do ARR (Annual Recurring Revenue) e taxa de crescimento
 * Métrica crítica para investidores M&A
 */
export const ArrGrowthChart: React.FC<ArrGrowthChartProps> = React.memo(({ data, loading = false }) => {
  // Preparar dados para o gráfico (inverter ordem para exibir cronologicamente)
  const chartData = React.useMemo(() => {
    return [...data]
      .reverse()
      .map((metric) => ({
        period: format(new Date(metric.period), 'MMM/yy', { locale: ptBR }),
        arr: Number(metric.arr),
        growth: Number(metric.arrGrowthRate),
      }));
  }, [data]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-sm font-medium text-slate-100 mb-2">{payload[0].payload.period}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-400">ARR:</span>
            <span className="text-sm font-bold text-green-400">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
              }).format(payload[0].value)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-400">Crescimento:</span>
            <span className="text-sm font-bold text-blue-400">
              {payload[1].value.toFixed(1)}%
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
            <TrendingUp className="h-5 w-5 text-green-400" />
            Crescimento do ARR
          </CardTitle>
          <CardDescription className="text-slate-400">
            Evolução do Annual Recurring Revenue ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400 mb-2">Nenhum dado disponível</p>
              <p className="text-xs text-slate-500">
                Adicione métricas financeiras para visualizar o crescimento do ARR
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
          <TrendingUp className="h-5 w-5 text-green-400" />
          Crescimento do ARR
        </CardTitle>
        <CardDescription className="text-slate-400">
          Evolução do Annual Recurring Revenue ao longo do tempo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="period"
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis
              yAxisId="left"
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
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              tick={{ fill: '#94a3b8' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
              iconType="line"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="arr"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
              name="ARR (R$)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="growth"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              name="Crescimento (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

ArrGrowthChart.displayName = 'ArrGrowthChart';
