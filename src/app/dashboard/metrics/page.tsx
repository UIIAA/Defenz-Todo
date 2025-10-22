'use client';

import React, { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  DollarSign,
  TrendingUp,
  Users,
  Target,
  Award,
  AlertCircle,
  BarChart3,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// Componentes
import { MetricCard } from './components/MetricCard';
import { PeriodSelector } from './components/PeriodSelector';
import { ArrGrowthChart } from './components/ArrGrowthChart';
import { MrrBreakdownChart } from './components/MrrBreakdownChart';
import { CustomerGrowthChart } from './components/CustomerGrowthChart';
import { ChurnTrendChart } from './components/ChurnTrendChart';
import { EbitdaMarginChart } from './components/EbitdaMarginChart';

// Hooks e tipos
import { useAllMetrics, periodFilterToParams } from './hooks';
import { PeriodFilter } from './types';

// Query client para React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * MetricsDashboard - Dashboard principal de métricas para investidores
 *
 * Exibe todas as métricas críticas para avaliação M&A:
 * - Financial: ARR, EBITDA, MRR, Rule of 40
 * - Customer: Churn, LTV:CAC, NRR, ARPU
 * - Engagement: DAU/MAU, Retention
 * - Product Health: NPS, CSAT, Uptime
 * - Sales: CAC, Pipeline, Win Rate
 */
function MetricsDashboardContent() {
  const [period, setPeriod] = useState<PeriodFilter>('12m');

  // Buscar todas as métricas em paralelo
  const queryParams = useMemo(() => periodFilterToParams(period), [period]);
  const { financial, customer, engagement, productHealth, sales, isLoading, isError, error } =
    useAllMetrics(queryParams);

  // Handler para refresh manual
  const handleRefresh = () => {
    financial.refetch();
    customer.refetch();
    engagement.refetch();
    productHealth.refetch();
    sales.refetch();
  };

  // Calcular métricas derivadas dos dados mais recentes
  const latestFinancial = financial.data?.data[0];
  const latestCustomer = customer.data?.data[0];
  const latestEngagement = engagement.data?.data[0];
  const latestProductHealth = productHealth.data?.data[0];
  const latestSales = sales.data?.data[0];

  // Calcular variações (comparar com período anterior)
  const calculateChange = (current: number, previous: number): number => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const arrChange = latestFinancial && financial.data?.data[1]
    ? calculateChange(Number(latestFinancial.arr), Number(financial.data.data[1].arr))
    : 0;

  const churnChange = latestCustomer && customer.data?.data[1]
    ? calculateChange(
        Number(latestCustomer.customerChurnRate),
        Number(customer.data.data[1].customerChurnRate)
      )
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="space-y-6 p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-green-400" />
              Dashboard de Métricas para Investidores
            </h1>
            <p className="text-slate-400 mt-2">
              Métricas estratégicas para avaliação M&A - Defenz 2 anos
            </p>
          </div>
          <div className="flex items-center gap-3">
            <PeriodSelector value={period} onChange={setPeriod} />
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="bg-slate-900/50 border-slate-800/50 text-slate-100 hover:bg-slate-800/50"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Error State */}
        {isError && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-700/50">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao carregar métricas</AlertTitle>
            <AlertDescription>
              {error?.message || 'Ocorreu um erro ao buscar os dados. Tente novamente.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State - Nenhum dado ainda */}
        {!isLoading && !isError && financial.data?.data.length === 0 && (
          <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
            <CardContent className="py-12">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-300 mb-2">
                  Nenhuma métrica cadastrada ainda
                </h3>
                <p className="text-slate-500 mb-6 max-w-md mx-auto">
                  Comece adicionando métricas financeiras, de clientes e de produto para
                  visualizar o dashboard de investidores.
                </p>
                <Button className="bg-green-600 hover:bg-green-700">
                  Adicionar Primeira Métrica
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hero Section - Key Metrics Cards */}
        {(isLoading || (financial.data?.data && financial.data.data.length > 0)) && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* ARR */}
              <MetricCard
                title="ARR (Annual Recurring Revenue)"
                value={latestFinancial?.arr || 0}
                format="currency"
                change={arrChange}
                changeLabel="vs mês anterior"
                icon={<DollarSign className="h-5 w-5 text-green-400" />}
                tooltip="ARR é a receita recorrente anualizada. Para M&A, indica previsibilidade de receita."
                loading={isLoading}
                className="bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-700/30"
              />

              {/* EBITDA Margin */}
              <MetricCard
                title="EBITDA Margin"
                value={latestFinancial?.ebitdaMargin || 0}
                format="percentage"
                target={20}
                targetLabel="(target M&A)"
                icon={<TrendingUp className="h-5 w-5 text-purple-400" />}
                tooltip="Margem EBITDA > 20% indica eficiência operacional, fator crítico para M&A."
                loading={isLoading}
                className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-700/30"
              />

              {/* Customer Churn Rate */}
              <MetricCard
                title="Customer Churn Rate"
                value={latestCustomer?.customerChurnRate || 0}
                format="percentage"
                change={-churnChange} // Invertido: redução de churn é positiva
                changeLabel="vs mês anterior"
                target={5}
                targetLabel="(target < 5%)"
                icon={<Users className="h-5 w-5 text-red-400" />}
                tooltip="Churn < 5% mensalmente indica alta retenção e satisfação de clientes."
                loading={isLoading}
                className="bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-700/30"
              />

              {/* LTV:CAC Ratio */}
              <MetricCard
                title="LTV:CAC Ratio"
                value={latestCustomer?.ltvCacRatio || 0}
                format="number"
                target={3}
                targetLabel="(target > 3.0)"
                icon={<Target className="h-5 w-5 text-blue-400" />}
                tooltip="LTV:CAC > 3.0 indica eficiência na aquisição de clientes. Ideal: > 4.0."
                loading={isLoading}
                className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-700/30"
              />

              {/* Rule of 40 */}
              <MetricCard
                title="Rule of 40 Score"
                value={latestFinancial?.ruleOf40Score || 0}
                format="percentage"
                target={40}
                targetLabel="(target > 40%)"
                icon={<Award className="h-5 w-5 text-yellow-400" />}
                tooltip="Rule of 40 (crescimento % + EBITDA margin %) > 40% indica SaaS saudável."
                loading={isLoading}
                className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border-yellow-700/30"
              />

              {/* Net Revenue Retention */}
              <MetricCard
                title="Net Revenue Retention (NRR)"
                value={latestCustomer?.netRevenueRetention || 0}
                format="percentage"
                target={100}
                targetLabel="(target > 100%)"
                icon={<Zap className="h-5 w-5 text-cyan-400" />}
                tooltip="NRR > 100% indica expansão de receita na base existente (upsell/cross-sell)."
                loading={isLoading}
                className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 border-cyan-700/30"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ARR Growth Over Time */}
              <ArrGrowthChart data={financial.data?.data || []} loading={financial.isLoading} />

              {/* MRR Breakdown */}
              <MrrBreakdownChart data={financial.data?.data || []} loading={financial.isLoading} />

              {/* Customer Growth */}
              <CustomerGrowthChart data={customer.data?.data || []} loading={customer.isLoading} />

              {/* Churn Trend */}
              <ChurnTrendChart data={customer.data?.data || []} loading={customer.isLoading} />
            </div>

            {/* EBITDA Margin - Full Width */}
            <div className="grid grid-cols-1">
              <EbitdaMarginChart data={financial.data?.data || []} loading={financial.isLoading} />
            </div>

            {/* Performance Indicators */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* CAC Payback Period */}
              <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-slate-300">
                    CAC Payback Period
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Tempo para recuperar custo de aquisição
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-slate-100">
                        {(latestCustomer?.cacPaybackMonths ?? 0).toFixed(1)} meses
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Target: &lt; 12 meses (ideal: 6-9 meses)
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Burn Rate & Runway */}
              <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-slate-300">
                    Burn Rate & Runway
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Queima de caixa e meses de sobrevivência
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs text-slate-400">Burn Rate:</span>
                          <p className="text-lg font-bold text-red-400">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                              minimumFractionDigits: 0,
                            }).format(latestFinancial?.burnRate || 0)}
                            /mês
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-slate-400">Runway:</span>
                          <p className="text-lg font-bold text-green-400">
                            {(latestFinancial?.runway ?? 0).toFixed(0)} meses
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* NPS Score */}
              <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-slate-300">NPS Score</CardTitle>
                  <CardDescription className="text-slate-400">
                    Net Promoter Score (satisfação do cliente)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-slate-100">
                        {latestProductHealth?.npsScore || 0}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Excelente: &gt; 50 | Bom: 30-50 | Ok: 0-30
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Investor Insights */}
            <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-700/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <Award className="h-5 w-5 text-blue-400" />
                  Insights para Investidores
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Análise automática das métricas para avaliação M&A
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Growth Insight */}
                  <div className="p-4 bg-green-900/20 rounded-lg border border-green-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <h4 className="font-medium text-green-300">Crescimento</h4>
                    </div>
                    <p className="text-sm text-slate-400">
                      {latestFinancial && Number(latestFinancial.arrGrowthRate) > 30
                        ? 'Crescimento excepcional! ARR crescendo > 30% MoM.'
                        : latestFinancial && Number(latestFinancial.arrGrowthRate) > 15
                        ? 'Crescimento saudável. ARR crescendo consistentemente.'
                        : 'Oportunidade de acelerar crescimento.'}
                    </p>
                  </div>

                  {/* Efficiency Insight */}
                  <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-4 w-4 text-purple-400" />
                      <h4 className="font-medium text-purple-300">Eficiência</h4>
                    </div>
                    <p className="text-sm text-slate-400">
                      {latestFinancial && Number(latestFinancial.ebitdaMargin) >= 20
                        ? 'Margem EBITDA excelente (> 20%). Empresa eficiente.'
                        : 'Foco em otimização operacional para melhorar margem.'}
                    </p>
                  </div>

                  {/* Retention Insight */}
                  <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-400" />
                      <h4 className="font-medium text-blue-300">Retenção</h4>
                    </div>
                    <p className="text-sm text-slate-400">
                      {latestCustomer && Number(latestCustomer.customerChurnRate) < 5
                        ? 'Churn excelente (< 5%). Alta satisfação de clientes.'
                        : 'Priorizar estratégias de retenção e sucesso do cliente.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Página principal com provider do React Query
 */
export default function MetricsDashboardPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <MetricsDashboardContent />
    </QueryClientProvider>
  );
}
