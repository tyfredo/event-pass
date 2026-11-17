<script setup lang="ts">
import RegistrationCard from '~/components/registrations/RegistrationCard.vue'

definePageMeta({ middleware: 'attendee' })

const { listMine } = useRegistrations()

const { data: registrations, error } = useAsyncData('my-registrations', listMine, {
  server: false,
  default: () => [],
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
