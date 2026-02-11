<template>
  <div>
    <!-- Validando token -->
    <div v-if="isValidating" class="flex flex-col items-center justify-center py-8">
      <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      <p class="mt-4 text-secondary-500">Verificando enlace...</p>
    </div>

    <!-- Token inválido o expirado -->
    <div v-else-if="tokenInvalid" class="text-center space-y-4">
      <div class="flex justify-center mb-4">
        <div class="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <i class="pi pi-times text-3xl text-red-600"></i>
        </div>
      </div>
      <h2 class="text-2xl font-bold text-secondary">Enlace inválido</h2>
      <p class="text-secondary-500">{{ tokenError }}</p>
      <router-link to="/forgot-password">
        <Button label="Solicitar nuevo enlace" icon="pi pi-refresh" class="mt-4" />
      </router-link>
      <div class="mt-4">
        <router-link to="/login" class="text-sm text-primary hover:underline">
          <i class="pi pi-arrow-left mr-1"></i>Volver a iniciar sesión
        </router-link>
      </div>
    </div>

    <!-- Contraseña cambiada exitosamente -->
    <div v-else-if="resetSuccess" class="text-center space-y-4">
      <div class="flex justify-center mb-4">
        <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <i class="pi pi-check text-3xl text-green-600"></i>
        </div>
      </div>
      <h2 class="text-2xl font-bold text-secondary">Contraseña actualizada</h2>
      <p class="text-secondary-500">
        Tu contraseña ha sido cambiada exitosamente. Serás redirigido al inicio de sesión.
      </p>
      <router-link to="/login">
        <Button label="Iniciar sesión" icon="pi pi-sign-in" class="mt-4" />
      </router-link>
    </div>

    <!-- Formulario de nueva contraseña -->
    <div v-else>
      <h2 class="text-2xl font-bold text-center mb-2 text-secondary">Nueva contraseña</h2>
      <p class="text-center text-secondary-500 mb-6">
        Ingresa tu nueva contraseña.
      </p>

      <form @submit.prevent="handleReset" class="space-y-4">
        <div>
          <label for="password" class="block text-sm font-medium text-secondary-700 mb-2">
            Nueva contraseña
          </label>
          <Password
            id="password"
            v-model="password"
            :feedback="true"
            toggleMask
            class="w-full"
            inputClass="w-full"
            placeholder="Mínimo 8 caracteres"
            :disabled="isLoading"
          />
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-secondary-700 mb-2">
            Confirmar contraseña
          </label>
          <Password
            id="confirmPassword"
            v-model="confirmPassword"
            :feedback="false"
            toggleMask
            class="w-full"
            inputClass="w-full"
            placeholder="Repite tu contraseña"
            :disabled="isLoading"
          />
        </div>

        <small v-if="formError" class="text-red-500">{{ formError }}</small>

        <Message v-if="error" severity="error" :closable="false">
          {{ error }}
        </Message>

        <Button
          type="submit"
          label="Cambiar contraseña"
          icon="pi pi-key"
          class="w-full"
          :loading="isLoading"
          :disabled="!password || !confirmPassword"
        />
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authApi } from '@/api/auth.api'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()

const token = ref('')
const password = ref('')
const confirmPassword = ref('')
const formError = ref('')
const error = ref('')
const isLoading = ref(false)
const isValidating = ref(true)
const tokenInvalid = ref(false)
const tokenError = ref('')
const resetSuccess = ref(false)

onMounted(async () => {
  token.value = (route.query.token as string) || ''

  if (!token.value) {
    tokenInvalid.value = true
    tokenError.value = 'No se proporcionó un token de restablecimiento.'
    isValidating.value = false
    return
  }

  try {
    const response = await authApi.validateResetToken({ token: token.value })
    if (response.success && response.data?.valid) {
      // Token válido, mostrar formulario
    } else {
      tokenInvalid.value = true
      tokenError.value = response.data?.message || 'El enlace ha expirado o ya fue utilizado.'
    }
  } catch {
    tokenInvalid.value = true
    tokenError.value = 'Error al verificar el enlace. Intenta de nuevo.'
  } finally {
    isValidating.value = false
  }
})

async function handleReset() {
  formError.value = ''
  error.value = ''

  if (password.value.length < 8) {
    formError.value = 'La contraseña debe tener al menos 8 caracteres'
    return
  }

  if (password.value !== confirmPassword.value) {
    formError.value = 'Las contraseñas no coinciden'
    return
  }

  isLoading.value = true

  try {
    const response = await authApi.resetPassword({
      token: token.value,
      password: password.value,
      password_confirmation: confirmPassword.value
    })

    if (response.success) {
      resetSuccess.value = true
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } else {
      error.value = response.message || 'Error al cambiar la contraseña'
    }
  } catch (e: any) {
    const msg = e?.response?.data?.message || e?.response?.data?.messages?.error
    error.value = msg || 'Error al cambiar la contraseña. El enlace puede haber expirado.'
  } finally {
    isLoading.value = false
  }
}
</script>
