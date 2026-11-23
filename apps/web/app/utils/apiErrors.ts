import type { ApiErrorBody } from '~/types'

const apiErrorMessages: Record<string, string> = {
  VALIDATION_ERROR: 'Revisa los datos del formulario.',
  'Validation error': 'Revisa los datos del formulario.',
  EMAIL_TAKEN: 'Ese correo ya está registrado.',
  INVALID_ORGANIZER_CODE: 'El código de organizador no es válido.',
  USER_NOT_FOUND: 'No se encontró tu perfil.',
  UNAUTHENTICATED: 'Debes iniciar sesión.',
  Unauthorized: 'Debes iniciar sesión.',
  UNAUTHORIZED: 'Debes iniciar sesión.',
  INVALID_TOKEN: 'Tu sesión expiró, vuelve a iniciar sesión.',
  'Invalid or expired token': 'Tu sesión expiró, vuelve a iniciar sesión.',
  FORBIDDEN: 'Tu rol no tiene permiso para esta acción.',
  Forbidden: 'Tu rol no tiene permiso para esta acción.',
  EVENT_NOT_FOUND: 'El evento no existe.',
  EVENT_CLOSED: 'El evento está cerrado y no acepta inscripciones.',
  EVENT_FULL: 'El evento ya no tiene lugares disponibles.',
  ALREADY_REGISTERED: 'Ya estás inscrito en este evento.',
  NOT_EVENT_OWNER: 'Solo el organizador del evento puede hacer esto.',
  REGISTRATION_NOT_FOUND: 'La inscripción no existe.',
  NOT_REGISTRATION_OWNER: 'Solo puedes cancelar tus propias inscripciones.',
  CAPACITY_BELOW_REGISTERED: 'El aforo no puede ser menor que el número de inscritos.',
  INVALID_CAPACITY: 'El aforo no puede ser menor que el número de inscritos.',
  INVALID_JSON: 'El cuerpo de la petición no es un JSON válido.',
  PAYLOAD_TOO_LARGE: 'El cuerpo de la petición es demasiado grande.',
  NOT_FOUND: 'El recurso solicitado no existe.',
  'Route not found': 'El recurso solicitado no existe.',
  INTERNAL_SERVER_ERROR: 'Ocurrió un error en el servidor, intenta más tarde.',
  'Internal server error': 'Ocurrió un error en el servidor, intenta más tarde.',
  NETWORK_ERROR: 'No se pudo conectar con el servidor.',
}

const fallbackMessage = 'No se pudo completar la operación.'

export class ApiRequestError extends Error {
  readonly statusCode: number
  readonly code: string
  readonly data: ApiErrorBody

  constructor(statusCode: number, code: string, data?: ApiErrorBody) {
    super(apiErrorMessages[code] ?? fallbackMessage)
    this.name = 'ApiRequestError'
    this.statusCode = statusCode
    this.code = code
    this.data = data ?? { message: code }
  }
}

export function translateApiError(code: string | undefined): string {
  return (code && apiErrorMessages[code]) || fallbackMessage
}

export function toApiRequestError(error: unknown): ApiRequestError {
  if (error instanceof ApiRequestError) {
    return error
  }

  const fetchError = error as {
    statusCode?: number
    data?: ApiErrorBody
  } | null

  const statusCode = fetchError?.statusCode ?? 0
  const code =
    fetchError?.data?.error?.code ??
    fetchError?.data?.message ??
    (statusCode === 0 ? 'NETWORK_ERROR' : '')

  return new ApiRequestError(statusCode, code, fetchError?.data)
}
