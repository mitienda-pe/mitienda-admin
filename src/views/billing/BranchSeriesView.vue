<template>
  <div class="p-4 md:p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-xl font-semibold text-secondary-800">Series por sucursal</h1>
        <p class="text-sm text-secondary-500 mt-1">
          Define series y correlativos independientes para cada sucursal. Útil para comercios con
          POS en varios locales que emiten con series distintas por sucursal.
        </p>
      </div>
      <Button
        label="Agregar serie"
        icon="pi pi-plus"
        size="small"
        @click="openCreate"
      />
    </div>

    <Message severity="info" :closable="false" class="mb-6">
      <div class="text-sm">
        <p class="font-semibold">¿Cómo funciona?</p>
        <ul class="list-disc ml-5 mt-1 space-y-1">
          <li>Una serie con <strong>sucursal "Todas (default de tienda)"</strong> aplica cuando la venta no tiene una serie específica de sucursal.</li>
          <li>Una serie asignada a una sucursal <strong>reemplaza</strong> a la default para las ventas de ese local.</li>
          <li>Si no configuras ninguna serie aquí, la emisión sigue usando la serie única del proveedor (comportamiento actual).</li>
        </ul>
      </div>
    </Message>

    <!-- Aviso: feature más útil con ≥2 sucursales -->
    <Message
      v-if="!isLoading && !featureApplicable"
      severity="warn"
      :closable="false"
      class="mb-6"
    >
      <div class="text-sm">
        Esta tienda tiene menos de 2 sucursales con POS. Puedes configurar series igualmente,
        pero esta opción está pensada para comercios con múltiples sucursales.
      </div>
    </Message>

    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <ProgressSpinner />
    </div>

    <div v-else>
      <!-- Sin series -->
      <Message v-if="series.length === 0" severity="secondary" :closable="false">
        <div class="text-sm">
          Aún no hay series por sucursal configuradas. Usa <strong>"Agregar serie"</strong> para crear la primera.
        </div>
      </Message>

      <!-- Tabla -->
      <DataTable v-else :value="series" stripedRows class="border">
        <Column header="Sucursal" style="min-width: 200px">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <i
                :class="data.tiendadireccion_id !== null ? 'pi pi-map-marker text-primary' : 'pi pi-globe text-secondary-500'"
              ></i>
              <span>{{ rowSucursalNombre(data) }}</span>
            </div>
          </template>
        </Column>

        <Column header="Tipo" style="width: 140px">
          <template #body="{ data }">
            <Tag
              :value="data.tiendaseriefact_tipo_documento === 'FACTURA' ? 'Factura' : 'Boleta'"
              :severity="data.tiendaseriefact_tipo_documento === 'FACTURA' ? 'info' : 'success'"
            />
          </template>
        </Column>

        <Column header="Serie" style="width: 120px">
          <template #body="{ data }">
            <span class="font-mono font-semibold">{{ data.tiendaseriefact_serie }}</span>
          </template>
        </Column>

        <Column header="Último correlativo" style="width: 160px">
          <template #body="{ data }">
            <span class="font-mono">{{ data.tiendaseriefact_correlativo }}</span>
          </template>
        </Column>

        <Column header="Acciones" style="width: 160px">
          <template #body="{ data }">
            <div class="flex gap-2">
              <Button
                icon="pi pi-pencil"
                size="small"
                outlined
                v-tooltip.top="'Editar'"
                @click="openEdit(data)"
              />
              <Button
                icon="pi pi-trash"
                size="small"
                severity="danger"
                outlined
                :loading="data._deleting"
                v-tooltip.top="'Eliminar'"
                @click="handleDelete(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialog crear/editar -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="editingId ? 'Editar serie' : 'Agregar serie'"
      modal
      :style="{ width: '34rem' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Sucursal *</label>
          <Dropdown
            v-model="form.tiendadireccion_id"
            :options="sucursalOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar"
            class="w-full"
          />
          <small class="text-secondary-500">"Todas (default de tienda)" aplica cuando la venta no tiene serie de sucursal.</small>
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Tipo de documento *</label>
          <Dropdown
            v-model="form.tipo_documento"
            :options="tipoDocumentoOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Seleccionar"
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Serie *</label>
          <InputText
            v-model="form.serie"
            placeholder="Ej: B002"
            class="w-full font-mono uppercase"
            maxlength="10"
          />
          <small class="text-secondary-500">Código tal como se emite (Boleta: B###, Factura: F###).</small>
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Último correlativo emitido</label>
          <InputNumber
            v-model="form.correlativo_inicial"
            :min="0"
            :useGrouping="false"
            placeholder="0"
            class="w-full"
          />
          <small class="text-secondary-500">
            0 si la serie es nueva. Si migras una serie en uso, ingresa el último número ya emitido;
            el próximo comprobante usará el siguiente.
          </small>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" text @click="dialogVisible = false" />
        <Button label="Guardar" icon="pi pi-save" :loading="isSaving" @click="handleSave" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { billingApi } from '@/api/billing.api'
import type {
  BranchSerie,
  BranchSerieSucursal,
  SerieTipoDocumento
} from '@/types/billing.types'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

const toast = useToast()
const confirm = useConfirm()

const isLoading = ref(false)
const isSaving = ref(false)
const series = ref<(BranchSerie & { _deleting?: boolean })[]>([])
const sucursales = ref<BranchSerieSucursal[]>([])
const featureApplicable = ref(true)

const tipoDocumentoOptions = [
  { label: 'Boleta', value: 'BOLETA' },
  { label: 'Factura', value: 'FACTURA' }
]

const sucursalOptions = computed(() => [
  { label: 'Todas (default de tienda)', value: null as number | null },
  ...sucursales.value.map(s => ({ label: s.nombre, value: Number(s.tiendadireccion_id) }))
])

function sucursalNombre(tiendadireccionId: number | null): string {
  if (tiendadireccionId === null) return 'Todas (default de tienda)'
  const s = sucursales.value.find(x => Number(x.tiendadireccion_id) === Number(tiendadireccionId))
  return s ? s.nombre : `Sucursal #${tiendadireccionId}`
}

// Nombre para la fila de la tabla: prioriza el nombre resuelto por el backend (JOIN),
// cae al catálogo de sucursales y por último al id.
function rowSucursalNombre(row: BranchSerie): string {
  if (row.tiendadireccion_id === null) return 'Todas (default de tienda)'
  if (row.sucursal_nombre) return row.sucursal_nombre
  return sucursalNombre(row.tiendadireccion_id)
}

// --- Form ---
const dialogVisible = ref(false)
const editingId = ref<number | null>(null)
const form = ref<{
  tiendadireccion_id: number | null
  tipo_documento: SerieTipoDocumento | null
  serie: string
  correlativo_inicial: number | null
}>({
  tiendadireccion_id: null,
  tipo_documento: null,
  serie: '',
  correlativo_inicial: 0
})

function openCreate() {
  editingId.value = null
  form.value = { tiendadireccion_id: null, tipo_documento: null, serie: '', correlativo_inicial: 0 }
  dialogVisible.value = true
}

function openEdit(row: BranchSerie) {
  editingId.value = row.tiendaseriefact_id
  form.value = {
    tiendadireccion_id: row.tiendadireccion_id,
    tipo_documento: row.tiendaseriefact_tipo_documento,
    serie: row.tiendaseriefact_serie,
    correlativo_inicial: row.tiendaseriefact_correlativo
  }
  dialogVisible.value = true
}

async function loadSeries() {
  isLoading.value = true
  try {
    const res = await billingApi.getBranchSeries()
    if (res.success && res.data) {
      // Los IDs pueden llegar como string desde la API; se normalizan a number
      // para que las comparaciones y el v-model del <select> funcionen.
      series.value = (res.data.series ?? []).map(s => ({
        ...s,
        tiendaseriefact_id: Number(s.tiendaseriefact_id),
        tiendadireccion_id: s.tiendadireccion_id === null || s.tiendadireccion_id === undefined
          ? null
          : Number(s.tiendadireccion_id),
        tiendaseriefact_correlativo: Number(s.tiendaseriefact_correlativo)
      }))
      sucursales.value = (res.data.sucursales ?? []).map(s => ({
        ...s,
        tiendadireccion_id: Number(s.tiendadireccion_id),
        numero_cajas: Number(s.numero_cajas)
      }))
      featureApplicable.value = res.data.feature_applicable ?? false
    }
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e.response?.data?.message || 'No se pudieron cargar las series',
      life: 4000
    })
  } finally {
    isLoading.value = false
  }
}

