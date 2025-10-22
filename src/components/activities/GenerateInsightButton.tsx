import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface GenerateInsightButtonProps {
  activityId: string;
  hasExistingInsight?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

/**
 * GenerateInsightButton - Botão para gerar insights via IA
 *
 * Dispara análise da atividade via Google Gemini AI.
 * Gerencia estados de loading, error e success com feedback visual.
 * Rate limit: 10 requisições por minuto.
 */
export const GenerateInsightButton: React.FC<GenerateInsightButtonProps> = ({
  activityId,
  hasExistingInsight = false,
  onSuccess,
  onError,
  variant = 'default',
  size = 'default',
  className
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setIsSuccess(false);

    try {
      const response = await fetch(`/api/activities/${activityId}/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Tratamento de erros específicos
        if (response.status === 429) {
          toast.error('Limite de requisições atingido. Aguarde 1 minuto e tente novamente.', {
            description: 'Rate limit: 10 análises por minuto'
          });
          throw new Error('Rate limit exceeded');
        }

        if (response.status === 404) {
          toast.error('Atividade não encontrada');
          throw new Error('Activity not found');
        }

        if (response.status === 500) {
          const errorData = await response.json().catch(() => ({}));
          toast.error('Erro ao processar análise de IA', {
            description: errorData.error || 'Erro interno do servidor'
          });
          throw new Error(errorData.error || 'Internal server error');
        }

        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Feedback de sucesso
      setIsSuccess(true);
      toast.success('Análise de IA concluída com sucesso!', {
        description: `Score geral: ${data.businessScore + data.maScore} • Confiança: ${Math.round(data.aiConfidence * 100)}%`,
        icon: <Sparkles className="size-4 text-blue-500" />
      });

      // Callback de sucesso
      if (onSuccess) {
        onSuccess();
      }

      // Reset success state após 3 segundos
      setTimeout(() => setIsSuccess(false), 3000);

    } catch (error) {
      console.error('Error generating insight:', error);

      // Callback de erro
      if (onError) {
        onError(error as Error);
      }

      // Se não foi um erro já tratado, mostrar mensagem genérica
      if (!(error instanceof Error && error.message.includes('Rate limit'))) {
        if (!toast.error.length) { // Evitar toast duplicado
          toast.error('Erro ao gerar análise de IA');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [activityId, onSuccess, onError]);

  // Estado do botão
  const isDisabled = isLoading || (hasExistingInsight && !isLoading);

  return (
    <Button
      onClick={handleGenerate}
      disabled={isDisabled}
      variant={variant}
      size={size}
      className={cn(
        'transition-all',
        isSuccess && 'bg-green-600 hover:bg-green-700 border-green-500',
        className
      )}
      aria-label={hasExistingInsight ? 'Análise já existe' : 'Gerar análise de IA'}
    >
      {/* Ícone dinâmico */}
      {isLoading && <Loader2 className="size-4 animate-spin" />}
      {isSuccess && <CheckCircle2 className="size-4" />}
      {!isLoading && !isSuccess && (
        hasExistingInsight ? (
          <AlertCircle className="size-4" />
        ) : (
          <Sparkles className="size-4" />
        )
      )}

      {/* Texto do botão */}
      <span>
        {isLoading && 'Analisando...'}
        {isSuccess && 'Análise Concluída!'}
        {!isLoading && !isSuccess && (
          hasExistingInsight ? 'Análise Existente' : 'Gerar Análise IA'
        )}
      </span>
    </Button>
  );
};

GenerateInsightButton.displayName = 'GenerateInsightButton';
