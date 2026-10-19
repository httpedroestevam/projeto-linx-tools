<script setup lang="ts">
import type { Tool, PortalConfig, Notice, NoticeOptions } from "../../shared/types";
import { noticeExcerpt } from "#shared/utils/notice-content";
const { data: toolData } = await useFetch<{ tools: Tool[] }>("/api/tools");
const { data: portalData } = await useFetch<{ portal: PortalConfig }>(
  "/api/portal",
);
const tools = computed(() => toolData.value?.tools || []);
const portal = computed(() => portalData.value?.portal);
const session = useSession();
const notices = ref<Notice[]>([]);
const noticeOptions = ref<NoticeOptions>({
  categories: [],
  priorities: [],
});
const noticeCategoryLabel = (id: string) =>
  noticeOptions.value.categories.find((option) => option.id === id)?.label || id;
const query = ref("");
const category = ref("Todas");
const categories = computed(() => [
  "Todas",
  ...new Set(tools.value.map((t) => t.category)),
]);
const filtered = computed(() =>
  tools.value.filter(
    (t) =>
      (category.value === "Todas" || t.category === category.value) &&
      `${t.name} ${t.description}`
        .toLocaleLowerCase("pt-BR")
        .includes(query.value.toLocaleLowerCase("pt-BR")),
  ),
);
onMounted(async () => {
  await session.refresh();
  try {
    const response = await $fetch<{ notices: Notice[]; noticeOptions: NoticeOptions }>("/api/notices");
    notices.value = response.notices.slice(0, 3);
    noticeOptions.value = response.noticeOptions;
  } catch {}
});
</script>
<template>
  <div>
    <div class="hero">
      <div class="container">
        <div class="eyebrow" style="color: #f5d09d">✦ Portal da Operação</div>
        <h1>{{ portal?.hero_title || "Mais conexão. Mais soluções." }}</h1>
        <p>
          {{
            portal?.hero_description ||
            "Uma central inteligente com comunicados, ferramentas práticas e conhecimento para apoiar seu dia a dia."
          }}
        </p>
        <NuxtLink class="btn" to="/tools"
          >Explorar Webee Tools <span>↗</span></NuxtLink
        >
        <span class="hero-ornament">✳</span>
      </div>
    </div>
    <div class="container home-content">
      <div
        v-if="portal?.banner_enabled && portal.banner_text"
        class="info-banner"
      >
        📣 {{ portal.banner_text }}
      </div>
      <section class="home-section">
        <div class="section-head">
          <div>
            <div class="eyebrow">Comunicação</div>
            <h2 class="section-title">Mural da Operação</h2>
            <p class="section-subtitle">
              Informações que importam, diretamente da liderança para toda a
              equipe.
            </p>
          </div>
          <NuxtLink class="inline-link" to="/mural">Ver comunicados →</NuxtLink>
        </div>
        <div class="home-notices">
          <NuxtLink
            v-for="notice in notices"
            :key="notice.id"
            class="home-notice-card panel"
            :to="`/mural/${notice.id}`"
          >
            <span
              class="pill"
              :class="notice.priority === 'critical' ? 'red' : ''"
            >
              {{ notice.pinned ? "📌 Em destaque" : noticeCategoryLabel(notice.category) }}
            </span>
            <h3>{{ notice.title }}</h3>
            <p>{{ noticeExcerpt(notice.body, 140) }}</p>
            <span class="inline-link">Ler comunicado →</span>
          </NuxtLink>
          <div v-if="!notices.length" class="notice-feature panel">
            <span class="pill">📢 Mural da Operação</span>
            <h3>Um espaço para estar sempre informado.</h3>
            <p>
              Orientações, procedimentos e novidades oficiais, organizados por
              assunto.
            </p>
            <NuxtLink class="inline-link" to="/mural">Ver comunicados →</NuxtLink>
          </div>
        </div>
        <div class="home-notices2">
          <div class="quick-card panel">
            <div>
              <div class="mark">◈</div>
              <h3>Conhecimento na palma da mão.</h3>
              <p class="muted" style="font-size: 13px">
                Tutoriais e vídeos para você aprender, revisar e resolver
                demandas.
              </p>
            </div>
            <NuxtLink class="inline-link" to="/aprender"
              >Central de Aprendizado →</NuxtLink
            >
          </div>
        </div>
      </section>
      <section class="home-section" id="ferramentas">
        <div class="section-head">
          <div>
            <div class="eyebrow">Produtividade para o dia a dia</div>
            <h2 class="section-title">Explore as Webee Tools</h2>
            <p class="section-subtitle">
              Pequenas ferramentas, grandes soluções. Escolha e comece a usar.
            </p>
          </div>
          <span class="pill">{{ tools.length }} ferramentas</span>
        </div>
        <div class="search-row">
          <input
            v-model="query"
            class="search-input"
            type="search"
            placeholder="⌕  Pesquisar ferramentas..."
            aria-label="Pesquisar ferramentas"
          />
          <div class="filters">
            <button
              v-for="c in categories"
              :key="c"
              type="button"
              :class="['filter-chip', { active: category === c }]"
              @click="category = c"
            >
              {{ c }}
            </button>
          </div>
        </div>
        <div v-if="filtered.length" class="tool-grid">
          <ToolCard v-for="tool in filtered" :key="tool.id" :tool="tool" />
        </div>
        <div v-else class="empty">
          Nenhuma ferramenta corresponde à sua pesquisa.
        </div>
      </section>
      <section class="home-section" style="margin-bottom: 0">
        <div class="section-head">
          <div>
            <div class="eyebrow">Fique por dentro</div>
            <h2 class="section-title">Releases e atualizações</h2>
            <p class="section-subtitle">
              Novas versões, melhorias e correções dos produtos em um único
              lugar.
            </p>
          </div>
          <NuxtLink class="inline-link" to="/releases"
            >Consultar releases →</NuxtLink
          >
        </div>
        <div class="callout">
          As atualizações são publicadas pela liderança e pelos usuários que
          tiverem a permissão correspondente no Portal da Operação.
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.home-notices {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 62px;
}

.home-notice-card {
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: linear-gradient(135deg, #fff, #f8f4ff);
}

.home-notice-card:hover {
  border-color: #c8b2e7;
}

.home-notice-card h3 {
  margin: 12px 0 8px;
  font-size: 16px;
}

.home-notice-card p {
  margin: 0 0 12px;
  color: #767085;
  font-size: 13px;
}

.home-notice-card > .inline-link {
  margin-top: auto;
  white-space: nowrap;
}

@media (max-width: 560px) {
  .home-notices {
    grid-template-columns: 1fr;
  }
}
</style>
