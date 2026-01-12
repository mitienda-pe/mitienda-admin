<template>
  <div class="space-y-6">
    <!-- Descripción -->
    <Message severity="info" :closable="false">
      <div class="flex items-start gap-3">
        <i class="pi pi-info-circle text-xl mt-1"></i>
        <div class="flex-1">
          <p class="font-semibold mb-2">Sincronización de Precios desde NetSuite</p>
          <p class="text-sm">
            Esta función actualiza los precios de los productos en MiTienda con los precios configurados en NetSuite (Price Level 15 - Ecommerce).
            Solo se sincronizan productos que tienen un ID de NetSuite asignado.
          </p>
        </div>
      </div>
    </Message>

    <!-- Estado de última sincronización -->
    <Card>
      <template #title>
        <div class="flex items-center justify-between">
          <span class="text-lg">Estado de Sincronización</span>
          <Button
            label="Actualizar"
            icon="pi pi-refresh"
            size="small"
            text
            @click="loadSyncStatus"
            :loading="loadingStatus"
          />
        </div>
      </template>
      <template #content>
        <div v-if="syncStatus" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-secondary-600">Última Sincronización</p>
              <p class="font-semibold text-lg mt-1">
                {{ syncStatus.last_sync ? formatDate(syncStatus.last_sync) : 'Nunca' }}
              </p>
            </div>
            <div>
              <p class="text-sm text-secondary-600">Productos Actualizados</p>
              <p class="font-semibold text-lg mt-1">
                {{ syncStatus.last_updated_count || 0 }}
              </p>
            </div>
          </div>

          <Divider />

          <div v-if="syncStatus.last_errors && syncStatus.last_errors.length > 0">
            <p class="text-sm text-secondary-600 mb-2">Últimos Errores:</p>
            <ul class="list-disc list-inside space-y-1 text-sm text-red-600">
              <li v-for="(error, index) in syncStatus.last_errors.slice(0, 3)" :key="index">
                {{ error }}
              </li>
            </ul>
          </div>
        </div>
        <div v-else class="text-center py-4 text-secondary-500">
          No hay información de sincronización disponible
        </div>
      </template>
    </Card>

    <!-- Acciones de sincronización -->
    <Card>
      <template #title>
        <span class="text-lg">Acciones</span>
      </template>
      <template #content>
        <div class="space-y-4">
          <!-- Botón de sincronización -->
          <div class="flex items-center gap-4">
            <Button
              label="Sincronizar Precios Ahora"
              icon="pi pi-sync"
              severity="success"
              :loading="syncing"
              @click="syncPrices"
              class="flex-1"
            />
            <Button
              label="Vista Previa"
              icon="pi pi-eye"
              severity="secondary"
              outlined
              :loading="previewing"
              @click="previewChanges"
            />
          </div>

          <p class="text-sm text-secondary-600">
            <i class="pi pi-info-circle mr-1"></i>
            La sincronización puede tardar varios minutos dependiendo de la cantidad de productos.
          </p>
        </div>
      </template>
    </Card>

    <!-- Resultados de la última sincronización -->
    <Card v-if="lastSyncResult">
      <template #title>
        <div class="flex items-center gap-2">
          <i :class="['pi', lastSyncResult.success ? 'pi-check-circle text-green-600' : 'pi-times-circle text-red-600']"></i>
          <span class="text-lg">Último Resultado</span>
        </div>
      </template>
      <template #content>
        <div class="space-y-4">
          <!-- Resumen -->
          <div class="grid grid-cols-4 gap-4 text-center">
            <div class="p-4 bg-blue-50 rounded-lg">
              <p class="text-sm text-blue-700 font-medium">Revisados</p>
              <p class="text-2xl font-bold text-blue-900 mt-1">
                {{ lastSyncResult.total_products_checked || 0 }}
              </p>
            </div>
            <div class="p-4 bg-green-50 rounded-lg">
              <p class="text-sm text-green-700 font-medium">Actualizados</p>
              <p class="text-2xl font-bold text-green-900 mt-1">
                {{ lastSyncResult.updated_count || 0 }}
              </p>
            </div>
            <div class="p-4 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-700 font-medium">Sin Cambio</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">
                {{ (lastSyncResult.total_products_checked || 0) - (lastSyncResult.total_changes || 0) }}
              </p>
            </div>
            <div class="p-4 bg-orange-50 rounded-lg">
              <p class="text-sm text-orange-700 font-medium">Omitidos</p>
              <p class="text-2xl font-bold text-orange-900 mt-1">
                {{ lastSyncResult.skipped_count || 0 }}
              </p>
            </div>
          </div>

          <!-- Cambios de precio (si hay) -->
          <div v-if="lastSyncResult.changes && lastSyncResult.changes.length > 0">
            <Divider />
            <p class="font-semibold mb-3">Cambios Aplicados:</p>
            <DataTable
              :value="lastSyncResult.changes.slice(0, 10)"
              class="p-datatable-sm"
              stripedRows
            >
              <Column field="producto_sku" header="SKU" style="width: 15%"></Column>
              <Column field="producto_titulo" header="Producto" style="width: 40%">
                <template #body="slotProps">
                  <span class="text-sm">{{ slotProps.data.producto_titulo }}</span>
                </template>
              </Column>
              <Column field="old_price" header="Precio Anterior" style="width: 15%">
                <template #body="slotProps">
                  <span class="font-mono text-sm">S/ {{ slotProps.data.old_price.toFixed(2) }}</span>
                </template>
              </Column>
              <Column field="new_price_with_igv" header="Precio Nuevo" style="width: 15%">
                <template #body="slotProps">
                  <span class="font-mono text-sm font-semibold">S/ {{ (slotProps.data.new_price_with_igv || slotProps.data.new_price || 0).toFixed(2) }}</span>
                </template>
              </Column>
              <Column field="price_change_percent" header="Cambio" style="width: 15%">
                <template #body="slotProps">
                  <Tag
                    :value="`${slotProps.data.price_change_percent > 0 ? '+' : ''}${slotProps.data.price_change_percent.toFixed(1)}%`"
                    :severity="slotProps.data.price_change_percent > 0 ? 'success' : 'danger'"
                  />
                </template>
              </Column>
            </DataTable>
            <p v-if="lastSyncResult.changes.length > 10" class="text-sm text-secondary-600 mt-2 text-center">
              ... y {{ lastSyncResult.changes.length - 10 }} cambios más
            </p>
          </div>

          <!-- Errores -->
          <div v-if="lastSyncResult.errors && lastSyncResult.errors.length > 0">
            <Divider />
            <Message severity="error" :closable="false">
              <p class="font-semibold mb-2">Errores encontrados ({{ lastSyncResult.errors.length }}):</p>
              <ul class="list-disc list-inside space-y-1 text-sm">
                <li v-for="(error, index) in lastSyncResult.errors.slice(0, 5)" :key="index">
                  SKU {{ error.sku }}: {{ error.errors.join(', ') }}
                </li>
              </ul>
              <p v-if="lastSyncResult.errors.length > 5" class="text-sm mt-2">
                ... y {{ lastSyncResult.errors.length - 5 }} errores más
              </p>
            </Message>
          </div>

          <!-- Tiempo de ejecución -->
          <p class="text-sm text-secondary-600 text-center">
            Tiempo de ejecución: {{ lastSyncResult.execution_time || 0 }} segundos
          </p>
        </div>
      </template>
    </Card>

    <!-- Dialog de vista previa -->
    <Dialog
      v-model:visible="previewDialog"
      header="Vista Previa de Cambios"
      :modal="true"
      :style="{ width: '80vw' }"
      :maximizable="true"
    >
      <div v-if="previewData" class="space-y-4">
        <Message severity="info" :closable="false">
          Se encontraron {{ previewData.total_changes }} productos con cambios de precio
        </Message>

        <DataTable
          v-if="previewData.price_changes && previewData.price_changes.length > 0"
          :value="previewData.price_changes"
          class="p-datatable-sm"
          stripedRows
          :paginator="true"
          :rows="10"
        >
          <Column field="producto_sku" header="SKU" style="width: 12%"></Column>
          <Column field="producto_titulo" header="Producto" style="width: 40%">
            <template #body="slotProps">
              <span class="text-sm">{{ slotProps.data.producto_titulo }}</span>
            </template>
          </Column>
          <Column field="old_price" header="Precio Actual" style="width: 15%">
            <template #body="slotProps">
              <span class="font-mono text-sm">S/ {{ slotProps.data.old_price.toFixed(2) }}</span>
            </template>
          </Column>
          <Column field="new_price_with_igv" header="Precio Nuevo" style="width: 15%">
            <template #body="slotProps">
              <span class="font-mono text-sm font-semibold text-green-700">
                S/ {{ (slotProps.data.new_price_with_igv || slotProps.data.new_price || 0).toFixed(2) }}
              </span>
            </template>
          </Column>
          <Column field="price_change_percent" header="Cambio %" style="width: 18%">
            <template #body="slotProps">
              <div class="flex items-center gap-2">
                <Tag
                  :value="`${slotProps.data.price_change_percent > 0 ? '+' : ''}${slotProps.data.price_change_percent.toFixed(1)}%`"
                  :severity="slotProps.data.price_change_percent > 0 ? 'success' : 'danger'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
      <div v-else-if="previewing" class="text-center py-8">
        <ProgressSpinner style="width: 50px; height: 50px" />
        <p class="mt-4 text-secondary-600">Consultando precios en NetSuite...</p>
      </div>
    </Dialog>

    <!-- Sección de Promociones -->
    <Divider />

    <Message severity="info" :closable="false">
      <div class="flex items-start gap-3">
        <i class="pi pi-gift text-xl mt-1"></i>
        <div class="flex-1">
          <p class="font-semibold mb-2">Sincronización de Promociones desde NetSuite</p>
          <p class="text-sm">
            Sincroniza promociones tipo FREEGIFT (bonificaciones), PERCENTOFF y AMOUNTOFF (descuentos) desde NetSuite.
            Las promociones se crean o actualizan automáticamente en MiTienda.
          </p>
        </div>
      </div>
    </Message>

    <!-- Acciones de sincronización de promociones -->
    <Card>
      <template #title>
        <span class="text-lg">Sincronizar Promociones</span>
      </template>
      <template #content>
        <div class="space-y-4">
          <Button
            label="Sincronizar Promociones Ahora"
            icon="pi pi-gift"
            severity="info"
            :loading="syncingPromotions"
            @click="syncPromotions"
            class="w-full"
          />
          <p class="text-sm text-secondary-600">
            <i class="pi pi-clock mr-1"></i>
            Cron programado: Todos los días a las 3:00 AM
          </p>
        </div>
      </template>
    </Card>

    <!-- Resultados de sincronización de promociones -->
    <Card v-if="lastPromotionSyncResult">
      <template #title>
        <div class="flex items-center gap-2">
          <i :class="['pi', lastPromotionSyncResult.success ? 'pi-check-circle text-green-600' : 'pi-times-circle text-red-600']"></i>
          <span class="text-lg">Resultado de Promociones</span>
        </div>
      </template>
      <template #content>
        <div class="space-y-4">
          <!-- Resumen -->
          <div class="grid grid-cols-4 gap-4 text-center">
            <div class="p-4 bg-green-50 rounded-lg">
              <p class="text-sm text-green-700 font-medium">Creadas</p>
              <p class="text-2xl font-bold text-green-900 mt-1">
                {{ lastPromotionSyncResult.promotions_created || 0 }}
              </p>
            </div>
            <div class="p-4 bg-blue-50 rounded-lg">
              <p class="text-sm text-blue-700 font-medium">Actualizadas</p>
              <p class="text-2xl font-bold text-blue-900 mt-1">
                {{ lastPromotionSyncResult.promotions_updated || 0 }}
              </p>
            </div>
            <div class="p-4 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-700 font-medium">Omitidas</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">
                {{ lastPromotionSyncResult.promotions_skipped || 0 }}
              </p>
            </div>
            <div class="p-4 bg-purple-50 rounded-lg">
              <p class="text-sm text-purple-700 font-medium">Productos Vinculados</p>
              <p class="text-2xl font-bold text-purple-900 mt-1">
                {{ (lastPromotionSyncResult.activators_linked || 0) + (lastPromotionSyncResult.bonifications_linked || 0) }}
              </p>
            </div>
          </div>

          <!-- SKUs no encontrados -->
          <div v-if="lastPromotionSyncResult.skus_not_found && lastPromotionSyncResult.skus_not_found.length > 0">
            <Divider />
            <Message severity="warn" :closable="false">
              <p class="font-semibold mb-2">SKUs no encontrados en MiTienda ({{ lastPromotionSyncResult.skus_not_found.length }}):</p>
              <ul class="list-disc list-inside space-y-1 text-sm">
                <li v-for="(sku, index) in lastPromotionSyncResult.skus_not_found.slice(0, 5)" :key="index">
                  {{ sku }}
                </li>
              </ul>
              <p v-if="lastPromotionSyncResult.skus_not_found.length > 5" class="text-sm mt-2">
                ... y {{ lastPromotionSyncResult.skus_not_found.length - 5 }} SKUs más
              </p>
            </Message>
          </div>

          <!-- Errores -->
          <div v-if="lastPromotionSyncResult.errors && lastPromotionSyncResult.errors.length > 0">
            <Divider />
            <Message severity="error" :closable="false">
              <p class="font-semibold mb-2">Errores encontrados ({{ lastPromotionSyncResult.errors.length }}):</p>
              <ul class="list-disc list-inside space-y-1 text-sm">
                <li v-for="(error, index) in lastPromotionSyncResult.errors.slice(0, 5)" :key="index">
                  {{ error }}
                </li>
              </ul>
            </Message>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import apiClient from '@/api/axios'

