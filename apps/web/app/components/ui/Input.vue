<script setup lang="ts">
const model = defineModel<string>({ default: '' })

const props = withDefaults(
  defineProps<{
    label?: string
    type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'datetime-local' | 'search' | 'tel'
    placeholder?: string
    hint?: string
    error?: string
    required?: boolean
    disabled?: boolean
    autocomplete?: string
    id?: string
  }>(),
  {
    label: undefined,
    type: 'text',
    placeholder: undefined,
    hint: undefined,
    error: undefined,
    required: false,
    disabled: false,
    autocomplete: undefined,
    id: undefined,
  },
)

const generatedId = useId()
const inputId = computed(() => props.id ?? generatedId)
const describedBy = computed(() => {
  if (props.error) return `${inputId.value}-error`
  if (props.hint) return `${inputId.value}-hint`
  return undefined
})
</script>

<template>
  <div class="space-y-1.5">
    <label v-if="props.label" :for="inputId" class="block text-sm font-semibold text-slate-700">
      {{ props.label }}
      <span v-if="props.required" class="text-red-600" aria-hidden="true">*</span>
    </label>
    <input
      :id="inputId"
      v-model="model"
      :type="props.type"
      :placeholder="props.placeholder"
      :required="props.required"
      :disabled="props.disabled"
      :autocomplete="props.autocomplete"
      :aria-invalid="props.error ? true : undefined"
      :aria-describedby="describedBy"
      class="block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100"
      :class="
        props.error
          ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
          : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200'
      "
    />
    <p v-if="props.error" :id="`${inputId}-error`" class="text-sm font-medium text-red-600">
      {{ props.error }}
    </p>
    <p v-else-if="props.hint" :id="`${inputId}-hint`" class="text-sm text-slate-500">
      {{ props.hint }}
    </p>
  </div>
</template>
