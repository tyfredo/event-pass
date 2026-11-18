import { vi } from 'vitest'
import type { Role } from '~/types'

export interface FakeAuth {
  isAuthenticated: boolean
  isOrganizer: boolean
  isAttendee: boolean
  role: Role | null
  waitUntilReady: () => Promise<void>
}

export function fakeAuth(role: Role | null): FakeAuth {
  return {
    isAuthenticated: role !== null,
    isOrganizer: role === 'organizer',
    isAttendee: role === 'attendee',
    role,
    waitUntilReady: vi.fn(() => Promise.resolve()),
  }
}

export function fakeRoute(fullPath: string) {
  return { fullPath, path: fullPath.split('?')[0] } as never
}

export async function setupNuxtGlobals(auth: FakeAuth, useMocks = true) {
  const navigateTo = vi.fn((target: unknown) => target)

  vi.stubGlobal('defineNuxtRouteMiddleware', (middleware: unknown) => middleware)
  vi.stubGlobal('navigateTo', navigateTo)
  vi.stubGlobal('useAuthStore', () => auth)
  vi.stubGlobal('useRuntimeConfig', () => ({ public: { useMocks } }))

  const roleHome = await import('~/utils/roleHome')
  vi.stubGlobal('homeForRole', roleHome.homeForRole)
  vi.stubGlobal('loginRedirect', roleHome.loginRedirect)
  vi.stubGlobal('resolveSession', roleHome.resolveSession)

  return { navigateTo }
}
