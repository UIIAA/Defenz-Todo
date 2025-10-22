'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { TrendingDown } from 'lucide-react';
import { CustomerMetric } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChurnTrendChartProps {
  data: CustomerMetric[];
  loading?: boolean;
}

/**
 * ChurnTrendChart - Gráfico de tendência de churn
 *
 * Exibe evolução das taxas de churn:
 * - Customer Churn Rate (%)
 * - Revenue Churn Rate (%)
 * - Linha de referência do target (5%)
 */
export const ChurnTrendChart: React.FC<ChurnTrendChartProps> = React.memo(({ data, loading = false }) => {
  // Target de churn para M&A (< 5%)
  const CHURN_TARGET = 5;

  // Preparar dados para o gráfico
  const chartData = React.useMemo(() => {
    return [...data]
      .reverse()
      .map((metric) => ({
        period: format(new Date(metric.period), 'MMM/yy', { locale: ptBR }),
        customerChurn: Number(metric.customerChurnRate),
        revenueChurn: Number(metric.revenueChurnRate),
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
            <span className="text-xs text-red-400">Customer Churn:</span>
            <span className="text-sm font-bold text-red-400">
              {payload[0].value.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-orange-400">Revenue Churn:</span>
            <span className="text-sm font-bold text-orange-400">
              {payload[1]?.value.toFixed(2)}%
            </span>
          </div>
          <div className="border-t border-slate-700 mt-2 pt-2">
            <span className="text-xs text-slate-500">Target M&A: &lt; {CHURN_TARGET}%</span>
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
            <TrendingDown className="h-5 w-5 text-red-400" />
            Tendência de Churn
          </CardTitle>
          <CardDescription className="text-slate-400">
            Evolução das taxas de churn de clientes e receita
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400 mb-2">Nenhum dado disponível</p>
              <p className="text-xs text-slate-500">
                Adicione métricas de clientes para visualizar o churn
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular média de churn
  const avgCustomerChurn = chartData.reduce((sum, d) => sum + d.customerChurn, 0) / chartData.length;
  const isHealthy = avgCustomerChurn < CHURN_TARGET;

  return (
    <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-100">
          <TrendingDown className="h-5 w-5 text-red-400" />
          Tendência de Churn
        </CardTitle>
        <CardDescription className="text-slate-400">
          Evolução das taxas de churn (target para M&A: &lt; {CHURN_TARGET}%)
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
              y={CHURN_TARGET}
              stroke="#10b981"
              strokeDasharray="3 3"
              label={{
                value: `Target: ${CHURN_TARGET}%`,
                position: 'right',
                fill: '#10b981',
                fontSize: 10,
              }}
            />
            <Line
              type="monotone"
              dataKey="customerChurn"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', r: 4 }}
              activeDot={{ r: 6 }}
              name="Customer Churn (%)"
            />
            <Line
              type="monotone"
              dataKey="revenueChurn"
              stroke="#f97316"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#f97316', r: 4 }}
              activeDot={{ r: 6 }}
              name="Revenue Churn (%)"
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Status indicator */}
        <div className="mt-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Status para M&A:</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={`text-sm font-medium ${isHealthy ? 'text-green-400' : 'text-red-400'}`}>
                {isHealthy ? 'Saudável' : 'Atenção Necessária'}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Churn médio: {avgCustomerChurn.toFixed(2)}% {isHealthy ? '(abaixo do target)' : '(acima do target)'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
});

ChurnTrendChart.displayName = 'ChurnTrendChart';
