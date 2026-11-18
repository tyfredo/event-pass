import { email, z } from 'zod';

export const registerSchema = z.object({
    name: z.string().trim().min(2, 'El nombre es muy corto'),
    email: z.string().trim().toLowerCase().email('Email inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    role: z.enum(['attendee', 'organizer']),
    origanizerCode: z.string().optional()
});

export type RegisterInput = z.infer<typeof registerSchema>;