// PrimeVue components
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import Divider from 'primevue/divider'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'

interface SyncStatus {
  last_sync: string | null
  last_updated_count: number
  last_errors: any[]
}

interface SyncResult {
  success: boolean
  total_products_checked: number
  total_changes: number
  updated_count: number
  skipped_count: number
  changes: any[]
  errors: any[]
  warnings: any[]
  execution_time: number
}

interface PreviewData {
  total_changes: number
  price_changes: any[]
}

const props = defineProps({
  tiendaId: {
    type: Number,
    required: true
  }
})

const toast = useToast()

// Estado - Precios
const syncing = ref(false)
const previewing = ref(false)
const loadingStatus = ref(false)
const syncStatus = ref<SyncStatus | null>(null)
const lastSyncResult = ref<SyncResult | null>(null)
const previewDialog = ref(false)
const previewData = ref<PreviewData | null>(null)

// Estado - Promociones
const syncingPromotions = ref(false)
const lastPromotionSyncResult = ref<any | null>(null)

// Métodos
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Nunca'
  const date = new Date(dateString)
  return date.toLocaleString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadSyncStatus = async () => {
  loadingStatus.value = true
  try {
    // TODO: Implementar endpoint para obtener estado de sincronización
    // const response = await axios.get(`/api/v1/netsuite-prices/status?tienda_id=${props.tiendaId}`)
    // syncStatus.value = response.data

    // Mock data por ahora
    syncStatus.value = {
      last_sync: null,
      last_updated_count: 0,
      last_errors: []
    }
  } catch (error) {
    console.error('Error loading sync status:', error)
  } finally {
    loadingStatus.value = false
  }
}

