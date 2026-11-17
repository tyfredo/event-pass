<script setup lang="ts">
import { isProfileKey, useAuthStore } from '~/stores/auth';
import { useEventsStore } from '~/stores/events';

const auth = useAuthStore();
const eventsStore = useEventsStore();
const route = useRoute();

async function onRoleChange(event: Event) {
  const value = (event.target as HTMLSelectElement).value;
  if (!isProfileKey(value)) return;

  auth.switchProfile(value);

  // Si deja de ser organizador estando en /organizer, se le saca del panel.
  if (!auth.isOrganizer && route.path.startsWith('/organizer')) {
    await navigateTo('/events');
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div class="flex items-center gap-6">
          <NuxtLink to="/events" class="text-lg font-extrabold tracking-tight text-indigo-600">
            EventPass
          </NuxtLink>

          <nav class="flex items-center gap-4 text-sm font-medium">
            <NuxtLink
              to="/events"
              exact-active-class="bg-indigo-50 text-indigo-700 font-semibold"
              class="rounded-md px-3 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Catálogo Público
            </NuxtLink>

            <NuxtLink
              v-if="auth.isOrganizer"
              to="/organizer/events"
              active-class="bg-indigo-50 text-indigo-700 font-semibold"
              class="rounded-md px-3 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Mis Eventos (Organizador)
            </NuxtLink>
          </nav>
        </div>

        <!-- Controles de simulación (solo desarrollo) -->
        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="rounded-lg border px-3 py-1.5 text-xs font-semibold transition"
            :class="
              eventsStore.useMockMode
                ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-emerald-300 bg-emerald-50 text-emerald-800'
            "
            @click="eventsStore.toggleMockMode()"
          >
            {{ eventsStore.useMockMode ? 'Modo: Mock Local' : 'Modo: API Backend' }}
          </button>

          <div v-if="auth.availableProfiles?.length" class="flex items-center gap-2">
            <label for="role-switcher" class="text-xs font-medium text-slate-500">Usuario:</label>
            <select
              id="role-switcher"
              :value="auth.currentProfileKey"
              class="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
              @change="onRoleChange"
            >
              <option v-for="profile in auth.availableProfiles" :key="profile.key" :value="profile.key">
                {{ profile.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-8">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </main>
  </div>
</template>