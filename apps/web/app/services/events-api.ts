import type {
  CreateEventPayload,
  EventItem,
  EventStatus,
  UpdateEventPayload,
} from '~/types/events';
import type { MockUserProfile } from '~/stores/auth';

export class EventsApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'EventsApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface EventsApi {
  list(status?: EventStatus): Promise<EventItem[]>;
  getById(id: string): Promise<EventItem>;
  listMine(): Promise<EventItem[]>;
  create(payload: CreateEventPayload): Promise<EventItem>;
  update(id: string, payload: UpdateEventPayload): Promise<EventItem>;
  setStatus(id: string, newStatus: EventStatus): Promise<EventItem>;
}

export interface HttpEventsApiConfig {
  baseUrl: () => string;
  authHeader: () => Record<string, string>;
}

async function handleResponse<T>(res: Response): Promise<T> {
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // Respuesta no JSON
  }

  if (!res.ok) {
    const error = body?.error;
    throw new EventsApiError(
      res.status,
      error?.message || `Error en la petición (${res.status} ${res.statusText})`,
      error?.code,
      error?.details
    );
  }

  return (body?.data !== undefined ? body.data : body) as T;
}

export function createHttpEventsApi(config: HttpEventsApiConfig): EventsApi {
  const getUrl = (path: string): string => {
    const base = config.baseUrl().replace(/\/+$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  };

  return {
    async list(status?: EventStatus): Promise<EventItem[]> {
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      const res = await fetch(getUrl(`/events${query}`), {
        headers: { Accept: 'application/json' },
      });
      return handleResponse<EventItem[]>(res);
    },

    async getById(id: string): Promise<EventItem> {
      const res = await fetch(getUrl(`/events/${encodeURIComponent(id)}`), {
        headers: { Accept: 'application/json' },
      });
      return handleResponse<EventItem>(res);
    },

    async listMine(): Promise<EventItem[]> {
      const res = await fetch(getUrl('/events/mine'), {
        headers: {
          Accept: 'application/json',
          ...config.authHeader(),
        },
      });
      return handleResponse<EventItem[]>(res);
    },

    async create(payload: CreateEventPayload): Promise<EventItem> {
      const res = await fetch(getUrl('/events'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...config.authHeader(),
        },
        body: JSON.stringify(payload),
      });
      return handleResponse<EventItem>(res);
    },

    async update(id: string, payload: UpdateEventPayload): Promise<EventItem> {
      const res = await fetch(getUrl(`/events/${encodeURIComponent(id)}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...config.authHeader(),
        },
        body: JSON.stringify(payload),
      });
      return handleResponse<EventItem>(res);
    },

    async setStatus(id: string, newStatus: EventStatus): Promise<EventItem> {
      const res = await fetch(getUrl(`/events/${encodeURIComponent(id)}/status`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...config.authHeader(),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      return handleResponse<EventItem>(res);
    },
  };
}

export function createMockEventsApi(getUser: () => MockUserProfile): EventsApi {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const now = new Date();
  const at = (days: number) => new Date(now.getTime() + days * DAY_MS).toISOString();
  const stamp = now.toISOString();

  let mockEvents: EventItem[] = [
    {
      id: 'evt-101',
      organizerId: 'org-a',
      title: 'Conferencia Fullstack & Nuxt 4',
      description: 'Aprende arquitectura moderna con Express 5, TypeScript, Nuxt 4 y Pinia.',
      location: 'Auditorio Principal - Campus Central',
      capacity: 100,
      registeredCount: 35,
      availableSeats: 65,
      status: 'open',
      startsAt: at(7),
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: 'evt-102',
      organizerId: 'org-a',
      title: 'Taller Práctico de Testing con Vitest',
      description: 'Pruebas unitarias y de integración con Supertest en APIs REST.',
      location: 'Laboratorio 3B',
      capacity: 30,
      registeredCount: 30,
      availableSeats: 0,
      status: 'closed',
      startsAt: at(14),
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: 'evt-103',
      organizerId: 'org-b',
      title: 'Meetup Cloud & Arquitectura Serverless',
      description: 'Despliegue escalable en Firestore y contenedores ligeros.',
      location: 'Sala de Innovación Norte',
      capacity: 60,
      registeredCount: 12,
      availableSeats: 48,
      status: 'open',
      startsAt: at(30),
      createdAt: stamp,
      updatedAt: stamp,
    },
  ];

  return {
    async list(status?: EventStatus): Promise<EventItem[]> {
      let filtered = [...mockEvents];
      if (status) {
        filtered = filtered.filter((e) => e.status === status);
      }
      return filtered.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
    },

    async getById(id: string): Promise<EventItem> {
      const found = mockEvents.find((e) => e.id === id);
      if (!found) {
        throw new EventsApiError(404, `No se encontró ningún evento con el ID '${id}'.`, 'NOT_FOUND');
      }
      return { ...found };
    },

    async listMine(): Promise<EventItem[]> {
      const user = getUser();
      if (!user || user.role !== 'organizer') {
        throw new EventsApiError(403, 'Acceso denegado. Se requiere rol organizador.', 'FORBIDDEN');
      }
      return mockEvents
        .filter((e) => e.organizerId === user.id)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .map((e) => ({ ...e }));
    },

    async create(payload: CreateEventPayload): Promise<EventItem> {
      const user = getUser();
      if (!user || user.role !== 'organizer') {
        throw new EventsApiError(403, 'Acceso denegado. Se requiere rol organizador.', 'FORBIDDEN');
      }

      const createdDate = new Date().toISOString();
      const newEvent: EventItem = {
        id: `evt-${Date.now()}`,
        organizerId: user.id,
        title: payload.title,
        description: payload.description || '',
        location: payload.location || 'Por definir',
        capacity: payload.capacity,
        registeredCount: 0,
        availableSeats: payload.capacity,
        status: 'open',
        startsAt: payload.startsAt,
        createdAt: createdDate,
        updatedAt: createdDate,
      };

      mockEvents = [newEvent, ...mockEvents];
      return { ...newEvent };
    },

    async update(id: string, payload: UpdateEventPayload): Promise<EventItem> {
      const user = getUser();
      if (!user || user.role !== 'organizer') {
        throw new EventsApiError(403, 'Acceso denegado. Se requiere rol organizador.', 'FORBIDDEN');
      }

      const index = mockEvents.findIndex((e) => e.id === id);
      if (index === -1) {
        throw new EventsApiError(404, `No se encontró ningún evento con el ID '${id}'.`, 'NOT_FOUND');
      }

      const existing = mockEvents[index]!;
      if (existing.organizerId !== user.id) {
        throw new EventsApiError(
          403,
          'No puedes modificar un evento que pertenece a otro organizador.',
          'NOT_EVENT_OWNER'
        );
      }

      if (payload.capacity !== undefined && payload.capacity < existing.registeredCount) {
        throw new EventsApiError(
          400,
          `El nuevo aforo (${payload.capacity}) no puede ser menor al número de asistentes ya registrados (${existing.registeredCount}).`,
          'INVALID_CAPACITY'
        );
      }

      const updated: EventItem = {
        ...existing,
        ...(payload.title !== undefined ? { title: payload.title } : {}),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
        ...(payload.location !== undefined ? { location: payload.location } : {}),
        ...(payload.capacity !== undefined
          ? {
              capacity: payload.capacity,
              availableSeats: Math.max(0, payload.capacity - existing.registeredCount),
            }
          : {}),
        ...(payload.startsAt !== undefined ? { startsAt: payload.startsAt } : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
        updatedAt: new Date().toISOString(),
      };

      mockEvents[index] = updated;
      return { ...updated };
    },

    async setStatus(id: string, newStatus: EventStatus): Promise<EventItem> {
      const user = getUser();
      if (!user || user.role !== 'organizer') {
        throw new EventsApiError(403, 'Acceso denegado. Se requiere rol organizador.', 'FORBIDDEN');
      }

      const index = mockEvents.findIndex((e) => e.id === id);
      if (index === -1) {
        throw new EventsApiError(404, `No se encontró ningún evento con el ID '${id}'.`, 'NOT_FOUND');
      }

      const existing = mockEvents[index]!;
      if (existing.organizerId !== user.id) {
        throw new EventsApiError(
          403,
          'No puedes cambiar el estado de un evento que pertenece a otro organizador.',
          'NOT_EVENT_OWNER'
        );
      }

      const updated: EventItem = {
        ...existing,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };

      mockEvents[index] = updated;
      return { ...updated };
    },
  };
}
