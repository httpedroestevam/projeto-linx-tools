<script setup lang="ts">
const session=useSession()
const menu=ref(false)
const canManage=computed(()=>session.user.value?.role==='admin'||Boolean(session.user.value?.permissions?.length))
const links=[{to:'/',label:'Início'},{to:'/mural',label:'Mural'},{to:'/tools',label:'Webee Tools'},{to:'/aprender',label:'Aprendizado'},{to:'/releases',label:'Releases'},{to:'/links',label:'Links úteis'}]
</script>
<template>
  <header class="topbar z-30">
    <div class="topbar-inner container mx-auto flex items-center">
      <NuxtLink to="/" class="logo" @click="menu=false"><span class="logo-emblem">✳</span>linx<span class="logo-light">tools</span><span class="brand-dot">.</span></NuxtLink>
      <button class="mobile-menu" type="button" :aria-expanded="menu" aria-label="Abrir navegação" @click="menu=!menu">☰</button>
      <nav :class="['top-nav flex items-center',{opened:menu}]" aria-label="Navegação principal">
        <NuxtLink v-for="link in links" :key="link.to" :to="link.to" @click="menu=false">{{link.label}}</NuxtLink>
      </nav>
      <div class="header-account">
        <NuxtLink v-if="canManage" class="admin-entry" to="/operacao">⚙ <span>Operação</span></NuxtLink>
        <div v-if="session.user.value" class="profile-box"><span class="avatar">{{session.user.value.name.charAt(0).toUpperCase()}}</span><span class="profile-name">{{session.user.value.name.split(' ')[0]}}</span><button class="small-text-button" @click="session.logout()">Sair</button></div>
        <NuxtLink v-else class="login-btn" to="/login">Entrar <span>→</span></NuxtLink>
      </div>
    </div>
  </header>
</template>
