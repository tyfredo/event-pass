<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { passPath } from '~/composables/useRegistrations'
import type { Registration } from '~/types/registration'

const props = withDefaults(
  defineProps<{
    registration: Registration
    cancelling?: boolean
  }>(),
  {
    cancelling: false,
  },
)

const emit = defineEmits<{
  cancel: [registration: Registration]
}>()

const isActive = computed(() => props.registration.status === 'active')
const confirming = ref(false)

watch(
  () => props.registration.status,
  () => {
    confirming.value = false
  },
)

function confirmCancel() {
  emit('cancel', props.registration)
}
</script>

<template>
  <article class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200" data-testid="registration-card">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-xs font-black uppercase tracking-widest text-indigo-600">Pase de acceso</p>
        <h3 class="mt-2 text-xl font-black text-slate-900">{{ registration.eventTitle }}</h3>
      </div>
      <UiBadge :variant="isActive ? 'success' : 'danger'" data-testid="registration-status">
        {{ isActive ? 'Activa' : 'Cancelada' }}
      </UiBadge>
    </div>

    <div class="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-dashed border-slate-300 pt-4">
      <div>
        <p class="text-sm font-semibold text-slate-500">Folio</p>
        <p
          class="font-mono text-2xl font-black tracking-widest"
          :class="isActive ? 'text-indigo-600' : 'text-slate-400 line-through'"
        >
          {{ registration.folio }}
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UiButton
          v-if="isActive && !confirming"
          variant="ghost"
          size="sm"
          data-testid="cancel-registration"
          @click="confirming = true"
        >
          Cancelar
        </UiButton>
        <UiButton :to="passPath(registration.id)" size="sm" data-testid="view-pass">Ver pase</UiButton>
      </div>
    </div>

    <div
      v-if="isActive && confirming"
      class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-red-50 px-4 py-3"
      data-testid="cancel-confirm"
    >
      <p class="text-sm font-semibold text-red-700">¿Cancelar tu inscripción? Liberarás tu lugar en el evento.</p>
      <div class="flex gap-2">
        <UiButton variant="secondary" size="sm" :disabled="cancelling" @click="confirming = false">No</UiButton>
        <UiButton variant="danger" size="sm" :loading="cancelling" data-testid="confirm-cancel" @click="confirmCancel">
          Sí, cancelar
        </UiButton>
      </div>
    </div>
  </article>
</template>
