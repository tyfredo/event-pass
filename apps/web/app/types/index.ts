export type Role = 'attendee' | 'organizer'

export interface UserProfile {
  uid: string
  name: string
  email: string
  role: Role
  createdAt: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  role: Role
  organizerCode?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface ApiResponse<T> {
  data: T
}

export interface ApiErrorBody {
  message: string
}

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export interface ApiRequestOptions {
  method?: HttpMethod
  body?: Record<string, unknown>
  query?: Record<string, string | number | boolean | undefined>
}

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export type EventStatus = 'open' | 'closed'

export interface EventItem {
  id: string
  organizerId: string
  title: string
  description: string
  location: string
  capacity: number
  registeredCount: number
  availableSeats: number
  status: EventStatus
  startsAt: string
  createdAt: string
  updatedAt: string
}
