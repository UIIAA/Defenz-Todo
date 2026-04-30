export const validDemanda = {
  title: 'Proposta cliente X',
  description: 'Detalhe da demanda',
  origin: 'fernando' as const,
  status: 'solicitada' as const,
  priority: 'alta' as const,
  assignee: 'Marcos',
  dateIn: '2025-01-15',
  deadline: '2025-02-15',
  dateDone: null,
}

export const minimalDemanda = {
  title: 'Demanda minima',
}

export const savedDemanda = {
  id: 'dem-001',
  ...validDemanda,
  dateIn: new Date('2025-01-15'),
  deadline: new Date('2025-02-15'),
  dateDone: null,
  userId: 'user-test-123',
  assignedToId: null as string | null,
  companyId: 'company-defenz',
  teamId: 'team-geral',
  createdAt: new Date('2025-01-15'),
  updatedAt: new Date('2025-01-15'),
}

export const demandaList = [
  savedDemanda,
  {
    ...savedDemanda,
    id: 'dem-002',
    title: 'Revisao contrato ABC',
    status: 'em_andamento',
    priority: 'media',
    origin: 'securisoft',
  },
  {
    ...savedDemanda,
    id: 'dem-003',
    title: 'Dashboard metricas',
    status: 'concluida',
    dateDone: new Date('2025-02-01'),
  },
]
