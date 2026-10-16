<script setup lang="ts">
const session = useSession()
onMounted(() => { void session.refresh() })
</script>
<template>
  <div class="app-shell">
    <SiteHeader />
    <main><NuxtPage /></main>
    <footer class="site-footer"><span><b>linxtools<span class="brand-dot">.</span></b> Plataforma de apoio à operação</span><span>Projeto demonstrativo independente • Não oficial</span></footer>
  </div>
</template>
