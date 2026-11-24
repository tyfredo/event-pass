<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PassTicket from '~/components/pass/PassTicket.vue'
import { getErrorMessage, passPath, useRegistrations } from '~/composables/useRegistrations'
import { useAuthStore } from '~/stores/auth'
import { useEventsStore } from '~/stores/events'
import type { Registration } from '~/types/registration'
import { toPass } from '~/utils/pass'

definePageMeta({ middleware: 'attendee' })

const route = useRoute()
const eventId = String(route.params.id)
const eventsStore = useEventsStore()
const auth = useAuthStore()
const { register, listMine } = useRegistrations()

const { data: event, refresh, status: eventStatus } = useAsyncData(`event-${eventId}`, () => eventsStore.fetchEventById(eventId), {
  server: false,
})

const registration = ref<Registration | null>(null)
const errorMessage = ref('')
const loading = ref(false)

const pass = computed(() => (registration.value ? toPass(registration.value, event.value ?? undefined, auth.user?.name) : null))

// Si el asistente ya estaba inscrito a este evento, se le muestra su boleto en lugar del botón.
onMounted(async () => {
  try {
    const mine = await listMine()
    const existing = mine.find((item) => item.eventId === eventId && item.status === 'active')
    if (existing && !registration.value) registration.value = existing
  } catch {
    // Si falla, se queda el botón de inscripción.
  }
})

const canRegister = computed(() => event.value?.status === 'open' && event.value.availableSeats > 0)

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso))

const handleRegister = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    registration.value = await register(eventId)
    await refresh()
  } catch (error) {
    errorMessage.value = getErrorMessage(error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <div class="mx-auto max-w-2xl space-y-6">
      <NuxtLink to="/events" class="inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-700">
        &larr; Volver a eventos
      </NuxtLink>

      <div
        v-if="!event && (eventStatus === 'idle' || eventStatus === 'pending' || eventsStore.loading.detail)"
        class="flex flex-col items-center gap-3 py-16 text-sm font-medium text-slate-500"
      >
        <span class="text-indigo-600"><UiSpinner size="lg" label="Cargando evento..." /></span>
        Cargando evento...
      </div>

      <UiAlert v-else-if="!event" variant="error">
        {{ eventsStore.error ?? 'El evento no existe.' }}
      </UiAlert>

      <template v-else>
        <section class="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div class="flex items-start justify-between gap-3">
            <h1 class="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{{ event.title }}</h1>
            <UiBadge :variant="event.status === 'open' ? 'success' : 'danger'" class="mt-1 shrink-0">
              {{ event.status === 'open' ? 'Abierto' : 'Cerrado' }}
            </UiBadge>
          </div>
          <p v-if="event.description" class="text-slate-600">{{ event.description }}</p>
          <dl class="grid gap-3 sm:grid-cols-3">
            <div class="rounded-2xl bg-slate-50 px-4 py-3">
              <dt class="text-xs font-bold uppercase tracking-wide text-slate-500">Fecha</dt>
              <dd class="mt-1 text-sm font-semibold text-slate-900">{{ formatDate(event.startsAt) }}</dd>
            </div>
            <div class="rounded-2xl bg-slate-50 px-4 py-3">
              <dt class="text-xs font-bold uppercase tracking-wide text-slate-500">Lugar</dt>
              <dd class="mt-1 text-sm font-semibold text-slate-900">{{ event.location || 'Por definir' }}</dd>
            </div>
            <div class="rounded-2xl bg-slate-50 px-4 py-3">
              <dt class="text-xs font-bold uppercase tracking-wide text-slate-500">Lugares disponibles</dt>
              <dd class="mt-1 text-sm font-semibold text-slate-900">{{ event.availableSeats }} / {{ event.capacity }}</dd>
            </div>
          </dl>
        </section>

        <template v-if="pass && registration">
          <UiAlert variant="success" title="¡Ya estás inscrito!">
            Guarda tu folio o abre tu pase para descargar el QR o imprimirlo.
          </UiAlert>
          <PassTicket :pass="pass" />
          <UiButton :to="passPath(registration.id)" block data-testid="view-pass">Ver pase</UiButton>
        </template>

        <template v-else>
          <UiAlert v-if="errorMessage" variant="error">{{ errorMessage }}</UiAlert>

          <UiButton v-if="canRegister" size="lg" block :loading="loading" @click="handleRegister">
            {{ loading ? 'Inscribiendo...' : 'Inscribirme' }}
          </UiButton>

          <UiAlert v-else variant="warning">Este evento ya no acepta inscripciones.</UiAlert>
        </template>
      </template>
    </div>
  </div>
</template>
