<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Badge from '~/components/ui/Badge.vue'
import PassQr from '~/components/pass/PassQr.vue'
import type { Pass } from '~/types/pass'
import { buildPassUrl, formatEventDate } from '~/utils/pass'

const props = defineProps<{
  pass: Pass
  /** Dirección del sitio que abrirá el QR. Si no se indica, se usa la del navegador. */
  baseUrl?: string
}>()

const isActive = computed(() => props.pass.status === 'active')
const formattedDate = computed(() => formatEventDate(props.pass.eventStartsAt))

// El origen del sitio solo se conoce en el navegador; así el QR se dibuja al montar
// y no hay diferencias entre el HTML del servidor y el del cliente.
const browserOrigin = ref('')
onMounted(() => {
  browserOrigin.value = window.location.origin
})

const qrUrl = computed(() => {
  const origin = props.baseUrl ?? browserOrigin.value
  return origin ? buildPassUrl(origin, props.pass) : ''
})
</script>

<template>
  <article
    class="mx-auto w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200"
    :class="{ 'opacity-80': !isActive }"
  >
    <header class="flex items-start justify-between gap-3 bg-indigo-600 px-6 py-5 text-white">
      <div>
        <p class="text-xs font-black uppercase tracking-widest text-indigo-200">Pase de acceso</p>
        <h3 class="mt-1 text-xl font-black leading-tight" data-testid="pass-event">{{ pass.eventTitle }}</h3>
      </div>
      <Badge :variant="isActive ? 'success' : 'danger'" data-testid="pass-status">
        {{ isActive ? 'Activa' : 'Cancelada' }}
      </Badge>
    </header>

    <dl class="space-y-3 px-6 py-5">
      <div>
        <dt class="text-xs font-bold uppercase tracking-wide text-slate-500">Fecha</dt>
        <dd class="text-sm font-semibold capitalize text-slate-900" data-testid="pass-date">{{ formattedDate }}</dd>
      </div>
      <div>
        <dt class="text-xs font-bold uppercase tracking-wide text-slate-500">Lugar</dt>
        <dd class="text-sm font-semibold text-slate-900" data-testid="pass-location">{{ pass.eventLocation }}</dd>
      </div>
      <div>
        <dt class="text-xs font-bold uppercase tracking-wide text-slate-500">Asistente</dt>
        <dd class="text-sm font-semibold text-slate-900" data-testid="pass-name">{{ pass.attendeeName }}</dd>
      </div>
    </dl>

    <div class="border-t border-dashed border-slate-300 px-6 py-5 text-center">
      <div
        class="inline-block h-48 w-48 rounded-2xl bg-white p-2 ring-1 ring-slate-200"
        :class="{ 'opacity-30 grayscale': !isActive }"
      >
        <PassQr :value="qrUrl" :size="176" />
      </div>
      <p v-if="isActive" class="mt-2 text-xs text-slate-500">Escanéalo para ver los datos del evento</p>
      <p class="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">Folio</p>
      <p class="font-mono text-xl font-black tracking-widest text-indigo-600" data-testid="pass-folio">
        {{ pass.folio }}
      </p>
      <p v-if="!isActive" class="mt-2 text-xs font-semibold text-red-700">
        Este pase fue cancelado y no es válido para entrar.
      </p>
    </div>
  </article>
</template>