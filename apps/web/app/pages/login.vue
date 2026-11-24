<script setup lang="ts">
definePageMeta({ middleware: 'guest' })
useHead({ title: 'Iniciar sesión · EventPass' })

const auth = useAuthStore()
const route = useRoute()

const form = reactive({
  email: '',
  password: '',
})
const errors = reactive({
  email: '',
  password: '',
})
const errorMessage = ref('')
const submitting = ref(false)

function validate() {
  errors.email = /^\S+@\S+\.\S+$/.test(form.email.trim()) ? '' : 'Escribe un correo válido.'
  errors.password = form.password ? '' : 'Escribe tu contraseña.'
  return !errors.email && !errors.password
}

async function handleSubmit() {
  errorMessage.value = ''
  if (!validate()) return

  submitting.value = true
  try {
    await auth.login(form.email.trim(), form.password)
    await navigateTo(safeRedirect(route.query.redirect) ?? homeForRole(auth.role), { replace: true })
  } catch (error) {
    errorMessage.value = authErrorMessage(error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex max-w-md flex-col gap-6 sm:py-6">
    <div class="space-y-1 text-center">
      <h1 class="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Iniciar sesión</h1>
      <p class="text-sm text-slate-600">Entra para ver tus eventos e inscripciones.</p>
    </div>

    <form class="space-y-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200" novalidate @submit.prevent="handleSubmit">
      <UiAlert v-if="errorMessage" variant="error">{{ errorMessage }}</UiAlert>

      <UiInput
        v-model="form.email"
        label="Correo"
        type="email"
        autocomplete="email"
        placeholder="tu@correo.com"
        required
        :error="errors.email"
      />
      <UiInput
        v-model="form.password"
        label="Contraseña"
        type="password"
        autocomplete="current-password"
        required
        :error="errors.password"
      />

      <UiButton type="submit" block :loading="submitting">
        {{ submitting ? 'Entrando...' : 'Entrar' }}
      </UiButton>
    </form>

    <p class="text-center text-sm text-slate-600">
      ¿No tienes cuenta?
      <NuxtLink
        :to="{ path: '/register', query: route.query.redirect ? { redirect: route.query.redirect } : {} }"
        class="font-bold text-indigo-600 hover:text-indigo-700"
      >
        Regístrate
      </NuxtLink>
    </p>
  </div>
</template>
