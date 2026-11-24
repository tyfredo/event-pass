<script setup lang="ts">
import PassTicket from '~/components/pass/PassTicket.vue'
import { cancelledExamplePass, examplePass } from '~/utils/passExample'

useHead({ title: 'Demo boleto · EventPass' })
</script>

<template>
  <main class="min-h-screen bg-slate-50">
    <div class="mx-auto grid max-w-3xl gap-6 px-6 py-10 sm:grid-cols-2">
      <PassTicket :pass="examplePass" />
      <PassTicket :pass="cancelledExamplePass" />
    </div>
  </main>
</template>