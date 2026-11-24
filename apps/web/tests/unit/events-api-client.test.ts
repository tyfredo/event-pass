import { describe, expect, it } from 'vitest'
import { createClientEventsApi, EventsApiError } from '~/services/events-api'
import { ApiRequestError } from '~/utils/apiErrors'
import { mockRequest } from '~/utils/mocks'

const mockClient = <T>(url: string, options?: Parameters<typeof mockRequest>[1]) =>
  mockRequest<T>(url, options ?? {}, null)

describe('tienda de eventos sobre useApi', () => {
  it('funciona con los mocks: lista y filtra por estado', async () => {
    const api = createClientEventsApi(mockClient)
    const all = await api.list()
    const open = await api.list('open')
    expect(all.length).toBeGreaterThan(open.length)
    expect(open.every((event) => event.status === 'open')).toBe(true)
  })

  it('devuelve el detalle de un evento', async () => {
    const api = createClientEventsApi(mockClient)
    expect((await api.getById('evt-vue')).title).toBe('Taller de Vue y Nuxt')
  })

  it('convierte los errores de la API en EventsApiError con el mensaje en español', async () => {
    const api = createClientEventsApi(mockClient)
    await expect(api.getById('no-existe')).rejects.toMatchObject({
      name: 'EventsApiError',
      status: 404,
      code: 'EVENT_NOT_FOUND',
      message: 'El evento no existe.',
    })
  })

  it('conserva el mensaje y los detalles del backend cuando el código no tiene traducción', async () => {
    const failing = async () => {
      throw new ApiRequestError(400, 'CAMPO_RARO', {
        error: { code: 'CAMPO_RARO', message: 'Mensaje del backend', details: [{ field: 'title' }] },
      })
    }
    const error = await createClientEventsApi(failing).create({ title: 'x', capacity: 1, startsAt: '' }).catch((e) => e)
    expect(error).toBeInstanceOf(EventsApiError)
    expect(error).toMatchObject({ message: 'Mensaje del backend', details: [{ field: 'title' }] })
  })
})
