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
          :disabled="authStore.isLoading"
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
          :disabled="authStore.isLoading"
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
        :disabled="authStore.isLoading"
      />
    </form>

    <!-- Enlace para olvidé contraseña (futuro) -->
    <div class="mt-4 text-center">
      <a href="#" class="text-sm text-primary hover:underline">¿Olvidaste tu contraseña?</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const credentials = ref({
  email: '',
  password: ''
})

const emailError = ref('')
const passwordError = ref('')

// Cargar credenciales de prueba si existen en .env
onMounted(() => {
  const testEmail = import.meta.env.VITE_TEST_EMAIL
  const testPassword = import.meta.env.VITE_TEST_PASSWORD

  if (testEmail && testPassword) {
    credentials.value.email = testEmail
    credentials.value.password = testPassword
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
    toast.add({
      severity: 'success',
      summary: 'Bienvenido',
      detail: `Hola ${authStore.user?.name}`,
      life: 3000
    })

    // Caso 1: SuperAdmin sin tiendas propias → /admin/stores
    if (authStore.isSuperAdmin && authStore.stores.length === 0) {
      console.log('🛡️ SuperAdmin sin tiendas, redirigiendo a /admin/stores')
      router.push('/admin/stores')
      return
    }

    // Caso 2: Usuario con 1 sola tienda → Seleccionarla automáticamente
    if (authStore.stores.length === 1 && !authStore.selectedStore) {
      console.log('🏪 Usuario con 1 tienda, seleccionando automáticamente...')
      await authStore.selectStore(authStore.stores[0])
      router.push('/dashboard')
      return
    }

    // Caso 3: Usuario con múltiples tiendas sin seleccionar → /store-selection
    if (authStore.hasMultipleStores && !authStore.selectedStore) {
      console.log('🏪 Usuario con múltiples tiendas, redirigiendo a /store-selection')
      router.push('/store-selection')
      return
    }

    // Caso 4: Ya tiene tienda seleccionada → /dashboard
    router.push('/dashboard')
  }
}
</script>
