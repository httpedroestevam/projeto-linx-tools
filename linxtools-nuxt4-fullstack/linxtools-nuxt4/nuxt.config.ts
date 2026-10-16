export default defineNuxtConfig({
  compatibilityDate: "2025-07-01",
  css: ["~/assets/css/main.css"],
  devtools: { enabled: true },
  typescript: { strict: true, shim: false },
  runtimeConfig: {
    dataProvider: "local",
    dataFile: "storage/data.json",
    supabaseUrl: "",
    supabaseServiceRoleKey: "",
    public: { appName: "Linxtools" },
  },
  app: {
    head: {
      title: "Linxtools • Portal da Operação",
      htmlAttrs: { lang: "pt-BR" },
      meta: [
        {
          name: "description",
          content: "Ferramentas, comunicados e conhecimento para a operação.",
        },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    },
  },
});
