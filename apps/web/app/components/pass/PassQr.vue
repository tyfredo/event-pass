<script setup lang="ts">
import { computed } from 'vue'
import QRCode from 'qrcode'

const props = withDefaults(
  defineProps<{
    value: string
    size?: number
  }>(),
  {
    size: 160,
  },
)

// Zona de silencio de 4 módulos alrededor del QR (la pide el estándar para que el celular lo lea).
const QUIET_ZONE = 4

const qr = computed(() => {
  if (!props.value) return null

  const { modules } = QRCode.create(props.value, { errorCorrectionLevel: 'M' })
  const count = modules.size
  let path = ''
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (modules.get(row, col)) {
        path += `M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`
      }
    }
  }

  return { path, viewBox: count + QUIET_ZONE * 2 }
})
</script>

<template>
  <svg
    v-if="qr"
    role="img"
    :aria-label="`Código QR: ${value}`"
    :width="size"
    :height="size"
    :viewBox="`0 0 ${qr.viewBox} ${qr.viewBox}`"
    shape-rendering="crispEdges"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="100%" height="100%" fill="#ffffff" />
    <path :d="qr.path" fill="#000000" />
  </svg>
</template>