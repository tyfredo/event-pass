import { describe, expect, it, vi } from 'vitest'
import { copyFolio, downloadQr, printPass } from '~/utils/passActions'

const folio = 'EVP-2026-TEST01'

describe('acciones del pase', () => {
  it('descarga el QR como PNG con el folio de nombre', async () => {
    const link = { href: '', download: '', click: vi.fn() }
    vi.stubGlobal('document', { createElement: () => link })

    await downloadQr(folio)

    expect(link.href).toMatch(/^data:image\/png;base64,/)
    expect(link.download).toBe('EVP-2026-TEST01.png')
    expect(link.click).toHaveBeenCalledOnce()
  })

  it('copia el folio al portapapeles', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    await copyFolio(folio)

    expect(writeText).toHaveBeenCalledWith(folio)
  })

  it('abre la impresión del navegador', () => {
    const print = vi.fn()
    vi.stubGlobal('window', { print })

    printPass()

    expect(print).toHaveBeenCalledOnce()
  })
})
