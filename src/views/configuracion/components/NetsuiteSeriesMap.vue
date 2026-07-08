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

    <!-- Barra de acciones -->
    <div class="flex items-center justify-end mb-4">
      <Button
        label="Agregar serie"
        icon="pi pi-plus"
        size="small"
        :disabled="!tiendaId"
        @click="openCreate"
      />
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Sin series -->
      <Message v-if="!series || series.length === 0" severity="warn" :closable="false">
        <div>
          <p class="font-semibold mb-2">No hay series mapeadas a NetSuite.</p>
          <p class="text-sm">
            Si tu tienda <strong>delega la facturación a NetSuite</strong>, agrega aquí las series
            directamente con el botón <strong>"Agregar serie"</strong> (código, tipo de documento y
            el ID de la serie en NetSuite).
          </p>
          <p class="text-sm mt-2">
            Si en cambio facturas con un proveedor electrónico (ej: Nubefact), configura primero el
            proveedor y sus series para poder mapearlas.
          </p>
          <div class="mt-3">
            <Button
              label="Ir a Facturación"
              icon="pi pi-arrow-right"
              size="small"
              outlined
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

        <Column header="Acciones" style="width: 200px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                label="Guardar"
                icon="pi pi-save"
                size="small"
                :loading="data._saving"
                @click="handleSave(data)"
              />
              <Button
                icon="pi pi-trash"
                size="small"
                severity="danger"
                outlined
                :loading="data._deleting"
                v-tooltip.top="'Eliminar serie'"
                @click="handleDelete(data)"
              />
            </div>
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

    <!-- Dialog: agregar serie manual (tiendas que delegan facturación a NetSuite) -->
    <Dialog
      v-model:visible="createDialogVisible"
      header="Agregar serie"
      modal
      :style="{ width: '32rem' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Serie *</label>
          <InputText v-model="createForm.codigo" placeholder="Ej: B101" class="w-full font-mono" />
          <small class="text-secondary-500">El código de la serie tal como se emite (Boleta: B###, Factura: F###).</small>
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Tipo de documento *</label>
          <Dropdown
            v-model="createForm.tipo_documento"
            :options="tipoDocumentoOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar"
            class="w-full"
            @change="onTipoChange"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">NetSuite Serie ID *</label>
          <InputText v-model="createForm.netsuite_id" placeholder="Ej: 453" class="w-full font-mono" />
          <small class="text-secondary-500">El internal ID del registro de serie (CUSTOMRECORD_PE_SERIE) en NetSuite.</small>
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">NetSuite DocType ID *</label>
          <Dropdown
            v-model="createForm.netsuite_doctype_id"
            :options="docTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar"
            class="w-full"
          />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" text @click="createDialogVisible = false" />
        <Button label="Guardar" icon="pi pi-save" :loading="isCreating" @click="handleCreate" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useRouter } from 'vue-router'
import { useNetsuite } from '@/composables/useNetsuite'
import { netsuiteApi } from '@/api/netsuite.api'
import type { NetsuiteSerie } from '@/types/netsuite.types'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import Divider from 'primevue/divider'
import ProgressSpinner from 'primevue/progressspinner'

const props = defineProps<{
  tiendaId: number | null
}>()

const toast = useToast()
const confirm = useConfirm()
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

const tipoDocumentoOptions = [
  { label: 'Boleta', value: 'BOLETA' },
  { label: 'Factura', value: 'FACTURA' }
]

// --- Crear serie manual (tiendas que delegan facturación a NetSuite) ---
const createDialogVisible = ref(false)
const isCreating = ref(false)
const createForm = ref<{
  codigo: string
  tipo_documento: 'BOLETA' | 'FACTURA' | null
  netsuite_id: string
  netsuite_doctype_id: string | null
}>({
  codigo: '',
  tipo_documento: null,
  netsuite_id: '',
  netsuite_doctype_id: null
})

function openCreate() {
  createForm.value = { codigo: '', tipo_documento: null, netsuite_id: '', netsuite_doctype_id: null }
  createDialogVisible.value = true
}

