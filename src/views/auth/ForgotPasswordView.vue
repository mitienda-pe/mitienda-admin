<template>
  <div>
    <h2 class="text-2xl font-bold text-center mb-2 text-secondary">Recuperar contraseña</h2>
    <p class="text-center text-secondary-500 mb-6">
      Ingresa tu correo electrónico y te enviaremos un enlace para cambiar tu contraseña.
    </p>

    <!-- Estado: Formulario -->
    <form v-if="!emailSent" @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-secondary-700 mb-2">
          Correo Electrónico
        </label>
        <InputText
          id="email"
          v-model="email"
          type="email"
          placeholder="tu@email.com"
          class="w-full"
          :class="{ 'p-invalid': emailError }"
          :disabled="isLoading"
          required
        />
        <small v-if="emailError" class="text-red-500">{{ emailError }}</small>
      </div>

      <Message v-if="error" severity="error" :closable="false">
        {{ error }}
      </Message>

      <Button
        type="submit"
        label="Enviar enlace"
        icon="pi pi-envelope"
        class="w-full"
        :loading="isLoading"
      />
    </form>

    <!-- Estado: Email enviado -->
    <div v-else class="text-center space-y-4">
      <div class="flex justify-center mb-4">
        <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <i class="pi pi-check text-3xl text-green-600"></i>
        </div>
      </div>
      <p class="text-secondary-700">
        Hemos enviado un enlace a <strong>{{ email }}</strong> para que puedas cambiar tu contraseña.
      </p>
      <p class="text-sm text-secondary-500">
        Revisa tu bandeja de entrada y la carpeta de spam. El enlace expira en 1 hora.
      </p>
      <Button
        label="Enviar de nuevo"
        icon="pi pi-refresh"
        severity="secondary"
        text
        :loading="isLoading"
        @click="handleSubmit"
        class="mt-2"
      />
    </div>

    <!-- Volver al login -->
    <div class="mt-6 text-center">
      <router-link to="/login" class="text-sm text-primary hover:underline">
        <i class="pi pi-arrow-left mr-1"></i>Volver a iniciar sesión
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { authApi } from '@/api/auth.api'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'

const email = ref('')
const emailError = ref('')
const error = ref('')
const isLoading = ref(false)
const emailSent = ref(false)

async function handleSubmit() {
  emailError.value = ''
  error.value = ''

  if (!email.value || !email.value.includes('@')) {
    emailError.value = 'Ingresa un correo electrónico válido'
    return
  }

  isLoading.value = true

  try {
    await authApi.forgotPassword({ email: email.value })
    emailSent.value = true
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Error al enviar el enlace. Intenta de nuevo.'
  } finally {
    isLoading.value = false
  }
}
</script>
