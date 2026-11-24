<script setup lang="ts">
import { computed, ref } from 'vue'
import RegistrationCard from '~/components/registrations/RegistrationCard.vue'
import { getErrorMessage, useRegistrations } from '~/composables/useRegistrations'
import type { Registration } from '~/types/registration'

definePageMeta({ middleware: 'attendee' })

const { listMine, cancel } = useRegistrations()

const { data: registrations, error, status } = useAsyncData('my-registrations', listMine, {
  server: false,
  default: () => [],
})

const loading = computed(() => status.value === 'idle' || status.value === 'pending')

const cancellingId = ref<string | null>(null)
const feedback = ref<{ variant: 'success' | 'error'; text: string } | null>(null)

async function handleCancel(registration: Registration) {
  cancellingId.value = registration.id
  feedback.value = null
  try {
    const updated = await cancel(registration.id)
    registrations.value = registrations.value.map((item) =>
      item.id === registration.id ? { ...item, ...updated, status: 'cancelled' } : item,
    )
    feedback.value = { variant: 'success', text: `Cancelaste tu inscripción a «${registration.eventTitle}».` }
  } catch (cancelError) {
    feedback.value = { variant: 'error', text: getErrorMessage(cancelError) }
  } finally {
    cancellingId.value = null
  }
}
</script>

<template>
  <div>
    <div class="mx-auto max-w-2xl space-y-6">
      <h1 class="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Mis inscripciones</h1>

      <UiAlert
        v-if="feedback"
        :variant="feedback.variant"
        dismissible
        data-testid="cancel-feedback"
        @dismiss="feedback = null"
      >
        {{ feedback.text }}
      </UiAlert>

      <div v-if="loading" class="flex justify-center py-10 text-indigo-600">
        <UiSpinner size="lg" label="Cargando inscripciones..." />
      </div>

      <UiAlert v-else-if="error" variant="error">
        {{ getErrorMessage(error) }}
      </UiAlert>

      <p v-else-if="registrations.length === 0" class="text-slate-600">
        Aún no te has inscrito a ningún evento.
      </p>

      <template v-else>
        <RegistrationCard
          v-for="registration in registrations"
          :key="registration.id"
          :registration="registration"
          :cancelling="cancellingId === registration.id"
          @cancel="handleCancel"
        />
      </template>
    </div>
  </div>
</template>
