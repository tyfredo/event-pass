import { reactive, ref, type Ref } from 'vue';
import { defineStore } from 'pinia';
import { useAuthStore } from '~/stores/auth';
import {
  createHttpEventsApi,
  createMockEventsApi,
  EventsApiError,
  type EventsApi,
} from '~/services/events-api';
import type {
  CreateEventPayload,
  EventItem,
  EventStatus,
  UpdateEventPayload,
} from '~/types/events';

/** Convierte cualquier error en un texto para la UI, incluyendo el detalle por campo del backend. */
function toMessage(err: unknown): string {
  if (err instanceof EventsApiError) {
    if (Array.isArray(err.details) && err.details.length > 0) {
      const lines = (err.details as Array<{ message?: string }>)
        .map((d) => d.message)
        .filter((m): m is string => Boolean(m));
      if (lines.length > 0) return `${err.message} ${lines.join(' ')}`;
    }
    return err.message;
  }
  return err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
}

/** Reemplaza (por id) un evento en una lista reactiva, si existe en ella. */
function replaceById(list: Ref<EventItem[]>, updated: EventItem): void {
  list.value = list.value.map((e) => (e.id === updated.id ? updated : e));
}

export const useEventsStore = defineStore('events', () => {
  const auth = useAuthStore();
  const config = useRuntimeConfig();

  const useMockMode = ref(false);
  const events = ref<EventItem[]>([]);
  const myEvents = ref<EventItem[]>([]);
  const currentEvent = ref<EventItem | null>(null);
  const error = ref<string | null>(null);

  // Un flag por recurso (antes un único isLoading ocultaba pantallas ajenas).
  const loading = reactive({ list: false, mine: false, detail: false, saving: false });
  // `loaded` evita el parpadeo "No hay eventos" antes de la primera carga (y en SSR).
  const loaded = reactive({ list: false, mine: false });
  const pendingStatusId = ref<string | null>(null);

  const httpApi = createHttpEventsApi({
    baseUrl: () => String(config.public.apiBase),
    authHeader: () => auth.authHeader,
  });
  const mockApi = createMockEventsApi(() => auth.currentUser);
  const api = (): EventsApi => (useMockMode.value ? mockApi : httpApi);

  // Contadores de petición: solo la última respuesta puede escribir en el estado.
  let listSeq = 0;
  let mineSeq = 0;
  let detailSeq = 0;

  function toggleMockMode(enabled?: boolean): void {
    useMockMode.value = enabled ?? !useMockMode.value;
    error.value = null;
    currentEvent.value = null;
  }

  async function fetchEvents(status?: EventStatus): Promise<void> {
    const seq = ++listSeq;
    loading.list = true;
    error.value = null;
    try {
      const data = await api().list(status);
      if (seq === listSeq) events.value = data;
    } catch (err) {
      if (seq === listSeq) error.value = toMessage(err);
    } finally {
      if (seq === listSeq) {
        loading.list = false;
        loaded.list = true;
      }
    }
  }

  async function fetchEventById(id: string): Promise<EventItem | null> {
    const seq = ++detailSeq;
    loading.detail = true;
    error.value = null;
    currentEvent.value = null;
    try {
      const data = await api().getById(id);
      if (seq === detailSeq) currentEvent.value = data;
      return seq === detailSeq ? data : null;
    } catch (err) {
      if (seq === detailSeq) error.value = toMessage(err);
      return null;
    } finally {
      if (seq === detailSeq) loading.detail = false;
    }
  }

  async function fetchMyEvents(): Promise<void> {
    const seq = ++mineSeq;
    error.value = null;

    // Un asistente no tiene "mis eventos": se evita una llamada que terminaría en 403.
    if (!auth.isOrganizer) {
      myEvents.value = [];
      loading.mine = false;
      loaded.mine = true;
      return;
    }

    loading.mine = true;
    try {
      const data = await api().listMine();
      if (seq === mineSeq) myEvents.value = data;
    } catch (err) {
      if (seq === mineSeq) error.value = toMessage(err);
    } finally {
      if (seq === mineSeq) {
        loading.mine = false;
        loaded.mine = true;
      }
    }
  }

  async function createEvent(payload: CreateEventPayload): Promise<EventItem | null> {
    loading.saving = true;
    error.value = null;
    try {
      const created = await api().create(payload);
      myEvents.value = [created, ...myEvents.value];
      return created;
    } catch (err) {
      error.value = toMessage(err);
      return null;
    } finally {
      loading.saving = false;
    }
  }

  async function updateEvent(id: string, payload: UpdateEventPayload): Promise<EventItem | null> {
    loading.saving = true;
    error.value = null;
    try {
      const updated = await api().update(id, payload);
      currentEvent.value = updated;
      replaceById(myEvents, updated);
      replaceById(events, updated);
      return updated;
    } catch (err) {
      error.value = toMessage(err);
      return null;
    } finally {
      loading.saving = false;
    }
  }

  async function toggleEventStatus(id: string, newStatus: EventStatus): Promise<boolean> {
    pendingStatusId.value = id;
    error.value = null;
    try {
      const updated = await api().setStatus(id, newStatus);
      replaceById(myEvents, updated);
      replaceById(events, updated);
      if (currentEvent.value?.id === id) currentEvent.value = updated;
      return true;
    } catch (err) {
      error.value = toMessage(err);
      return false;
    } finally {
      pendingStatusId.value = null;
    }
  }

  return {
    // estado
    useMockMode,
    events,
    myEvents,
    currentEvent,
    error,
    loading,
    loaded,
    pendingStatusId,
    // acciones
    toggleMockMode,
    fetchEvents,
    fetchEventById,
    fetchMyEvents,
    createEvent,
    updateEvent,
    toggleEventStatus,
  };
});
