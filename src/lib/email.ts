import { Resend } from 'resend'
import { db } from '@/lib/db'

// Initialize Resend client only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export interface EmailOptions {
  to: string
  subject: string
  react: React.ReactElement
}

export interface SendEmailParams {
  userId: string
  emailType: 'assigned' | 'deadline' | 'status_change' | 'deleted' | 'digest' | 'report'
  activityId?: string
  to: string
  subject: string
  react: React.ReactElement
}

/**
 * Check if current time is within user's quiet hours
 */
export async function isQuietHours(userId: string): Promise<boolean> {
  try {
    const preferences = await db.notificationPreferences.findUnique({
      where: { userId }
    })

    if (!preferences || !preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false
    }

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    const start = preferences.quietHoursStart
    const end = preferences.quietHoursEnd

    // Handle quiet hours that cross midnight
    if (start > end) {
      return currentTime >= start || currentTime < end
    }

    return currentTime >= start && currentTime < end
  } catch (error) {
    console.error('Error checking quiet hours:', error)
    return false
  }
}

/**
 * Check if user has enabled notifications for a specific type
 */
export async function isNotificationEnabled(userId: string, notificationType: keyof typeof notificationTypeMap): Promise<boolean> {
  try {
    const preferences = await db.notificationPreferences.findUnique({
      where: { userId }
    })

    if (!preferences) {
      // If no preferences exist, create default ones
      await db.notificationPreferences.create({
        data: { userId }
      })
      return true // Default is enabled
    }

    return preferences[notificationType]
  } catch (error) {
    console.error('Error checking notification preferences:', error)
    return true // Default to enabled on error
  }
}

const notificationTypeMap = {
  activityAssigned: 'assigned',
  deadlineApproaching: 'deadline',
  statusChanged: 'status_change',
  activityDeleted: 'deleted',
  dailyDigest: 'digest',
  weeklyReport: 'report'
} as const

/**
 * Send email with logging and error handling
 */
export async function sendEmail({
  userId,
  emailType,
  activityId,
  to,
  subject,
  react
}: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if Resend is configured
    if (!resend) {
      console.warn('RESEND_API_KEY not configured. Email sending disabled.')
      return { success: false, error: 'Email service not configured' }
    }

    // Send email
    const { data, error } = await resend.emails.send({
      from: `${process.env.EMAIL_FROM_NAME || 'Defenz To-Do'} <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`,
      to: [to],
      subject,
      react
    })

    // Log the email
    await db.emailLog.create({
      data: {
        userId,
        emailType,
        activityId,
        sentTo: to,
        subject,
        status: error ? 'failed' : 'sent',
        error: error ? JSON.stringify(error) : null
      }
    })

    if (error) {
      console.error('Failed to send email:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error sending email:', error)

    // Log failed attempt
    try {
      await db.emailLog.create({
        data: {
          userId,
          emailType,
          activityId,
          sentTo: to,
          subject,
          status: 'failed',
          error: error.message
        }
      })
    } catch (logError) {
      console.error('Error logging failed email:', logError)
    }

    return { success: false, error: error.message }
  }
}

/**
 * Send email with all checks (quiet hours, preferences, etc.)
 */
export async function sendEmailWithChecks(
  params: SendEmailParams,
  notificationType: keyof typeof notificationTypeMap
): Promise<{ success: boolean; error?: string; skipped?: string }> {
  // Check if quiet hours
  const quietHours = await isQuietHours(params.userId)
  if (quietHours) {
    return { success: false, skipped: 'Quiet hours' }
  }

  // Check if notification is enabled
  const enabled = await isNotificationEnabled(params.userId, notificationType)
  if (!enabled) {
    return { success: false, skipped: 'Notification disabled by user' }
  }

  // Send the email
  return await sendEmail(params)
}

/**
 * Get user's notification preferences or create defaults
 */
export async function getOrCreatePreferences(userId: string) {
  let preferences = await db.notificationPreferences.findUnique({
    where: { userId }
  })

  if (!preferences) {
    preferences = await db.notificationPreferences.create({
      data: { userId }
    })
  }

  return preferences
}
