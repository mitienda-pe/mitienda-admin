<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useIntegrationProvidersStore } from '@/stores/integration-providers.store'
import { usePaymentGatewaysStore } from '@/stores/payment-gateways.store'
import { useCourierProvidersStore } from '@/stores/courier-providers.store'
import { usePlanStore } from '@/stores/plan.store'
import { useAuthStore } from '@/stores/auth.store'
import { useAdminStore } from '@/stores/admin.store'
import { AppBadge, AppEmptyState, AppErrorState } from '@/components/ui'
import type { IntegrationProvider } from '@/types/integration-provider.types'
import type { PlanModule } from '@/types/plan.types'

const store = useIntegrationProvidersStore()
const paymentStore = usePaymentGatewaysStore()
const courierStore = useCourierProvidersStore()
const planStore = usePlanStore()
const authStore = useAuthStore()
const adminStore = useAdminStore()
const router = useRouter()

onMounted(() => {
  store.fetchProviders()
  paymentStore.fetchGateways()
  courierStore.fetchProviders()
})

// Minimum plan required per integration category.
// Plan tiers (ascending): Micro → Small → Medium → Large.
/**
 * El mínimo de plan ya NO vive acá: lo sirve el backend con cada proveedor
 * (`min_plan`, de `IntegrationPlanGate`), que es además quien lo hace cumplir.
 * Esta vista pinta el candado; no decide quién pasa.
 *
 * Tener la copia acá significaba que el panel y la API podían discrepar, y
 * discreparon: el candado era decorativo —ninguna ruta validaba el plan— y al
 * mismo tiempo escondía proveedores que la API sí habría aceptado.
 */

const PLAN_RANK: Record<string, number> = {
  Micro: 1,
  Small: 2,
  Medium: 3,
  Large: 4,
}

const skipPlanGate = computed(() => authStore.isSuperAdmin || adminStore.isImpersonating)

const currentPlanRank = computed(() => {
  const name = planStore.plan?.name
  return name ? (PLAN_RANK[name] ?? 0) : 0
})

/**
 * ¿El plan de la tienda se queda corto para este proveedor?
 *
 * Fuera de la jerarquía (`Prueba Gratis`, `PDV`, `Plan a la medida`…) devuelve
 * false, igual que el backend: son 72 tiendas vigentes, 63 de ellas en prueba, y
 * rankearlas a ojo les cambiaría el acceso sin que nadie lo decidiera.
 */
function planFallsShort(provider: IntegrationProvider): boolean {
  const min = provider.min_plan
  if (!min) return false
  if (!currentPlanRank.value) return false
  return currentPlanRank.value < (PLAN_RANK[min] ?? 0)
}


/**
 * El candado que ve el comerciante: no puede activarla y la API lo rechazaría.
 *
 * El superadmin y quien impersona quedan fuera, pero no a ciegas: ven el aviso
 * de `planInfoFor`, que dice qué plan haría falta. Que el candado simplemente
 * desapareciera fue lo que dejó activar el Asistente IA en una tienda Small sin
 * que nada avisara de que el widget no se iba a publicar.
 */
function isProviderLocked(provider: IntegrationProvider): boolean {
  if (skipPlanGate.value) return false
  return planFallsShort(provider)
}

/**
 * Lo que ve el superadmin en vez del candado: qué plan pide y cuál tiene la
 * tienda. Sin esto, soporte activa algo que para el comerciante no existe.
 */
function planInfoFor(provider: IntegrationProvider): string | null {
  if (!skipPlanGate.value || !planFallsShort(provider)) return null
  return `Requiere ${provider.min_plan} · esta tienda es ${planStore.plan?.name}`
}

/**
 * El mismo modal del menú de navegación, pero nombrando el proveedor.
 *
 * Antes armaba el módulo sintético con el nombre de la CATEGORÍA, así que quien
 * hacía clic en Tawk.to leía «Chat en vivo» y tenía que adivinar la relación.
 */
