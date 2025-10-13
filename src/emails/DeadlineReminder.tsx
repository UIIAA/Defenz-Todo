import { Heading, Text, Section, Button, Hr } from '@react-email/components'
import * as React from 'react'
import BaseEmail from './layouts/BaseEmail'

interface DeadlineReminderProps {
  activityTitle: string
  area: string
  priority: 'Alta' | 'Média' | 'Baixa'
  deadline: string
  hoursUntilDeadline: number
  activityUrl: string
}

export default function DeadlineReminder({
  activityTitle,
  area,
  priority,
  deadline,
  hoursUntilDeadline,
  activityUrl
}: DeadlineReminderProps) {
  const priorityColor = priority === 'Alta' ? '#ef4444' : priority === 'Média' ? '#f59e0b' : '#3b82f6'
  const isUrgent = hoursUntilDeadline <= 24

  return (
    <BaseEmail preview={`⏰ Lembrete: ${activityTitle} vence em breve`}>
      <Section style={urgentBanner}>
        <Text style={urgentText}>⚠️ PRAZO PRÓXIMO</Text>
      </Section>

      <Heading style={h1}>⏰ Lembrete de Prazo</Heading>

      <Text style={text}>
        A atividade <strong>{activityTitle}</strong> tem prazo se aproximando!
      </Text>

      <Section style={deadlineCard}>
        <Text style={deadlineTime}>
          {isUrgent ? (
            <>Vence em <strong style={{ color: '#ef4444' }}>{hoursUntilDeadline} horas</strong></>
          ) : (
            <>Vence em breve</>
          )}
        </Text>
        <Text style={deadlineDate}>Prazo: {deadline}</Text>
      </Section>

      <Section style={activityCard}>
        <Text style={activityTitle}>{activityTitle}</Text>

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
        </Section>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href={activityUrl}>
          Atualizar Atividade
        </Button>
      </Section>

      <Text style={footer}>
        Não deixe para a última hora! Acesse agora e atualize o status.
      </Text>
    </BaseEmail>
  )
}

const urgentBanner = {
  backgroundColor: '#7f1d1d',
  border: '2px solid #ef4444',
  borderRadius: '8px',
  padding: '12px',
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const urgentText = {
  color: '#fca5a5',
  fontSize: '14px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0',
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

const deadlineCard = {
  backgroundColor: '#1e1b4b',
  border: '2px solid #6366f1',
  borderRadius: '8px',
  padding: '24px',
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const deadlineTime = {
  color: '#f1f5f9',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
}

const deadlineDate = {
  color: '#94a3b8',
  fontSize: '16px',
  margin: '0',
}

const activityCard = {
  backgroundColor: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '24px',
}

const activityTitle = {
  color: '#f1f5f9',
  fontSize: '20px',
  fontWeight: 'bold',
  marginTop: '0',
  marginBottom: '12px',
}

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
  backgroundColor: '#f59e0b',
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
