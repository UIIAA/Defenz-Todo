import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { BusinessIndicator, MAMetric, ConfidenceLevel } from '@/types/activity-insight';
import { cn } from '@/lib/utils';

interface MetricConnectionBadgeProps {
  metric: BusinessIndicator | MAMetric;
  type: 'business' | 'ma';
}

/**
 * MetricConnectionBadge - Badge visual para mostrar conexão com métrica
 *
 * Exibe uma métrica individual com seu impact score, confidence level e explicação.
 * Usa cores diferentes baseado na categoria (business) ou tipo (M&A).
 */
export const MetricConnectionBadge: React.FC<MetricConnectionBadgeProps> = React.memo(({ metric, type }) => {
  // Determina a cor do badge baseado no confidence level
  const getConfidenceColor = (confidence: ConfidenceLevel): string => {
    switch (confidence) {
      case 'high':
        return 'border-green-500/50 bg-green-500/10 text-green-400';
      case 'medium':
        return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
      case 'low':
        return 'border-amber-500/50 bg-amber-500/10 text-amber-400';
      default:
        return 'border-gray-500/50 bg-gray-500/10 text-gray-400';
    }
  };

  // Determina a cor do impact score
  const getImpactColor = (impact: number): string => {
    if (impact >= 70) return 'bg-green-500';
    if (impact >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Label para confidence level
  const getConfidenceLabel = (confidence: ConfidenceLevel): string => {
    switch (confidence) {
      case 'high':
        return 'Alta Confiança';
      case 'medium':
        return 'Média Confiança';
      case 'low':
        return 'Baixa Confiança';
      default:
        return 'Desconhecida';
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col gap-2 p-3 border rounded-lg bg-slate-800/30 border-slate-700/50 hover:border-slate-600 transition-all cursor-pointer">
          {/* Nome da métrica e confidence */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-200 truncate">
              {metric.name}
            </span>
            <Badge
              variant="outline"
              className={cn(
                'text-xs px-2 py-0.5 shrink-0',
                getConfidenceColor(metric.confidence)
              )}
            >
              {getConfidenceLabel(metric.confidence)}
            </Badge>
          </div>

          {/* Impact progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Impacto</span>
              <span className="font-semibold text-slate-200">{metric.impact}%</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-700/30">
              <div
                className={cn(
                  'h-full transition-all duration-300',
                  getImpactColor(metric.impact)
                )}
                style={{ width: `${metric.impact}%` }}
              />
            </div>
          </div>
        </div>
      </TooltipTrigger>

      <TooltipContent side="top" className="max-w-xs p-3 bg-slate-900 border-slate-700">
        <div className="space-y-1">
          <p className="font-semibold text-slate-100">{metric.name}</p>
          <p className="text-xs text-slate-300 leading-relaxed">
            {metric.explanation}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
            <span>Impacto: {metric.impact}%</span>
            <span>•</span>
            <span>{getConfidenceLabel(metric.confidence)}</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
});

MetricConnectionBadge.displayName = 'MetricConnectionBadge';
