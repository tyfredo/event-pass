import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../../config/firebase.js'
import { checkCanRegister, generateFolio } from './registration.rules.js'
import type { EventForRegistration, Registration } from './registration.types.js'

const registrations = db.collection('registrations')
const events = db.collection('events')
const users = db.collection('users')

export const registrationRepository = {
  // El ID {eventId}_{attendeeId} impide inscribirse dos veces al mismo evento.
  async create(eventId: string, attendeeId: string): Promise<Registration> {
    return db.runTransaction(async transaction => {
      const registrationRef = registrations.doc(`${eventId}_${attendeeId}`)
      const eventRef = events.doc(eventId)

      const [eventDoc, userDoc, registrationDoc] = await Promise.all([
        transaction.get(eventRef),
        transaction.get(users.doc(attendeeId)),
        transaction.get(registrationRef),
      ])

      const event = eventDoc.exists ? (eventDoc.data() as EventForRegistration) : null
      checkCanRegister(event, registrationDoc.exists)

      const user = userDoc.data()
      const data: Omit<Registration, 'id'> = {
        eventId,
        attendeeId,
        attendeeName: user?.fullName ?? '',
        attendeeEmail: user?.email ?? '',
        eventTitle: eventDoc.data()?.title ?? '',
        folio: generateFolio(),
        status: 'active',
        createdAt: new Date().toISOString(),
      }

      transaction.set(registrationRef, data)
      transaction.update(eventRef, { registeredCount: FieldValue.increment(1) })

      return { id: registrationRef.id, ...data }
    })
  },

  async listByAttendee(attendeeId: string): Promise<Registration[]> {
    const snapshot = await registrations.where('attendeeId', '==', attendeeId).get()
    return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Registration, 'id'>) }))
  },

  async listByEvent(eventId: string): Promise<Registration[]> {
    const snapshot = await registrations.where('eventId', '==', eventId).get()
    return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Registration, 'id'>) }))
  },

  async findEventOrganizer(eventId: string): Promise<string | null> {
    const doc = await events.doc(eventId).get()
    return doc.exists ? doc.data()?.organizerId : null
  },
  async findById(id: string): Promise<Registration | null> {
    const doc = await registrations.doc(id).get()
    return doc.exists ? {
      id: doc.id,
      ...(doc.data() as Omit<Registration, 'id'>)
    } : null
  }
}
