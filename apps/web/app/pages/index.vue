<script setup lang="ts">
definePageMeta({
  middleware: async () => {
    const auth = await resolveSession()
    if (!auth) return
    return navigateTo(homeForRole(auth.role), { replace: true })
  },
})
</script>

<template>
  <div class="flex min-h-[50vh] items-center justify-center text-indigo-600">
    <UiSpinner size="lg" />
  </div>
</template>
