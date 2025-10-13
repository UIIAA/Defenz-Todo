import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface BaseEmailProps {
  preview: string
  children: React.ReactNode
}

export default function BaseEmail({ preview, children }: BaseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <div style={logoContainer}>
              <div style={logo}>
                <Text style={logoText}>🛡️ Defenz</Text>
              </div>
            </div>
          </Section>

          {/* Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Defenz To-Do. All rights reserved.
            </Text>
            <Text style={footerText}>
              <Link href={`${process.env.NEXTAUTH_URL}/dashboard/settings/notifications`} style={footerLink}>
                Manage notification preferences
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#0f172a',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#1e293b',
  margin: '0 auto',
  padding: '20px 0',
  marginBottom: '64px',
  maxWidth: '600px',
}

const header = {
  backgroundColor: '#0f172a',
  padding: '20px',
  borderBottom: '2px solid #3b82f6',
}

const logoContainer = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}

const logo = {
  display: 'inline-block',
}

const logoText = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#60a5fa',
  margin: '0',
}

const content = {
  padding: '32px',
}

const footer = {
  backgroundColor: '#0f172a',
  padding: '20px',
  borderTop: '1px solid #334155',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '4px 0',
}

const footerLink = {
  color: '#60a5fa',
  textDecoration: 'underline',
}
