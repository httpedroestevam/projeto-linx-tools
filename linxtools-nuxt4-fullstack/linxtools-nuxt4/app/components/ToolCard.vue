<script setup lang="ts">
import type { Tool } from '../../shared/types'
defineProps<{tool:Tool}>()
const iconMap:Record<string,string>={'file-code':'⌘','braces':'{}','route':'⇄','share':'↗','terminal':'›_','message':'✉','sparkles':'✦','bell':'♧'}
</script>
<template>
  <NuxtLink :to="tool.slug==='releases'?'/releases':`/tools/${tool.slug}`" :class="['tool-card group flex flex-col overflow-hidden transition duration-200 hover:-translate-y-1',`accent-${tool.accent}`]">
    <div class="tool-icon grid place-items-center">{{iconMap[tool.icon]||'✦'}}</div>
    <div class="tool-body"><h3 class="font-display">{{tool.name}}</h3><p>{{tool.description}}</p></div>
    <div class="tool-foot mt-auto flex items-center justify-between"><span>{{tool.category}}</span><span class="circle-arrow grid place-items-center transition group-hover:translate-x-0.5">↗</span></div>
  </NuxtLink>
</template>
