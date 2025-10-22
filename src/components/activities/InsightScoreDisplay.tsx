import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface InsightScoreDisplayProps {
  businessScore: number;
  maScore: number;
  overallScore: number;
  aiConfidence: number;
  processingTime?: number;
}

/**
 * InsightScoreDisplay - Exibe os scores principais do insight
 *
 * Mostra businessScore, maScore e overallScore em formato visual
 * com cores indicativas e AI confidence indicator.
 */
export const InsightScoreDisplay: React.FC<InsightScoreDisplayProps> = React.memo(({
  businessScore,
  maScore,
  overallScore,
  aiConfidence,
  processingTime
}) => {
  // Determina cor baseada no score
  const getScoreColor = (score: number): string => {
    if (score >= 70) return 'text-green-400 bg-green-500/10 border-green-500/30';
    if (score >= 40) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    return 'text-red-400 bg-red-500/10 border-red-500/30';
  };

  // Determina cor da barra de progresso
  const getProgressBarColor = (score: number): string => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Formata o AI confidence como porcentagem
  const confidencePercentage = Math.round(aiConfidence * 100);

  // Score item individual
  const ScoreItem: React.FC<{
    label: string;
    score: number;
    description: string;
  }> = ({ label, score, description }) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <span className={cn(
          'text-2xl font-bold tabular-nums',
          score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'
        )}>
          {score}
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-700/30">
        <div
          className={cn(
            'h-full transition-all duration-500',
            getProgressBarColor(score)
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Overall Score - Destaque principal */}
      <div className="relative">
        <div className={cn(
          'rounded-lg border p-4 transition-all',
          getScoreColor(overallScore)
        )}>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-300">Score Geral</p>
              <p className="text-4xl font-bold tabular-nums">
                {overallScore}
              </p>
              <p className="text-xs text-slate-400">
                Combina impacto operacional e estratégico
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className="text-xs border-slate-600 bg-slate-800/50 text-slate-300">
                IA: {confidencePercentage}%
              </Badge>
              {processingTime && processingTime >= 1000 && (
                <span className="text-xs text-slate-500">
                  {(processingTime / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Business e M&A Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-700/50 bg-slate-800/20 p-4">
          <ScoreItem
            label="Score Operacional"
            score={businessScore}
            description="Impacto nas métricas operacionais do negócio"
          />
        </div>

        <div className="rounded-lg border border-slate-700/50 bg-slate-800/20 p-4">
          <ScoreItem
            label="Score Estratégico"
            score={maScore}
            description="Impacto em métricas de valorização (M&A)"
          />
        </div>
      </div>

      {/* Formula explanation */}
      <div className="rounded-lg border border-slate-700/30 bg-slate-800/10 p-3">
        <p className="text-xs text-slate-400 text-center">
          Score Geral = (40% × Operacional) + (60% × Estratégico)
        </p>
      </div>
    </div>
  );
});

InsightScoreDisplay.displayName = 'InsightScoreDisplay';
