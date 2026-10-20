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
    <div v-if="loading" class="empty mt-[25px]">
      Carregando...
    </div>
    <div
      v-else-if="notice"
      class="panel panel-pad mt-[26px] max-w-[820px]"
    >
      <div class="v-space">
        <span class="pill">{{
          optionLabel(noticeOptions.categories, notice.category)
        }}</span>
        <span v-if="notice.pinned" class="pill amber">Fixado</span>
      </div>
      <h1 class="mb-2 mt-[17px] text-[35px]">{{ notice.title }}</h1>
      <p class="muted text-xs">
        {{ formatDate(notice.published_at) }} · {{ notice.author_name }}
      </p>
      <div
        class="my-7 max-w-full [overflow-wrap:anywhere] leading-[1.85] [&_img]:block [&_img]:h-auto [&_img]:max-w-full [&_video]:aspect-video [&_video]:h-auto [&_video]:w-full [&_video]:max-w-full [&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:w-full [&_iframe]:max-w-full [&_table]:block [&_table]:w-full [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--border)] [&_td]:px-2 [&_td]:py-1.5 [&_th]:border [&_th]:border-[var(--border)] [&_th]:px-2 [&_th]:py-1.5 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-[#f3f0f7] [&_pre]:p-3"
        v-html="notice.body"
      ></div>
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
    <div v-else class="empty mt-[25px]">
      {{ error || "Comunicado não encontrado." }}
    </div>
  </div>
</template>
