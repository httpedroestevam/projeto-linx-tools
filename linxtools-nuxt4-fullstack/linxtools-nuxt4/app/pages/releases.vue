<script setup lang="ts">
import type {Release} from '../../shared/types'
const {data}=await useFetch<{releases:Release[]}>('/api/releases')
const releases=computed(()=>data.value?.releases||[])
</script>
<template><div class="container page"><div class="page-heading"><div class="eyebrow">Novidades e atualizações</div><h1>Últimas releases</h1><p>Acompanhe novas versões, correções e melhorias informadas pela operação.</p></div><div v-if="releases.length" class="list-grid"><article v-for="r in releases" :key="r.id" class="list-card"><span class="pill">{{r.product}}</span><h3>{{r.title}}</h3><div class="list-meta">Versão {{r.version || 'não especificada'}} · {{formatDate(r.published_at)}}</div><p style="white-space:pre-line;margin-top:16px">{{r.summary}}</p><a v-if="r.url" class="inline-link" :href="r.url" target="_blank" rel="noopener noreferrer">Consultar referência ↗</a></article></div><div v-else class="empty"><span class="empty-icon">↗</span>Nenhuma release publicada até o momento.</div></div></template>
