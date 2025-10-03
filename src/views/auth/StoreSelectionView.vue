<template>
  <div>
    <h2 class="text-2xl font-bold text-center mb-2 text-secondary">Selecciona tu Tienda</h2>
    <p class="text-center text-secondary-500 mb-6">Elige la tienda con la que deseas trabajar</p>

    <div v-if="authStore.isLoading" class="text-center py-8">
      <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
    </div>

    <div v-else class="space-y-3">
      <Card
        v-for="store in authStore.stores"
        :key="store.id"
        class="cursor-pointer hover:shadow-lg transition-shadow"
        @click="handleSelectStore(store)"
      >
        <template #content>
          <div class="flex items-center gap-4">
            <!-- Logo de la tienda -->
            <div class="w-16 h-16 bg-primary-50 rounded-lg flex items-center justify-center">
              <i v-if="!store.logo" class="pi pi-shop text-2xl text-primary"></i>
              <img v-else :src="store.logo" :alt="store.name" class="w-full h-full object-cover rounded-lg">
            </div>

            <!-- Info de la tienda -->
            <div class="flex-1">
              <h3 class="font-semibold text-lg text-secondary">{{ store.name }}</h3>
              <p class="text-sm text-secondary-500">{{ store.url || store.slug }}</p>
              <div class="flex gap-2 mt-1">
                <span class="text-xs px-2 py-1 bg-primary-50 text-primary rounded">
                  {{ store.plan }}
                </span>
                <span
                  class="text-xs px-2 py-1 rounded"
                  :class="store.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'"
                >
                  {{ store.status === 'active' ? 'Activa' : 'Inactiva' }}
                </span>
              </div>
            </div>

            <!-- Icono seleccionado -->
            <div v-if="authStore.selectedStore?.id === store.id">
              <i class="pi pi-check-circle text-2xl text-green-500"></i>
            </div>
            <div v-else>
              <i class="pi pi-chevron-right text-secondary-400"></i>
            </div>
          </div>
        </template>
      </Card>

      <Message v-if="authStore.error" severity="error" :closable="false">
        {{ authStore.error }}
      </Message>
    </div>

    <!-- Botón de logout -->
    <div class="mt-6">
      <Button
        label="Cerrar Sesión"
        icon="pi pi-sign-out"
        class="w-full"
        outlined
        @click="handleLogout"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Message from 'primevue/message'
import type { Store } from '@/types/auth.types'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const handleSelectStore = async (store: Store) => {
  const success = await authStore.selectStore(store)

  if (success) {
    toast.add({
      severity: 'success',
      summary: 'Tienda seleccionada',
      detail: `Ahora estás trabajando en ${store.name}`,
      life: 3000
    })

    router.push('/dashboard')
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>
