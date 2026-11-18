import type {
  CreateEventPayload,
  EventItem,
  EventStatus,
  UpdateEventPayload,
} from '~/types/events';

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
  authHeader?: () => Record<string, string> | Promise<Record<string, string>>;
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
          ...(await config.authHeader?.()),
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
          ...(await config.authHeader?.()),
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
          ...(await config.authHeader?.()),
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
          ...(await config.authHeader?.()),
        },
        body: JSON.stringify({ status: newStatus }),
      });
      return handleResponse<EventItem>(res);
    },
  };
}