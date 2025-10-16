import { Heading, Text, Section, Button, Hr } from '@react-email/components'
import * as React from 'react'
import BaseEmail from './layouts/BaseEmail'

interface ActivityAssignedProps {
  activityTitle: string
  activityDescription?: string
  area: string
  priority: 'Alta' | 'Média' | 'Baixa'
  deadline?: string
  location?: string
  assignedBy: string
  activityUrl: string
}

export default function ActivityAssigned({
  activityTitle,
  activityDescription,
  area,
  priority,
  deadline,
  location,
  assignedBy,
  activityUrl
}: ActivityAssignedProps) {
  const priorityColor = priority === 'Alta' ? '#ef4444' : priority === 'Média' ? '#f59e0b' : '#3b82f6'

  return (
    <BaseEmail preview={`Nova atividade atribuída: ${activityTitle}`}>
      <Heading style={h1}>🎯 Nova Atividade Atribuída</Heading>

      <Text style={text}>
        Olá! Você foi atribuído(a) a uma nova atividade por <strong>{assignedBy}</strong>.
      </Text>

      <Section style={activityCard}>
        <Text style={activityTitleStyle}>{activityTitle}</Text>

        {activityDescription && (
          <Text style={descriptionStyle}>{activityDescription}</Text>
        )}

        <Hr style={hr} />

        <Section style={detailsGrid}>
          <div style={detailItem}>
            <Text style={detailLabel}>Área:</Text>
            <Text style={detailValue}>{area}</Text>
          </div>

          <div style={detailItem}>
            <Text style={detailLabel}>Prioridade:</Text>
            <Text style={{ ...detailValue, color: priorityColor, fontWeight: 'bold' }}>{priority}</Text>
          </div>

          {deadline && (
            <div style={detailItem}>
              <Text style={detailLabel}>Prazo:</Text>
              <Text style={detailValue}>{deadline}</Text>
            </div>
          )}

          {location && (
            <div style={detailItem}>
              <Text style={detailLabel}>Local:</Text>
              <Text style={detailValue}>{location}</Text>
            </div>
          )}
        </Section>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={activityUrl}>
          Ver Atividade
        </Button>
      </Section>

      <Text style={footer}>
        Acesse o dashboard para mais detalhes e atualizações.
      </Text>
    </BaseEmail>
  )
}

const h1 = {
  color: '#e2e8f0',
  fontSize: '28px',
  fontWeight: 'bold',
  marginTop: '0',
  marginBottom: '16px',
}

const text = {
  color: '#cbd5e1',
  fontSize: '16px',
  lineHeight: '24px',
  marginBottom: '24px',
}

const activityCard = {
  backgroundColor: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '24px',
}

const activityTitleStyle = {
  color: '#f1f5f9',
  fontSize: '20px',
  fontWeight: 'bold',
  marginTop: '0',
  marginBottom: '12px',
} as const

const descriptionStyle = {
  color: '#94a3b8',
  fontSize: '14px',
  lineHeight: '20px',
  marginBottom: '16px',
} as const

const hr = {
  borderColor: '#334155',
  margin: '16px 0',
}

const detailsGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
}

const detailItem = {
  marginBottom: '8px',
}

const detailLabel = {
  color: '#64748b',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px 0',
}

const detailValue = {
  color: '#e2e8f0',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '24px',
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
}

const footer = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '20px',
  textAlign: 'center' as const,
}
