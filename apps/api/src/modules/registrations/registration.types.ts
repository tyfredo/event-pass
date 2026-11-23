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

export interface EventForRegistration {
  status: 'open' | 'closed'
  capacity: number
  registeredCount: number
}

export interface Pass {
  id: string
  folio: string
  status: RegistrationStatus
  eventId: string
  eventTitle: string
  eventStartsAt: string // ISO 8601
  eventLocation: string
  attendeeName: string
}