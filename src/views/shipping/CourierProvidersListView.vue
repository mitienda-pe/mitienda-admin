<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Proveedores de Courier</h1>
        <p class="text-gray-600 mt-1">Configura los servicios de courier para envíos de tu tienda</p>
      </div>
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
      <Card
        v-for="provider in store.providers"
        :key="provider.code"
        class="cursor-pointer hover:shadow-lg transition-shadow border-2"
        :class="provider.configured ? 'border-green-200 hover:border-primary' : 'border-transparent hover:border-primary'"
        @click="router.push(`/shipping/couriers/${provider.code}`)"
      >
        <template #header>
          <div
            class="relative flex items-center justify-center p-6"
            :class="courierGradients[provider.code] || 'bg-gradient-to-br from-gray-50 to-gray-100'"
          >
            <Tag
              v-if="betaCouriers.includes(provider.code)"
              value="Beta"
              severity="warn"
              class="!absolute top-2 right-2 text-xs"
            />
            <img
              v-if="courierLogos[provider.code]"
              :src="courierLogos[provider.code]"
              :alt="provider.name"
              class="h-20 object-contain"
            />
            <i v-else class="pi pi-truck text-5xl text-secondary-400"></i>
          </div>
        </template>
        <template #title>
          <div class="flex items-center justify-between">
            <span>{{ provider.name }}</span>
            <Tag
              v-if="provider.configured"
              value="Configurado"
              severity="success"
              icon="pi pi-check"
            />
            <Tag
              v-else
              value="Sin configurar"
              severity="secondary"
            />
          </div>
        </template>
        <template #content>
          <p class="text-sm text-gray-600">
            {{ stripHtml(provider.description) || getDefaultDescription(provider.code) }}
          </p>
          <div v-if="provider.configured && provider.environment" class="mt-2">
            <Tag
              :value="provider.environment === 'produccion' ? 'Producción' : 'Prueba'"
              :severity="provider.environment === 'produccion' ? 'info' : 'warn'"
              class="text-xs"
            />
          </div>
          <div class="mt-4 flex items-center gap-2 text-sm">
            <i class="pi pi-cog text-primary"></i>
            <span class="text-primary font-medium">
              {{ provider.configured ? 'Editar configuración' : 'Configurar courier' }}
            </span>
          </div>
        </template>
      </Card>
    </div>

    <!-- Information Box -->
    <Card class="bg-blue-50 border border-blue-200">
      <template #content>
        <div class="flex gap-4">
          <i class="pi pi-info-circle text-blue-600 text-2xl"></i>
          <div>
            <h3 class="font-semibold text-blue-900 mb-2">Sobre los proveedores de courier</h3>
            <ul class="text-sm text-blue-800 space-y-1">
              <li>• Cada proveedor requiere una cuenta activa con sus respectivas credenciales</li>
              <li>• Puedes configurar múltiples couriers simultáneamente</li>
              <li>• Usa el entorno de prueba (sandbox) para verificar la integración antes de activar en producción</li>
              <li>• Los simuladores de precio te permiten probar sin afectar envíos reales</li>
            </ul>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCourierProvidersStore } from '@/stores/courier-providers.store'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'

import urbanerLogo from '@/assets/images/urbaner-logo.png'
import minutos99Logo from '@/assets/images/logo_99minutos.svg'
import chazkiLogo from '@/assets/images/logo-chazki.webp'
import nirexLogo from '@/assets/images/logo-nirex.png'
import urbanoLogo from '@/assets/images/logo-urbano.png'
import yangoLogo from '@/assets/images/logo-yango.svg'
import hopLogo from '@/assets/images/logo-hop.svg'

const router = useRouter()
const store = useCourierProvidersStore()

const courierLogos: Record<string, string> = {
  urbaner: urbanerLogo,
  '99minutos': minutos99Logo,
  chazki: chazkiLogo,
  nirex: nirexLogo,
  urbano: urbanoLogo,
  yango: yangoLogo,
  hop: hopLogo,
}

const betaCouriers = ['chazki', 'nirex', 'urbano', 'yango', 'hop']

function stripHtml(text: string): string {
  if (!text) return ''
  return text.replace(/<[^>]*>/g, '')
}

const courierGradients: Record<string, string> = {
  urbaner: 'bg-gradient-to-br from-blue-50 to-blue-100',
  '99minutos': 'bg-gradient-to-br from-orange-50 to-orange-100',
  chazki: 'bg-gradient-to-br from-teal-50 to-teal-100',
  nirex: 'bg-gradient-to-br from-purple-50 to-purple-100',
  urbano: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
  yango: 'bg-gradient-to-br from-red-50 to-red-100',
  hop: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
}

function getDefaultDescription(code: string): string {
  const descriptions: Record<string, string> = {
    urbaner: 'Servicio de courier para envíos Express, Same Day y Next Day en Lima y ciudades principales.',
    '99minutos': 'Plataforma de logística para envíos Same Day y Next Day en Perú y Latinoamérica.',
    chazki: 'Servicio de courier para envíos Regular, Express y Programado en Lima y ciudades principales.',
    nirex: 'Plataforma de logística last-mile para envíos en Lima Metropolitana y Callao.',
    urbano: 'Servicio de courier y logística a nivel nacional con distribución terrestre, aérea y puntos de recojo.',
    yango: 'Plataforma de delivery express con courier, express y cargo para entregas rápidas en la ciudad.',
    hop: 'Plataforma logística con red de puntos de entrega y retiro en Argentina, Uruguay y Perú.',
  }
  return descriptions[code] || ''
}

onMounted(() => {
  store.fetchProviders()
})
</script>
