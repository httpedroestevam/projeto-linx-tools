<script setup lang="ts">
import type { Tool } from '../../shared/types'
defineProps<{tool:Tool}>()
const iconMap:Record<string,string>={'file-code':'⌘','braces':'{}','route':'⇄','share':'↗','terminal':'›_','message':'✉','sparkles':'✦','bell':'♧'}
</script>
<template>
  <NuxtLink :to="tool.slug==='releases'?'/releases':`/tools/${tool.slug}`" :class="['tool-card',`accent-${tool.accent}`]">
    <div class="tool-icon">{{iconMap[tool.icon]||'✦'}}</div>
    <div class="tool-body"><h3>{{tool.name}}</h3><p>{{tool.description}}</p></div>
    <div class="tool-foot"><span>{{tool.category}}</span><span class="circle-arrow">↗</span></div>
  </NuxtLink>
</template>
