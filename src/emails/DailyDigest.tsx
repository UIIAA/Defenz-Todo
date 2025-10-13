import { Heading, Text, Section, Button, Hr } from '@react-email/components'
import * as React from 'react'
import BaseEmail from './layouts/BaseEmail'

interface Activity {
  id: string
  title: string
  area: string
  priority: 'Alta' | 'Média' | 'Baixa'
  deadline?: string
}

interface DailyDigestProps {
  userName: string
  totalPending: number
  totalInProgress: number
  totalCompleted: number
  highPriorityActivities: Activity[]
  upcomingDeadlines: Activity[]
  dashboardUrl: string
}

export default function DailyDigest({
  userName,
  totalPending,
  totalInProgress,
  totalCompleted,
  highPriorityActivities,
  upcomingDeadlines,
  dashboardUrl
}: DailyDigestProps) {
  return (
    <BaseEmail preview={`Resumo Diário - ${totalPending + totalInProgress} atividades ativas`}>
      <Heading style={h1}>☀️ Bom dia, {userName}!</Heading>

      <Text style={text}>
        Aqui está o resumo das suas atividades para hoje.
      </Text>

      {/* Statistics Cards */}
      <Section style={statsContainer}>
        <div style={statCard}>
          <Text style={statNumber}>{totalPending}</Text>
          <Text style={statLabel}>Pendentes</Text>
        </div>
        <div style={statCard}>
          <Text style={statNumber}>{totalInProgress}</Text>
          <Text style={statLabel}>Em Andamento</Text>
        </div>
        <div style={statCard}>
          <Text style={statNumber}>{totalCompleted}</Text>
          <Text style={statLabel}>Concluídas</Text>
        </div>
      </Section>

      {/* High Priority Activities */}
      {highPriorityActivities.length > 0 && (
        <>
          <Section style={sectionHeader}>
            <Text style={sectionTitle}>🔥 Atividades de Alta Prioridade</Text>
          </Section>

          {highPriorityActivities.map((activity) => (
            <Section key={activity.id} style={activityItem}>
              <Text style={activityTitle}>{activity.title}</Text>
              <div style={activityMeta}>
                <Text style={metaText}>📁 {activity.area}</Text>
                {activity.deadline && (
                  <Text style={metaText}>📅 {activity.deadline}</Text>
                )}
              </div>
            </Section>
          ))}

          <Hr style={hr} />
        </>
      )}

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <>
          <Section style={sectionHeader}>
            <Text style={sectionTitle}>⏰ Prazos Próximos</Text>
          </Section>

          {upcomingDeadlines.map((activity) => (
            <Section key={activity.id} style={activityItem}>
              <Text style={activityTitle}>{activity.title}</Text>
              <div style={activityMeta}>
                <Text style={metaText}>📁 {activity.area}</Text>
                {activity.deadline && (
                  <Text style={{ ...metaText, color: '#f59e0b', fontWeight: 'bold' }}>
                    ⚠️ {activity.deadline}
                  </Text>
                )}
              </div>
            </Section>
          ))}

          <Hr style={hr} />
        </>
      )}

      {/* CTA */}
      <Section style={buttonContainer}>
        <Button style={button} href={dashboardUrl}>
          Ir para o Dashboard
        </Button>
      </Section>

      <Text style={footer}>
        Tenha um dia produtivo! 🚀
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

const statsContainer = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: '12px',
  marginBottom: '32px',
}

const statCard = {
  backgroundColor: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
}

const statNumber = {
  color: '#60a5fa',
  fontSize: '32px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
}

const statLabel = {
  color: '#94a3b8',
  fontSize: '12px',
  textTransform: 'uppercase' as const,
  margin: '0',
}

const sectionHeader = {
  marginBottom: '16px',
}

const sectionTitle = {
  color: '#f1f5f9',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
}

const activityItem = {
  backgroundColor: '#0f172a',
  border: '1px solid #334155',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '12px',
}

const activityTitle = {
  color: '#e2e8f0',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 8px 0',
}

const activityMeta = {
  display: 'flex',
  gap: '16px',
}

const metaText = {
  color: '#94a3b8',
  fontSize: '12px',
  margin: '0',
}

const hr = {
  borderColor: '#334155',
  margin: '24px 0',
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
