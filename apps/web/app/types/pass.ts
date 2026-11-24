export type PassStatus = 'active' | 'cancelled'

export interface Pass {
  id: string
  folio: string
  status: PassStatus
  eventId: string
  eventTitle: string
  eventStartsAt: string // ISO 8601
  eventLocation: string
  attendeeName: string
}