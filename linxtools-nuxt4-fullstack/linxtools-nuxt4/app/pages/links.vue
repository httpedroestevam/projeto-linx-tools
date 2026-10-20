<script setup lang="ts">
import type { UsefulLink } from "../../shared/types";
const links = ref<UsefulLink[]>([]),
  loading = ref(true),
  error = ref("");
onMounted(async () => {
  try {
    links.value = (await $fetch<{ links: UsefulLink[] }>("/api/links")).links;
  } catch (e) {
    error.value = apiMessage(e);
  } finally {
    loading.value = false;
  }
});
</script>
<template>
  <div class="container page">
    <div class="page-heading">
      <div class="eyebrow">Acesso rápido</div>
      <h1>Links úteis</h1>
      <p>Documentos, sistemas e referências compartilhados pela liderança.</p>
    </div>
    <div v-if="loading" class="empty">Carregando...</div>
    <div v-else>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="links.length" class="list-grid">
        <article v-for="link in links" :key="link.id" class="list-card">
          <span class="pill">{{ link.category }}</span>
          <h3>{{ link.title }}</h3>
          <div
            class="mb-3 [overflow-wrap:anywhere] [&_img]:max-w-full [&_video]:max-w-full [&_iframe]:max-w-full"
            v-html="link.description"
          ></div>
          <a
            class="inline-link"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            >Abrir link ↗</a
          >
        </article>
      </div>
      <div v-else class="empty">Nenhum link publicado no momento.</div>
    </div>
  </div>
</template>
