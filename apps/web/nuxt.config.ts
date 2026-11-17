import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@pinia/nuxt"],
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      title: "EventPass",
      htmlAttrs: { lang: "es" },
      meta: [{ name: "viewport", content: "width=device-width, initial-scale=1" }],
    },
  },
  runtimeConfig: {
    public: {
      apiBase: "http://localhost:4000/api",
      useMocks: false,
      firebase: {
        apiKey: "",
        authDomain: "",
        projectId: "",
        appId: "",
      },
    },
  },
  vite: { plugins: [tailwindcss()] },
});
