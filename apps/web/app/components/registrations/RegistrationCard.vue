<script setup lang="ts">
import type { Registration } from '~/types/registration'

defineProps<{
  registration: Registration
}>()
</script>

<template>
  <article class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
    <p class="text-xs font-black uppercase tracking-widest text-indigo-600">Pase de acceso</p>
    <h3 class="mt-2 text-xl font-black text-slate-900">{{ registration.eventTitle }}</h3>

    <div class="mt-4 border-t border-dashed border-slate-300 pt-4">
      <p class="text-sm font-semibold text-slate-500">Folio</p>
      <p class="font-mono text-2xl font-black tracking-widest text-indigo-600">
        {{ registration.folio }}
      </p>
    </div>
  </article>
</template>
