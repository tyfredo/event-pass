import type { EventItem } from '~/types/events'
import type { Pass } from '~/types/pass'
import type { Registration } from '~/types/registration'

/**
 * URL que se guarda dentro del QR: la página pública del pase, con el id del evento
 * para que esa página pueda consultar y mostrar sus datos.
 */
export function buildPassUrl(baseUrl: string, pass: Pick<Pass, 'folio' | 'eventId'>): string {
  const origin = baseUrl.replace(/\/+$/, '')
  return `${origin}/pass/${encodeURIComponent(pass.folio)}?event=${encodeURIComponent(pass.eventId)}`
}

/** Fecha legible en español (zona horaria del navegador). */
export function formatEventDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Fecha por confirmar'
  return new Intl.DateTimeFormat('es-MX', { dateStyle: 'full', timeStyle: 'short' }).format(date)
}

/**
 * Convierte una inscripción real (y los datos de su evento) en el pase que dibuja PassTicket.
 * Si todavía no se tiene el evento, se usa el título de la inscripción y fecha/lugar quedan por confirmar.
 * Si la inscripción llega sin nombre, se usa `fallbackName` (el de la sesión).
 */
export function toPass(
  registration: Registration,
  event?: Pick<EventItem, 'title' | 'startsAt' | 'location'>,
  fallbackName = '',
): Pass {
  return {
    id: registration.id,
    folio: registration.folio,
    status: registration.status,
    eventId: registration.eventId,
    eventTitle: event?.title ?? registration.eventTitle,
    eventStartsAt: event?.startsAt ?? '',
    eventLocation: event?.location || 'Por definir',
    attendeeName: registration.attendeeName || fallbackName,
  }
}