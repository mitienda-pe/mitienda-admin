<template>
  <div>
    <h2 class="text-2xl font-bold text-center mb-6 text-secondary">Iniciar Sesión</h2>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <!-- Email -->
      <div>
        <label for="email" class="block text-sm font-medium text-secondary-700 mb-2">
          Correo Electrónico
        </label>
        <InputText
          id="email"
          v-model="credentials.email"
          type="email"
          placeholder="tu@email.com"
          class="w-full"
          :class="{ 'p-invalid': emailError }"
          :disabled="authStore.isLoading || isSocialLoading"
          required
        />
        <small v-if="emailError" class="text-red-500">{{ emailError }}</small>
      </div>

      <!-- Password -->
      <div>
        <label for="password" class="block text-sm font-medium text-secondary-700 mb-2">
          Contraseña
        </label>
        <Password
          id="password"
          v-model="credentials.password"
          placeholder="••••••••"
          :feedback="false"
          toggle-mask
          class="w-full"
          input-class="w-full"
          :class="{ 'p-invalid': passwordError }"
          :disabled="authStore.isLoading || isSocialLoading"
          required
        />
        <small v-if="passwordError" class="text-red-500">{{ passwordError }}</small>
      </div>

      <!-- Error general -->
      <Message v-if="authStore.error" severity="error" :closable="false">
        {{ authStore.error }}
      </Message>

      <!-- Botón de login -->
      <Button
        type="submit"
        label="Iniciar Sesión"
        class="w-full"
        :loading="authStore.isLoading"
        :disabled="authStore.isLoading || isSocialLoading"
      />
    </form>

    <!-- Separador -->
    <div class="relative my-6">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-gray-300"></div>
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-2 bg-white text-secondary-500">O continúa con</span>
      </div>
    </div>

    <!-- Social Login Buttons -->
    <div class="space-y-3">
      <!-- Google -->
      <Button
        type="button"
        class="w-full p-button-outlined"
        :loading="isSocialLoading && socialProvider === 'google'"
        :disabled="authStore.isLoading || isSocialLoading"
        @click="handleGoogleLogin"
      >
        <template #default>
          <img src="@/assets/images/google-icon.svg" alt="Google" class="w-5 h-5 mr-2" />
          <span>Continuar con Google</span>
        </template>
      </Button>

      <!-- Facebook -->
      <Button
        type="button"
        class="w-full p-button-outlined"
        :loading="isSocialLoading && socialProvider === 'facebook'"
        :disabled="authStore.isLoading || isSocialLoading"
        @click="handleFacebookLogin"
      >
        <template #default>
          <img src="@/assets/images/facebook-icon.svg" alt="Facebook" class="w-5 h-5 mr-2" />
          <span>Continuar con Facebook</span>
        </template>
      </Button>
    </div>

    <!-- Enlace para olvidé contraseña -->
    <div class="mt-6 text-center">
      <router-link to="/forgot-password" class="text-sm text-primary hover:underline">
        ¿Olvidaste tu contraseña?
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from 'primevue/usetoast'
import { profileApi } from '@/api/profile.api'
import type { SocialProvider } from '@/types/profile.types'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

const credentials = ref({
  email: '',
  password: ''
})

const emailError = ref('')
const passwordError = ref('')
const isSocialLoading = ref(false)
const socialProvider = ref<SocialProvider | null>(null)

// Cargar credenciales de prueba si existen en .env
onMounted(async () => {
  const testEmail = import.meta.env.VITE_TEST_EMAIL
  const testPassword = import.meta.env.VITE_TEST_PASSWORD

  if (testEmail && testPassword) {
    credentials.value.email = testEmail
    credentials.value.password = testPassword
  }

  // Manejar callback de OAuth si hay código en la URL
  const code = route.query.code as string
  const state = route.query.state as string
  if (code) {
    await handleOAuthCallback(code, state)
  }
})

const validateForm = (): boolean => {
  emailError.value = ''
  passwordError.value = ''

  if (!credentials.value.email) {
    emailError.value = 'El correo es requerido'
    return false
  }

  if (!credentials.value.password) {
    passwordError.value = 'La contraseña es requerida'
    return false
  }

  if (credentials.value.password.length < 6) {
    passwordError.value = 'La contraseña debe tener al menos 6 caracteres'
    return false
  }

  return true
}

