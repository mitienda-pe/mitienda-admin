<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Proveedores de Facturación</h1>
        <p class="text-gray-600 mt-1">Configura tus proveedores de facturación electrónica</p>
      </div>
    </div>

    <!-- Providers Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Nubefact Card -->
      <Card
        class="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary"
        @click="goToProviderConfig(2)"
      >
        <template #header>
          <div class="flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <img
              src="@/assets/images/NubeFact.png"
              alt="NubeFact"
              class="h-20 object-contain"
            />
          </div>
        </template>
        <template #title>
          <div class="flex items-center justify-between">
            <span>NubeFact</span>
            <Tag
              v-if="providersConfig[2]?.configured"
              value="Configurado"
              severity="success"
              icon="pi pi-check"
            />
          </div>
        </template>
        <template #content>
          <p class="text-sm text-gray-600">
            Proveedor de facturación electrónica en la nube. Simple y rápido.
          </p>
          <div class="mt-4 flex items-center gap-2 text-sm">
            <i class="pi pi-cog text-primary"></i>
            <span class="text-primary font-medium">Configurar proveedor</span>
          </div>
        </template>
      </Card>

      <!-- Bizlinks Card -->
      <Card
        class="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary opacity-60"
      >
        <template #header>
          <div class="flex items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-purple-100">
            <img
              src="@/assets/images/bizlinks.png"
              alt="Bizlinks"
              class="h-20 object-contain"
            />
          </div>
        </template>
        <template #title>
          <div class="flex items-center justify-between">
            <span>Bizlinks</span>
            <Tag
              value="Próximamente"
              severity="secondary"
            />
          </div>
        </template>
        <template #content>
          <p class="text-sm text-gray-600">
            Solución empresarial de facturación electrónica con integración SOAP.
          </p>
          <div class="mt-4 flex items-center gap-2 text-sm text-gray-400">
            <i class="pi pi-lock"></i>
            <span>Disponible próximamente</span>
          </div>
        </template>
      </Card>

      <!-- Factura en Una Card -->
      <Card
        class="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-primary opacity-60"
      >
        <template #header>
          <div class="flex items-center justify-center p-6 bg-gradient-to-br from-green-50 to-green-100">
            <img
              src="@/assets/images/Factura_en_Una.png"
              alt="Factura en Una"
              class="h-20 object-contain"
            />
          </div>
        </template>
        <template #title>
          <div class="flex items-center justify-between">
            <span>Factura en Una</span>
            <Tag
              value="Próximamente"
              severity="secondary"
            />
          </div>
        </template>
        <template #content>
          <p class="text-sm text-gray-600">
            Plataforma peruana de emisión de comprobantes electrónicos.
          </p>
          <div class="mt-4 flex items-center gap-2 text-sm text-gray-400">
            <i class="pi pi-lock"></i>
            <span>Disponible próximamente</span>
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
              <li>• Solo puedes tener un proveedor activo a la vez</li>
              <li>• Los documentos emitidos quedarán registrados permanentemente</li>
              <li>• Asegúrate de tener las credenciales correctas antes de configurar</li>
              <li>• Las series de documentos (Factura/Boleta) se configuran por proveedor</li>
            </ul>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBillingStore } from '@/stores/billing.store'
import Card from 'primevue/card'
import Tag from 'primevue/tag'

const router = useRouter()
const billingStore = useBillingStore()

const providersConfig = ref<Record<number, { configured: boolean }>>({
  1: { configured: false }, // Factura en Una
  2: { configured: false }, // NubeFact
  3: { configured: false }  // Bizlinks
})

onMounted(async () => {
  // Load provider configurations status
  // For now, only NubeFact is available
  await checkNubefactConfig()
})

async function checkNubefactConfig() {
  try {
    await billingStore.fetchNubefactConfig()
    providersConfig.value[2].configured = billingStore.nubefactConfig?.configured || false
  } catch (error) {
    console.error('Error checking Nubefact config:', error)
  }
}

function goToProviderConfig(providerId: number) {
  // Only NubeFact is available for now
  if (providerId === 2) {
    router.push(`/billing/providers/${providerId}`)
  }
}
</script>
