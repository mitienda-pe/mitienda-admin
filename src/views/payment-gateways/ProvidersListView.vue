<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Formas de Pago</h1>
        <p class="text-gray-600 mt-1">Configura las pasarelas de pago para tu tienda</p>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="store.isLoading" class="flex items-center justify-center py-12">
      <ProgressSpinner />
    </div>

    <div v-else data-tour="payment-grid">
      <!-- Pasarela de pago principal (exclusive) -->
      <div class="mb-8">
        <div class="flex items-center gap-2 mb-4">
          <i class="pi pi-credit-card text-primary text-lg"></i>
          <h2 class="text-lg font-semibold text-gray-900">Pasarela de pago principal</h2>
          <span class="text-sm text-gray-500">(solo 1 activa a la vez)</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <Card v-for="gateway in exclusiveGateways" :key="gateway.code"
            class="cursor-pointer hover:shadow-lg transition-shadow border-2" :class="[
              gateway.configured && gateway.enabled
                ? 'border-green-200 hover:border-green-400'
                : gateway.configured
                  ? 'border-yellow-200 hover:border-yellow-400'
                  : 'border-transparent hover:border-primary'
            ]" @click="goToGatewayConfig(gateway.code)">
            <template #header>
              <div class="flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 relative">
                <div class="h-16 w-32 flex items-center justify-center">
                  <img v-if="gatewayLogos[gateway.code]" :src="gatewayLogos[gateway.code]" :alt="gateway.name"
                    class="max-h-16 max-w-full object-contain" />
                  <div v-else class="text-4xl font-bold text-gray-300">
                    {{ gateway.name.charAt(0) }}
                  </div>
                </div>
                <!-- Active badge for exclusive gateway -->
                <span v-if="gateway.configured && gateway.enabled"
                  class="absolute top-2 right-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-500 text-white">
                  <i class="pi pi-check mr-1"></i> Pasarela activa
                </span>
              </div>
            </template>
            <template #title>
              <div class="flex items-center justify-between">
                <span>{{ gateway.name }}</span>
              </div>
            </template>
            <template #content>
              <p class="text-sm text-gray-600 line-clamp-2">
                {{ gateway.description }}
              </p>
              <div v-if="gateway.configured" class="mt-3 flex flex-wrap gap-2">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  :class="gateway.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'">
                  <i :class="gateway.enabled ? 'pi pi-check-circle' : 'pi pi-pause-circle'" class="mr-1"></i>
                  {{ gateway.enabled ? 'Activo' : 'Inactivo' }}
                </span>
                <span v-if="gateway.environment" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  :class="getEnvironmentBadgeClass(gateway.environment)">
                  <i :class="isProductionEnvironment(gateway.environment) ? 'pi pi-shield' : 'pi pi-code'" class="mr-1"></i>
                  {{ getEnvironmentLabel(gateway.environment) }}
                </span>
              </div>
              <div class="mt-4 flex items-center gap-2 text-sm">
                <i class="pi pi-cog text-primary"></i>
                <span class="text-primary font-medium">
                  {{ gateway.configured ? 'Editar configuración' : 'Configurar pasarela' }}
                </span>
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Métodos de pago alternativos (complementary) -->
      <div>
        <div class="flex items-center gap-2 mb-4">
          <i class="pi pi-wallet text-primary text-lg"></i>
          <h2 class="text-lg font-semibold text-gray-900">Métodos de pago alternativos</h2>
          <span class="text-sm text-gray-500">(pueden estar activos simultáneamente)</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <Card v-for="gateway in complementaryGateways" :key="gateway.code"
            class="cursor-pointer hover:shadow-lg transition-shadow border-2" :class="[
              gateway.configured && gateway.enabled
                ? 'border-green-200 hover:border-green-400'
                : gateway.configured
                  ? 'border-yellow-200 hover:border-yellow-400'
                  : 'border-transparent hover:border-primary'
            ]" @click="goToGatewayConfig(gateway.code)">
            <template #header>
              <div class="flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                <div class="h-16 w-32 flex items-center justify-center">
                  <img v-if="gatewayLogos[gateway.code]" :src="gatewayLogos[gateway.code]" :alt="gateway.name"
                    class="max-h-16 max-w-full object-contain" />
                  <div v-else class="text-4xl font-bold text-gray-300">
                    {{ gateway.name.charAt(0) }}
                  </div>
                </div>
              </div>
            </template>
            <template #title>
              <div class="flex items-center justify-between">
                <span>{{ gateway.name }}</span>
              </div>
            </template>
            <template #content>
              <p class="text-sm text-gray-600 line-clamp-2">
                {{ gateway.description }}
              </p>
              <div v-if="gateway.configured" class="mt-3 flex flex-wrap gap-2">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                  :class="gateway.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'">
                  <i :class="gateway.enabled ? 'pi pi-check-circle' : 'pi pi-pause-circle'" class="mr-1"></i>
                  {{ gateway.enabled ? 'Activo' : 'Inactivo' }}
                </span>
              </div>
              <div class="mt-4 flex items-center gap-2 text-sm">
                <i class="pi pi-cog text-primary"></i>
                <span class="text-primary font-medium">
                  {{ gateway.configured ? 'Editar configuración' : 'Configurar pasarela' }}
                </span>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <!-- Information Box -->
    <Card data-tour="payment-info" class="bg-blue-50 border border-blue-200">
      <template #content>
        <div class="flex gap-4">
          <i class="pi pi-info-circle text-blue-600 text-2xl"></i>
          <div>
            <h3 class="font-semibold text-blue-900 mb-2">Información importante</h3>
            <ul class="text-sm text-blue-800 space-y-1">
              <li>* Solo puedes tener <strong>una pasarela de pago principal</strong> activa a la vez</li>
              <li>* Los métodos alternativos (transferencia, contra entrega, QR, BNPL) pueden estar activos simultáneamente</li>
              <li>* Las credenciales se almacenan de forma segura y encriptada</li>
              <li>* Usa el ambiente de prueba antes de pasar a producción</li>
            </ul>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePaymentGatewaysStore } from '@/stores/payment-gateways.store'
