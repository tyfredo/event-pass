<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Badge from '~/components/ui/Badge.vue'
import { useEventsStore } from '~/stores/events'
import type { EventItem } from '~/types/events'
import { formatEventDate } from '~/utils/pass'

useHead({ title: 'Pase de acceso · EventPass' })

const route = useRoute()
const eventsStore = useEventsStore()

const folio = computed(() => String(route.params.folio ?? ''))
const eventId = computed(() => (typeof route.query.event === 'string' ? route.query.event : ''))

const event = ref<EventItem | null>(null)
const loading = ref(true)
const errorMessage = ref('')

onMounted(async () => {
  if (!eventId.value) {
    errorMessage.value = 'El enlace del pase no es válido.'
    loading.value = false
    return
  }

  event.value = await eventsStore.fetchEventById(eventId.value)
  if (!event.value) {
    errorMessage.value = eventsStore.error ?? 'No se encontró el evento de este pase.'
  }
  loading.value = false
})
</script>

<template>
  <div>
    <div class="mx-auto max-w-md space-y-4">
      <p class="text-xs font-black uppercase tracking-widest text-indigo-600">Pase de acceso</p>

      <p v-if="loading" class="text-slate-500">Cargando datos del evento...</p>

      <p v-else-if="errorMessage" role="alert" class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        {{ errorMessage }}
      </p>

      <section
        v-else-if="event"
        class="space-y-3 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200"
        data-testid="pass-event-info"
      >
        <div class="flex items-start justify-between gap-3">
          <h1 class="text-2xl font-black text-slate-900" data-testid="event-title">{{ event.title }}</h1>
          <Badge :variant="event.status === 'open' ? 'success' : 'neutral'">
            {{ event.status === 'open' ? 'Abierto' : 'Cerrado' }}
          </Badge>
        </div>

        <p v-if="event.description" class="text-slate-600" data-testid="event-description">{{ event.description }}</p>

        <dl class="space-y-2 text-sm">
          <div>
            <dt class="font-bold uppercase tracking-wide text-slate-500">Fecha</dt>
            <dd class="font-semibold capitalize text-slate-900" data-testid="event-date">{{ formatEventDate(event.startsAt) }}</dd>
          </div>
          <div>
            <dt class="font-bold uppercase tracking-wide text-slate-500">Lugar</dt>
            <dd class="font-semibold text-slate-900" data-testid="event-location">{{ event.location || 'Por definir' }}</dd>
          </div>
          <div class="border-t border-dashed border-slate-300 pt-2">
            <dt class="font-bold uppercase tracking-wide text-slate-500">Folio del pase</dt>
            <dd class="font-mono text-lg font-black tracking-widest text-indigo-600" data-testid="pass-folio">{{ folio }}</dd>
          </div>
        </dl>
      </section>
    </div>
  </div>
</template>