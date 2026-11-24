// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PassQr from '~/components/pass/PassQr.vue'
import { decodeSvg } from './qr-helper'

const URL_EJEMPLO = 'http://localhost:3000/pass/EVT-SEED01?event=evt-abierto'

describe('PassQr', () => {
  it('dibuja un SVG con el tamaño recibido', () => {
    const wrapper = mount(PassQr, { props: { value: URL_EJEMPLO, size: 200 } })
    const svg = wrapper.get('svg')

    expect(svg.attributes('width')).toBe('200')
    expect(svg.attributes('height')).toBe('200')
    expect(svg.find('path').attributes('d')).toBeTruthy()
  })

  it('usa 160 px por defecto', () => {
    const wrapper = mount(PassQr, { props: { value: URL_EJEMPLO } })
    expect(wrapper.get('svg').attributes('width')).toBe('160')
  })

  it('genera un QR que un lector decodifica al mismo valor', () => {
    const wrapper = mount(PassQr, { props: { value: URL_EJEMPLO, size: 180 } })
    expect(decodeSvg(wrapper.get('svg').element)).toBe(URL_EJEMPLO)
  })

  it('cambia el QR cuando cambia el valor', async () => {
    const wrapper = mount(PassQr, { props: { value: 'https://a.test/uno' } })
    await wrapper.setProps({ value: 'https://a.test/dos' })
    expect(decodeSvg(wrapper.get('svg').element)).toBe('https://a.test/dos')
  })

  it('no dibuja nada si el valor está vacío', () => {
    const wrapper = mount(PassQr, { props: { value: '' } })
    expect(wrapper.find('svg').exists()).toBe(false)
  })
})