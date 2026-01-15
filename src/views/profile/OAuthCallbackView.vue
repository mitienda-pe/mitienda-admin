<template>
  <div class="flex flex-col items-center justify-center min-h-[400px]">
    <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
    <p class="mt-4 text-secondary-600">Procesando autenticación...</p>
    <p v-if="error" class="mt-2 text-red-500">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProfileStore } from '@/stores/profile.store'
import { useToast } from 'primevue/usetoast'
import { profileApi } from '@/api/profile.api'
import type { SocialProvider } from '@/types/profile.types'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const profileStore = useProfileStore()
const toast = useToast()

const error = ref('')

onMounted(async () => {
  const code = route.query.code as string
  const state = route.query.state as string
  const provider = (route.query.provider || route.params.provider || detectProvider()) as SocialProvider

  // Verificar state para prevenir CSRF
  const savedState = sessionStorage.getItem('oauth_state')
  if (state && savedState && state !== savedState) {
    error.value = 'Error de seguridad: estado inválido'
    setTimeout(() => router.push('/profile'), 3000)
    return
  }

  sessionStorage.removeItem('oauth_state')

  if (!code) {
    error.value = 'No se recibió código de autorización'
    setTimeout(() => router.push('/profile'), 3000)
    return
  }

  try {
    const redirectUri = `${window.location.origin}/profile/oauth/callback`
    const result = await profileApi.handleOAuthCallback(provider, code, redirectUri)

    if (result.success) {
      // Si estamos vinculando una cuenta existente
      await profileStore.fetchProfile()

      // Check if there was a warning (e.g., account already linked to another user)
      if (result.data?.warning) {
        toast.add({
          severity: 'warn',
          summary: 'Cuenta no vinculada',
          detail: result.data.warning,
          life: 8000
        })
      } else {
        toast.add({
          severity: 'success',
          summary: 'Cuenta vinculada',
          detail: `Tu cuenta de ${provider === 'google' ? 'Google' : 'Facebook'} ha sido vinculada`,
          life: 3000
        })
      }
    } else {
      error.value = result.message || 'Error al procesar la autenticación'
    }
  } catch (err: any) {
    console.error('OAuth callback error:', err)
    error.value = err.response?.data?.message || 'Error al procesar la autenticación'
  }

  // Redirigir al perfil después de un momento
  setTimeout(() => router.push('/profile'), 2000)
})

function detectProvider(): SocialProvider {
  // Detectar proveedor basado en la URL de referencia o parámetros
  const referrer = document.referrer
  if (referrer.includes('google.com') || referrer.includes('accounts.google')) {
    return 'google'
  }
  if (referrer.includes('facebook.com')) {
    return 'facebook'
  }
  // Default
  return 'google'
}
</script>
