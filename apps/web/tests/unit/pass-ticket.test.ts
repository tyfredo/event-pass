// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PassQr from '~/components/pass/PassQr.vue'
import PassTicket from '~/components/pass/PassTicket.vue'
import { cancelledExamplePass, examplePass } from '~/utils/passExample'
import { decodeSvg } from './qr-helper'

const BASE_URL = 'https://eventpass.test'
const PASS_URL = 'https://eventpass.test/pass/EVT-SEED01?event=evt-abierto'

describe('PassTicket', () => {
  it('muestra evento, fecha, lugar, nombre y folio del pase', () => {
    const wrapper = mount(PassTicket, { props: { pass: examplePass, baseUrl: BASE_URL } })

    expect(wrapper.get('[data-testid="pass-event"]').text()).toBe('Congreso de Cómputo en la Nube')
    expect(wrapper.get('[data-testid="pass-location"]').text()).toBe('Auditorio A')
    expect(wrapper.get('[data-testid="pass-name"]').text()).toBe('Ana Asistente')
    expect(wrapper.get('[data-testid="pass-folio"]').text()).toBe('EVT-SEED01')
    expect(wrapper.get('[data-testid="pass-date"]').text()).toMatch(/diciembre.*2026/i)
  })

  it('el QR guarda la dirección de la página del pase y un lector la decodifica', () => {
    const wrapper = mount(PassTicket, { props: { pass: examplePass, baseUrl: BASE_URL } })
    const qr = wrapper.getComponent(PassQr)

    expect(qr.props('value')).toBe(PASS_URL)
    expect(decodeSvg(qr.get('svg').element)).toBe(PASS_URL)
  })

  it('si no se indica baseUrl usa la dirección del navegador', async () => {
    const wrapper = mount(PassTicket, { props: { pass: examplePass } })
    await flushPromises()

    expect(wrapper.getComponent(PassQr).props('value')).toBe(
      `${window.location.origin}/pass/EVT-SEED01?event=evt-abierto`,
    )
  })

  it('muestra el estado "Activa" para un pase activo', () => {
    const wrapper = mount(PassTicket, { props: { pass: examplePass, baseUrl: BASE_URL } })

    expect(wrapper.get('[data-testid="pass-status"]').text()).toBe('Activa')
    expect(wrapper.text()).not.toContain('Cancelada')
  })

  it('muestra el estado "Cancelada" y avisa que no es válido', () => {
    const wrapper = mount(PassTicket, { props: { pass: cancelledExamplePass, baseUrl: BASE_URL } })

    expect(wrapper.get('[data-testid="pass-status"]').text()).toBe('Cancelada')
    expect(wrapper.text()).toContain('no es válido para entrar')
  })

  it('no se rompe si la fecha del evento es inválida', () => {
    const wrapper = mount(PassTicket, {
      props: { pass: { ...examplePass, eventStartsAt: 'no-es-fecha' }, baseUrl: BASE_URL },
    })
    expect(wrapper.get('[data-testid="pass-date"]').text()).toBe('Fecha por confirmar')
  })
})