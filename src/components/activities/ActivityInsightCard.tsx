'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  DollarSign,
  Briefcase,
  AlertCircle,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ActivityInsight } from '@/types/activity-insight';
import { MetricConnectionBadge } from './MetricConnectionBadge';
import { InsightScoreDisplay } from './InsightScoreDisplay';
import { GenerateInsightButton } from './GenerateInsightButton';

interface ActivityInsightCardProps {
  activityId: string;
  className?: string;
}

/**
 * ActivityInsightCard - Componente principal para exibir insights de IA
 *
 * Carrega e exibe análise completa da atividade:
 * - Scores (business, M&A, overall)
 * - Conexões com Business Metrics
 * - Conexões com M&A Metrics
 * - Metadata da análise
 *
 * Gerencia estados: loading, error, empty, success
 */
export const ActivityInsightCard: React.FC<ActivityInsightCardProps> = ({ activityId, className }) => {
  const [insight, setInsight] = useState<ActivityInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBusinessExpanded, setIsBusinessExpanded] = useState(false);
  const [isMaExpanded, setIsMaExpanded] = useState(false);

  // Fetch insight data
  const fetchInsight = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/activities/${activityId}/insights`);

      if (response.status === 404) {
        // Sem insight ainda - estado vazio normal
        setInsight(null);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setInsight(data);
    } catch (err) {
      console.error('Error fetching insight:', err);
      setError('Erro ao carregar análise de IA');
      toast.error('Erro ao carregar análise de IA');
    } finally {
      setIsLoading(false);
    }
  }, [activityId]);

  // Delete insight
  const handleDelete = useCallback(async () => {
    if (!insight) return;

    if (!confirm('Deseja remover esta análise de IA?')) {
      return;
    }

    try {
      const response = await fetch(`/api/activities/${activityId}/insights`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      toast.success('Análise removida com sucesso');
      setInsight(null);
    } catch (err) {
      console.error('Error deleting insight:', err);
      toast.error('Erro ao remover análise');
    }
  }, [activityId, insight]);

  // Calcular overall score (40% business + 60% M&A)
  const calculateOverallScore = useCallback((businessScore: number, maScore: number): number => {
    return Math.round(businessScore * 0.4 + maScore * 0.6);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchInsight();
  }, [fetchInsight]);

  // Loading state
  if (isLoading) {
    return (
      <Card className={cn('bg-muted/50 border-border', className)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <Skeleton className="h-6 w-48" />
          </div>
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('bg-muted/50 border-destructive/30', className)}>
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="size-12 text-destructive" />
            <p className="text-destructive font-medium">{error}</p>
            <Button
              onClick={fetchInsight}
              variant="outline"
              size="sm"
              className="border-border"
            >
              <RefreshCw className="size-4" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state (sem insight)
  if (!insight) {
    return (
      <Card className={cn('bg-muted/50 border-border', className)}>
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Sparkles className="size-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Análise de IA Não Disponível
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Gere uma análise inteligente para descobrir como esta atividade impacta
                métricas operacionais e estratégicas do seu negócio.
              </p>
            </div>
            <GenerateInsightButton
              activityId={activityId}
              onSuccess={fetchInsight}
              size="lg"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state (com insight)
  const overallScore = calculateOverallScore(insight.businessScore, insight.maScore);

  return (
    <Card className={cn('bg-muted/50 border-border', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              <CardTitle className="text-xl text-foreground">Análise de IA</CardTitle>
              <Badge
                variant="outline"
                className={cn(
                  'ml-2',
                  overallScore >= 70
                    ? 'border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400'
                    : overallScore >= 40
                      ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                      : 'border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400'
                )}
              >
                {overallScore}/100
              </Badge>
            </div>
            <CardDescription className="text-muted-foreground">
              Análise gerada por Google Gemini AI
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={fetchInsight}
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              aria-label="Recarregar análise"
            >
              <RefreshCw className="size-4" />
            </Button>
            <Button
              onClick={handleDelete}
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              aria-label="Remover análise"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Scores Display */}
        <InsightScoreDisplay
          businessScore={insight.businessScore}
          maScore={insight.maScore}
          overallScore={overallScore}
          aiConfidence={insight.aiConfidence}
          processingTime={insight.processingTime}
        />

        {/* Business Metrics Section */}
        {insight.businessIndicators && insight.businessIndicators.length > 0 && (
          <Collapsible open={isBusinessExpanded} onOpenChange={setIsBusinessExpanded}>
            <div className="space-y-3">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 h-auto hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-500/10 p-2">
                      <TrendingUp className="size-5 text-indigo-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">
                        Métricas Operacionais
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {insight.businessIndicators.length} indicador{insight.businessIndicators.length > 1 ? 'es' : ''} identificado{insight.businessIndicators.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {isBusinessExpanded ? (
                    <ChevronUp className="size-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-5 text-muted-foreground" />
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {insight.businessIndicators.map((indicator, index) => (
                    <MetricConnectionBadge
                      key={`business-${index}`}
                      metric={indicator}
                      type="business"
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}

        {/* M&A Metrics Section */}
        {insight.maMetrics && insight.maMetrics.length > 0 && (
          <Collapsible open={isMaExpanded} onOpenChange={setIsMaExpanded}>
            <div className="space-y-3">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 h-auto hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-500/10 p-2">
                      <DollarSign className="size-5 text-green-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">
                        Métricas Estratégicas (M&A)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {insight.maMetrics.length} métrica{insight.maMetrics.length > 1 ? 's' : ''} de valorização
                      </p>
                    </div>
                  </div>
                  {isMaExpanded ? (
                    <ChevronUp className="size-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="size-5 text-muted-foreground" />
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {insight.maMetrics.map((metric, index) => (
                    <MetricConnectionBadge
                      key={`ma-${index}`}
                      metric={metric}
                      type="ma"
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )}

        {/* AI Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border">
          <div className="flex items-center gap-4">
            <span>Modelo: {insight.aiModel}</span>
            <span>•</span>
            <span>Versão: {insight.analysisVersion}</span>
          </div>
          <span>
            {new Date(insight.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

ActivityInsightCard.displayName = 'ActivityInsightCard';
