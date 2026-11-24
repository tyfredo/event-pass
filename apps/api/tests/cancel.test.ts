import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  docs: new Map<string, Record<string, unknown> | undefined>(),
  updates: [] as Array<{ path: string; data: Record<string, unknown> }>,
}))

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { increment: (value: number) => ({ increment: value }) },
}))

vi.mock('../src/config/firebase.js', () => {
  const doc = (collection: string) => (id: string) => ({ path: `${collection}/${id}`, id })
  const collection = (name: string) => ({ doc: doc(name) })
  return {
    db: {
      collection,
      runTransaction: async (handler: (tx: unknown) => Promise<unknown>) =>
        handler({
          get: async (ref: { path: string; id: string }) => {
            const data = state.docs.get(ref.path)
            return { id: ref.id, exists: data !== undefined, data: () => data }
          },
          update: (ref: { path: string }, data: Record<string, unknown>) => {
            state.updates.push({ path: ref.path, data })
          },
          set: vi.fn(),
        }),
    },
  }
})

import { checkCanCancel } from '../src/modules/registrations/registration.rules.js'
import { registrationService } from '../src/modules/registrations/registration.service.js'

const active = {
  eventId: 'evt-1',
  attendeeId: 'uid-ana',
  attendeeName: 'Ana',
  attendeeEmail: 'ana@x.com',
  eventTitle: 'Taller',
  folio: 'EVP-2026-AAAAAA',
  status: 'active',
  createdAt: '2026-01-01T00:00:00.000Z',
}

describe('checkCanCancel', () => {
  it('permite cancelar una inscripción activa propia', () => {
    expect(() => checkCanCancel({ attendeeId: 'uid-ana', status: 'active' }, 'uid-ana')).not.toThrow()
  })

  it('404 si la inscripción no existe', () => {
    expect(() => checkCanCancel(null, 'uid-ana')).toThrow(
      expect.objectContaining({ statusCode: 404, code: 'REGISTRATION_NOT_FOUND' }),
    )
  })

  it('403 si la inscripción es de otro asistente', () => {
    expect(() => checkCanCancel({ attendeeId: 'uid-ana', status: 'active' }, 'uid-beto')).toThrow(
      expect.objectContaining({ statusCode: 403, code: 'NOT_REGISTRATION_OWNER' }),
    )
  })

  it('409 si ya estaba cancelada', () => {
    expect(() => checkCanCancel({ attendeeId: 'uid-ana', status: 'cancelled' }, 'uid-ana')).toThrow(
      expect.objectContaining({ statusCode: 409, code: 'ALREADY_CANCELLED' }),
    )
  })
})

describe('registrationService.cancel', () => {
  beforeEach(() => {
    state.docs.clear()
    state.updates = []
  })

  it('pasa la inscripción a cancelled y libera un lugar del evento', async () => {
    state.docs.set('registrations/evt-1_uid-ana', { ...active })
    state.docs.set('events/evt-1', { registeredCount: 3 })

    const result = await registrationService.cancel('evt-1_uid-ana', 'uid-ana')

    expect(result).toMatchObject({ id: 'evt-1_uid-ana', status: 'cancelled', folio: 'EVP-2026-AAAAAA' })
    expect(state.updates).toEqual([
      { path: 'registrations/evt-1_uid-ana', data: { status: 'cancelled', cancelledAt: expect.any(String) } },
      { path: 'events/evt-1', data: { registeredCount: { increment: -1 } } },
    ])
  })

  it('no toca nada si otro asistente intenta cancelar', async () => {
    state.docs.set('registrations/evt-1_uid-ana', { ...active })
    state.docs.set('events/evt-1', { registeredCount: 3 })

    await expect(registrationService.cancel('evt-1_uid-ana', 'uid-beto')).rejects.toMatchObject({ statusCode: 403 })
    expect(state.updates).toEqual([])
  })

  it('no baja el contador por debajo de cero', async () => {
    state.docs.set('registrations/evt-1_uid-ana', { ...active })
    state.docs.set('events/evt-1', { registeredCount: 0 })

    await registrationService.cancel('evt-1_uid-ana', 'uid-ana')

    expect(state.updates).toHaveLength(1)
  })
})
