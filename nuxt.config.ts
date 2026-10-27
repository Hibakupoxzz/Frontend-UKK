// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      // Bisa dioverride lewat env NUXT_PUBLIC_API_BASE.
      apiBase: 'http://localhost:8000/api',
    },
  },
})
