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

// Category definitions with display order
const categoryConfig: Record<string, { label: string; icon: string; iconColor: string; bgColor: string }> = {
  chat:               { label: 'Chat en vivo',                icon: 'pi pi-comments',   iconColor: 'text-blue-600',   bgColor: 'bg-blue-50' },
  analytics:          { label: 'Análisis y comportamiento',   icon: 'pi pi-chart-bar',  iconColor: 'text-purple-600', bgColor: 'bg-purple-50' },
  push_notifications: { label: 'Notificaciones push',         icon: 'pi pi-bell',       iconColor: 'text-orange-600', bgColor: 'bg-orange-50' },
  lead_capture:       { label: 'Captura de leads y popups',   icon: 'pi pi-megaphone',  iconColor: 'text-pink-600',   bgColor: 'bg-pink-50' },
  ads:                { label: 'Publicidad y Anuncios',        icon: 'pi pi-megaphone',  iconColor: 'text-blue-600',   bgColor: 'bg-blue-50' },
  email_marketing:    { label: 'Email Marketing',              icon: 'pi pi-envelope',   iconColor: 'text-primary',    bgColor: 'bg-teal-50' },
}

const categoryOrder = ['chat', 'analytics', 'push_notifications', 'lead_capture', 'ads', 'email_marketing']

const categories = computed(() => {
  const groups: Record<string, IntegrationProvider[]> = {}

  for (const p of store.providers) {
    // Infer category for legacy providers that don't have one
    const cat = p.category || (p.code === 'facebook_capi' ? 'ads' : 'email_marketing')
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(p)
  }

  return categoryOrder
    .filter(key => groups[key] && groups[key].length > 0)
    .map(key => ({
      key,
      ...categoryConfig[key],
      providers: groups[key],
    }))
})

const providerIcons: Record<string, string> = {
  // Ads
  facebook_capi: 'pi pi-facebook',
  tiktok_pixel: 'pi pi-video',
  // Email Marketing
  doppler: 'pi pi-envelope',
  icomm: 'pi pi-envelope',
  mailchimp: 'pi pi-envelope',
  klaviyo: 'pi pi-chart-bar',
  brevo: 'pi pi-envelope',
  mailerlite: 'pi pi-envelope',
  sendy: 'pi pi-send',
  emailoctopus: 'pi pi-envelope',
  sendfox: 'pi pi-envelope',
  // Chat
  tawkto: 'pi pi-comments',
  livechat: 'pi pi-comments',
  chatway: 'pi pi-comments',
  chatify: 'pi pi-comments',
  // Analytics
  hotjar: 'pi pi-chart-bar',
  clarity: 'pi pi-chart-bar',
  // Push
  onesignal: 'pi pi-bell',
  // Lead Capture
  optinmonster: 'pi pi-megaphone',
  privy: 'pi pi-megaphone',
  bdow: 'pi pi-megaphone',
  hellobar: 'pi pi-megaphone',
  poptin: 'pi pi-megaphone',
  // Analytics (additional)
  crazyegg: 'pi pi-chart-bar',
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
      <!-- Dynamic category sections -->
      <div
        v-for="category in categories"
        :key="category.key"
        class="mb-8"
      >
        <h2 class="text-lg font-semibold text-gray-700 mb-4">{{ category.label }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="provider in category.providers"
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
                <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="category.bgColor">
                  <i :class="[providerIcons[provider.code] || category.icon, 'text-xl', category.iconColor]" />
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
            <div v-if="provider.supported_events.length" class="flex flex-wrap gap-1">
              <span
                v-for="evt in provider.supported_events"
                :key="evt"
                class="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded"
              >
                {{ evt }}
              </span>
            </div>
            <div v-else-if="provider.frontend_only" class="flex items-center gap-1 text-xs text-gray-400">
              <i class="pi pi-globe" />
              <span>Se carga en tu tienda online</span>
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
          Las integraciones conectan tu tienda con plataformas externas. Los widgets de chat,
          analytics y popups se cargan automáticamente en tu tienda online cuando están activados.
          Las integraciones de email marketing sincronizan datos de clientes y pedidos con tus
          plataformas de marketing.
        </p>
      </div>
    </template>
  </div>
</template>
