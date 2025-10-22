'use client';

import { useQuery } from '@tanstack/react-query';
import {
  FinancialMetricsResponse,
  CustomerMetricsResponse,
  EngagementMetricsResponse,
  ProductHealthMetricsResponse,
  SalesMetricsResponse,
  MetricsQueryParams,
  PeriodFilter
} from './types';

/**
 * Hook para buscar métricas financeiras
 *
 * Busca dados de ARR, EBITDA, MRR, Growth, Rule of 40
 */
export function useFinancialMetrics(params?: MetricsQueryParams) {
  return useQuery<FinancialMetricsResponse>({
    queryKey: ['financial-metrics', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.startDate) searchParams.set('startDate', params.startDate);
      if (params?.endDate) searchParams.set('endDate', params.endDate);
      if (params?.version) searchParams.set('version', params.version.toString());

      const url = `/api/metrics/financial${searchParams.toString() ? `?${searchParams}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Falha ao buscar métricas financeiras');
      }

      return response.json();
    },
    refetchInterval: 5 * 60 * 1000, // Auto-refresh a cada 5 minutos
    staleTime: 2 * 60 * 1000, // Cache válido por 2 minutos
  });
}

/**
 * Hook para buscar métricas de clientes
 *
 * Busca dados de Churn, LTV:CAC, NRR, ARPU
 */
export function useCustomerMetrics(params?: MetricsQueryParams) {
  return useQuery<CustomerMetricsResponse>({
    queryKey: ['customer-metrics', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.startDate) searchParams.set('startDate', params.startDate);
      if (params?.endDate) searchParams.set('endDate', params.endDate);
      if (params?.version) searchParams.set('version', params.version.toString());

      const url = `/api/metrics/customer${searchParams.toString() ? `?${searchParams}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Falha ao buscar métricas de clientes');
      }

      return response.json();
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook para buscar métricas de engajamento
 *
 * Busca dados de DAU/MAU, Retention, Activation
 */
export function useEngagementMetrics(params?: MetricsQueryParams) {
  return useQuery<EngagementMetricsResponse>({
    queryKey: ['engagement-metrics', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.startDate) searchParams.set('startDate', params.startDate);
      if (params?.endDate) searchParams.set('endDate', params.endDate);
      if (params?.version) searchParams.set('version', params.version.toString());

      const url = `/api/metrics/engagement${searchParams.toString() ? `?${searchParams}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Falha ao buscar métricas de engajamento');
      }

      return response.json();
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook para buscar métricas de product health
 *
 * Busca dados de NPS, CSAT, Uptime, Bugs
 */
export function useProductHealthMetrics(params?: MetricsQueryParams) {
  return useQuery<ProductHealthMetricsResponse>({
    queryKey: ['product-health-metrics', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.startDate) searchParams.set('startDate', params.startDate);
      if (params?.endDate) searchParams.set('endDate', params.endDate);
      if (params?.version) searchParams.set('version', params.version.toString());

      const url = `/api/metrics/product-health${searchParams.toString() ? `?${searchParams}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Falha ao buscar métricas de product health');
      }

      return response.json();
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook para buscar métricas de vendas
 *
 * Busca dados de CAC, Pipeline, Conversion, Win Rate
 */
export function useSalesMetrics(params?: MetricsQueryParams) {
  return useQuery<SalesMetricsResponse>({
    queryKey: ['sales-metrics', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.startDate) searchParams.set('startDate', params.startDate);
      if (params?.endDate) searchParams.set('endDate', params.endDate);
      if (params?.version) searchParams.set('version', params.version.toString());

      const url = `/api/metrics/sales${searchParams.toString() ? `?${searchParams}` : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Falha ao buscar métricas de vendas');
      }

      return response.json();
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook agregador - busca todas as métricas em paralelo
 *
 * Útil para dashboard principal que precisa de todos os dados
 */
export function useAllMetrics(params?: MetricsQueryParams) {
  const financial = useFinancialMetrics(params);
  const customer = useCustomerMetrics(params);
  const engagement = useEngagementMetrics(params);
  const productHealth = useProductHealthMetrics(params);
  const sales = useSalesMetrics(params);

  return {
    financial,
    customer,
    engagement,
    productHealth,
    sales,
    isLoading:
      financial.isLoading ||
      customer.isLoading ||
      engagement.isLoading ||
      productHealth.isLoading ||
      sales.isLoading,
    isError:
      financial.isError ||
      customer.isError ||
      engagement.isError ||
      productHealth.isError ||
      sales.isError,
    error:
      financial.error ||
      customer.error ||
      engagement.error ||
      productHealth.error ||
      sales.error,
  };
}

/**
 * Utility: converte PeriodFilter em query params
 */
export function periodFilterToParams(period: PeriodFilter): MetricsQueryParams {
  const now = new Date();
  const params: MetricsQueryParams = {};

  switch (period) {
    case '3m':
      params.limit = 3;
      break;
    case '6m':
      params.limit = 6;
      break;
    case '12m':
      params.limit = 12;
      break;
    case 'all':
      params.limit = 100; // Limite alto para pegar todos
      break;
  }

  return params;
}
