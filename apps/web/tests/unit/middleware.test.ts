import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Role } from '~/types'
import { fakeAuth, fakeRoute, setupNuxtGlobals } from './setup'

type Middleware = (to: unknown) => Promise<unknown>

async function runMiddleware(name: 'auth' | 'organizer' | 'attendee' | 'guest', role: Role | null, path: string) {
  const auth = fakeAuth(role)
  const { navigateTo } = await setupNuxtGlobals(auth)
  const middleware = (await import(`~/middleware/${name}.ts`)).default as Middleware
  const result = await middleware(fakeRoute(path))
  return { result, navigateTo, auth }
}

describe('middlewares de ruta', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  describe('auth', () => {
    it('manda al login con redirect si no hay sesión', async () => {
      const { result } = await runMiddleware('auth', null, '/my-registrations')
      expect(result).toEqual({ path: '/login', query: { redirect: '/my-registrations' } })
    })

    it('deja pasar a cualquier usuario con sesión', async () => {
      const { result, navigateTo } = await runMiddleware('auth', 'attendee', '/my-registrations')
      expect(result).toBeUndefined()
      expect(navigateTo).not.toHaveBeenCalled()
    })

    it('espera a que se restaure la sesión antes de decidir', async () => {
      const { auth } = await runMiddleware('auth', 'organizer', '/organizer/events')
      expect(auth.waitUntilReady).toHaveBeenCalledOnce()
    })
  })

  describe('organizer', () => {
    it('no deja a un asistente abrir /organizer y lo manda a /events', async () => {
      const { result } = await runMiddleware('organizer', 'attendee', '/organizer/events/new')
      expect(result).toBe('/events')
    })

    it('deja pasar a un organizador', async () => {
      const { result } = await runMiddleware('organizer', 'organizer', '/organizer/events/new')
      expect(result).toBeUndefined()
    })

    it('manda al login si no hay sesión', async () => {
      const { result } = await runMiddleware('organizer', null, '/organizer/events')
      expect(result).toEqual({ path: '/login', query: { redirect: '/organizer/events' } })
    })
  })

  describe('attendee', () => {
    it('no deja a un organizador abrir Mis inscripciones', async () => {
      const { result } = await runMiddleware('attendee', 'organizer', '/my-registrations')
      expect(result).toBe('/organizer/events')
    })

    it('deja pasar a un asistente', async () => {
      const { result } = await runMiddleware('attendee', 'attendee', '/my-registrations')
      expect(result).toBeUndefined()
    })
  })

  describe('guest', () => {
    it('saca del login a quien ya inició sesión', async () => {
      const { result } = await runMiddleware('guest', 'organizer', '/login')
      expect(result).toBe('/organizer/events')
    })

    it('deja entrar al login sin sesión', async () => {
      const { result } = await runMiddleware('guest', null, '/login')
      expect(result).toBeUndefined()
    })
  })
})