function showProviderUpgrade(provider: IntegrationProvider, categoryLabel: string) {
  const synthetic: PlanModule = {
    code: `integration_${provider.code}`,
    name: provider.name,
    group: `Integraciones · ${categoryLabel}`,
    enabled: false,
    minimum_plan: provider.min_plan ?? null,
  }
  planStore.showUpgradeModal(synthetic)
}

/**
 * La categoría entera queda bloqueada cuando ninguno de sus proveedores se
 * puede activar. Con el Asistente IA en beta, `chat` ya no lo está: el aviso de
 * cabecera mentiría sobre la tarjeta que sí se puede usar.
 */
function isCategoryLocked(providers: IntegrationProvider[]): boolean {
  return providers.length > 0 && providers.every((p) => isProviderLocked(p))
}

function categoryMinPlan(providers: IntegrationProvider[]): string | null {
  return providers.find((p) => p.min_plan)?.min_plan ?? null
}

// Category definitions with display order
const categoryConfig: Record<string, { label: string; icon: string; iconColor: string; bgColor: string }> = {
  payments:           { label: 'Pasarelas de Pago',             icon: 'pi pi-credit-card', iconColor: 'text-green-600',  bgColor: 'bg-green-50' },
  shipping:           { label: 'Servicios de Reparto',          icon: 'pi pi-truck',       iconColor: 'text-amber-600',  bgColor: 'bg-amber-50' },
  ads:                { label: 'Publicidad y Anuncios',         icon: 'pi pi-megaphone',   iconColor: 'text-primary',   bgColor: 'bg-primary/5' },
  analytics:          { label: 'Análisis y comportamiento',     icon: 'pi pi-chart-bar',   iconColor: 'text-purple-600', bgColor: 'bg-purple-50' },
  email_marketing:    { label: 'Email Marketing',               icon: 'pi pi-envelope',    iconColor: 'text-primary',    bgColor: 'bg-teal-50' },
  fulfillment:        { label: 'Fulfillment y Logística 3PL',   icon: 'pi pi-box',         iconColor: 'text-primary', bgColor: 'bg-primary/5' },
  erp:                { label: 'ERP y Contabilidad',             icon: 'pi pi-server',      iconColor: 'text-slate-600',  bgColor: 'bg-slate-50' },
  crm:                { label: 'CRM',                          icon: 'pi pi-users',       iconColor: 'text-primary',    bgColor: 'bg-primary/5' },
  lead_capture:       { label: 'Captura de leads y popups',     icon: 'pi pi-megaphone',   iconColor: 'text-pink-600',   bgColor: 'bg-pink-50' },
  chat:               { label: 'Chat en vivo',                  icon: 'pi pi-comments',    iconColor: 'text-primary',   bgColor: 'bg-primary/5' },
  push_notifications: { label: 'Notificaciones push',           icon: 'pi pi-bell',        iconColor: 'text-orange-600', bgColor: 'bg-orange-50' },
}

const categoryOrder = ['payments', 'shipping', 'ads', 'analytics', 'crm', 'email_marketing', 'fulfillment', 'erp', 'lead_capture', 'chat', 'push_notifications']

// Map payment gateways to IntegrationProvider shape
const paymentProviders = computed<IntegrationProvider[]>(() =>
  paymentStore.gateways.map(g => ({
    code: `pg_${g.code}`,
    name: g.name,
    description: g.description,
    category: 'payments',
    supported_events: [],
    config_fields: [],
    configured: g.configured,
    enabled: g.configured,
    frontend_only: false,
    config_url: `/payment-gateways/${g.code}`,
  }))
)

// Map courier providers to IntegrationProvider shape
const courierProviders = computed<IntegrationProvider[]>(() =>
  courierStore.providers.map(c => ({
    code: `cr_${c.code}`,
    name: c.name,
    description: c.description,
    category: 'shipping',
    supported_events: [],
    config_fields: [],
    configured: c.configured,
    enabled: c.configured,
    frontend_only: false,
    config_url: `/shipping/couriers/${c.code}`,
  }))
)

