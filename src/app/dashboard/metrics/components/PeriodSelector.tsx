'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { PeriodFilter, PeriodOption } from '../types';

interface PeriodSelectorProps {
  value: PeriodFilter;
  onChange: (value: PeriodFilter) => void;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  { value: '3m', label: 'Últimos 3 meses', months: 3 },
  { value: '6m', label: 'Últimos 6 meses', months: 6 },
  { value: '12m', label: 'Últimos 12 meses', months: 12 },
  { value: 'all', label: 'Todos os períodos', months: null },
];

/**
 * PeriodSelector - Seletor de período para filtrar métricas
 *
 * Permite ao usuário escolher o período de análise:
 * - 3 meses
 * - 6 meses
 * - 12 meses
 * - Todos
 */
export const PeriodSelector: React.FC<PeriodSelectorProps> = ({ value, onChange }) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px] bg-slate-900/50 border-slate-800/50 text-slate-100">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <SelectValue placeholder="Selecione o período" />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-slate-900 border-slate-800">
        <SelectGroup>
          <SelectLabel className="text-slate-400">Período de Análise</SelectLabel>
          {PERIOD_OPTIONS.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="text-slate-100 focus:bg-slate-800 focus:text-slate-100"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
