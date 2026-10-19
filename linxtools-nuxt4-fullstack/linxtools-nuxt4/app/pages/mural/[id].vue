<script setup lang="ts">
import type { Notice, NoticeOptions } from "../../../shared/types";

const route = useRoute();
const session = useSession();
const notice = ref<Notice | null>(null);
const noticeOptions = ref<NoticeOptions>({
  categories: [],
  priorities: [],
});
const error = ref("");
const busy = ref(false);
const loading = ref(true);
const optionLabel = (
  options: NoticeOptions["categories"],
  id: string,
) => options.find((option) => option.id === id)?.label || id;

onMounted(async () => {
  await session.refresh();
  try {
    const response = await $fetch<{
      notice: Notice;
      noticeOptions: NoticeOptions;
    }>(`/api/notices/${route.params.id}`);
    notice.value = response.notice;
    noticeOptions.value = response.noticeOptions;
  } catch (cause) {
    error.value = apiMessage(cause);
  }
  loading.value = false;
});

async function acknowledge() {
  if (!notice.value) return;
  busy.value = true;
  error.value = "";
  try {
    await $fetch(`/api/notices/${notice.value.id}/ack`, {
      method: "POST",
      body: {},
    });
    notice.value.acknowledged = true;
  } catch (cause) {
    error.value = apiMessage(cause);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="container page">
    <NuxtLink class="inline-link" to="/mural">← Voltar ao mural</NuxtLink>
    <div v-if="loading" class="empty" style="margin-top: 25px">
      Carregando...
    </div>
    <div
      v-else-if="notice"
      class="panel panel-pad"
      style="max-width: 820px; margin-top: 26px"
    >
      <div class="v-space">
        <span class="pill">{{
          optionLabel(noticeOptions.categories, notice.category)
        }}</span>
        <span v-if="notice.pinned" class="pill amber">Fixado</span>
      </div>
      <h1 style="font-size: 35px; margin: 17px 0 8px">{{ notice.title }}</h1>
      <p class="muted" style="font-size: 12px">
        {{ formatDate(notice.published_at) }} · {{ notice.author_name }}
      </p>
      <div class="notice-body-content" v-html="notice.body"></div>
      <div v-if="notice.requires_ack">
        <div v-if="notice.acknowledged" class="success">
          ✓ Você confirmou a leitura deste comunicado.
        </div>
        <NuxtLink
          v-else-if="!session.user.value"
          to="/login"
          class="btn btn-primary"
        >
          Entrar para confirmar leitura
        </NuxtLink>
        <button
          v-else
          class="btn btn-primary"
          :disabled="busy"
          @click="acknowledge"
        >
          Confirmar leitura
        </button>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
    </div>
    <div v-else class="empty" style="margin-top: 25px">
      {{ error || "Comunicado não encontrado." }}
    </div>
  </div>
</template>

<style scoped>
.notice-body-content {
  max-width: 100%;
  margin: 28px 0;
  overflow-wrap: anywhere;
  line-height: 1.85;
}
.notice-body-content :deep(img),
.notice-body-content :deep(video),
.notice-body-content :deep(iframe) {
  max-width: 100%;
  height: auto;
}
.notice-body-content :deep(iframe),
.notice-body-content :deep(video) {
  width: 100%;
  aspect-ratio: 16 / 9;
}
.notice-body-content :deep(img) {
  display: block;
}
.notice-body-content :deep(table) {
  display: block;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
}
.notice-body-content :deep(td),
.notice-body-content :deep(th) {
  border: 1px solid var(--border);
  padding: 6px 8px;
}
.notice-body-content :deep(pre) {
  overflow-x: auto;
  padding: 12px;
  border-radius: 8px;
  background: #f3f0f7;
}
</style>
