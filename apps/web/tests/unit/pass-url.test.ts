import { describe, expect, it } from 'vitest'
import { buildPassUrl, formatEventDate } from '~/utils/pass'
import { examplePass } from '~/utils/passExample'

describe('buildPassUrl', () => {
  it('arma la dirección de la página del pase con el id del evento', () => {
    expect(buildPassUrl('https://eventpass.test', examplePass)).toBe(
      'https://eventpass.test/pass/EVT-SEED01?event=evt-abierto',
    )
  })

  it('ignora la diagonal final de la dirección base', () => {
    expect(buildPassUrl('http://192.168.1.20:3000/', examplePass)).toBe(
      'http://192.168.1.20:3000/pass/EVT-SEED01?event=evt-abierto',
    )
  })

  it('codifica caracteres especiales', () => {
    expect(buildPassUrl('https://eventpass.test', { folio: 'A B/1', eventId: 'e&1' })).toBe(
      'https://eventpass.test/pass/A%20B%2F1?event=e%261',
    )
  })
})

describe('formatEventDate', () => {
  it('da formato en español', () => {
    expect(formatEventDate('2026-12-05T17:00:00.000Z')).toMatch(/diciembre.*2026/i)
  })

  it('avisa cuando la fecha no es válida', () => {
    expect(formatEventDate('no-es-fecha')).toBe('Fecha por confirmar')
  })
})