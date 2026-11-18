import type { RouteLocationNormalized } from 'vue-router'
import type { Role } from '~/types'

export function homeForRole(role: Role | null) {
  if (role === 'organizer') return '/organizer/events'
  if (role === 'attendee') return '/events'
  return '/login'
}

export function safeRedirect(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return null
  if (value.startsWith('/login') || value.startsWith('/register')) return null
  return value
}

export function loginRedirect(to: RouteLocationNormalized) {
  return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
}

export async function resolveSession() {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  if (import.meta.server && !config.public.useMocks) {
    return null
  }

  await auth.waitUntilReady()
  return auth
}
