import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityInsight } from '@/types/activity-insight';

interface InsightScoreBadgeProps {
  activityId: string;
  className?: string;
}

/**
 * InsightScoreBadge - Badge compacto para mostrar score na lista
 *
 * Componente leve para exibir o overallScore de uma atividade
 * diretamente na tabela/lista de atividades.
 */
export const InsightScoreBadge: React.FC<InsightScoreBadgeProps> = ({ activityId, className }) => {
  const [insight, setInsight] = useState<ActivityInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInsight = async () => {
      try {
        const response = await fetch(`/api/activities/${activityId}/insights`);

        if (response.status === 404) {
          setInsight(null);
          return;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setInsight(data);
      } catch (err) {
        console.error('Error fetching insight badge:', err);
        setInsight(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsight();
  }, [activityId]);

  // Loading state
  if (isLoading) {
    return (
      <Badge variant="outline" className={cn('border-slate-600 bg-slate-800/50', className)}>
        <Loader2 className="size-3 animate-spin text-slate-400" />
      </Badge>
    );
  }

  // Sem insight
  if (!insight) {
    return (
      <Badge variant="outline" className={cn('border-slate-700 bg-slate-800/30 text-slate-500', className)}>
        <Sparkles className="size-3" />
        <span className="text-xs">Sem IA</span>
      </Badge>
    );
  }

  // Calcular overall score
  const overallScore = Math.round(insight.businessScore * 0.4 + insight.maScore * 0.6);

  // Determinar cor baseada no score
  const getScoreStyles = (score: number): string => {
    if (score >= 70) {
      return 'border-green-500/50 bg-green-500/10 text-green-400';
    }
    if (score >= 40) {
      return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400';
    }
    return 'border-red-500/50 bg-red-500/10 text-red-400';
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-semibold tabular-nums',
        getScoreStyles(overallScore),
        className
      )}
    >
      <Sparkles className="size-3" />
      <span className="text-xs">{overallScore}</span>
    </Badge>
  );
};

InsightScoreBadge.displayName = 'InsightScoreBadge';
