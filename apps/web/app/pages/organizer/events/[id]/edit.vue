<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useEventsStore } from '~/stores/events';
import type { EventItem, EventStatus, UpdateEventPayload } from '~/types/events';
import { fromDatetimeLocal, toDatetimeLocal } from '~/utils/datetime';
import { validateEventForm } from '~/utils/event-validation';

definePageMeta({ middleware: 'organizer' });

const route = useRoute();
const auth = useAuthStore();
const eventsStore = useEventsStore();
const { currentEvent: current } = storeToRefs(eventsStore);
const eventId = computed(() => String(route.params.id));
const isOwner = computed(() => current.value?.organizerId === auth.user?.uid);
// `ready` evita pintar "no encontrado" antes de que termine la primera carga (también en SSR).
const ready = ref(false);
const validationError = ref<string | null>(null);

const form = reactive({
  title: '',
  description: '',
  location: '',
  capacity: 1 as number | '',
  startsAt: '',
  status: 'open' as EventStatus,
});

function fillForm(event: EventItem) {
  form.title = event.title;
  form.description = event.description;
  form.location = event.location;
  form.capacity = event.capacity;
  form.startsAt = toDatetimeLocal(event.startsAt);
  form.status = event.status;
}

async function loadEvent() {
  validationError.value = null;
  const event = await eventsStore.fetchEventById(eventId.value);
  if (event) fillForm(event);
  ready.value = true;
}

onMounted(loadEvent);
watch(eventId, loadEvent);

async function handleSubmit() {
  const event = current.value;
  if (!event) return;

  // La fecha solo se valida (y se envía) si el organizador la cambió: así se puede editar o
  // cerrar un evento cuya fecha ya pasó. Antes el formulario siempre exigía fecha futura.
  const startsAtChanged = form.startsAt !== toDatetimeLocal(event.startsAt);

  validationError.value = validateEventForm(form, {
    minCapacity: event.registeredCount,
    checkStartsAt: startsAtChanged,
  });
  if (validationError.value) return;

  // PATCH parcial: solo los campos que cambiaron.
  const payload: UpdateEventPayload = {};
  const title = form.title.trim();
  const description = form.description.trim();
  const location = form.location.trim();
  const capacity = Number(form.capacity);

  if (title !== event.title) payload.title = title;
  if (description !== event.description) payload.description = description;
  if (location !== event.location) payload.location = location;
  if (capacity !== event.capacity) payload.capacity = capacity;
  if (form.status !== event.status) payload.status = form.status;
  if (startsAtChanged) {
    const iso = fromDatetimeLocal(form.startsAt);
    if (iso) payload.startsAt = iso;
  }

  if (Object.keys(payload).length === 0) {
    await navigateTo('/organizer/events'); // nada que guardar
    return;
  }

  const updated = await eventsStore.updateEvent(event.id, payload);
  if (updated) {
    await navigateTo('/organizer/events');
  }
}
</script>

<template>
  <section class="mx-auto max-w-2xl">
    <div class="mb-6">
      <NuxtLink to="/organizer/events" class="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
        ← Volver a Mis Eventos
      </NuxtLink>
      <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Editar Evento</h1>
    </div>

    <div v-if="!ready || eventsStore.loading.detail" class="py-12 text-center text-sm text-slate-500">
      Cargando datos del evento...
    </div>

    <!-- Evento inexistente o error de red (antes esta pantalla quedaba en blanco) -->
    <div
      v-else-if="!current"
      class="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800"
      role="alert"
    >
      {{ eventsStore.error || 'No se encontró el evento solicitado.' }}
    </div>

    <div
      v-else-if="!isOwner"
      class="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-800"
      role="alert"
    >
      <strong>Acceso denegado (NOT_EVENT_OWNER):</strong> Este evento pertenece a otro organizador y no puedes editarlo.
    </div>

    <form
      v-else
      class="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
      novalidate
      @submit.prevent="handleSubmit"
    >
      <div class="rounded-lg bg-slate-50 p-3.5 text-xs text-slate-600">
        Asistentes registrados actualmente:
        <strong class="text-slate-900">{{ current.registeredCount }}</strong>
        (el aforo mínimo permitido es {{ Math.max(1, current.registeredCount) }}).
      </div>

      <div
        v-if="validationError || eventsStore.error"
        class="rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700"
        role="alert"
      >
        {{ validationError || eventsStore.error }}
      </div>

      <div>
        <label for="title" class="mb-1 block text-sm font-semibold text-slate-700">Título del evento *</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          required
          maxlength="120"
          class="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label for="description" class="mb-1 block text-sm font-semibold text-slate-700">Descripción</label>
        <textarea
          id="description"
          v-model="form.description"
          rows="3"
          maxlength="2000"
          class="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="location" class="mb-1 block text-sm font-semibold text-slate-700">Ubicación</label>
          <input
            id="location"
            v-model="form.location"
            type="text"
            maxlength="200"
            class="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label for="capacity" class="mb-1 block text-sm font-semibold text-slate-700">Aforo máximo *</label>
          <input
            id="capacity"
            v-model.number="form.capacity"
            type="number"
            :min="Math.max(1, current.registeredCount)"
            step="1"
            required
            class="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="startsAt" class="mb-1 block text-sm font-semibold text-slate-700">
            Fecha y hora de inicio *
          </label>
          <input
            id="startsAt"
            v-model="form.startsAt"
            type="datetime-local"
            required
            class="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label for="status" class="mb-1 block text-sm font-semibold text-slate-700">Estado del evento</label>
          <select
            id="status"
            v-model="form.status"
            class="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="open">Abierto (open)</option>
            <option value="closed">Cerrado (closed)</option>
          </select>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        <NuxtLink
          to="/organizer/events"
          class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </NuxtLink>
        <button
          type="submit"
          :disabled="eventsStore.loading.saving"
          class="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {{ eventsStore.loading.saving ? 'Actualizando...' : 'Guardar Cambios' }}
        </button>
      </div>
    </form>
  </section>
</template>