const previewChanges = async () => {
  previewing.value = true
  previewDialog.value = true
  previewData.value = null

  try {
    const response = await apiClient.get(`/netsuite-prices/map?tienda_id=${props.tiendaId}`)

    if (response.data.success) {
      previewData.value = {
        total_changes: response.data.price_changes?.length || 0,
        price_changes: response.data.price_changes || []
      }
    } else {
      throw new Error(response.data.error || 'Error obteniendo vista previa')
    }
  } catch (error: any) {
    console.error('Error previewing changes:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.error || 'No se pudo obtener la vista previa de cambios',
      life: 5000
    })
    previewDialog.value = false
  } finally {
    previewing.value = false
  }
}

const syncPrices = async () => {
  const confirmSync = await new Promise((resolve) => {
    const confirmed = window.confirm(
      '¿Está seguro que desea sincronizar los precios desde NetSuite?\n\n' +
      'Esta acción actualizará los precios de los productos en MiTienda.\n' +
      'El proceso puede tardar varios minutos.'
    )
    resolve(confirmed)
  })

  if (!confirmSync) return

  syncing.value = true
  lastSyncResult.value = null

  try {
    toast.add({
      severity: 'info',
      summary: 'Sincronización Iniciada',
      detail: 'Actualizando precios desde NetSuite...',
      life: 3000
    })

    const response = await apiClient.post(`/netsuite-prices/sync`, {
      tienda_id: props.tiendaId,
      dry_run: false
    }, {
      timeout: 300000 // 5 minutos
    })

    if (response.data.success) {
      lastSyncResult.value = response.data.result

      toast.add({
        severity: 'success',
        summary: 'Sincronización Exitosa',
        detail: `Se actualizaron ${response.data.result.updated_count} productos`,
        life: 5000
      })

      // Actualizar estado
      await loadSyncStatus()
    } else {
      throw new Error(response.data.error || 'Error en la sincronización')
    }
  } catch (error: any) {
    console.error('Error syncing prices:', error)

    let errorMessage = 'No se pudo completar la sincronización'
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'La sincronización está tardando más de lo esperado. El proceso puede seguir ejecutándose en segundo plano.'
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error
    }

    toast.add({
      severity: 'error',
      summary: 'Error en Sincronización',
      detail: errorMessage,
      life: 8000
    })
  } finally {
    syncing.value = false
  }
}

