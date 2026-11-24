import QRCode from 'qrcode'

export const downloadQr = async (folio: string, value: string = folio) => {
  const link = document.createElement('a')
  link.href = await QRCode.toDataURL(value, { width: 512, margin: 4, errorCorrectionLevel: 'M' })
  link.download = `${folio}.png`
  link.click()
}

export const copyFolio = (folio: string) => navigator.clipboard.writeText(folio)

export const printPass = () => window.print()