// Al elegir el tipo, prellenar el docType correspondiente (Boleta=1, Factura=2).
function onTipoChange() {
  if (!createForm.value.netsuite_doctype_id) {
    createForm.value.netsuite_doctype_id = createForm.value.tipo_documento === 'FACTURA' ? '2' : '1'
  }
}

async function handleCreate() {
  if (!props.tiendaId) {
    toast.add({ severity: 'warn', summary: 'Advertencia', detail: 'Seleccione una tienda', life: 3000 })
    return
  }
  const f = createForm.value
  if (!f.codigo.trim()) {
    toast.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Ingrese el código de la serie', life: 3000 })
    return
  }
  if (!f.tipo_documento) {
    toast.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Seleccione el tipo de documento', life: 3000 })
    return
  }
  if (!f.netsuite_id.trim()) {
    toast.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Ingrese el NetSuite Serie ID', life: 3000 })
    return
  }
  if (!f.netsuite_doctype_id) {
    toast.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Seleccione el NetSuite DocType ID', life: 3000 })
    return
  }

  isCreating.value = true
  clearError()
  try {
    const result = await saveSerie(props.tiendaId, {
      codigo: f.codigo.trim(),
      tipo_documento: f.tipo_documento as string,
      netsuite_id: f.netsuite_id.trim(),
      netsuite_doctype_id: f.netsuite_doctype_id as string,
      estado: 1
    })

    if (result.success) {
      toast.add({ severity: 'success', summary: 'Éxito', detail: `Serie ${f.codigo.trim()} agregada`, life: 3000 })
      createDialogVisible.value = false
      await reloadSeries()
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: result.error || 'No se pudo agregar la serie', life: 5000 })
    }
  } finally {
    isCreating.value = false
  }
}

// Computed properties
const mappedCount = computed(() => {
  return series.value.filter(s => s.tiendaserieerp_netsuite_id).length
})

const unmappedCount = computed(() => {
  return series.value.filter(s => !s.tiendaserieerp_netsuite_id).length
})

// Carga (y combina) las series mapeadas + las sin mapear del proveedor de facturación.
async function reloadSeries() {
  if (!props.tiendaId) return

  clearError()

  // Get both mapped and unmapped series
  const mappedSeries = await getSeries(props.tiendaId)
  const unmappedSeries = await getUnmappedSeries(props.tiendaId)

  // Combine both lists, avoiding duplicates
  // Use tiendaserieerp_codigo as key since empfacturacionserie_id can be null
  const allSeriesMap = new Map<string, any>()

  // Add mapped series first
  mappedSeries.forEach((s: any) => {
    s._saving = false
    allSeriesMap.set(s.tiendaserieerp_codigo, s)
  })

  // Add unmapped series (won't overwrite if already mapped)
  unmappedSeries.forEach((s: any) => {
    if (!allSeriesMap.has(s.tiendaserieerp_codigo)) {
      s._saving = false
      allSeriesMap.set(s.tiendaserieerp_codigo, s)
    }
  })

  // Update the series ref directly
  series.value = Array.from(allSeriesMap.values())
}

// Watch tiendaId changes and load series
watch(() => props.tiendaId, () => {
  reloadSeries()
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

async function handleDelete(row: NetsuiteSerie & { _deleting?: boolean }) {
  if (!props.tiendaId) return

  confirm.require({
    message: `¿Eliminar la serie ${row.tiendaserieerp_codigo}? Esta acción no se puede deshacer.`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      row._deleting = true
      try {
        const response = await netsuiteApi.deleteSerie(props.tiendaId!, Number(row.tiendaserieerp_id))
        if (response.success) {
          toast.add({
            severity: 'success',
            summary: 'Serie eliminada',
            detail: `${row.tiendaserieerp_codigo} fue eliminada`,
            life: 3000
          })
          series.value = series.value.filter(s => s.tiendaserieerp_id !== row.tiendaserieerp_id)
        } else {
          toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo eliminar la serie',
            life: 4000
          })
        }
      } catch (e: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: e.response?.data?.message || 'Error al eliminar la serie',
          life: 4000
        })
      } finally {
        row._deleting = false
      }
    }
  })
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
