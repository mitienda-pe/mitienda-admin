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

    <!-- Providers Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <Card
        v-for="gateway in store.gateways"
        :key="gateway.code"
        class="cursor-pointer hover:shadow-lg transition-shadow border-2"
        :class="[
          gateway.configured && gateway.enabled
            ? 'border-green-200 hover:border-green-400'
            : gateway.configured
              ? 'border-yellow-200 hover:border-yellow-400'
              : 'border-transparent hover:border-primary'
        ]"
        @click="goToGatewayConfig(gateway.code)"
      >
        <template #header>
          <div class="flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100">
            <!-- Logo placeholder -->
            <div class="h-16 w-32 flex items-center justify-center">
              <img
                v-if="gatewayLogos[gateway.code]"
                :src="gatewayLogos[gateway.code]"
                :alt="gateway.name"
                class="max-h-16 max-w-full object-contain"
              />
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
          <!-- Status badges -->
          <div v-if="gateway.configured" class="mt-3 flex flex-wrap gap-2">
            <span
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              :class="gateway.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
            >
              <i :class="gateway.enabled ? 'pi pi-check-circle' : 'pi pi-pause-circle'" class="mr-1"></i>
              {{ gateway.enabled ? 'Activo' : 'Inactivo' }}
            </span>
            <span
              v-if="gateway.environment"
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              :class="getEnvironmentBadgeClass(gateway.environment)"
            >
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

    <!-- Information Box -->
    <Card class="bg-blue-50 border border-blue-200">
      <template #content>
        <div class="flex gap-4">
          <i class="pi pi-info-circle text-blue-600 text-2xl"></i>
          <div>
            <h3 class="font-semibold text-blue-900 mb-2">Información importante</h3>
            <ul class="text-sm text-blue-800 space-y-1">
              <li>* Puedes tener múltiples pasarelas activas simultáneamente</li>
              <li>* Las credenciales se almacenan de forma segura y encriptada</li>
              <li>* Usa el ambiente de prueba antes de pasar a producción</li>
              <li>* Cada pasarela tiene sus propias tarjetas de prueba</li>
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
import { usePaymentGatewaysStore } from '@/stores/payment-gateways.store'
import Card from 'primevue/card'
import ProgressSpinner from 'primevue/progressspinner'

// Logos de las pasarelas
import logoIzipay from '@/assets/images/logo_izipay.png'
import logoNiubiz from '@/assets/images/logo_niubiz.png'
import logoCulqi from '@/assets/images/Logo-Culqi.png'
import logoMercadopago from '@/assets/images/logo_mercadopago.svg'
import logoOpenpay from '@/assets/images/logo_Openpay.png'
import logoPowerpay from '@/assets/images/logo_powerpay.png'
import logoPaypal from '@/assets/images/Logo_PayPal.png'

const router = useRouter()
const store = usePaymentGatewaysStore()

const gatewayLogos: Record<string, string> = {
  'izipay': logoIzipay,
  'niubiz': logoNiubiz,
  'culqi': logoCulqi,
  'mercadopago': logoMercadopago,
  'openpay': logoOpenpay,
  'powerpay': logoPowerpay,
  'paypal': logoPaypal
}

onMounted(async () => {
  await store.fetchGateways()
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
