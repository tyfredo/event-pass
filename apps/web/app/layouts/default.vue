<script setup lang="ts">
interface NavLink {
  to: string
  label: string
}

const auth = useAuthStore()
const menuOpen = ref(false)
const loggingOut = ref(false)
const route = useRoute()

const links = computed<NavLink[]>(() => {
  if (auth.isOrganizer) {
    return [
      { to: '/organizer/events', label: 'Mis eventos' },
      { to: '/organizer/events/new', label: 'Crear evento' },
    ]
  }
  if (auth.isAttendee) {
    return [
      { to: '/events', label: 'Eventos' },
      { to: '/my-registrations', label: 'Mis inscripciones' },
    ]
  }
  return [{ to: '/events', label: 'Eventos' }]
})

const roleLabel = computed(() => (auth.isOrganizer ? 'Organizador' : 'Asistente'))

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

async function handleLogout() {
  loggingOut.value = true
  try {
    await auth.logout()
    await navigateTo('/login')
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3" aria-label="Principal">
        <NuxtLink to="/" class="text-lg font-black tracking-tight text-indigo-600">EventPass</NuxtLink>

        <button
          type="button"
          class="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          :aria-expanded="menuOpen"
          aria-controls="main-menu"
          aria-label="Abrir menú"
          @click="menuOpen = !menuOpen"
        >
          <span aria-hidden="true" class="block text-xl leading-none">&#9776;</span>
        </button>

        <div
          id="main-menu"
          class="absolute inset-x-0 top-full flex-col gap-4 border-b border-slate-200 bg-white px-4 py-4 md:static md:flex md:flex-1 md:flex-row md:items-center md:justify-between md:border-0 md:bg-transparent md:p-0"
          :class="menuOpen ? 'flex' : 'hidden'"
        >
          <ul class="flex flex-col gap-1 md:flex-row md:items-center md:gap-2">
            <li v-for="link in links" :key="link.to">
              <NuxtLink
                :to="link.to"
                exact-active-class="bg-indigo-50 text-indigo-700"
                class="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>

          <div v-if="auth.ready" class="flex flex-col gap-3 md:flex-row md:items-center">
            <template v-if="auth.isAuthenticated">
              <div class="flex items-center gap-2 text-sm">
                <span class="font-semibold text-slate-800">{{ auth.user?.name }}</span>
                <UiBadge :variant="auth.isOrganizer ? 'info' : 'success'">{{ roleLabel }}</UiBadge>
              </div>
              <UiButton variant="secondary" size="sm" :loading="loggingOut" @click="handleLogout">Salir</UiButton>
            </template>
            <template v-else>
              <UiButton variant="ghost" size="sm" to="/login">Iniciar sesión</UiButton>
              <UiButton size="sm" to="/register">Crear cuenta</UiButton>
            </template>
          </div>
        </div>
      </nav>
    </header>

    <main>
      <slot />
    </main>
  </div>
</template>
