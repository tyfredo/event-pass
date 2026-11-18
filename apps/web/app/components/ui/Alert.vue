<script setup lang="ts">
type AlertVariant = 'info' | 'success' | 'warning' | 'error'

const props = withDefaults(
  defineProps<{
    variant?: AlertVariant
    title?: string
    dismissible?: boolean
  }>(),
  {
    variant: 'info',
    title: undefined,
    dismissible: false,
  },
)

const emit = defineEmits<{
  dismiss: []
}>()

const variantClasses: Record<AlertVariant, string> = {
  info: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-900 ring-amber-200',
  error: 'bg-red-50 text-red-700 ring-red-200',
}

const role = computed(() => (props.variant === 'error' || props.variant === 'warning' ? 'alert' : 'status'))
</script>

<template>
  <div
    :role="role"
    class="flex items-start gap-3 rounded-xl px-4 py-3 text-sm ring-1 ring-inset"
    :class="variantClasses[props.variant]"
  >
    <div class="flex-1 space-y-0.5">
      <p v-if="props.title" class="font-bold">{{ props.title }}</p>
      <div class="font-medium">
        <slot />
      </div>
    </div>
    <button
      v-if="props.dismissible"
      type="button"
      class="-m-1 rounded-lg p-1 opacity-70 transition hover:opacity-100"
      aria-label="Cerrar aviso"
      @click="emit('dismiss')"
    >
      <span aria-hidden="true" class="block text-lg leading-none">&times;</span>
    </button>
  </div>
</template>
