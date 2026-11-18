import { z } from 'zod';

export const EVENT_STATUSES = ['open', 'closed'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

/** Tope razonable para evitar aforos absurdos (1e12) o desbordes numéricos. */
export const MAX_CAPACITY = 100_000;

export interface EventEntity {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  location: string;
  capacity: number;
  registeredCount: number;
  status: EventStatus;
  startsAt: string; // ISO 8601
  createdAt: string;
  updatedAt: string;
}

export interface EventDTO extends EventEntity {
  availableSeats: number;
}


const textField = (label: string) =>
  z.string({
    error: (issue) =>
      issue.input === undefined ? `${label} es obligatorio.` : `${label} debe ser texto.`,
  });

const titleSchema = textField('El título')
  .trim()
  .min(3, 'El título debe tener al menos 3 caracteres.')
  .max(120, 'El título no puede exceder 120 caracteres.');

const descriptionSchema = textField('La descripción')
  .trim()
  .max(2000, 'La descripción no puede exceder 2000 caracteres.');

const locationSchema = textField('La ubicación')
  .trim()
  .max(200, 'La ubicación no puede exceder 200 caracteres.');

const capacitySchema = z
  .number({
    error: (issue) =>
      issue.input === undefined
        ? 'El aforo (capacity) es obligatorio.'
        : 'El aforo debe ser un número.',
  })
  .int('El aforo debe ser un número entero.')
  .positive('El aforo debe ser mayor a 0.')
  .max(MAX_CAPACITY, `El aforo no puede exceder ${MAX_CAPACITY} lugares.`);

// ISO 8601 estricto (antes `Date.parse` aceptaba "December 25, 2030" o "2030").
const futureDateSchema = z
  .iso.datetime({
    offset: true,
    error: (issue) =>
      issue.input === undefined
        ? 'La fecha de inicio (startsAt) es obligatoria.'
        : 'La fecha startsAt debe tener formato ISO 8601 (ej. 2026-12-01T15:00:00.000Z).',
  })
  .refine((val) => new Date(val).getTime() > Date.now(), {
    message: 'La fecha startsAt debe ser una fecha futura.',
  })
  .transform((val) => new Date(val).toISOString());

const statusSchema = z.enum(EVENT_STATUSES, {
  error: (issue) =>
    issue.input === undefined
      ? 'El campo status es obligatorio.'
      : "El campo status debe ser 'open' o 'closed'.",
});

export const createEventSchema = z.object({
  title: titleSchema,
  description: descriptionSchema.default(''),
  location: locationSchema.default('Por definir'),
  capacity: capacitySchema,
  startsAt: futureDateSchema,
});

export const updateEventSchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    location: locationSchema.optional(),
    capacity: capacitySchema.optional(),
    startsAt: futureDateSchema.optional(),
    status: statusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar.',
  });

export const updateEventStatusSchema = z.object({ status: statusSchema });

export const listEventsQuerySchema = z.object({
  status: statusSchema.optional(),
});

export const eventIdParamSchema = z.object({
  id: z.string().min(1, 'El ID del evento es obligatorio.').max(100),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
export type UpdateEventStatusInput = z.infer<typeof updateEventStatusSchema>;
