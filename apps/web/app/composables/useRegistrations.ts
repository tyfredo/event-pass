import type { Registration } from '~/types/registration'

interface RegistrationResponse {
  data: Registration
}

interface RegistrationsResponse {
  data: Registration[]
}

const messages: Record<string, string> = {
  EVENT_NOT_FOUND: 'El evento no existe.',
  EVENT_CLOSED: 'El evento está cerrado y no acepta inscripciones.',
  EVENT_FULL: 'El evento ya no tiene lugares disponibles.',
  ALREADY_REGISTERED: 'Ya estás inscrito en este evento.',
  NOT_EVENT_OWNER: 'Solo el organizador del evento puede ver sus inscritos.',
  Unauthorized: 'Debes iniciar sesión.',
  'Invalid or expired token': 'Tu sesión expiró, vuelve a iniciar sesión.',
  Forbidden: 'Tu rol no tiene permiso para esta acción.',
}

export const getErrorMessage = (error: any) =>
  messages[error?.data?.message] ?? 'No se pudo completar la operación.'

export const useRegistrations = () => {
  const api = useApi()

  const register = async (eventId: string) => {
    const response = await api<RegistrationResponse>('/registrations', {
      method: 'POST',
      body: { eventId },
    })
    return response.data
  }

  const listMine = async () => {
    const response = await api<RegistrationsResponse>('/registrations/me')
    return response.data
  }

  const listByEvent = async (eventId: string) => {
    const response = await api<RegistrationsResponse>(`/events/${eventId}/registrations`)
    return response.data
  }

  return { register, listMine, listByEvent }
}
