'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Target, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number; // Percentual de mudança (ex: 5.2 para +5.2%)
  changeLabel?: string;
  target?: number;
  targetLabel?: string;
  icon?: React.ReactNode;
  tooltip?: string;
  format?: 'number' | 'currency' | 'percentage';
  loading?: boolean;
  className?: string;
}

/**
 * MetricCard - Card de métrica com valor, tendência e target
 *
 * Exibe uma métrica importante do negócio com:
 * - Valor atual
 * - Variação percentual (positiva/negativa)
 * - Target/objetivo
 * - Tooltip explicativo
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  target,
  targetLabel,
  icon,
  tooltip,
  format = 'number',
  loading = false,
  className
}) => {
  // Formatar valor baseado no tipo
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'number':
      default:
        return new Intl.NumberFormat('pt-BR').format(val);
    }
  };

  // Determinar cor da variação
  const getChangeColor = (changeValue: number): string => {
    if (changeValue > 0) return 'text-green-400';
    if (changeValue < 0) return 'text-red-400';
    return 'text-slate-400';
  };

  // Determinar cor do target
  const getTargetColor = (): string => {
    if (!target || typeof value !== 'number') return 'text-slate-400';

    const current = format === 'percentage' ? value : value;
    if (current >= target) return 'text-green-400';
    if (current >= target * 0.8) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <Card className={cn('bg-slate-900/50 border-slate-800/50 backdrop-blur-sm', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-slate-900/50 border-slate-800/50 backdrop-blur-sm hover:border-slate-700/50 transition-all', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium text-slate-300">
            {title}
          </CardTitle>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-slate-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-slate-800 border-slate-700 text-slate-100">
                  <p className="text-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {icon && <div className="text-slate-400">{icon}</div>}
      </CardHeader>
      <CardContent>
        {/* Valor Principal */}
        <div className="text-2xl font-bold text-slate-100 mb-2">
          {formatValue(value)}
        </div>

        {/* Variação e Target */}
        <div className="flex items-center justify-between text-xs">
          {/* Variação */}
          {change !== undefined && (
            <div className={cn('flex items-center gap-1', getChangeColor(change))}>
              {change > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : change < 0 ? (
                <TrendingDown className="h-3 w-3" />
              ) : null}
              <span className="font-medium">
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-slate-500 ml-1">{changeLabel}</span>
              )}
            </div>
          )}

          {/* Target */}
          {target !== undefined && (
            <div className={cn('flex items-center gap-1', getTargetColor())}>
              <Target className="h-3 w-3" />
              <span className="font-medium">
                Meta: {format === 'percentage' ? `${target}%` : target}
              </span>
              {targetLabel && (
                <span className="text-slate-500 ml-1">{targetLabel}</span>
              )}
            </div>
          )}
        </div>

        {/* Barra de progresso para targets */}
        {target !== undefined && typeof value === 'number' && (
          <div className="mt-3">
            <div className="w-full bg-slate-800 rounded-full h-1.5">
              <div
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  value >= target
                    ? 'bg-green-500'
                    : value >= target * 0.8
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                )}
                style={{ width: `${Math.min((value / target) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
