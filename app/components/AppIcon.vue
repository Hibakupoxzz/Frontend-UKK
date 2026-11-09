<template>
  <svg
    class="app-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    :aria-hidden="label ? undefined : 'true'"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    v-html="markup"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getIconMarkup, type IconName } from '~/utils/icons'

const props = withDefaults(defineProps<{
  /** Nama ikon dari registri `~/utils/icons`. */
  name: IconName | string
  /** Ketebalan garis; samakan bila ikon tampil sangat kecil. */
  strokeWidth?: number | string
  /** Isi bila ikon tidak didampingi teks (mis. tombol ikon saja). */
  label?: string
}>(), {
  strokeWidth: 2,
  label: undefined,
})

const markup = computed(() => getIconMarkup(props.name))
</script>
