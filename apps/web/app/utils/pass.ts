import type { Pass } from '~/types/pass'

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