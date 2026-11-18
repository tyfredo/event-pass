<script setup lang="ts">
import type { SelectOption } from '~/types'

const model = defineModel<string>({ default: '' })

const props = withDefaults(
  defineProps<{
    options: SelectOption[]
    label?: string
    placeholder?: string
    hint?: string
    error?: string
    required?: boolean
    disabled?: boolean
    id?: string
  }>(),
  {
    label: undefined,
    placeholder: undefined,
    hint: undefined,
    error: undefined,
    required: false,
    disabled: false,
    id: undefined,
  },
)

const generatedId = useId()
const selectId = computed(() => props.id ?? generatedId)
const describedBy = computed(() => {
  if (props.error) return `${selectId.value}-error`
  if (props.hint) return `${selectId.value}-hint`
  return undefined
})
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="props.label" :for="selectId" class="block text-sm font-semibold text-slate-700">
      {{ props.label }}
      <span v-if="props.required" class="text-red-600" aria-hidden="true">*</span>
    </label>
    <select
      :id="selectId"
      v-model="model"
      :required="props.required"
      :disabled="props.disabled"
      :aria-invalid="props.error ? true : undefined"
      :aria-describedby="describedBy"
      class="block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100"
      :class="
        props.error
          ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
          : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
      "
    >
      <option v-if="props.placeholder" value="" disabled>{{ props.placeholder }}</option>
      <option
        v-for="option in props.options"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
      >
        {{ option.label }}
      </option>
    </select>
    <p v-if="props.error" :id="`${selectId}-error`" class="text-sm font-medium text-red-600">
      {{ props.error }}
    </p>
    <p v-else-if="props.hint" :id="`${selectId}-hint`" class="text-sm text-slate-500">
      {{ props.hint }}
    </p>
  </div>
</template>
