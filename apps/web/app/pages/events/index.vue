<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import EventCard from '~/components/events/EventCard.vue';
import { useEventsStore } from '~/stores/events';
import { useAuthStore } from '~/stores/auth';
import type { EventStatus } from '~/types/events';

const eventsStore = useEventsStore();
const auth = useAuthStore();
const route = useRoute();

type Filter = 'all' | EventStatus;
const selectedFilter = ref<Filter>('open');
const filters: ReadonlyArray<{ value: Filter; label: string }> = [
  { value: 'open', label: 'Abiertos' },
  { value: 'all', label: 'Todos' },
  { value: 'closed', label: 'Cerrados' },
];

async function loadEvents() {
  await eventsStore.fetchEvents(selectedFilter.value === 'all' ? undefined : selectedFilter.value);
}

onMounted(loadEvents);
watch(selectedFilter, loadEvents);
</script>

<template>
  <section>
    <div
      v-if="route.query.unauthorized"
      class="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800"
    >
      El panel de gestión de eventos es exclusivo para usuarios con rol <strong>Organizador</strong>.
    </div>

    <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Eventos Disponibles</h1>
        <p class="text-sm text-slate-600">
          Explora los próximos eventos y consulta la disponibilidad de lugares.
        </p>
      </div>

      <div class="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-xs" role="group" aria-label="Filtrar por estado">
        <button
          v-for="filter in filters"
          :key="filter.value"
          type="button"
          class="rounded-md px-3 py-1.5 text-xs font-semibold transition"
          :class="
            selectedFilter === filter.value
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 hover:text-slate-900'
          "
          :aria-pressed="selectedFilter === filter.value"
          @click="selectedFilter = filter.value"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <div
      v-if="eventsStore.error"
      class="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
      role="alert"
    >
      {{ eventsStore.error }}
    </div>

    <!-- `loaded` evita mostrar "vacío" antes de la primera carga (también en SSR) -->
    <div
      v-if="eventsStore.loading.list || !eventsStore.loaded.list"
      class="flex flex-col items-center gap-3 py-16 text-sm font-medium text-slate-500"
    >
      <span class="text-indigo-600"><UiSpinner size="lg" label="Cargando catálogo de eventos..." /></span>
      Cargando catálogo de eventos...
    </div>

    <div v-else-if="eventsStore.events.length > 0" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <EventCard v-for="evt in eventsStore.events" :key="evt.id" :event="evt">
        <template v-if="!auth.isOrganizer && evt.status === 'open' && evt.availableSeats > 0" #actions>
          <NuxtLink
            :to="`/events/${evt.id}`"
            class="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
          >
            Inscribirme
          </NuxtLink>
        </template>
      </EventCard>
    </div>

    <div
      v-else-if="!eventsStore.error"
      class="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center"
    >
      <p class="text-base font-semibold text-slate-700">No hay eventos para mostrar</p>
      <p class="mt-1 text-sm text-slate-500">
        Prueba cambiando el filtro de estado o crea un nuevo evento como organizador.
      </p>
    </div>
  </section>
</template>
