<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-secondary">Proveedores de Courier</h1>
      <p class="text-sm text-secondary-500 mt-1">
        Configura los servicios de courier para envíos de tu tienda.
      </p>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="store.error" severity="error" :closable="false">
      {{ store.error }}
    </Message>

    <!-- Providers Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="provider in store.providers"
        :key="provider.code"
        class="bg-white rounded-lg shadow border-2 transition-colors cursor-pointer hover:shadow-md"
        :class="{
          'border-green-200': provider.configured && provider.enabled,
          'border-yellow-200': provider.configured && !provider.enabled,
          'border-transparent': !provider.configured,
        }"
        @click="router.push(`/shipping/couriers/${provider.code}`)"
      >
        <div class="p-6">
          <!-- Logo & Name -->
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
              <i class="pi pi-truck text-2xl text-secondary-500"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-secondary-800">{{ provider.name }}</h3>
              <p class="text-xs text-secondary-400">{{ provider.code }}</p>
            </div>
          </div>

          <!-- Description -->
          <p class="text-sm text-secondary-500 mb-4 line-clamp-2">
            {{ provider.description || getDefaultDescription(provider.code) }}
          </p>

          <!-- Status -->
          <div class="flex items-center gap-2">
            <span
              v-if="provider.configured"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700"
            >
              <i class="pi pi-check-circle mr-1"></i>
              Configurado
            </span>
            <span
              v-else
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary-100 text-secondary-500"
            >
              <i class="pi pi-circle mr-1"></i>
              Sin configurar
            </span>

            <span
              v-if="provider.configured && provider.environment"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              :class="{
                'bg-blue-100 text-blue-700': provider.environment === 'produccion',
                'bg-orange-100 text-orange-700': provider.environment === 'prueba',
              }"
            >
              {{ provider.environment === 'produccion' ? 'Producción' : 'Prueba' }}
            </span>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-3 bg-secondary-50 border-t rounded-b-lg">
          <span class="text-sm text-primary font-medium">
            {{ provider.configured ? 'Editar configuración' : 'Configurar courier' }}
            <i class="pi pi-arrow-right ml-1"></i>
          </span>
        </div>
      </div>
    </div>

    <!-- Info Box -->
    <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div class="flex gap-3">
        <i class="pi pi-info-circle text-blue-500 mt-0.5"></i>
        <div class="text-sm text-blue-700">
          <p class="font-medium mb-1">Sobre los proveedores de courier</p>
          <p>
            Configura las credenciales de los servicios de courier para habilitar envíos
            a través de sus APIs. Cada proveedor requiere una cuenta activa con sus
            respectivas credenciales (API Key, etc.).
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCourierProvidersStore } from '@/stores/courier-providers.store'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'

const router = useRouter()
const store = useCourierProvidersStore()

function getDefaultDescription(code: string): string {
  const descriptions: Record<string, string> = {
    urbaner: 'Servicio de courier para envíos Express, Same Day y Next Day en Lima y ciudades principales.',
    '99minutos': 'Plataforma de logística para envíos Same Day y Next Day en Perú y Latinoamérica.',
  }
  return descriptions[code] || ''
}

onMounted(() => {
  store.fetchProviders()
})
</script>
