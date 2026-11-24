import { AppError } from '../../shared/errors.js'
import { registrationRepository } from './registration.repository.js'
import { eventsRepository, EventsRepository } from '../events/events.repository.js'
import { assertOwner } from './registration.rules.js'
import type { Pass } from './registration.types.js'

export const registrationService = {
  create(eventId: string, attendeeId: string) {
    return registrationRepository.create(eventId, attendeeId)
  },

  listMine(attendeeId: string) {
    return registrationRepository.listByAttendee(attendeeId)
  },

  cancel(id: string, attendeeId: string) {
    return registrationRepository.cancel(id, attendeeId)
  },

  async listByEvent(eventId: string, organizerId: string) {
    const ownerId = await registrationRepository.findEventOrganizer(eventId)
    if (!ownerId) throw new Error('EVENT_NOT_FOUND')
    if (ownerId !== organizerId) throw new Error('NOT_EVENT_OWNER')

    return registrationRepository.listByEvent(eventId)
  },
  async getPass(id: string, uid: string): Promise<Pass> {
    const registration = await registrationRepository.findById(id)
    if (!registration) {
      throw new AppError(404, 'REGISTRATION_NOT_FOUND', 'La inscripción no exite')
    }
    assertOwner(registration, uid)

    const event = await eventsRepository.findById(registration.eventId)
    if (!event) {
      throw new AppError(404, 'EVENT_NOT_FOUND', 'El evento de esta inscripción ya no existe')
    }

    return {
      id: registration.id,
      folio: registration.folio,
      status: registration.status,
      eventId: event.id,
      eventTitle: event.title,
      eventStartsAt: event.startsAt,
      eventLocation: event.location,
      attendeeName: registration.attendeeName,
    }
  }
}
