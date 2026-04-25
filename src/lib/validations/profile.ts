import { z } from 'zod'

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  notificationEmail: z.string().email().nullable().optional(),
  emailEnabled: z.boolean().optional(),
  activityAssigned: z.boolean().optional(),
  deadlineApproaching: z.boolean().optional(),
  statusChanged: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
})
