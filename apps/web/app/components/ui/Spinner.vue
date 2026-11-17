<script setup lang="ts">
type SpinnerSize = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    size?: SpinnerSize
    label?: string
  }>(),
  {
    size: 'md',
    label: 'Cargando...',
  },
)

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-4',
}
</script>

<template>
  <span role="status" class="inline-flex items-center">
    <span
      class="animate-spin rounded-full border-current border-t-transparent"
      :class="sizeClasses[props.size]"
      aria-hidden="true"
    />
    <span class="sr-only">{{ props.label }}</span>
  </span>
</template>
