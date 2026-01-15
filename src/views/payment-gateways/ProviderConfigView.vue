<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <Button
        icon="pi pi-arrow-left"
        text
        rounded
        @click="$router.push('/payment-gateways')"
      />
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ gatewayName }}</h1>
        <p class="text-gray-600 mt-1">Configura las credenciales de la pasarela</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex items-center justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Dynamic Component based on gateway code -->
    <component
      v-else-if="configComponent"
      :is="configComponent"
    />

    <!-- Gateway not found -->
    <Card v-else>
      <template #content>
        <div class="text-center py-12">
          <i class="pi pi-exclamation-triangle text-6xl text-yellow-400 mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">Pasarela no encontrada</h3>
          <p class="text-gray-600 mb-4">
            La pasarela "{{ gatewayCode }}" no está disponible o no existe.
          </p>
          <Button
            label="Volver a pasarelas"
            icon="pi pi-arrow-left"
            @click="$router.push('/payment-gateways')"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, defineAsyncComponent, type Component } from 'vue'
import { useRoute } from 'vue-router'
import { usePaymentGatewaysStore } from '@/stores/payment-gateways.store'
import Button from 'primevue/button'
import Card from 'primevue/card'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const store = usePaymentGatewaysStore()

const gatewayCode = computed(() => route.params.code as string)

// Mapeo de nombres amigables
const gatewayNames: Record<string, string> = {
  'izipay': 'Izipay',
  'niubiz': 'Niubiz',
  'culqi': 'Culqi',
  'mercadopago': 'Mercado Pago',
  'openpay': 'Openpay',
  'powerpay': 'Powerpay',
  'paypal': 'PayPal',
  'qr-wallets': 'Billeteras QR (Yape / Plin)',
  'bank-transfer': 'Transferencia Bancaria',
  'cash-on-delivery': 'Pago Contra Entrega'
}

const gatewayName = computed(() => gatewayNames[gatewayCode.value] || 'Pasarela Desconocida')

// Mapeo de componentes de configuración
const configComponents: Record<string, Component> = {
  'izipay': defineAsyncComponent(() => import('./IzipayConfigView.vue')),
  'niubiz': defineAsyncComponent(() => import('./NiubizConfigView.vue')),
  'culqi': defineAsyncComponent(() => import('./CulqiConfigView.vue')),
  'mercadopago': defineAsyncComponent(() => import('./MercadoPagoConfigView.vue')),
  'openpay': defineAsyncComponent(() => import('./OpenpayConfigView.vue')),
  'powerpay': defineAsyncComponent(() => import('./PowerpayConfigView.vue')),
  'paypal': defineAsyncComponent(() => import('./PaypalConfigView.vue')),
  'qr-wallets': defineAsyncComponent(() => import('./QrWalletsConfigView.vue')),
  'bank-transfer': defineAsyncComponent(() => import('./BankTransferConfigView.vue')),
  'cash-on-delivery': defineAsyncComponent(() => import('./CashOnDeliveryConfigView.vue'))
}

const configComponent = computed(() => {
  return configComponents[gatewayCode.value] || null
})

onMounted(async () => {
  // Verificar si el código es válido
  if (!gatewayNames[gatewayCode.value]) {
    console.warn(`Gateway code "${gatewayCode.value}" not found`)
  }

  // Cargar la configuración de la pasarela
  if (gatewayCode.value) {
    await store.fetchGatewayConfig(gatewayCode.value)
  }
})
</script>
