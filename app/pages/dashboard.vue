<template>
  <div />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { ROLE_ROUTES } from '~/utils/nav'

const { user } = useAuth()

onMounted(() => {
  if (user.value) {
    navigateTo(ROLE_ROUTES[user.value.role])
  } else {
    navigateTo('/admin/login')
  }
})
</script>
