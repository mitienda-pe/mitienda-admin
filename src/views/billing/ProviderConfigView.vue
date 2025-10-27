<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <Button
        icon="pi pi-arrow-left"
        text
        rounded
        @click="$router.push('/billing/providers')"
      />
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ providerName }}</h1>
        <p class="text-gray-600 mt-1">Configura las credenciales y series de documentos</p>
      </div>
    </div>

    <!-- Nubefact Configuration -->
    <div v-if="providerId === 2">
      <NubefactConfigView />
    </div>

    <!-- Other providers (not yet implemented) -->
    <Card v-else>
      <template #content>
        <div class="text-center py-12">
          <i class="pi pi-wrench text-6xl text-gray-300 mb-4"></i>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">Proveedor no disponible</h3>
          <p class="text-gray-600 mb-4">
            La configuración para {{ providerName }} estará disponible próximamente
          </p>
          <Button
            label="Volver a proveedores"
            icon="pi pi-arrow-left"
            @click="$router.push('/billing/providers')"
          />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Card from 'primevue/card'
import NubefactConfigView from './NubefactConfigView.vue'

const route = useRoute()
const router = useRouter()

const providerId = computed(() => parseInt(route.params.id as string))

const providerNames: Record<number, string> = {
  1: 'Factura en Una',
  2: 'NubeFact',
  3: 'Bizlinks'
}

const providerName = computed(() => providerNames[providerId.value] || 'Proveedor Desconocido')

// Redirect to providers list if invalid provider ID
if (!providerNames[providerId.value]) {
  router.push('/billing/providers')
}
</script>