const handleLogin = async () => {
  if (!validateForm()) return

  const success = await authStore.login(credentials.value)

  if (success) {
    handleLoginSuccess()
  }
}

function handleLoginSuccess() {
  toast.add({
    severity: 'success',
    summary: 'Bienvenido',
    detail: `Hola ${authStore.user?.name}`,
    life: 3000
  })

  // Caso 1: SuperAdmin sin tiendas propias → /admin/stores
  if (authStore.isSuperAdmin && authStore.stores.length === 0) {
    console.log('SuperAdmin sin tiendas, redirigiendo a /admin/stores')
    router.push('/admin/stores')
    return
  }

  // Caso 2: Usuario con 1 sola tienda → Seleccionarla automáticamente
  if (authStore.stores.length === 1 && !authStore.selectedStore) {
    console.log('Usuario con 1 tienda, seleccionando automáticamente...')
    authStore.selectStore(authStore.stores[0]).then(() => {
      router.push('/dashboard')
    })
    return
  }

  // Caso 3: Usuario con múltiples tiendas sin seleccionar → /store-selection
  if (authStore.hasMultipleStores && !authStore.selectedStore) {
    console.log('Usuario con múltiples tiendas, redirigiendo a /store-selection')
    router.push('/store-selection')
    return
  }

  // Caso 4: Ya tiene tienda seleccionada → /dashboard
  router.push('/dashboard')
}

function handleGoogleLogin() {
  socialProvider.value = 'google'
  isSocialLoading.value = true

  const redirectUri = `${window.location.origin}/login`
  const url = profileApi.getOAuthUrl('google', redirectUri)
  window.location.href = url
}

function handleFacebookLogin() {
  socialProvider.value = 'facebook'
  isSocialLoading.value = true

  const redirectUri = `${window.location.origin}/login`
  const url = profileApi.getOAuthUrl('facebook', redirectUri)
  window.location.href = url
}

async function handleOAuthCallback(code: string, state: string) {
  // Verificar state para prevenir CSRF
  const savedState = sessionStorage.getItem('oauth_state')
  if (state && savedState && state !== savedState) {
    toast.add({
      severity: 'error',
      summary: 'Error de seguridad',
      detail: 'Estado de autenticación inválido',
      life: 5000
    })
    // Limpiar URL
    router.replace('/login')
    return
  }

  sessionStorage.removeItem('oauth_state')
  isSocialLoading.value = true

  // Detectar proveedor (Google usa state con prefijo, o podemos detectar por referrer)
  const provider = detectProvider()
  socialProvider.value = provider

  try {
    const redirectUri = `${window.location.origin}/login`
    const result = await profileApi.handleOAuthCallback(provider, code, redirectUri)

    if (result.success && result.data) {
      // Guardar tokens
      localStorage.setItem('access_token', result.data.access_token)
      if (result.data.refresh_token) {
        localStorage.setItem('refresh_token', result.data.refresh_token)
      }
      localStorage.setItem('user', JSON.stringify(result.data.user))

      // Restaurar sesión en el store
      authStore.restoreSession()

      // Si es usuario nuevo, mostrar mensaje especial
      if (result.data.isNewUser) {
        toast.add({
          severity: 'success',
          summary: 'Cuenta creada',
          detail: 'Tu cuenta ha sido creada exitosamente',
          life: 3000
        })
      }

      handleLoginSuccess()
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: result.message || 'Error al iniciar sesión con red social',
        life: 5000
      })
    }
  } catch (err: any) {
    console.error('OAuth callback error:', err)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.message || 'Error al procesar la autenticación',
      life: 5000
    })
  } finally {
    isSocialLoading.value = false
    socialProvider.value = null
    // Limpiar URL de parámetros OAuth
    router.replace('/login')
  }
}

function detectProvider(): SocialProvider {
  // Intentar detectar por referrer
  const referrer = document.referrer
  if (referrer.includes('google.com') || referrer.includes('accounts.google')) {
    return 'google'
  }
  if (referrer.includes('facebook.com')) {
    return 'facebook'
  }
  // Default a Google
  return 'google'
}
</script>
