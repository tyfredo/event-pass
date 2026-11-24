<script setup lang="ts">
import { computed } from 'vue'
import PassTicket from '~/components/pass/PassTicket.vue'
import { getErrorMessage, useRegistrations } from '~/composables/useRegistrations'
import { useAuthStore } from '~/stores/auth'
import { useEventsStore } from '~/stores/events'
import { toPass } from '~/utils/pass'

definePageMeta({ middleware: 'attendee' })

const { listMine } = useRegistrations()
const eventsStore = useEventsStore()
const auth = useAuthStore()

const { data: registrations, error } = useAsyncData(
  'my-registrations',
  async () => {
    // Los eventos se piden junto con las inscripciones para mostrar fecha y lugar en cada boleto.
    const [mine] = await Promise.all([listMine(), eventsStore.fetchEvents()])
    return mine
  },
  {
  server: false,
  default: () => [],
})

const passes = computed(() => {
  const events = new Map(eventsStore.events.map((event) => [event.id, event]))
  return registrations.value.map((registration) => toPass(registration, events.get(registration.eventId), auth.user?.name))
})
</script>

<template>
  <main class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <h1 class="text-3xl font-black text-slate-900">Mis inscripciones</h1>

      <p v-if="error" class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        {{ getErrorMessage(error) }}
      </p>

      <p v-else-if="registrations.length === 0" class="text-slate-600">
        Aún no te has inscrito a ningún evento.
      </p>

      <RegistrationCard
        v-for="registration in registrations"
        :key="registration.id"
        :registration="registration"
      />
    </div>
  </main>
</template>
