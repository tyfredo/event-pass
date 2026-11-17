<script setup lang="ts">
import { computed } from 'vue';
import type { EventItem } from '~/types/events';

const props = defineProps<{
  event: EventItem;
}>();

const formattedDate = computed(() => {
  try {
    return new Intl.DateTimeFormat('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(props.event.startsAt));
  } catch {
    return props.event.startsAt;
  }
});

const isOpen = computed(() => props.event.status === 'open');

const occupancyPercentage = computed(() => {
  if (props.event.capacity <= 0) return 0;
  return Math.min(100, Math.round((props.event.registeredCount / props.event.capacity) * 100));
});

const seatsLabel = computed(() => {
  if (!isOpen.value) return 'Inscripciones cerradas';
  if (props.event.availableSeats === 0) return 'Sin lugares disponibles';
  return `${props.event.availableSeats} lugares disponibles`;
});
</script>

<template>
  <article
    class="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
  >
    <div>
      <div class="mb-3 flex items-start justify-between gap-3">
        <h3 class="text-lg font-bold leading-snug text-slate-900">
          {{ event.title }}
        </h3>
        <span
          :class="[
            'shrink-0 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase',
            isOpen
              ? 'border-emerald-200 bg-emerald-100 text-emerald-800'
              : 'border-rose-200 bg-rose-100 text-rose-800',
          ]"
        >
          {{ isOpen ? 'Abierto' : 'Cerrado' }}
        </span>
      </div>

      <p class="mb-4 line-clamp-3 text-sm text-slate-600">
        {{ event.description || 'Sin descripción adicional.' }}
      </p>

      <!-- <dl> válido: cada fila agrupa <dt>/<dd> -->
      <dl class="space-y-1.5 text-xs text-slate-500">
        <div class="flex items-center gap-2">
          <dt class="font-semibold text-slate-700">Fecha:</dt>
          <dd>{{ formattedDate }}</dd>
        </div>
        <div class="flex items-center gap-2">
          <dt class="font-semibold text-slate-700">Lugar:</dt>
          <dd>{{ event.location || 'Por definir' }}</dd>
        </div>
      </dl>
    </div>

    <div class="mt-5 border-t border-slate-100 pt-4">
      <div class="mb-1.5 flex items-center justify-between text-xs">
        <span class="font-medium text-slate-600">
          Aforo: <strong>{{ event.registeredCount }}</strong> / {{ event.capacity }}
        </span>
        <span
          :class="[
            'font-semibold',
            isOpen && event.availableSeats > 0 ? 'text-emerald-700' : 'text-rose-600',
          ]"
        >
          {{ seatsLabel }}
        </span>
      </div>

      <div
        class="h-2 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label="Ocupación del evento"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="occupancyPercentage"
      >
        <div
          class="h-full rounded-full transition-all duration-300"
          :class="isOpen ? 'bg-indigo-600' : 'bg-slate-400'"
          :style="{ width: `${occupancyPercentage}%` }"
        />
      </div>

      <div v-if="$slots.actions" class="mt-4 flex flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
  </article>
</template>
