'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine, Area, AreaChart } from 'recharts';
import { DollarSign } from 'lucide-react';
import { FinancialMetric } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EbitdaMarginChartProps {
  data: FinancialMetric[];
  loading?: boolean;
}

/**
 * EbitdaMarginChart - Gráfico de margem EBITDA
 *
 * Exibe evolução da margem EBITDA ao longo do tempo
 * Target para M&A: > 20%
 */
export const EbitdaMarginChart: React.FC<EbitdaMarginChartProps> = React.memo(({ data, loading = false }) => {
  // Target de EBITDA margin para M&A (> 20%)
  const EBITDA_TARGET = 20;

  // Preparar dados para o gráfico
  const chartData = React.useMemo(() => {
    return [...data]
      .reverse()
      .map((metric) => ({
        period: format(new Date(metric.period), 'MMM/yy', { locale: ptBR }),
        margin: Number(metric.ebitdaMargin),
        ebitda: Number(metric.ebitda),
        revenue: Number(metric.revenue),
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
      }).format(value);

    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
        <p className="text-sm font-medium text-slate-100 mb-2">{payload[0].payload.period}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-purple-400">EBITDA Margin:</span>
            <span className="text-sm font-bold text-purple-400">
              {payload[0].value.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-green-400">EBITDA:</span>
            <span className="text-sm font-bold text-green-400">
              {formatCurrency(payload[0].payload.ebitda)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-blue-400">Receita:</span>
            <span className="text-sm font-bold text-blue-400">
              {formatCurrency(payload[0].payload.revenue)}
            </span>
          </div>
          <div className="border-t border-slate-700 mt-2 pt-2">
            <span className="text-xs text-slate-500">Target M&A: &gt; {EBITDA_TARGET}%</span>
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
            <DollarSign className="h-5 w-5 text-purple-400" />
            Margem EBITDA
          </CardTitle>
          <CardDescription className="text-slate-400">
            Evolução da margem EBITDA ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400 mb-2">Nenhum dado disponível</p>
              <p className="text-xs text-slate-500">
                Adicione métricas financeiras para visualizar a margem EBITDA
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular média de EBITDA margin
  const avgMargin = chartData.reduce((sum, d) => sum + d.margin, 0) / chartData.length;
  const isHealthy = avgMargin >= EBITDA_TARGET;
  const latestMargin = chartData[chartData.length - 1]?.margin || 0;

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-100">
          <DollarSign className="h-5 w-5 text-purple-400" />
          Margem EBITDA
        </CardTitle>
        <CardDescription className="text-slate-400">
          Evolução da margem EBITDA (target para M&A: &gt; {EBITDA_TARGET}%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
              iconType="line"
            />
            {/* Linha de referência do target */}
            <ReferenceLine
              y={EBITDA_TARGET}
              stroke="#10b981"
              strokeDasharray="3 3"
              label={{
                value: `Target: ${EBITDA_TARGET}%`,
                position: 'right',
                fill: '#10b981',
                fontSize: 10,
              }}
            />
            <Area
              type="monotone"
              dataKey="margin"
              stroke="#a855f7"
              strokeWidth={2}
              fill="url(#colorMargin)"
              name="EBITDA Margin (%)"
            />
          </AreaChart>
        </ResponsiveContainer>

        {/* Status indicator */}
        <div className="mt-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300">Status para M&A:</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className={`text-sm font-medium ${isHealthy ? 'text-green-400' : 'text-yellow-400'}`}>
                {isHealthy ? 'Excelente' : 'Em Crescimento'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500">Margem Atual:</span>
              <p className="font-medium text-slate-300">{latestMargin.toFixed(1)}%</p>
            </div>
            <div>
              <span className="text-slate-500">Margem Média:</span>
              <p className="font-medium text-slate-300">{avgMargin.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Explicação para investidores */}
        <div className="mt-3 p-2 rounded bg-blue-900/20 border border-blue-700/30">
          <p className="text-xs text-blue-300">
            <strong>Para investidores:</strong> EBITDA Margin &gt; 20% indica eficiência operacional
            e capacidade de gerar lucro, fatores críticos na avaliação de M&A.
          </p>
        </div>
      </CardContent>
    </Card>
  );
});

EbitdaMarginChart.displayName = 'EbitdaMarginChart';
