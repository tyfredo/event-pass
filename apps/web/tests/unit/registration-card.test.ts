// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RegistrationCard from '~/components/registrations/RegistrationCard.vue'
import type { Registration } from '~/types/registration'

const inscripcion: Registration = {
  id: 'evt-vue_att-laura',
  eventId: 'evt-vue',
  attendeeId: 'att-laura',
  attendeeName: 'Laura Pérez',
  attendeeEmail: 'laura@eventpass.test',
  eventTitle: 'Taller de Vue y Nuxt',
  folio: 'EVP-2026-A1B2C3',
  status: 'active',
  createdAt: '2026-11-20T00:00:00.000Z',
}

const stubs = {
  UiBadge: { template: '<span><slot /></span>' },
  UiButton: {
    props: ['to'],
    emits: ['click'],
    template: '<a v-if="to" :href="to"><slot /></a><button v-else @click="$emit(\'click\')"><slot /></button>',
  },
}

function mountCard(registration: Registration = inscripcion) {
  return mount(RegistrationCard, { props: { registration }, global: { stubs } })
}

describe('RegistrationCard', () => {
  it('enlaza al pase de la inscripción', () => {
    const wrapper = mountCard()
    expect(wrapper.find('[data-testid="view-pass"]').attributes('href')).toBe('/registrations/evt-vue_att-laura/pass')
  })

  it('pide confirmación antes de cancelar y emite cancel al confirmar', async () => {
    const wrapper = mountCard()
    expect(wrapper.find('[data-testid="cancel-confirm"]').exists()).toBe(false)

    await wrapper.find('[data-testid="cancel-registration"]').trigger('click')
    expect(wrapper.find('[data-testid="cancel-confirm"]').exists()).toBe(true)
    expect(wrapper.emitted('cancel')).toBeUndefined()

    await wrapper.find('[data-testid="confirm-cancel"]').trigger('click')
    expect(wrapper.emitted('cancel')?.[0]).toEqual([inscripcion])
  })

  it('no ofrece cancelar una inscripción ya cancelada', () => {
    const wrapper = mountCard({ ...inscripcion, status: 'cancelled' })
    expect(wrapper.find('[data-testid="registration-status"]').text()).toBe('Cancelada')
    expect(wrapper.find('[data-testid="cancel-registration"]').exists()).toBe(false)
  })
})
