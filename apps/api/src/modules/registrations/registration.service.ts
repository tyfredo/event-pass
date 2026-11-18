import { registrationRepository } from './registration.repository.js'

export const registrationService = {
  create(eventId: string, attendeeId: string) {
    return registrationRepository.create(eventId, attendeeId)
  },

  listMine(attendeeId: string) {
    return registrationRepository.listByAttendee(attendeeId)
  },

  async listByEvent(eventId: string, organizerId: string) {
    const ownerId = await registrationRepository.findEventOrganizer(eventId)
    if (!ownerId) throw new Error('EVENT_NOT_FOUND')
    if (ownerId !== organizerId) throw new Error('NOT_EVENT_OWNER')

    return registrationRepository.listByEvent(eventId)
  },
}
