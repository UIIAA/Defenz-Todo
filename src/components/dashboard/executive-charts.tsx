"use client"

import React from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Legend, FunnelChart as ReFunnelChart, Funnel, LabelList
} from 'recharts';

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// --- Componente: FunnelChart ---
interface FunnelData {
    name: string;
    value: number;
    fill: string;
}

export function ConversionFunnelChart({ data }: { data: FunnelData[] }) {
    if (!data || data.length === 0) return <div className="text-gray-500 text-center py-10">Sem dados para exibir</div>;

    // Encontrar o valor máximo para calcular larguras relativas
    const maxValue = data[0]?.value || 1;

    return (
        <div className="space-y-3">
            {data.map((item) => (
                <div key={item.name} className="relative">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="font-bold text-foreground">{item.value}</span>
                    </div>
                    <div className="h-8 bg-muted rounded-lg overflow-hidden">
                        <div
                            className="h-full rounded-lg transition-all duration-500 flex items-center justify-end px-2"
                            style={{
                                width: `${Math.max((item.value / maxValue) * 100, 5)}%`, // Mínimo de 5% para visibilidade
                                backgroundColor: item.fill
                            }}
                        >
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- Componente: PipelineStageChart ---
interface PipelineData {
    name: string; // Estágio
    value: number; // Valor Total
    count: number; // Quantidade
}

export function PipelineStageChart({ data }: { data: PipelineData[] }) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" tickFormatter={(val) => `R$${val / 1000}k`} />
                <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 11, fill: 'var(--foreground)' }}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--popover-foreground)' }}
                    formatter={(value: number, name: string) => [
                        name === 'value' ? formatCurrency(value) : value,
                        name === 'value' ? 'Valor Total' : 'Quantidade'
                    ]}
                    cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                    itemStyle={{ color: 'var(--popover-foreground)' }}
                    labelStyle={{ color: 'var(--popover-foreground)' }}
                />
                <Bar
                    dataKey="value"
                    fill="var(--primary)"
                    radius={[0, 4, 4, 0]}
                    barSize={32}
                />
            </BarChart>
        </ResponsiveContainer>
    );
}

// --- Componente: ListsActivityChart ---
interface ListActivityData {
    nome: string;
    ligacoes: number;
    emails: number;
    reunioes: number;
}

export function ListsActivityChart({ data }: { data: ListActivityData[] }) {
    // Ajustar nomes muito longos
    const formattedData = data.map(d => ({
        ...d,
        displayName: d.nome.length > 15 ? d.nome.substring(0, 15) + '...' : d.nome
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                    dataKey="displayName"
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 10, fill: 'var(--foreground)' }}
                    interval={0}
                />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                    contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--popover-foreground)' }}
                    itemStyle={{ color: 'var(--popover-foreground)' }}
                    labelStyle={{ color: 'var(--popover-foreground)' }}
                    cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="ligacoes" name="Ligações" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="emails" name="Emails" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
