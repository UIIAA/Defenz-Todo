import * as React from 'react'

interface ReminderEmailProps {
  demandaTitle: string
  demandaDescription: string | null
  assignee: string | null
  appUrl: string
}

export function ReminderEmail({ demandaTitle, demandaDescription, assignee, appUrl }: ReminderEmailProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 480, margin: '0 auto', padding: 24 }}>
      <div style={{ borderBottom: '3px solid #2563eb', paddingBottom: 16, marginBottom: 24 }}>
        <h1 style={{ color: '#1e293b', fontSize: 20, margin: 0 }}>
          Lembrete de Demanda
        </h1>
      </div>
      <div style={{ background: '#f8fafc', borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <h2 style={{ color: '#1e293b', fontSize: 18, margin: '0 0 8px 0' }}>
          {demandaTitle}
        </h2>
        {demandaDescription && (
          <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 12px 0', lineHeight: 1.5 }}>
            {demandaDescription.slice(0, 200)}
            {demandaDescription.length > 200 ? '...' : ''}
          </p>
        )}
        {assignee && (
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            Responsavel: <strong style={{ color: '#334155' }}>{assignee}</strong>
          </p>
        )}
      </div>
      <a
        href={`${appUrl}/dashboard/demandas`}
        style={{
          display: 'inline-block',
          background: '#2563eb',
          color: '#ffffff',
          padding: '10px 24px',
          borderRadius: 6,
          textDecoration: 'none',
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Abrir no Defenz
      </a>
      <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 32 }}>
        Este email foi enviado automaticamente pelo Defenz To-Do.
      </p>
    </div>
  )
}
