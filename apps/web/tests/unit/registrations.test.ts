import { describe, expect, it } from 'vitest'
import { getErrorMessage, passPath } from '~/composables/useRegistrations'
import { ApiRequestError } from '~/utils/apiErrors'
import { mockRequest, mockTokenFor } from '~/utils/mocks'
import type { Pass } from '~/types/pass'

const laura = mockTokenFor('att-laura')
const diego = mockTokenFor('att-diego')
const ana = mockTokenFor('org-ana')

async function requestPass(id: string, token: string | null) {
  return mockRequest<{ data: Pass }>(`/registrations/${encodeURIComponent(id)}`, {}, token)
}

async function codeOf(promise: Promise<unknown>) {
  try {
    await promise
  } catch (error) {
    return [(error as ApiRequestError).statusCode, (error as ApiRequestError).code]
  }
  return 'no falló'
}

describe('getErrorMessage', () => {
  it('traduce el formato nuevo { error: { code } }', () => {
    expect(getErrorMessage({ statusCode: 403, data: { error: { code: 'NOT_REGISTRATION_OWNER' } } })).toBe(
      'Esta inscripción no te pertenece.',
    )
  })

  it('sigue entendiendo el formato { message: CODIGO }', () => {
    expect(getErrorMessage({ statusCode: 409, data: { message: 'EVENT_FULL' } })).toBe(
      'El evento ya no tiene lugares disponibles.',
    )
  })

  it('usa el error original cuando useAsyncData lo envuelve en cause', () => {
    const wrapped = { message: 'Fetch failed', cause: new ApiRequestError(404, 'REGISTRATION_NOT_FOUND') }
    expect(getErrorMessage(wrapped)).toBe('La inscripción no existe.')
  })
})

describe('passPath', () => {
  it('arma la ruta del pase con el id de la inscripción', () => {
    expect(passPath('evt-vue_att-laura')).toBe('/registrations/evt-vue_att-laura/pass')
  })
})

describe('GET /registrations/:id en modo mock', () => {
  it('devuelve el pase con los datos del evento a su dueña', async () => {
    const { data } = await requestPass('evt-vue_att-laura', laura)
    expect(data).toMatchObject({
      id: 'evt-vue_att-laura',
      folio: 'EVP-2026-A1B2C3',
      status: 'active',
      eventId: 'evt-vue',
      eventTitle: 'Taller de Vue y Nuxt',
      eventLocation: 'Auditorio A',
      attendeeName: 'Laura Pérez',
    })
    expect(data.eventStartsAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('responde 403 si otro asistente pide el pase', async () => {
    expect(await codeOf(requestPass('evt-vue_att-laura', diego))).toEqual([403, 'NOT_REGISTRATION_OWNER'])
  })

  it('responde 404 si la inscripción no existe', async () => {
    expect(await codeOf(requestPass('no-existe', laura))).toEqual([404, 'REGISTRATION_NOT_FOUND'])
  })

  it('responde 403 a un organizador y 401 sin sesión', async () => {
    expect(await codeOf(requestPass('evt-vue_att-laura', ana))).toEqual([403, 'Forbidden'])
    expect(await codeOf(requestPass('evt-vue_att-laura', null))).toEqual([401, 'Unauthorized'])
  })
})

describe('PATCH /registrations/:id/cancel en modo mock', () => {
  const cancelUrl = (id: string) => `/registrations/${encodeURIComponent(id)}/cancel`

  it('rechaza con 403 si otro asistente intenta cancelar', async () => {
    expect(await codeOf(mockRequest(cancelUrl('evt-firebase_att-diego'), { method: 'PATCH' }, laura))).toEqual([
      403,
      'NOT_REGISTRATION_OWNER',
    ])
  })

  it('cancela, libera el lugar y no deja cancelar dos veces', async () => {
    const before = await mockRequest<{ data: { availableSeats: number } }>('/events/evt-firebase', {}, null)
    const { data } = await mockRequest<{ data: { status: string } }>(
      cancelUrl('evt-firebase_att-diego'),
      { method: 'PATCH' },
      diego,
    )
    const after = await mockRequest<{ data: { availableSeats: number } }>('/events/evt-firebase', {}, null)

    expect(data.status).toBe('cancelled')
    expect(after.data.availableSeats).toBe(before.data.availableSeats + 1)
    expect(await codeOf(mockRequest(cancelUrl('evt-firebase_att-diego'), { method: 'PATCH' }, diego))).toEqual([
      409,
      'ALREADY_CANCELLED',
    ])
  })
})
