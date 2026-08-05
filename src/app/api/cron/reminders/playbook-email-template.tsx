import * as React from 'react'

interface PlaybookReviewEmailProps {
  playbookTitle: string
  ownerName: string | null
  appUrl: string
  playbookId: string
}

/** E-mail de frescor: avisa o dono de que o POP passou da data de revisão. */
export function PlaybookReviewEmail({
  playbookTitle,
  ownerName,
  appUrl,
  playbookId,
}: PlaybookReviewEmailProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 480, margin: '0 auto', padding: 24 }}>
      <div style={{ borderBottom: '3px solid #2563eb', paddingBottom: 16, marginBottom: 24 }}>
        <h1 style={{ color: '#1e293b', fontSize: 20, margin: 0 }}>Revisar procedimento</h1>
      </div>

      <p style={{ color: '#1e293b', fontSize: 14, lineHeight: 1.6, margin: '0 0 16px 0' }}>
        {ownerName ? `Olá, ${ownerName}.` : 'Olá.'} Este POP passou da data de revisão e
        está marcado como <strong>precisa revisão</strong> no Portal Defenz.
      </p>

      <div style={{ background: '#f8fafc', borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <h2 style={{ color: '#1e293b', fontSize: 18, margin: 0 }}>{playbookTitle}</h2>
      </div>

      <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: '0 0 20px 0' }}>
        Confira se o procedimento ainda está correto e clique em Verificar. Enquanto
        não for verificado, quem consultar vê o aviso de conteúdo desatualizado.
      </p>

      <a
        href={`${appUrl}/dashboard/portal/pops/${playbookId}`}
        style={{
          display: 'inline-block',
          background: '#2563eb',
          color: '#ffffff',
          textDecoration: 'none',
          padding: '10px 20px',
          borderRadius: 6,
          fontSize: 14,
        }}
      >
        Abrir no Portal Defenz
      </a>
    </div>
  )
}
