<script setup lang="ts">
const route = useRoute()
const eventId = String(route.params.id)
const { listByEvent } = useRegistrations()

const { data: registrations, error } = useAsyncData(
  `event-registrations-${eventId}`,
  () => listByEvent(eventId),
  { server: false, default: () => [] },
)
</script>

<template>
  <main class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <h1 class="text-3xl font-black text-slate-900">Inscritos al evento</h1>

      <p v-if="error" class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        {{ getErrorMessage(error) }}
      </p>

      <div v-else class="overflow-x-auto rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-slate-50 text-xs font-black uppercase tracking-widest text-slate-500">
            <tr>
              <th class="px-5 py-3">Asistente</th>
              <th class="px-5 py-3">Correo</th>
              <th class="px-5 py-3">Folio</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="registration in registrations" :key="registration.id">
              <td class="px-5 py-3 font-semibold text-slate-900">{{ registration.attendeeName }}</td>
              <td class="px-5 py-3 text-slate-600">{{ registration.attendeeEmail }}</td>
              <td class="px-5 py-3 font-mono text-indigo-600">{{ registration.folio }}</td>
            </tr>
            <tr v-if="registrations.length === 0">
              <td colspan="3" class="px-5 py-8 text-center text-slate-500">Aún no hay inscritos.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>
</template>
