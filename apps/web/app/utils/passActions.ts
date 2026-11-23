import QRCode from 'qrcode'

export const downloadQr = async (folio: string) => {
  const link = document.createElement('a')
  link.href = await QRCode.toDataURL(folio, { width: 512, margin: 2 })
  link.download = `${folio}.png`
  link.click()
}

export const copyFolio = (folio: string) => navigator.clipboard.writeText(folio)

export const printPass = () => window.print()