async function handleSave() {
  const f = form.value
  if (!f.tipo_documento) {
    toast.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Selecciona el tipo de documento', life: 3000 })
    return
  }
  if (!f.serie.trim()) {
    toast.add({ severity: 'warn', summary: 'Datos incompletos', detail: 'Ingresa la serie', life: 3000 })
    return
  }

  isSaving.value = true
  try {
    const res = await billingApi.saveBranchSerie({
      tiendadireccion_id: f.tiendadireccion_id,
      tipo_documento: f.tipo_documento,
      serie: f.serie.trim().toUpperCase(),
      correlativo_inicial: f.correlativo_inicial ?? 0
    })
    if (res.success) {
      toast.add({ severity: 'success', summary: 'Guardado', detail: 'Serie guardada correctamente', life: 3000 })
      dialogVisible.value = false
      await loadSeries()
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la serie', life: 4000 })
    }
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: e.response?.data?.messages?.error || e.response?.data?.message || 'No se pudo guardar la serie',
      life: 4000
    })
  } finally {
    isSaving.value = false
  }
}

function handleDelete(row: BranchSerie & { _deleting?: boolean }) {
  confirm.require({
    message: `¿Eliminar la serie ${row.tiendaseriefact_serie} (${sucursalNombre(row.tiendadireccion_id)})?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Sí, eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      row._deleting = true
      try {
        const res = await billingApi.deleteBranchSerie(row.tiendaseriefact_id)
        if (res.success) {
          toast.add({ severity: 'success', summary: 'Serie eliminada', detail: `${row.tiendaseriefact_serie} fue eliminada`, life: 3000 })
          series.value = series.value.filter(s => s.tiendaseriefact_id !== row.tiendaseriefact_id)
        } else {
          toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la serie', life: 4000 })
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

onMounted(loadSeries)
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
</style>
