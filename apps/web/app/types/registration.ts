export type RegistrationStatus = 'active' | 'cancelled'

export interface Registration {
  id: string
  eventId: string
  attendeeId: string
  attendeeName: string
  attendeeEmail: string
  eventTitle: string
  folio: string
  status: RegistrationStatus
  createdAt: string
}
