<script setup lang="ts">
import PassTicket from '~/components/pass/PassTicket.vue'
import { cancelledExamplePass, examplePass } from '~/utils/passExample'

useHead({ title: 'Demo boleto · EventPass' })
</script>

<template>
  <div>
    <div class="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
      <PassTicket :pass="examplePass" />
      <PassTicket :pass="cancelledExamplePass" />
    </div>
  </div>
</template>