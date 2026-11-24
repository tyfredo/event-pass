<script setup lang="ts">
import { onMounted, watch } from 'vue';
import EventCard from '~/components/events/EventCard.vue';
import { useAuthStore } from '~/stores/auth';
import { useEventsStore } from '~/stores/events';
import type { EventItem } from '~/types/events';

definePageMeta({ middleware: 'organizer' });

const auth = useAuthStore();
const eventsStore = useEventsStore();

async function loadMyEvents() {
  await eventsStore.fetchMyEvents();
}

async function handleToggleStatus(event: EventItem) {
  await eventsStore.toggleEventStatus(event.id, event.status === 'open' ? 'closed' : 'open');
}

onMounted(loadMyEvents);
watch(() => auth.user?.uid, loadMyEvents);
</script>

<template>
  <section>
    <div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Mis Eventos</h1>
        <p class="text-sm text-slate-600">
          Gestionando eventos de <strong>{{ auth.user?.name ?? 'Organizador' }}</strong>
        </p>
      </div>

      <NuxtLink
        to="/organizer/events/new"
        class="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-indigo-700"
      >
        + Nuevo Evento
      </NuxtLink>
    </div>

    <div
      v-if="eventsStore.error"
      class="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
      role="alert"
    >
      {{ eventsStore.error }}
    </div>

    <div
      v-if="eventsStore.loading.mine || !eventsStore.loaded.mine"
      class="flex flex-col items-center gap-3 py-16 text-sm font-medium text-slate-500"
    >
      <span class="text-indigo-600"><UiSpinner size="lg" label="Cargando tus eventos..." /></span>
      Cargando tus eventos...
    </div>

    <div v-else-if="eventsStore.myEvents.length > 0" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <EventCard v-for="evt in eventsStore.myEvents" :key="evt.id" :event="evt">
        <template #actions>
          <NuxtLink
            :to="`/organizer/events/${evt.id}/edit`"
            class="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Editar
          </NuxtLink>

          <button
            type="button"
            class="flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition disabled:opacity-50"
            :class="
              evt.status === 'open'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            "
            :disabled="eventsStore.pendingStatusId === evt.id"
            @click="handleToggleStatus(evt)"
          >
            {{ evt.status === 'open' ? 'Cerrar Evento' : 'Abrir Evento' }}
          </button>
        </template>
      </EventCard>
    </div>

    <div
      v-else-if="!eventsStore.error"
      class="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center"
    >
      <p class="text-base font-semibold text-slate-700">Aún no has creado ningún evento</p>
      <p class="mt-1 text-sm text-slate-500">
        Haz clic en "Nuevo Evento" para publicar tu primera actividad.
      </p>
    </div>
  </section>
</template>
