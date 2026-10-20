<script setup lang="ts">
import type { Video } from "../../shared/types";
const videos = ref<Video[]>([]),
  busy = ref(true),
  error = ref(""),
  query = ref("");
const filtered = computed(() =>
  videos.value.filter((v) =>
    `${v.title} ${v.category} ${v.description}`
      .toLowerCase()
      .includes(query.value.toLowerCase()),
  ),
);
onMounted(async () => {
  try {
    videos.value = (await $fetch<{ videos: Video[] }>("/api/videos")).videos;
  } catch (e) {
    error.value = apiMessage(e);
  } finally {
    busy.value = false;
  }
});
</script>
<template>
  <div class="container page">
    <div class="page-heading">
      <div class="eyebrow">Biblioteca de conhecimento</div>
      <h1>Central de Aprendizado</h1>
      <p>
        Treinamentos, orientações e tutoriais práticos para ampliar o
        conhecimento da operação.
      </p>
    </div>
    <div v-if="busy" class="empty">Carregando vídeos...</div>
    <div v-else>
      <div v-if="error" class="error">{{ error }}</div>
      <div class="search-row">
        <input
          v-model="query"
          class="search-input"
          type="search"
          placeholder="Pesquisar vídeos e categorias..."
        />
      </div>
      <div v-if="filtered.length" class="video-grid">
        <article v-for="video in filtered" :key="video.id" class="video-card">
          <div class="video-wrap">
            <iframe
              :src="video.embed_url"
              :title="video.title"
              loading="lazy"
              referrerpolicy="strict-origin-when-cross-origin"
              allow="fullscreen; picture-in-picture"
              allowfullscreen
            />
          </div>
          <h3>{{ video.title }}</h3>
          <div
            class="[overflow-wrap:anywhere] [&_img]:max-w-full [&_video]:max-w-full [&_iframe]:max-w-full"
            v-html="video.description"
          ></div>
          <a
            class="inline-link"
            :href="video.external_url"
            rel="noopener noreferrer"
            target="_blank"
            >Abrir em nova guia ↗</a
          >
        </article>
      </div>
      <div v-else class="empty">
        Ainda não há vídeos publicados. A liderança pode cadastrá-los no painel.
      </div>
    </div>
  </div>
</template>
