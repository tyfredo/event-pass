<script setup lang="ts">
import { copyFolio, downloadQr, printPass } from '~/utils/passActions'

const props = defineProps<{
  folio: string
}>()

const message = ref('')
const errorMessage = ref('')
let timer: ReturnType<typeof setTimeout> | undefined

const clearMessages = () => {
  clearTimeout(timer)
  message.value = ''
  errorMessage.value = ''
}

const handleDownload = async () => {
  clearMessages()

  try {
    await downloadQr(props.folio)
  } catch {
    errorMessage.value = 'No se pudo descargar el QR.'
  }
}

const handleCopy = async () => {
  clearMessages()

  try {
    await copyFolio(props.folio)
    message.value = 'Folio copiado.'
    timer = setTimeout(clearMessages, 2000)
  } catch {
    errorMessage.value = 'No se pudo copiar el folio.'
  }
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="no-print space-y-3">
    <div class="flex flex-wrap gap-3">
      <UiButton @click="handleDownload">Descargar QR</UiButton>
      <UiButton variant="secondary" @click="printPass">Imprimir pase</UiButton>
      <UiButton variant="secondary" @click="handleCopy">Copiar folio</UiButton>
    </div>

    <p role="status" class="text-sm font-semibold text-emerald-700">{{ message }}</p>
    <p v-if="errorMessage" role="alert" class="text-sm font-semibold text-red-700">{{ errorMessage }}</p>
  </div>
</template>
