<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useIntegrationProvidersStore } from '@/stores/integration-providers.store'
import { AppBadge, AppEmptyState, AppErrorState } from '@/components/ui'
import type { IntegrationProvider } from '@/types/integration-provider.types'

const store = useIntegrationProvidersStore()
const router = useRouter()

onMounted(() => {
  store.fetchProviders()
})

const adsProviders = computed(() =>
  store.providers.filter(p => p.code === 'facebook_capi')
)

const emailProviders = computed(() =>
  store.providers.filter(p => p.code !== 'facebook_capi')
)

const providerIcons: Record<string, string> = {
  facebook_capi: 'pi pi-facebook',
  doppler: 'pi pi-envelope',
  icomm: 'pi pi-envelope',
  mailchimp: 'pi pi-envelope',
  klaviyo: 'pi pi-chart-bar',
  brevo: 'pi pi-envelope',
  mailerlite: 'pi pi-envelope',
  sendy: 'pi pi-send',
  emailoctopus: 'pi pi-envelope',
  sendfox: 'pi pi-envelope'
}

function navigateToProvider(provider: IntegrationProvider) {
  if (provider.config_url) {
    router.push(provider.config_url)
  } else {
    router.push(`/integrations/providers/${provider.code}`)
  }
}

function getStatusLabel(provider: IntegrationProvider): string {
  if (!provider.configured) return 'Sin configurar'
  if (provider.enabled) return 'Activo'
  return 'Pausado'
}

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

function getStatusVariant(provider: IntegrationProvider): BadgeVariant {
  if (!provider.configured) return 'neutral'
  if (provider.enabled) return 'success'
  return 'warning'
}
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Proveedores de Integración</h1>
      <p class="text-gray-500 mt-1">
        Conecta tu tienda con plataformas de marketing, publicidad y automatización
      </p>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-12">
      <i class="pi pi-spinner pi-spin text-4xl text-primary" />
    </div>

    <!-- Error -->
    <AppErrorState v-else-if="store.error" :message="store.error" @retry="store.fetchProviders" />

    <!-- Empty -->
    <AppEmptyState
      v-else-if="!store.providers.length"
      title="Sin proveedores"
      description="No hay proveedores de integración disponibles"
    />

    <template v-else>
      <!-- Ads Section -->
      <div v-if="adsProviders.length" class="mb-8">
        <h2 class="text-lg font-semibold text-gray-700 mb-4">Publicidad y Anuncios</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="provider in adsProviders"
            :key="provider.code"
            class="bg-white border rounded-lg p-5 cursor-pointer hover:shadow-md transition-shadow"
            :class="{
              'border-green-400': provider.configured && provider.enabled,
              'border-yellow-400': provider.configured && !provider.enabled
            }"
            @click="navigateToProvider(provider)"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <i :class="providerIcons[provider.code] || 'pi pi-box'" class="text-xl text-blue-600" />
                </div>
                <div>
                  <h3 class="font-semibold text-gray-800">{{ provider.name }}</h3>
                </div>
              </div>
              <AppBadge :variant="getStatusVariant(provider)">
                {{ getStatusLabel(provider) }}
              </AppBadge>
            </div>
            <p class="text-sm text-gray-500 mb-3">{{ provider.description }}</p>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="evt in provider.supported_events"
                :key="evt"
                class="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded"
              >
                {{ evt }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Email Marketing Section -->
      <div v-if="emailProviders.length">
        <h2 class="text-lg font-semibold text-gray-700 mb-4">Email Marketing</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="provider in emailProviders"
            :key="provider.code"
            class="bg-white border rounded-lg p-5 cursor-pointer hover:shadow-md transition-shadow"
            :class="{
              'border-green-400': provider.configured && provider.enabled,
              'border-yellow-400': provider.configured && !provider.enabled
            }"
            @click="navigateToProvider(provider)"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                  <i :class="providerIcons[provider.code] || 'pi pi-envelope'" class="text-xl text-primary" />
                </div>
                <div>
                  <h3 class="font-semibold text-gray-800">{{ provider.name }}</h3>
                </div>
              </div>
              <AppBadge :variant="getStatusVariant(provider)">
                {{ getStatusLabel(provider) }}
              </AppBadge>
            </div>
            <p class="text-sm text-gray-500 mb-3">{{ provider.description }}</p>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="evt in provider.supported_events"
                :key="evt"
                class="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded"
              >
                {{ evt }}
              </span>
            </div>
            <div v-if="provider.last_error" class="mt-2 text-xs text-red-500 truncate" :title="provider.last_error">
              <i class="pi pi-exclamation-triangle mr-1" />{{ provider.last_error }}
            </div>
          </div>
        </div>
      </div>

      <!-- Info Box -->
      <div class="mt-8 bg-gray-50 border rounded-lg p-6">
        <h3 class="font-semibold text-gray-700 mb-2">
          <i class="pi pi-info-circle mr-2" />Acerca de las integraciones
        </h3>
        <p class="text-sm text-gray-600">
          Las integraciones de marketing sincronizan automáticamente los datos de tu tienda con
          plataformas externas. Cuando se crea un cliente, una orden o se actualiza un producto,
          los datos se envían a los proveedores que hayas configurado y habilitado.
        </p>
      </div>
    </template>
  </div>
</template>
