// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { Pass } from '~/types/pass'
import { ApiRequestError } from '~/utils/apiErrors'

const getPass = vi.fn()

vi.mock('~/composables/useRegistrations', async (importOriginal) => {
  const original = await importOriginal<typeof import('~/composables/useRegistrations')>()
  return { ...original, useRegistrations: () => ({ getPass }) }
})

const pase: Pass = {
  id: 'evt-vue_att-laura',
  folio: 'EVP-2026-A1B2C3',
  status: 'active',
  eventId: 'evt-vue',
  eventTitle: 'Taller de Vue y Nuxt',
  eventStartsAt: '2026-12-05T17:00:00.000Z',
  eventLocation: 'Auditorio A',
  attendeeName: 'Laura Pérez',
}

const stubs = {
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
  UiSpinner: { template: '<span data-testid="spinner" />' },
  UiAlert: { props: ['title'], template: '<div role="alert">{{ title }} <slot /></div>' },
  UiButton: { props: ['to'], template: '<button><slot /></button>' },
  PassTicket: { props: ['pass'], template: '<article data-testid="ticket">{{ pass.folio }}</article>' },
  PassActions: {
    props: ['folio', 'qrValue'],
    template: '<div data-testid="actions" :data-qr="qrValue">{{ folio }}</div>',
  },
}

function stubNuxt() {
  vi.stubGlobal('definePageMeta', vi.fn())
  vi.stubGlobal('useHead', vi.fn())
  vi.stubGlobal('useRoute', () => ({ params: { id: 'evt-vue_att-laura' } }))
  vi.stubGlobal('useAsyncData', (_key: string, handler: () => Promise<unknown>) => {
    const data = ref<unknown>(null)
    const error = ref<unknown>(null)
    const status = ref('pending')
    const refresh = async () => {
      status.value = 'pending'
      error.value = null
      try {
        data.value = await handler()
        status.value = 'success'
      } catch (cause) {
        error.value = { message: 'error', cause }
        status.value = 'error'
      }
    }
    void refresh()
    return { data, error, status, refresh }
  })
}

async function mountPage() {
  stubNuxt()
  const { default: Page } = await import('~/pages/registrations/[id]/pass.vue')
  const wrapper = mount(Page, { global: { stubs } })
  return wrapper
}

describe('página del pase (/registrations/[id]/pass)', () => {
  beforeEach(() => {
    getPass.mockReset()
  })

  it('muestra el estado de carga mientras llega el pase', async () => {
    getPass.mockReturnValue(new Promise(() => {}))
    const wrapper = await mountPage()
    expect(wrapper.find('[data-testid="pass-loading"]').exists()).toBe(true)
    expect(getPass).toHaveBeenCalledWith('evt-vue_att-laura')
  })

  it('muestra el boleto y las acciones con el folio', async () => {
    getPass.mockResolvedValue(pase)
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="ticket"]').text()).toBe('EVP-2026-A1B2C3')
    expect(wrapper.find('[data-testid="actions"]').text()).toBe('EVP-2026-A1B2C3')
    expect(wrapper.find('[data-testid="actions"]').attributes('data-qr')).toBe(
      `${window.location.origin}/pass/EVP-2026-A1B2C3?event=evt-vue`,
    )
  })

  it('oculta las acciones si la inscripción está cancelada', async () => {
    getPass.mockResolvedValue({ ...pase, status: 'cancelled' })
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="ticket"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="actions"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('fue cancelada')
  })

  it('muestra el error traducido si el pase es de otro asistente', async () => {
    getPass.mockRejectedValue(new ApiRequestError(403, 'NOT_REGISTRATION_OWNER'))
    const wrapper = await mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="pass-error"]').text()).toContain('Esta inscripción no te pertenece.')
    expect(wrapper.find('[data-testid="ticket"]').exists()).toBe(false)
  })
})
