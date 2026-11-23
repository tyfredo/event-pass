import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ findReg: vi.fn(), findEvent: vi.fn() }))

vi.mock('../src/modules/registrations/registration.repository.js', () => ({
    registrationRepository: { findById: mocks.findReg },
}))
vi.mock('../src/modules/events/events.repository.js', () => ({
    eventsRepository: { findById: mocks.findEvent },
}))

import { assertOwner } from '../src/modules/registrations/registration.rules.js'
import { registrationService } from '../src/modules/registrations/registration.service.js'

const registration = {
    id: 'evt-1_uid-ana',
    eventId: 'evt-1',
    attendeeId: 'uid-ana',
    attendeeName: 'Ana',
    attendeeEmail: 'ana@x.com',
    eventTitle: 'Taller',
    folio: 'EVP-2026-AAAAAA',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
}
const event = {
    id: 'evt-1',
    title: 'Taller',
    startsAt: '2026-12-01T10:00:00.000Z',
    location: 'Lab 3',
}

describe('assertOwner', () => {
    it('permite al dueño', () => {
        expect(() => assertOwner(registration, 'uid-ana')).not.toThrow()
    })

    it('rechaza a otro usuario con 403', () => {
        let error: unknown
        try {
            assertOwner(registration, 'uid-beto')
        } catch (e) {
            error = e
        }
        expect(error).toMatchObject({ statusCode: 403, code: 'NOT_REGISTRATION_OWNER' })
    })
})

describe('registrationService.getPass', () => {
    beforeEach(() => vi.clearAllMocks())

    it('devuelve el pase con la forma que espera el frontend', async () => {
        mocks.findReg.mockResolvedValue(registration)
        mocks.findEvent.mockResolvedValue(event)

        const pass = await registrationService.getPass('evt-1_uid-ana', 'uid-ana')

        expect(pass).toEqual({
            id: 'evt-1_uid-ana',
            folio: 'EVP-2026-AAAAAA',
            status: 'active',
            eventId: 'evt-1',
            eventTitle: 'Taller',
            eventStartsAt: '2026-12-01T10:00:00.000Z',
            eventLocation: 'Lab 3',
            attendeeName: 'Ana',
        })
    })

    it('404 si la inscripción no existe', async () => {
        mocks.findReg.mockResolvedValue(null)
        await expect(registrationService.getPass('x', 'uid-ana')).rejects.toMatchObject({
            statusCode: 404,
            code: 'REGISTRATION_NOT_FOUND',
        })
    })

    it('403 si es de otro usuario, sin consultar el evento', async () => {
        mocks.findReg.mockResolvedValue(registration)
        await expect(registrationService.getPass('evt-1_uid-ana', 'uid-beto')).rejects.toMatchObject({
            statusCode: 403,
        })
        expect(mocks.findEvent).not.toHaveBeenCalled()
    })
})