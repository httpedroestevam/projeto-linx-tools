<script setup lang="ts">
const session = useSession();
const email = ref(""),
  password = ref(""),
  error = ref(""),
  busy = ref(false);
async function submit() {
  error.value = "";
  busy.value = true;
  try {
    await session.login(email.value, password.value);
    await navigateTo("/operacao");
  } catch (e) {
    error.value = apiMessage(e);
  } finally {
    busy.value = false;
    password.value = "";
  }
}
</script>
<template>
  <div class="auth-wrap">
    <div class="auth-box panel">
      <div class="eyebrow">Acesso à operação</div>
      <h1>Bem-vindo de volta.</h1>
      <p class="auth-sub">
        Entre com as credenciais cadastradas pelo administrador para acessar o
        mural e os conteúdos internos.
      </p>
      <form method="post" @submit.prevent="submit">
        <div class="field">
          <label for="email">Email</label
          ><input
            id="email"
            type="email"
            v-model.trim="email"
            autocomplete="username"
            required
            placeholder="seu.email@empresa.com"
          />
        </div>
        <div class="field">
          <label for="password">Senha</label
          ><input
            id="password"
            type="password"
            v-model="password"
            autocomplete="current-password"
            required
            placeholder="Sua senha"
          />
        </div>
        <div v-if="error" class="error" role="alert">{{ error }}</div>
        <button class="btn btn-primary" :disabled="busy" type="submit">
          {{ busy ? "Entrando..." : "Entrar no portal →" }}
        </button>
      </form>
      <p class="form-help mt-[22px]">
        O cadastro de contas é feito no Portal da Operação por um administrador
        autorizado.
      </p>
    </div>
  </div>
</template>
