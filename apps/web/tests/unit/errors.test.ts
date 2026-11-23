import { describe, expect, it } from 'vitest'
import { ApiRequestError, toApiRequestError, translateApiError } from '~/utils/apiErrors'
import { authErrorMessage, translateFirebaseError } from '~/utils/firebaseErrors'
import { homeForRole, safeRedirect } from '~/utils/roleHome'

describe('errores de la API', () => {
  it('traduce un error con el formato { message: CODIGO }', () => {
    const error = toApiRequestError({ statusCode: 409, data: { message: 'EVENT_FULL' } })
    expect(error).toBeInstanceOf(ApiRequestError)
    expect(error.statusCode).toBe(409)
    expect(error.code).toBe('EVENT_FULL')
    expect(error.message).toBe('El evento ya no tiene lugares disponibles.')
    expect(error.data).toEqual({ message: 'EVENT_FULL' })
  })

  it('traduce un error con el formato { error: { code: CODIGO } }', () => {
    const error = toApiRequestError({ statusCode: 400, data: { error: { code: 'INVALID_CAPACITY' } } })
    expect(error).toBeInstanceOf(ApiRequestError)
    expect(error.statusCode).toBe(400)
    expect(error.code).toBe('INVALID_CAPACITY')
    expect(error.message).toBe('El aforo no puede ser menor que el número de inscritos.')
  })

  it('traduce errores nuevos de la API como UNAUTHORIZED, INVALID_JSON y NOT_FOUND', () => {
    expect(translateApiError('UNAUTHORIZED')).toBe('Debes iniciar sesión.')
    expect(translateApiError('INVALID_JSON')).toBe('El cuerpo de la petición no es un JSON válido.')
    expect(translateApiError('NOT_FOUND')).toBe('El recurso solicitado no existe.')
  })

  it('reconoce cuando no hay conexión con el servidor', () => {
    expect(toApiRequestError(new TypeError('fetch failed')).message).toBe('No se pudo conectar con el servidor.')
  })

  it('usa un mensaje genérico para códigos desconocidos', () => {
    expect(translateApiError('ALGO_RARO')).toBe('No se pudo completar la operación.')
  })
})

describe('errores de Firebase Auth', () => {
  it('traduce las credenciales inválidas', () => {
    expect(translateFirebaseError('auth/invalid-credential')).toBe('Correo o contraseña incorrectos.')
  })

  it('traduce el bloqueo por demasiados intentos', () => {
    expect(authErrorMessage({ code: 'auth/too-many-requests' })).toBe(
      'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
    )
  })

  it('prioriza el mensaje de la API cuando el error viene de ahí', () => {
    expect(authErrorMessage(new ApiRequestError(403, 'INVALID_ORGANIZER_CODE'))).toBe(
      'El código de organizador no es válido.',
    )
  })
})

describe('rutas por rol', () => {
  it('lleva a cada rol a su inicio', () => {
    expect(homeForRole('attendee')).toBe('/events')
    expect(homeForRole('organizer')).toBe('/organizer/events')
    expect(homeForRole(null)).toBe('/login')
  })

  it('solo acepta redirecciones internas', () => {
    expect(safeRedirect('/my-registrations')).toBe('/my-registrations')
    expect(safeRedirect('https://otro-sitio.com')).toBeNull()
    expect(safeRedirect('//otro-sitio.com')).toBeNull()
    expect(safeRedirect('/login')).toBeNull()
    expect(safeRedirect(undefined)).toBeNull()
  })
})