// Sincronización de promociones
const syncPromotions = async () => {
  const confirmSync = await new Promise((resolve) => {
    const confirmed = window.confirm(
      '¿Está seguro que desea sincronizar las promociones desde NetSuite?\n\n' +
      'Esta acción creará o actualizará promociones en MiTienda.\n' +
      'El proceso puede tardar varios minutos.'
    )
    resolve(confirmed)
  })

  if (!confirmSync) return

  syncingPromotions.value = true
  lastPromotionSyncResult.value = null

  try {
    toast.add({
      severity: 'info',
      summary: 'Sincronización Iniciada',
      detail: 'Actualizando promociones desde NetSuite...',
      life: 3000
    })

    const response = await apiClient.post(`/netsuite-prices/sync-promotions`, {
      tienda_id: props.tiendaId,
      dry_run: false
    }, {
      timeout: 300000 // 5 minutos
    })

    if (response.data.success) {
      lastPromotionSyncResult.value = response.data.result

      const created = response.data.result.promotions_created || 0
      const updated = response.data.result.promotions_updated || 0

      toast.add({
        severity: 'success',
        summary: 'Sincronización Exitosa',
        detail: `Se crearon ${created} y actualizaron ${updated} promociones`,
        life: 5000
      })
    } else {
      throw new Error(response.data.error || 'Error en la sincronización')
    }
  } catch (error: any) {
    console.error('Error syncing promotions:', error)

    let errorMessage = 'No se pudo completar la sincronización de promociones'
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'La sincronización está tardando más de lo esperado. El proceso puede seguir ejecutándose en segundo plano.'
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error
    }

    toast.add({
      severity: 'error',
      summary: 'Error en Sincronización',
      detail: errorMessage,
      life: 8000
    })
  } finally {
    syncingPromotions.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadSyncStatus()
})
</script>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
