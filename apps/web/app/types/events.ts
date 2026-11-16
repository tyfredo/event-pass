export type UserRole = 'organizer' | 'attendee';

export type EventStatus = 'open' | 'closed';

export interface EventItem {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  location: string;
  capacity: number;
  registeredCount: number;
  availableSeats: number;
  status: EventStatus;
  startsAt: string; // ISO 8601
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventPayload {
  title: string;
  description?: string;
  location?: string;
  capacity: number;
  startsAt: string;
}

export interface UpdateEventPayload {
  title?: string;
  description?: string;
  location?: string;
  capacity?: number;
  startsAt?: string;
  status?: EventStatus;
}
