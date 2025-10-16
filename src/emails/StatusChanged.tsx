import { Heading, Text, Section, Button, Hr } from '@react-email/components'
import * as React from 'react'
import BaseEmail from './layouts/BaseEmail'

interface StatusChangedProps {
  activityTitle: string
  area: string
  oldStatus: 'Pendente' | 'Em Andamento' | 'Concluído'
  newStatus: 'Pendente' | 'Em Andamento' | 'Concluído'
  changedBy: string
  activityUrl: string
}

export default function StatusChanged({
  activityTitle,
  area,
  oldStatus,
  newStatus,
  changedBy,
  activityUrl
}: StatusChangedProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído':
        return '#10b981'
      case 'Em Andamento':
        return '#3b82f6'
      case 'Pendente':
      default:
        return '#64748b'
    }
  }

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'Concluído':
        return '✅'
      case 'Em Andamento':
        return '⏳'
      case 'Pendente':
      default:
        return '📋'
    }
  }

  const oldStatusColor = getStatusColor(oldStatus)
  const newStatusColor = getStatusColor(newStatus)

  return (
    <BaseEmail preview={`Status atualizado: ${activityTitle}`}>
      <Heading style={h1}>📊 Status Atualizado</Heading>

      <Text style={text}>
        O status da atividade <strong>{activityTitle}</strong> foi alterado por <strong>{changedBy}</strong>.
      </Text>

      <Section style={statusChangeCard}>
        <div style={statusRow}>
          <div style={statusBox}>
            <Text style={statusLabel}>Status Anterior</Text>
            <Text style={{ ...statusValue, color: oldStatusColor }}>
              {getStatusEmoji(oldStatus)} {oldStatus}
            </Text>
          </div>

          <div style={arrowContainer}>
            <Text style={arrow}>→</Text>
          </div>

          <div style={statusBox}>
            <Text style={statusLabel}>Novo Status</Text>
            <Text style={{ ...statusValue, color: newStatusColor }}>
              {getStatusEmoji(newStatus)} {newStatus}
            </Text>
          </div>
        </div>
      </Section>

      <Section style={activityCard}>
        <Text style={activityTitleStyle}>{activityTitle}</Text>

        <Hr style={hr} />

        <div style={detailItem}>
          <Text style={detailLabel}>Área:</Text>
          <Text style={detailValue}>{area}</Text>
        </div>
      </Section>

      {newStatus === 'Concluído' && (
        <Section style={congratsBox}>
          <Text style={congratsText}>
            🎉 Parabéns por concluir esta atividade!
          </Text>
        </Section>
      )}

      <Section style={buttonContainer}>
        <Button style={button} href={activityUrl}>
          Ver Detalhes
        </Button>
      </Section>

      <Text style={footer}>
        Continue acompanhando o progresso no dashboard.
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

const statusChangeCard = {
  backgroundColor: '#1e293b',
  border: '2px solid #3b82f6',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '24px',
}

const statusRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '16px',
}

const statusBox = {
  flex: 1,
  textAlign: 'center' as const,
}

const arrowContainer = {
  flex: '0 0 auto',
}

const arrow = {
  color: '#60a5fa',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0',
}

const statusLabel = {
  color: '#94a3b8',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  marginBottom: '8px',
}

const statusValue = {
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
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

const hr = {
  borderColor: '#334155',
  margin: '16px 0',
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

const congratsBox = {
  backgroundColor: '#064e3b',
  border: '2px solid #10b981',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const congratsText = {
  color: '#6ee7b7',
  fontSize: '16px',
  fontWeight: 'bold',
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
