<template>
  <div class="space-y-4">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-secondary-800">Configuración de NetSuite</h1>
      <p class="text-secondary-600 mt-1">Configura las credenciales y mapeo de series para sincronización con NetSuite</p>
    </div>

    <!-- Loading state -->
    <div v-if="!currentTiendaId" class="flex items-center justify-center py-12">
      <Message severity="warn" :closable="false">
        No se ha seleccionado ninguna tienda. Por favor, seleccione una tienda para continuar.
      </Message>
    </div>

    <!-- Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Columna principal: Tabs -->
      <div class="lg:col-span-2">
        <Card>
          <template #content>
            <TabView v-model:active-index="activeTabIndex">
              <TabPanel>
                <template #header>
                  <i class="pi pi-key mr-2"></i>
                  <span>Credenciales</span>
                </template>
                <div class="pt-4">
                  <NetsuiteCredentials
                    :tienda-id="currentTiendaId"
                    @credentials-saved="handleCredentialsSaved"
                  />
                </div>
              </TabPanel>

              <TabPanel>
                <template #header>
                  <i class="pi pi-list mr-2"></i>
                  <span>Series</span>
                </template>
                <div class="pt-4">
                  <NetsuiteSeriesMap
                    :tienda-id="currentTiendaId"
                  />
                </div>
              </TabPanel>

              <TabPanel>
                <template #header>
                  <i class="pi pi-dollar mr-2"></i>
                  <span>Precios</span>
                </template>
                <div class="pt-4">
                  <NetsuitePriceSync
                    :tienda-id="currentTiendaId"
                  />
                </div>
              </TabPanel>

              <TabPanel>
                <template #header>
                  <i class="pi pi-bolt mr-2"></i>
                  <span>Pruebas</span>
                </template>
                <div class="pt-4">
                  <NetsuiteTest
                    :tienda-id="currentTiendaId"
                  />
                </div>
              </TabPanel>
            </TabView>
          </template>
        </Card>
      </div>

      <!-- Sidebar: Información -->
      <div class="space-y-6">
        <!-- Información de la tienda -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-building text-lg"></i>
              <span>Tienda Actual</span>
            </div>
          </template>
          <template #content>
            <div v-if="authStore.selectedStore" class="space-y-3">
              <div>
                <p class="text-sm font-medium text-secondary-700">Nombre</p>
                <p class="text-secondary-900 mt-1">{{ authStore.selectedStore.name }}</p>
              </div>
              <Divider />
              <div>
                <p class="text-sm font-medium text-secondary-700">ID</p>
                <p class="text-secondary-900 mt-1 font-mono">#{{ authStore.selectedStore.id }}</p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Información sobre NetSuite -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-info-circle text-lg"></i>
              <span>Información</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-4 text-sm">
              <div>
                <h4 class="font-semibold text-secondary-800 mb-2">¿Qué es NetSuite?</h4>
                <p class="text-secondary-600">
                  NetSuite es un sistema ERP en la nube que permite gestionar operaciones empresariales,
                  incluyendo inventario, finanzas y facturación.
                </p>
              </div>

              <Divider />

              <div>
                <h4 class="font-semibold text-secondary-800 mb-2">Configuración necesaria</h4>
                <ol class="list-decimal list-inside space-y-2 text-secondary-600">
                  <li>Configura credenciales OAuth 1.0</li>
                  <li>Mapea series de facturación</li>
                  <li>Prueba la conexión</li>
                  <li>Activa sincronización automática</li>
                </ol>
              </div>

              <Divider />

              <div>
                <h4 class="font-semibold text-secondary-800 mb-2">Sincronización</h4>
                <p class="text-secondary-600">
                  Con la sincronización automática activada, las órdenes se enviarán a NetSuite
                  cuando cambien a estado PAGADO.
                </p>
              </div>

              <Divider />

              <div>
                <Button
                  label="Documentación de NetSuite"
                  icon="pi pi-external-link"
                  link
                  class="w-full"
                  @click="openNetsuiteDocumentation"
                />
              </div>
            </div>
          </template>
        </Card>

        <!-- Tips -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-lightbulb text-lg"></i>
              <span>Consejos</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-3 text-sm text-secondary-600">
              <div class="flex items-start gap-2">
                <i class="pi pi-check text-green-600 mt-0.5"></i>
                <p>Usa el ambiente sandbox (_SB1) para pruebas</p>
              </div>
              <div class="flex items-start gap-2">
                <i class="pi pi-check text-green-600 mt-0.5"></i>
                <p>Verifica los permisos de tu integración en NetSuite</p>
              </div>
              <div class="flex items-start gap-2">
                <i class="pi pi-check text-green-600 mt-0.5"></i>
                <p>Prueba la conexión antes de activar el autosync</p>
              </div>
              <div class="flex items-start gap-2">
                <i class="pi pi-check text-green-600 mt-0.5"></i>
                <p>Mapea todas las series antes de sincronizar</p>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/auth.store'

import Card from 'primevue/card'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Divider from 'primevue/divider'

import NetsuiteCredentials from './components/NetsuiteCredentials.vue'
import NetsuiteSeriesMap from './components/NetsuiteSeriesMap.vue'
import NetsuitePriceSync from './components/NetsuitePriceSync.vue'
import NetsuiteTest from './components/NetsuiteTest.vue'

const toast = useToast()
const authStore = useAuthStore()

const activeTabIndex = ref(0)

const currentTiendaId = computed(() => {
  return authStore.selectedStore?.id || null
})

onMounted(() => {
  // Verificar que haya una tienda seleccionada
  if (!currentTiendaId.value) {
    toast.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'No se ha seleccionado ninguna tienda',
      life: 5000
    })
  }
})

function handleCredentialsSaved() {
  toast.add({
    severity: 'success',
    summary: 'Éxito',
    detail: 'Credenciales guardadas. Ahora puedes mapear las series de facturación.',
    life: 5000
  })
  // Cambiar al tab de series
  activeTabIndex.value = 1
}

function openNetsuiteDocumentation() {
  window.open('https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_N3458435.html', '_blank')
}
</script>

<style scoped>
/* Card principal sin padding para tabs */
.lg\\:col-span-2 > :deep(.p-card .p-card-content) {
  padding: 0;
}

/* Estilos mejorados de TabView */
:deep(.p-tabview .p-tabview-nav) {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
  padding: 0 1.5rem;
  display: flex;
  gap: 0.5rem;
  margin: 0;
}

:deep(.p-tabview .p-tabview-nav-link) {
  padding: 1rem 1.5rem;
  border: none;
  background: transparent;
  color: #6b7280;
  font-weight: 500;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
  margin-bottom: -2px;
  border-radius: 0;
  cursor: pointer;
}

:deep(.p-tabview .p-tabview-nav-link:hover) {
  background: #f3f4f6;
  color: #374151;
}

:deep(.p-tabview .p-tabview-nav li.p-tabview-selected .p-tabview-nav-link) {
  color: #2563eb;
  background: white;
  border-bottom-color: #2563eb;
  font-weight: 600;
}

:deep(.p-tabview .p-tabview-panels) {
  background: white;
  padding: 1.5rem;
}

/* Sidebar cards con padding adecuado */
.space-y-6 > :deep(.p-card .p-card-title) {
  padding: 1.25rem 1.5rem;
  margin: 0;
  border-bottom: 1px solid #e5e7eb;
  font-size: 1rem;
}

.space-y-6 > :deep(.p-card .p-card-content) {
  padding: 1.5rem;
}
</style>
