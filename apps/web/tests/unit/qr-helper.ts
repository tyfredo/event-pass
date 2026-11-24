//(ayuda para leer el QR como lo haría un celular):
import jsQR from 'jsqr'

/** Convierte el SVG que dibuja PassQr en una imagen de píxeles y la lee con un decodificador de QR. */
export function decodeSvg(svg: Element): string | null {
  const [, , viewBox] = (svg.getAttribute('viewBox') ?? '0 0 0 0').split(' ').map(Number) as [number, number, number]
  const scale = 8
  const width = viewBox * scale
  const pixels = new Uint8ClampedArray(width * width * 4).fill(255) // fondo blanco

  const path = svg.querySelector('path')?.getAttribute('d') ?? ''
  for (const [, col, row] of path.matchAll(/M(\d+) (\d+)h1v1h-1z/g)) {
    for (let y = Number(row) * scale; y < (Number(row) + 1) * scale; y++) {
      for (let x = Number(col) * scale; x < (Number(col) + 1) * scale; x++) {
        const i = (y * width + x) * 4
        pixels[i] = pixels[i + 1] = pixels[i + 2] = 0
      }
    }
  }

  return jsQR(pixels, width, width)?.data ?? null
}