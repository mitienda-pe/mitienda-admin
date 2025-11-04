<template>
  <div>
    <Message severity="info" :closable="false" class="mb-6">
      <div class="flex items-start gap-2">
        <i class="pi pi-info-circle text-lg"></i>
        <div>
          <p class="font-semibold">Mapeo de Series</p>
          <p class="text-sm mt-1">
            Asigne los IDs de NetSuite a las series de facturación electrónica configuradas.
            Esto es necesario para que el sistema sincronice correctamente los documentos con NetSuite.
          </p>
        </div>
      </div>
    </Message>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Sin series -->
      <Message v-if="!series || series.length === 0" severity="warn" :closable="false">
        <div>
          <p class="font-semibold mb-2">No hay series de facturación configuradas para mapear a NetSuite.</p>
          <p class="text-sm">Para poder mapear series a NetSuite, primero debes:</p>
          <ol class="list-decimal list-inside text-sm mt-2 space-y-1">
            <li>Configurar un proveedor de facturación electrónica (ej: Nubefact)</li>
            <li>Configurar las series de facturación (Boletas, Facturas, etc.)</li>
            <li>Luego podrás mapear esas series a sus equivalentes en NetSuite</li>
          </ol>
          <div class="mt-3">
            <Button
              label="Ir a Facturación"
              icon="pi pi-arrow-right"
              size="small"
              @click="goToBilling"
            />
          </div>
        </div>
      </Message>

      <!-- Tabla de series -->
      <DataTable
        v-else
        :value="series"
        stripedRows
        class="border"
      >
        <Column field="tiendaserieerp_codigo" header="Serie" style="width: 120px">
          <template #body="{ data }">
            <Tag :value="data.tiendaserieerp_codigo" severity="info" />
          </template>
        </Column>

        <Column field="tiendaserieerp_tipo_documento" header="Tipo de Documento" style="width: 180px">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <i :class="data.tiendaserieerp_tipo_documento === 'FACTURA' ? 'pi pi-file-edit' : 'pi pi-file'" class="text-secondary-500"></i>
              <span>{{ data.tiendaserieerp_tipo_documento }}</span>
            </div>
          </template>
        </Column>

        <Column header="NetSuite Serie ID" style="width: 200px">
          <template #body="{ data }">
            <InputText
              v-model="data.tiendaserieerp_netsuite_id"
              placeholder="Ej: 439"
              size="small"
              class="w-full"
            />
          </template>
        </Column>

        <Column header="NetSuite DocType ID" style="width: 220px">
          <template #body="{ data }">
            <Dropdown
              v-model="data.tiendaserieerp_netsuite_doctype_id"
              :options="docTypeOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Seleccionar"
              size="small"
              class="w-full"
            />
          </template>
        </Column>

        <Column header="Estado" style="width: 150px">
          <template #body="{ data }">
            <Tag
              :value="data.tiendaserieerp_netsuite_id ? 'Mapeado' : 'Sin mapear'"
              :severity="data.tiendaserieerp_netsuite_id ? 'success' : 'warning'"
            />
          </template>
        </Column>

        <Column header="Acciones" style="width: 120px">
          <template #body="{ data }">
            <Button
              label="Guardar"
              icon="pi pi-save"
              size="small"
              :loading="data._saving"
              @click="handleSave(data)"
            />
          </template>
        </Column>
      </DataTable>

      <!-- Resumen -->
      <div v-if="series && series.length > 0" class="mt-6 p-4 bg-secondary-50 rounded-lg">
        <div class="flex items-center gap-4 text-sm">
          <div class="flex items-center gap-2">
            <i class="pi pi-chart-bar text-secondary-600"></i>
            <span class="text-secondary-700">Total de series:</span>
            <span class="font-semibold">{{ series.length }}</span>
          </div>
          <Divider layout="vertical" />
          <div class="flex items-center gap-2">
            <i class="pi pi-check-circle text-green-600"></i>
            <span class="text-secondary-700">Mapeadas:</span>
            <span class="font-semibold text-green-700">{{ mappedCount }}</span>
          </div>
          <Divider layout="vertical" />
          <div class="flex items-center gap-2">
            <i class="pi pi-exclamation-circle text-yellow-600"></i>
            <span class="text-secondary-700">Sin mapear:</span>
            <span class="font-semibold text-yellow-700">{{ unmappedCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Error message -->
    <Message v-if="error" severity="error" :closable="false" class="mt-4">
      {{ error }}
    </Message>
  </div>
</template>

<script setup lang="ts">
import { watch, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'
import { useNetsuite } from '@/composables/useNetsuite'
import type { NetsuiteSerie } from '@/types/netsuite.types'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import Divider from 'primevue/divider'
import ProgressSpinner from 'primevue/progressspinner'

const props = defineProps<{
  tiendaId: number | null
}>()

const toast = useToast()
const router = useRouter()

const {
  isLoading,
  error,
  series,
  getSeries,
  saveSerie,
  getUnmappedSeries,
  clearError
} = useNetsuite()

const docTypeOptions = [
  { label: '1 - Boleta', value: '1' },
  { label: '2 - Factura', value: '2' }
]

// Computed properties
const mappedCount = computed(() => {
  return series.value.filter(s => s.tiendaserieerp_netsuite_id).length
})

const unmappedCount = computed(() => {
  return series.value.filter(s => !s.tiendaserieerp_netsuite_id).length
})

// Watch tiendaId changes and load series
watch(() => props.tiendaId, async (tiendaId) => {
  if (!tiendaId) return

  console.log('[NetsuiteSeriesMap] Loading series for tiendaId:', tiendaId)

  clearError()

  // Get both mapped and unmapped series
  const mappedSeries = await getSeries(tiendaId)
  const unmappedSeries = await getUnmappedSeries(tiendaId)

  console.log('[NetsuiteSeriesMap] Mapped series:', mappedSeries)
  console.log('[NetsuiteSeriesMap] Unmapped series:', unmappedSeries)

  // Combine both lists, avoiding duplicates
  const allSeriesMap = new Map<number, any>()

  // Add mapped series first
  mappedSeries.forEach((s: any) => {
    s._saving = false
    allSeriesMap.set(s.empfacturacionserie_id, s)
  })

  // Add unmapped series (won't overwrite if already mapped)
  unmappedSeries.forEach((s: any) => {
    if (!allSeriesMap.has(s.empfacturacionserie_id)) {
      s._saving = false
      allSeriesMap.set(s.empfacturacionserie_id, s)
    }
  })

  const combinedSeries = Array.from(allSeriesMap.values())

  console.log('[NetsuiteSeriesMap] Combined series count:', combinedSeries.length)
  console.log('[NetsuiteSeriesMap] Combined series:', combinedSeries)

  // Update the series ref directly
  series.value = combinedSeries
}, { immediate: true })

function goToBilling() {
  router.push('/billing/providers')
}

async function handleSave(row: NetsuiteSerie & { _saving?: boolean }) {
  if (!props.tiendaId) {
    toast.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'Seleccione una tienda',
      life: 3000
    })
    return
  }

  // Validate
  if (!row.tiendaserieerp_netsuite_doctype_id) {
    toast.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: 'Seleccione el tipo de documento en NetSuite',
      life: 3000
    })
    return
  }

  row._saving = true
  clearError()

  try {
    const result = await saveSerie(props.tiendaId, {
      codigo: row.tiendaserieerp_codigo,
      tipo_documento: row.tiendaserieerp_tipo_documento,
      netsuite_id: row.tiendaserieerp_netsuite_id,
      netsuite_doctype_id: row.tiendaserieerp_netsuite_doctype_id,
      empfacturacionserie_id: row.empfacturacionserie_id,
      estado: 1
    })

    if (result.success) {
      toast.add({
        severity: 'success',
        summary: 'Éxito',
        detail: `Serie ${row.tiendaserieerp_codigo} guardada correctamente`,
        life: 3000
      })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: result.error || 'No se pudo guardar la serie',
        life: 5000
      })
    }
  } finally {
    row._saving = false
  }
}
</script>

<style scoped>
:deep(.p-datatable) {
  font-size: 0.875rem;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background-color: #f9fafb;
  color: #374151;
  font-weight: 600;
}

:deep(.p-inputtext) {
  border: 1px solid #d1d5db !important;
}
</style>
