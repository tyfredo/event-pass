import { z } from 'zod'

export const createRegistrationSchema = z.object({
  eventId: z.string().trim().min(1),
})