const categories = computed(() => {
  const groups: Record<string, IntegrationProvider[]> = {}

  // Inject payment gateways
  if (paymentProviders.value.length) {
    groups['payments'] = paymentProviders.value
  }

  // Inject courier providers
  if (courierProviders.value.length) {
    groups['shipping'] = courierProviders.value
  }

  // Integration providers (from API)
  for (const p of store.providers) {
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

const isLoading = computed(() => store.isLoading && !paymentStore.gateways.length && !courierStore.providers.length)
const hasData = computed(() => store.providers.length || paymentStore.gateways.length || courierStore.providers.length)

const providerIcons: Record<string, string> = {
  // Ads
  facebook_capi: 'pi pi-facebook',
  tiktok_pixel: 'pi pi-video',
  // Email Marketing
  doppler: 'pi pi-envelope',
  icomm: 'pi pi-envelope',
  icomm_omnichannel: 'pi pi-envelope',
  mailchimp: 'pi pi-envelope',
  klaviyo: 'pi pi-chart-bar',
  brevo: 'pi pi-envelope',
  mailerlite: 'pi pi-envelope',
  sendy: 'pi pi-send',
  emailoctopus: 'pi pi-envelope',
  sendfox: 'pi pi-envelope',
  // Chat
  shopping_chat: 'pi pi-sparkles',
  tawkto: 'pi pi-comments',
  livechat: 'pi pi-comments',
  chatway: 'pi pi-comments',
  chatify: 'pi pi-comments',
  // Analytics
  google: 'pi pi-chart-bar',
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
  doppler_popup: 'pi pi-megaphone',
  // Analytics (additional)
  crazyegg: 'pi pi-chart-bar',
  // Fulfillment
  mintsoft: 'pi pi-box',
  // ERP
  niux: 'pi pi-server',
  contanet: 'pi pi-server',
  // Payment Gateways
  pg_izipay: 'pi pi-credit-card',
  pg_niubiz: 'pi pi-credit-card',
  pg_culqi: 'pi pi-credit-card',
  pg_mercadopago: 'pi pi-credit-card',
  pg_openpay: 'pi pi-credit-card',
  pg_powerpay: 'pi pi-credit-card',
  pg_paypal: 'pi pi-credit-card',
  'pg_qr-wallets': 'pi pi-qrcode',
  'pg_bank-transfer': 'pi pi-building',
  'pg_cash-on-delivery': 'pi pi-wallet',
  // Courier Providers
  cr_urbaner: 'pi pi-truck',
  'cr_99minutos': 'pi pi-truck',
  cr_chazki: 'pi pi-truck',
  cr_nirex: 'pi pi-truck',
  cr_urbano: 'pi pi-truck',
  cr_yango: 'pi pi-truck',
  cr_hop: 'pi pi-truck',
}

function navigateToProvider(provider: IntegrationProvider, categoryLabel: string) {
  if (isProviderLocked(provider)) {
    showProviderUpgrade(provider, categoryLabel)
    return
  }
  if (provider.config_url) {
    router.push(provider.config_url)
  } else {
    router.push(`/integrations/providers/${provider.code}`)
  }
}

const PLAN_PILL_STYLES: Record<string, string> = {
  Micro: 'bg-gray-100 text-gray-700',
  Small: 'bg-sky-100 text-sky-700',
  Medium: 'bg-violet-100 text-violet-700',
  Large: 'bg-amber-100 text-amber-700',
}

function planPillClass(plan: string | null): string {
  return plan ? (PLAN_PILL_STYLES[plan] ?? 'bg-gray-100 text-gray-700') : 'bg-gray-100 text-gray-700'
}

/**
 * El Asistente IA tiene un estado intermedio: activado pero con el catálogo
 * todavía indexándose en el backend RAG, y hasta que termina la API no publica el
 * widget en la tienda. Decir "Activo" ahí manda al comerciante a buscar un chat
 * que aún no está.
 */
function awaitsIndex(provider: IntegrationProvider): boolean {
  return provider.indexed !== undefined && provider.enabled && !provider.indexed
}

/** Activado pero el indexado no va a ocurrir: plan que no lo habilita, o catálogo vacío. */
function indexBlocked(provider: IntegrationProvider): boolean {
  return awaitsIndex(provider)
    && (provider.index_eligible === false || provider.index_empty === true)
}

function isIndexing(provider: IntegrationProvider): boolean {
  return awaitsIndex(provider) && !indexBlocked(provider)
}

function getStatusLabel(provider: IntegrationProvider): string {
  if (!provider.configured) return 'Sin configurar'
  if (indexBlocked(provider)) return 'Sin publicar'
  if (isIndexing(provider)) return 'Indexando'
  if (provider.enabled) return 'Activo'
  return 'Pausado'
}

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

function getStatusVariant(provider: IntegrationProvider): BadgeVariant {
  if (!provider.configured) return 'neutral'
  if (indexBlocked(provider)) return 'warning'
  if (isIndexing(provider)) return 'info'
  if (provider.enabled) return 'success'
  return 'warning'
}
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Integraciones</h1>
      <p class="text-gray-500 mt-1">
        Conecta tu tienda con pasarelas de pago, servicios de reparto, marketing y automatización
      </p>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <i class="pi pi-spinner pi-spin text-4xl text-primary" />
    </div>

    <!-- Error -->
    <AppErrorState v-else-if="store.error" :message="store.error" @retry="store.fetchProviders" />

    <!-- Empty -->
    <AppEmptyState
      v-else-if="!hasData"
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
        <div class="flex items-center gap-3 mb-4">
          <h2 class="text-lg font-semibold text-gray-700">{{ category.label }}</h2>
          <span
            v-if="isCategoryLocked(category.providers)"
            class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
            :class="planPillClass(categoryMinPlan(category.providers))"
          >
            <i class="pi pi-lock text-[0.65rem]"></i>
            Disponible desde {{ categoryMinPlan(category.providers) }}
          </span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="provider in category.providers"
            :key="provider.code"
            class="bg-white border rounded-lg p-5 cursor-pointer transition-shadow"
            :class="{
              'border-green-400': !isProviderLocked(provider) && provider.configured && provider.enabled,
              'border-yellow-400': !isProviderLocked(provider) && provider.configured && !provider.enabled,
              'opacity-60 hover:shadow-sm': isProviderLocked(provider),
              'hover:shadow-md': !isProviderLocked(provider)
            }"
            @click="navigateToProvider(provider, category.label)"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="category.bgColor">
                  <i :class="[providerIcons[provider.code] || category.icon, 'text-xl', category.iconColor]" />
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="font-semibold text-gray-800">{{ provider.name }}</h3>
                    <span
                      v-if="provider.beta"
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-semibold bg-primary/10 text-primary"
                    >
                      Beta
                    </span>
                  </div>
                </div>
              </div>
              <i
                v-if="isProviderLocked(provider)"
                class="pi pi-lock text-gray-400"
                :title="`Disponible desde ${provider.min_plan}`"
              />
              <AppBadge v-else :variant="getStatusVariant(provider)">
                {{ getStatusLabel(provider) }}
              </AppBadge>
            </div>
            <p class="text-sm text-gray-500 mb-3">{{ provider.description }}</p>
            <p v-if="provider.plan_note" class="text-xs text-primary mb-3">
              <i class="pi pi-info-circle mr-1 text-[0.65rem]" />{{ provider.plan_note }}
            </p>
            <p v-if="planInfoFor(provider)" class="text-xs text-amber-600 mb-3">
              <i class="pi pi-lock mr-1 text-[0.65rem]" />{{ planInfoFor(provider) }}
            </p>
            <div v-if="provider.supported_events?.length" class="flex flex-wrap gap-1">
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
          Las integraciones conectan tu tienda con plataformas externas. Las pasarelas de pago y
          servicios de reparto se configuran desde sus secciones dedicadas. Los widgets de chat,
          analytics y popups se cargan automáticamente en tu tienda online cuando están activados.
        </p>
      </div>
    </template>
  </div>
</template>
