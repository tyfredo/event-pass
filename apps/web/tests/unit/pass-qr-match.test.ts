// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import QRCode from 'qrcode'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { onBeforeUnmount, ref } from 'vue'
import PassActions from '~/components/pass/PassActions.vue'
import PassTicket from '~/components/pass/PassTicket.vue'
import type { Pass } from '~/types/pass'
import { buildPassUrl } from '~/utils/pass'
import * as passActions from '~/utils/passActions'
import { decodeSvg } from './qr-helper'

const baseUrl = 'https://eventpass.test'

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

function readTicketQr() {
  const wrapper = mount(PassTicket, { props: { pass: pase, baseUrl } })
  const svg = wrapper.find('svg').element
  return decodeSvg(svg)
}

describe('QR del boleto y QR descargado', () => {
  beforeEach(() => {
    vi.stubGlobal('ref', ref)
    vi.stubGlobal('onBeforeUnmount', onBeforeUnmount)
  })

  it('el PNG descargado guarda lo mismo que se lee al escanear el boleto', async () => {
    const ticketContent = readTicketQr()
    expect(ticketContent).toBe(buildPassUrl(baseUrl, pase))

    const toDataURL = vi.spyOn(QRCode, 'toDataURL')
    const link = { href: '', download: '', click: vi.fn() }
    vi.spyOn(document, 'createElement').mockReturnValue(link as unknown as HTMLElement)

    await passActions.downloadQr(pase.folio, buildPassUrl(baseUrl, pase))

    expect(toDataURL).toHaveBeenCalledWith(ticketContent, expect.objectContaining({ errorCorrectionLevel: 'M' }))
    expect(link.href).toMatch(/^data:image\/png;base64,/)
    expect(link.download).toBe('EVP-2026-A1B2C3.png')
  })

  it('PassActions descarga el contenido recibido en qrValue', async () => {
    const downloadQr = vi.spyOn(passActions, 'downloadQr').mockResolvedValue(undefined)
    const qrValue = buildPassUrl(baseUrl, pase)
    const wrapper = mount(PassActions, {
      props: { folio: pase.folio, qrValue },
      global: { stubs: { UiButton: { template: '<button @click="$attrs.onClick?.()"><slot /></button>' } } },
    })

    await wrapper.findAll('button')[0]!.trigger('click')
    await flushPromises()

    expect(downloadQr).toHaveBeenCalledWith(pase.folio, qrValue)
  })

  it('sin qrValue, PassActions sigue descargando solo el folio', async () => {
    const downloadQr = vi.spyOn(passActions, 'downloadQr').mockResolvedValue(undefined)
    const wrapper = mount(PassActions, {
      props: { folio: pase.folio },
      global: { stubs: { UiButton: { template: '<button @click="$attrs.onClick?.()"><slot /></button>' } } },
    })

    await wrapper.findAll('button')[0]!.trigger('click')
    await flushPromises()

    expect(downloadQr).toHaveBeenCalledWith(pase.folio, pase.folio)
  })
})
