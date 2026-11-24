<script setup lang="ts">
import type { Role, SelectOption } from '~/types'

definePageMeta({ middleware: 'guest' })
useHead({ title: 'Crear cuenta · EventPass' })

const auth = useAuthStore()
const route = useRoute()

const roleOptions: SelectOption[] = [
  { value: 'attendee', label: 'Asistente: quiero inscribirme a eventos' },
  { value: 'organizer', label: 'Organizador: quiero crear eventos' },
]

const form = reactive({
  name: '',
  email: '',
  password: '',
  role: 'attendee' as Role,
  organizerCode: '',
})
const errors = reactive({
  name: '',
  email: '',
  password: '',
  organizerCode: '',
})
const errorMessage = ref('')
const submitting = ref(false)

const isOrganizer = computed(() => form.role === 'organizer')

watch(
  () => form.role,
  () => {
    form.organizerCode = ''
    errors.organizerCode = ''
  },
)

function validate() {
  errors.name = form.name.trim().length >= 2 ? '' : 'El nombre debe tener al menos 2 caracteres.'
  errors.email = /^\S+@\S+\.\S+$/.test(form.email.trim()) ? '' : 'Escribe un correo válido.'
  errors.password = form.password.length >= 6 ? '' : 'La contraseña debe tener al menos 6 caracteres.'
  errors.organizerCode = isOrganizer.value && !form.organizerCode.trim() ? 'Escribe el código de organizador.' : ''
  return !errors.name && !errors.email && !errors.password && !errors.organizerCode
}

async function handleSubmit() {
  errorMessage.value = ''
  if (!validate()) return

  submitting.value = true
  try {
    await auth.register({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
      ...(isOrganizer.value ? { organizerCode: form.organizerCode.trim() } : {}),
    })
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
      <h1 class="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">Crear cuenta</h1>
      <p class="text-sm text-slate-600">Elige tu rol para ver las opciones que te corresponden.</p>
    </div>

    <form class="space-y-5 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200" novalidate @submit.prevent="handleSubmit">
      <UiAlert v-if="errorMessage" variant="error">{{ errorMessage }}</UiAlert>

      <UiInput
        v-model="form.name"
        label="Nombre completo"
        autocomplete="name"
        required
        :error="errors.name"
      />
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
        autocomplete="new-password"
        hint="Mínimo 6 caracteres."
        required
        :error="errors.password"
      />
      <UiSelect v-model="form.role" label="Rol" :options="roleOptions" required />
      <UiInput
        v-if="isOrganizer"
        v-model="form.organizerCode"
        label="Código de organizador"
        autocomplete="off"
        hint="Te lo proporciona el administrador de EventPass."
        required
        :error="errors.organizerCode"
      />

      <UiButton type="submit" block :loading="submitting">
        {{ submitting ? 'Creando cuenta...' : 'Crear cuenta' }}
      </UiButton>
    </form>

    <p class="text-center text-sm text-slate-600">
      ¿Ya tienes cuenta?
      <NuxtLink
        :to="{ path: '/login', query: route.query.redirect ? { redirect: route.query.redirect } : {} }"
        class="font-bold text-indigo-600 hover:text-indigo-700"
      >
        Inicia sesión
      </NuxtLink>
    </p>
  </div>
</template>
