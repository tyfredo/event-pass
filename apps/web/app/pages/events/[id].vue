<script setup lang="ts">
import RegistrationCard from '~/components/registrations/RegistrationCard.vue'
import type { Registration } from '~/types/registration'

const route = useRoute()
const eventId = String(route.params.id)
const { register } = useRegistrations()

const registration = ref<Registration | null>(null)
const errorMessage = ref('')
const loading = ref(false)

const handleRegister = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    registration.value = await register(eventId)
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
      <!-- pendienteee integragte 3 -->
      <h1 class="text-3xl font-black text-slate-900">Inscripción al evento</h1>

      <RegistrationCard v-if="registration" :registration="registration" />

      <template v-else>
        <p
          v-if="errorMessage"
          class="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        >
          {{ errorMessage }}
        </p>

        <button
          type="button"
          :disabled="loading"
          class="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          @click="handleRegister"
        >
          {{ loading ? 'Inscribiendo...' : 'Inscribirme' }}
        </button>
      </template>
    </div>
  </main>
</template>
