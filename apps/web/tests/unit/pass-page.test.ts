// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { EventItem } from '~/types/events'

const fetchEventById = vi.fn()
const store = { fetchEventById, error: null as string | null }

vi.mock('~/stores/events', () => ({ useEventsStore: () => store }))

const evento: EventItem = {
  id: 'evt-abierto',
  organizerId: 'org-1',
  title: 'Congreso de Cómputo en la Nube',
  description: 'Charlas y talleres.',
  location: 'Auditorio A',
  capacity: 100,
  registeredCount: 2,
  availableSeats: 98,
  status: 'open',
  startsAt: '2026-12-05T17:00:00.000Z',
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
}

async function mountPage(query: Record<string, string> = { event: 'evt-abierto' }) {
  vi.stubGlobal('useHead', vi.fn())
  vi.stubGlobal('useRoute', () => ({ params: { folio: 'EVT-SEED01' }, query }))

  const { default: Page } = await import('~/pages/pass/[folio].vue')
  const wrapper = mount(Page)
  await flushPromises()
  return wrapper
}

describe('página pública del pase (/pass/[folio])', () => {
  beforeEach(() => {
    fetchEventById.mockReset()
    store.error = null
  })

  it('consulta el evento del enlace y muestra sus datos', async () => {
    fetchEventById.mockResolvedValue(evento)
    const wrapper = await mountPage()

    expect(fetchEventById).toHaveBeenCalledWith('evt-abierto')
    expect(wrapper.get('[data-testid="event-title"]').text()).toBe('Congreso de Cómputo en la Nube')
    expect(wrapper.get('[data-testid="event-description"]').text()).toBe('Charlas y talleres.')
    expect(wrapper.get('[data-testid="event-location"]').text()).toBe('Auditorio A')
    expect(wrapper.get('[data-testid="event-date"]').text()).toMatch(/diciembre.*2026/i)
    expect(wrapper.get('[data-testid="pass-folio"]').text()).toBe('EVT-SEED01')
  })

  it('avisa cuando el enlace no trae el evento', async () => {
    const wrapper = await mountPage({})

    expect(fetchEventById).not.toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text()).toBe('El enlace del pase no es válido.')
  })

  it('muestra el error cuando el evento no existe', async () => {
    fetchEventById.mockImplementation(async () => {
      store.error = 'El evento no existe.'
      return null
    })
    const wrapper = await mountPage()

    expect(wrapper.get('[role="alert"]').text()).toBe('El evento no existe.')
    expect(wrapper.find('[data-testid="pass-event-info"]').exists()).toBe(false)
  })
})