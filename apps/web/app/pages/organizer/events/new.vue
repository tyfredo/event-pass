<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useEventsStore } from '~/stores/events';
import { fromDatetimeLocal, toDatetimeLocal } from '~/utils/datetime';
import { validateEventForm } from '~/utils/event-validation';

definePageMeta({ middleware: 'organizer' });

const eventsStore = useEventsStore();

const form = reactive({
  title: '',
  description: '',
  location: '',
  capacity: 50 as number | '',
  startsAt: '',
});

const validationError = ref<string | null>(null);

// Se calcula en el cliente: en SSR la zona horaria del servidor daría un atributo distinto (hydration mismatch).
const minStartsAt = ref('');
onMounted(() => {
  minStartsAt.value = toDatetimeLocal(new Date().toISOString());
  eventsStore.error = null; // no arrastrar errores de otras pantallas
});

async function handleSubmit() {
  validationError.value = validateEventForm(form, { checkStartsAt: true });
  if (validationError.value) return;

  const startsAt = fromDatetimeLocal(form.startsAt);
  if (!startsAt) return; // ya validado arriba; estrecha el tipo

  const created = await eventsStore.createEvent({
    title: form.title.trim(),
    description: form.description.trim(),
    location: form.location.trim(),
    capacity: Number(form.capacity),
    startsAt,
  });

  if (created) {
    await navigateTo('/organizer/events');
  }
}
</script>

<template>
  <section class="mx-auto max-w-2xl">
    <div class="mb-6">
      <NuxtLink to="/organizer/events" class="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
        ← Volver a Mis Eventos
      </NuxtLink>
      <h1 class="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Crear Nuevo Evento</h1>
      <p class="text-sm text-slate-600">
        Completa los datos para publicar el evento con estado inicial abierto.
      </p>
    </div>

    <form
      class="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
      novalidate
      @submit.prevent="handleSubmit"
    >
      <div
        v-if="validationError || eventsStore.error"
        class="rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700"
        role="alert"
      >
        {{ validationError || eventsStore.error }}
      </div>

      <div>
        <label for="title" class="mb-1 block text-sm font-semibold text-slate-700">Título del evento *</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          required
          maxlength="120"
          placeholder="Ej. Taller de Arquitectura Web"
          class="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label for="description" class="mb-1 block text-sm font-semibold text-slate-700">Descripción</label>
        <textarea
          id="description"
          v-model="form.description"
          rows="3"
          maxlength="2000"
          placeholder="Describe la agenda, ponentes o requisitos..."
          class="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="location" class="mb-1 block text-sm font-semibold text-slate-700">Ubicación</label>
          <input
            id="location"
            v-model="form.location"
            type="text"
            maxlength="200"
            placeholder="Ej. Auditorio Central"
            class="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label for="capacity" class="mb-1 block text-sm font-semibold text-slate-700">
            Aforo máximo (lugares) *
          </label>
          <input
            id="capacity"
            v-model.number="form.capacity"
            type="number"
            min="1"
            step="1"
            required
            class="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label for="startsAt" class="mb-1 block text-sm font-semibold text-slate-700">
          Fecha y hora de inicio *
        </label>
        <input
          id="startsAt"
          v-model="form.startsAt"
          type="datetime-local"
          required
          :min="minStartsAt"
          class="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div class="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        <NuxtLink
          to="/organizer/events"
          class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </NuxtLink>
        <button
          type="submit"
          :disabled="eventsStore.loading.saving"
          class="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {{ eventsStore.loading.saving ? 'Guardando...' : 'Publicar Evento' }}
        </button>
      </div>
    </form>
  </section>
</template>
