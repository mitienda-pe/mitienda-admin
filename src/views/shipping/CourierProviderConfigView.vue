<template>
  <div>
    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="store.error" severity="error" :closable="false">
      {{ store.error }}
    </Message>

    <!-- Not Found -->
    <div v-else-if="!configComponent" class="bg-white rounded-lg shadow p-12 text-center">
      <i class="pi pi-exclamation-triangle text-4xl text-secondary-300 mb-4"></i>
      <h3 class="text-lg font-semibold text-secondary-700 mb-2">Courier no encontrado</h3>
      <p class="text-secondary-500 mb-4">El proveedor de courier solicitado no existe.</p>
      <Button
        label="Volver a la lista"
        icon="pi pi-arrow-left"
        @click="router.push('/shipping/couriers')"
      />
    </div>

    <!-- Dynamic Config Component -->
    <component
      v-else
      :is="configComponent"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCourierProvidersStore } from '@/stores/courier-providers.store'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const store = useCourierProvidersStore()

const courierCode = computed(() => route.params.code as string)

const componentMap: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  urbaner: defineAsyncComponent(() => import('./couriers/UrbanerConfigView.vue')),
  '99minutos': defineAsyncComponent(() => import('./couriers/Minutos99ConfigView.vue')),
}

const configComponent = computed(() => {
  return componentMap[courierCode.value] || null
})

onMounted(() => {
  if (courierCode.value) {
    store.fetchConfig(courierCode.value)
  }
})
</script>
