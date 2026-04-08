<template>
  <div class="magic-login">
    <!-- Loading -->
    <div v-if="status === 'loading'" class="magic-login__state">
      <div class="spinner-border text-primary mb-4" role="status">
        <span class="visually-hidden">Cargando…</span>
      </div>
      <h2 class="h4 mb-2">Ingresando a tu panel…</h2>
      <p class="text-muted">Estamos configurando tu sesión, solo tomará un momento.</p>
    </div>

    <!-- Error -->
    <div v-else-if="status === 'error'" class="magic-login__state">
      <div class="magic-login__icon magic-login__icon--error mb-4">✕</div>
      <h2 class="h4 mb-2">El enlace ha expirado</h2>
      <p class="text-muted mb-4">
        Los enlaces de acceso directo son válidos por 10 minutos y de un solo uso.
        Por favor, inicia sesión con tu email y contraseña.
      </p>
      <RouterLink to="/login" class="btn btn-primary">
        Iniciar sesión
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/api/auth.api'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()

const status = ref<'loading' | 'error'>('loading')

onMounted(async () => {
  const token = route.query.token as string | undefined

  if (!token) {
    status.value = 'error'
    return
  }

  try {
    const response = await authApi.magicLogin(token)

    if (!response.success || !response.data) {
      status.value = 'error'
      return
    }

    const { access_token, user, store_id } = response.data

    // Persist auth data via store action
    auth.setSession(access_token, { id: user.id, email: user.email, name: user.name })

    // The initial token already carries store_id — fetch & auto-select the store
    // so the per-store scoped token gets set before entering the dashboard.
    await auth.fetchStores()

    // fetchStores auto-selects if there is only one store; if for any reason it
    // didn't (e.g. timing), fall back to selecting by store_id directly.
    if (!auth.selectedStore && store_id) {
      const match = auth.stores.find(s => s.id === store_id)
      if (match) {
        await auth.selectStore(match)
      }
    }

    // Also check superadmin status in background (non-blocking)
    auth.checkSuperAdmin().catch(() => {})

    router.replace('/dashboard')
  } catch {
    status.value = 'error'
  }
})
</script>

<style scoped>
.magic-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  padding: 2rem;
}

.magic-login__state {
  text-align: center;
  max-width: 420px;
}

.magic-login__icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: 700;
  margin: 0 auto;
}

.magic-login__icon--error {
  background: #fde8e8;
  color: #dc3545;
}
</style>