import { useOnboarding } from '@/composables/useOnboarding'
import Card from 'primevue/card'
import ProgressSpinner from 'primevue/progressspinner'

// Logos de las pasarelas (SVG preferred, kebab-case naming)
import logoIzipay from '@/assets/images/logo-izipay.svg'
import logoNiubiz from '@/assets/images/logo-niubiz.svg'
import logoCulqi from '@/assets/images/logo-culqi.svg'
import logoMercadopago from '@/assets/images/logo-mercadopago.svg'
import logoOpenpay from '@/assets/images/logo-openpay.svg'
import logoPowerpay from '@/assets/images/logo-powerpay.svg'
import logoPaypal from '@/assets/images/logo-paypal.svg'
import logoYape from '@/assets/images/logo-yape.svg'
import logoPlin from '@/assets/images/logo-plin.svg'
import logoPayme from '@/assets/images/logo-payme.png'
import logoPayu from '@/assets/images/logo-payu.svg'
import logoPayphone from '@/assets/images/logo-payphone.svg'

const router = useRouter()
const store = usePaymentGatewaysStore()
const { resumeTourIfPending } = useOnboarding()

const gatewayLogos: Record<string, string> = {
  'izipay': logoIzipay,
  'niubiz': logoNiubiz,
  'culqi': logoCulqi,
  'mercadopago': logoMercadopago,
  'openpay': logoOpenpay,
  'powerpay': logoPowerpay,
  'paypal': logoPaypal,
  'yape_manual': logoYape,
  'plin': logoPlin,
  'payme': logoPayme,
  'payu': logoPayu,
  'payphone': logoPayphone,
}

const exclusiveGateways = computed(() =>
  store.gateways.filter((g: any) => g.exclusive)
)

const complementaryGateways = computed(() =>
  store.gateways.filter((g: any) => !g.exclusive)
)

onMounted(async () => {
  await store.fetchGateways()
  resumeTourIfPending()
})

function goToGatewayConfig(code: string) {
  router.push(`/payment-gateways/${code}`)
}

function isProductionEnvironment(env: string): boolean {
  return env === 'produccion'
}

function getEnvironmentLabel(env: string): string {
  const labels: Record<string, string> = {
    'produccion': 'Producción',
    'prueba': 'Prueba',
    'integracion': 'Integración',
    'sandbox': 'Sandbox',
    'development': 'Desarrollo'
  }
  return labels[env] || env
}

function getEnvironmentBadgeClass(env: string): string {
  if (env === 'produccion') {
    return 'bg-blue-100 text-blue-800'
  }
  // Test environments: prueba, integracion, sandbox, development
  return 'bg-orange-100 text-orange-800'
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
