<script setup lang="ts">
import RegistrationCard from '~/components/registrations/RegistrationCard.vue'
import { useEventsStore } from '~/stores/events'
import type { Registration } from '~/types/registration'

definePageMeta({ middleware: 'attendee' })

const route = useRoute()
const eventId = String(route.params.id)
const eventsStore = useEventsStore()
const { register } = useRegistrations()

const { data: event, refresh } = useAsyncData(`event-${eventId}`, () => eventsStore.fetchEventById(eventId), {
  server: false,
})

const registration = ref<Registration | null>(null)
const errorMessage = ref('')
const loading = ref(false)

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
  <main class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <p v-if="eventsStore.loading.detail && !event" class="text-slate-500">Cargando evento...</p>

      <p v-else-if="!event" class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        {{ eventsStore.error ?? 'El evento no existe.' }}
      </p>

      <template v-else>
        <section class="space-y-2 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h1 class="text-3xl font-black text-slate-900">{{ event.title }}</h1>
          <p class="text-slate-600">{{ event.description }}</p>
          <p class="text-sm text-slate-500"><strong>Fecha:</strong> {{ formatDate(event.startsAt) }}</p>
          <p class="text-sm text-slate-500"><strong>Lugar:</strong> {{ event.location || 'Por definir' }}</p>
          <p class="text-sm text-slate-500">
            <strong>Lugares disponibles:</strong> {{ event.availableSeats }} / {{ event.capacity }}
          </p>
        </section>

        <RegistrationCard v-if="registration" :registration="registration" />

        <template v-else>
          <p
            v-if="errorMessage"
            class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            {{ errorMessage }}
          </p>

          <button
            v-if="canRegister"
            type="button"
            :disabled="loading"
            class="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            @click="handleRegister"
          >
            {{ loading ? 'Inscribiendo...' : 'Inscribirme' }}
          </button>

          <p v-else class="text-sm font-semibold text-slate-500">
            Este evento ya no acepta inscripciones.
          </p>
        </template>
      </template>
    </div>
  </main>
</template>
