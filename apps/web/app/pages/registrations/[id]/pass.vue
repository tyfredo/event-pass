<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PassActions from '~/components/pass/PassActions.vue'
import PassTicket from '~/components/pass/PassTicket.vue'
import { getErrorMessage, useRegistrations } from '~/composables/useRegistrations'
import { buildPassUrl } from '~/utils/pass'

definePageMeta({ middleware: 'attendee' })

const route = useRoute()
const registrationId = computed(() => String(route.params.id ?? ''))
const { getPass } = useRegistrations()

const {
  data: pass,
  error,
  status,
  refresh,
} = useAsyncData(`pass-${registrationId.value}`, () => getPass(registrationId.value), {
  server: false,
  watch: [registrationId],
})

const loading = computed(() => status.value === 'idle' || status.value === 'pending')

const origin = ref('')
onMounted(() => {
  origin.value = window.location.origin
})

const qrValue = computed(() => (pass.value && origin.value ? buildPassUrl(origin.value, pass.value) : ''))

useHead(() => ({
  title: pass.value ? `Pase ${pass.value.folio} · EventPass` : 'Mi pase · EventPass',
}))
</script>

<template>
  <div>
    <div class="mx-auto max-w-md space-y-6">
      <NuxtLink
        to="/my-registrations"
        class="no-print inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-700"
      >
        &larr; Volver a Mis inscripciones
      </NuxtLink>

      <div v-if="loading" class="flex flex-col items-center gap-3 py-16 text-indigo-600" data-testid="pass-loading">
        <UiSpinner size="lg" label="Cargando tu pase..." />
        <p class="text-sm font-semibold text-slate-500">Cargando tu pase...</p>
      </div>

      <div v-else-if="error" class="space-y-4" data-testid="pass-error">
        <UiAlert variant="error" title="No se pudo mostrar el pase">
          {{ getErrorMessage(error) }}
        </UiAlert>
        <div class="flex flex-wrap gap-3">
          <UiButton variant="secondary" @click="refresh()">Reintentar</UiButton>
          <UiButton variant="ghost" to="/my-registrations">Ir a Mis inscripciones</UiButton>
        </div>
      </div>

      <template v-else-if="pass">
        <PassTicket :pass="pass" />

        <UiAlert v-if="pass.status === 'cancelled'" variant="warning" class="no-print">
          Esta inscripción fue cancelada, por lo que el pase ya no es válido para entrar al evento.
        </UiAlert>
        <PassActions v-else :folio="pass.folio" :qr-value="qrValue" />
      </template>
    </div>
  </div>
</template>
