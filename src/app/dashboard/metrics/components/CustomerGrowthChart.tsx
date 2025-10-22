'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { Users } from 'lucide-react';
import { CustomerMetric } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CustomerGrowthChartProps {
  data: CustomerMetric[];
  loading?: boolean;
}

/**
 * CustomerGrowthChart - Gráfico de crescimento da base de clientes
 *
 * Exibe evolução de:
 * - Clientes ativos
 * - Novos clientes
 * - Churn
 */
export const CustomerGrowthChart: React.FC<CustomerGrowthChartProps> = React.memo(({ data, loading = false }) => {
  // Preparar dados para o gráfico
  const chartData = React.useMemo(() => {
    return [...data]
      .reverse()
      .map((metric) => ({
        period: format(new Date(metric.period), 'MMM/yy', { locale: ptBR }),
        active: Number(metric.activeCustomers),
        new: Number(metric.newCustomers),
        churned: Number(metric.churnedCustomers),
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
            <span className="text-xs text-blue-400">Clientes Ativos:</span>
            <span className="text-sm font-bold text-blue-400">
              {payload[0].value.toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-green-400">Novos:</span>
            <span className="text-sm font-bold text-green-400">
              +{payload[1]?.value || 0}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-red-400">Churn:</span>
            <span className="text-sm font-bold text-red-400">
              -{payload[2]?.value || 0}
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
            <Users className="h-5 w-5 text-blue-400" />
            Crescimento de Clientes
          </CardTitle>
          <CardDescription className="text-slate-400">
            Evolução da base de clientes ativos ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400 mb-2">Nenhum dado disponível</p>
              <p className="text-xs text-slate-500">
                Adicione métricas de clientes para visualizar o crescimento
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
          <Users className="h-5 w-5 text-blue-400" />
          Crescimento de Clientes
        </CardTitle>
        <CardDescription className="text-slate-400">
          Evolução da base de clientes ativos, novos clientes e churn
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
              tickFormatter={(value) => value.toLocaleString('pt-BR')}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
              iconType="line"
            />
            <Area
              type="monotone"
              dataKey="active"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#colorActive)"
              name="Clientes Ativos"
            />
            <Line
              type="monotone"
              dataKey="new"
              stroke="#10b981"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#10b981', r: 3 }}
              name="Novos"
            />
            <Line
              type="monotone"
              dataKey="churned"
              stroke="#ef4444"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#ef4444', r: 3 }}
              name="Churn"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
});

CustomerGrowthChart.displayName = 'CustomerGrowthChart';
