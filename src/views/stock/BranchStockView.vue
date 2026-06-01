<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import FileUpload from 'primevue/fileupload'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import { storeApi } from '@/api/store.api'
import { usePlanStore } from '@/stores/plan.store'
import { branchStockApi, type BranchStockItem } from '@/api/branch-stock.api'
import type { StoreAddress } from '@/types/store.types'

const toast = useToast()
const planStore = usePlanStore()

const moduleEnabled = computed(() => planStore.isModuleEnabled('mod_stock_sucursal'))

const activationLoading = ref(true)
const activating = ref(false)
const isActive = ref(false)

const branches = ref<StoreAddress[]>([])
const selectedBranchId = ref<number | null>(null)

const rows = ref<Array<BranchStockItem & { _original: number }>>([])
const loadingRows = ref(false)
const saving = ref(false)
const importing = ref(false)
const search = ref('')
const page = ref(1)
const totalRecords = ref(0)
const perPage = ref(50)

let searchTimer: ReturnType<typeof setTimeout> | null = null

const changedItems = computed(() =>
  rows.value
    .filter((r) => !r.tiene_variantes && !r.stock_ilimitado && r.stock_sucursal !== r._original)
    .map((r) => ({ producto_id: r.producto_id, stock: r.stock_sucursal }))
)

const hasChanges = computed(() => changedItems.value.length > 0)

async function loadActivation() {
  activationLoading.value = true
  try {
    const res = await branchStockApi.getActivation()
    isActive.value = res.data?.enabled ?? false
  } catch {
    isActive.value = false
  } finally {
    activationLoading.value = false
  }
}

async function loadBranches() {
  const res = await storeApi.getAddresses()
  branches.value = (res.data ?? []).filter((b) => b.tiendadireccion_swpublicado === 1)
  if (branches.value.length && selectedBranchId.value === null) {
    selectedBranchId.value = branches.value[0].tiendadireccion_id
  }
}

async function loadRows() {
  if (!selectedBranchId.value) return
  loadingRows.value = true
  try {
    const res = await branchStockApi.list({
      tiendadireccion_id: selectedBranchId.value,
      search: search.value || undefined,
      page: page.value
    })
    const data = res.data
    rows.value = (data?.items ?? []).map((it) => ({ ...it, _original: it.stock_sucursal }))
    totalRecords.value = data?.pagination?.total_items ?? 0
    perPage.value = data?.pagination?.per_page ?? 50
  } catch (e: unknown) {
    toast.add({ severity: 'error', summary: 'Error', detail: extractMessage(e, 'No se pudo cargar el stock'), life: 4000 })
  } finally {
    loadingRows.value = false
  }
}

function onBranchChange() {
  page.value = 1
  loadRows()
}

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    loadRows()
  }, 350)
}

function onPage(e: { page: number }) {
  page.value = e.page + 1
  loadRows()
}

async function activate() {
  activating.value = true
  try {
    const res = await branchStockApi.setActivation(true)
    isActive.value = res.data?.enabled ?? false
    if (isActive.value) {
      toast.add({ severity: 'success', summary: 'Activado', detail: 'Gestión de stock por sucursal activada', life: 3000 })
      await loadBranches()
      await loadRows()
    }
  } catch (e: unknown) {
    toast.add({ severity: 'error', summary: 'No se pudo activar', detail: extractMessage(e, 'No disponible para esta tienda'), life: 5000 })
  } finally {
    activating.value = false
  }
}

async function save() {
  if (!selectedBranchId.value || !hasChanges.value) return
  saving.value = true
  try {
    const res = await branchStockApi.save(selectedBranchId.value, changedItems.value)
    const updated = res.data?.updated ?? 0
    toast.add({ severity: 'success', summary: 'Guardado', detail: `${updated} producto(s) actualizado(s)`, life: 3000 })
    await loadRows()
  } catch (e: unknown) {
    toast.add({ severity: 'error', summary: 'Error', detail: extractMessage(e, 'No se pudo guardar'), life: 4000 })
  } finally {
    saving.value = false
  }
}

async function onImport(event: { files: File | File[] }) {
  const file = Array.isArray(event.files) ? event.files[0] : event.files
  if (!file || !selectedBranchId.value) return
  importing.value = true
  try {
    const res = await branchStockApi.importCsv(file, selectedBranchId.value)
    const d = res.data
    const detail = `${d?.updated ?? 0} actualizado(s)` + (d?.errors?.length ? `, ${d.errors.length} error(es)` : '')
    toast.add({ severity: d?.errors?.length ? 'warn' : 'success', summary: 'Importación', detail, life: 5000 })
    await loadRows()
  } catch (e: unknown) {
    toast.add({ severity: 'error', summary: 'Error', detail: extractMessage(e, 'No se pudo importar el CSV'), life: 4000 })
  } finally {
    importing.value = false
  }
}

function extractMessage(e: unknown, fallback: string): string {
  if (typeof e === 'object' && e !== null) {
    const anyE = e as { response?: { data?: { message?: string } }; message?: string }
    return anyE.response?.data?.message || anyE.message || fallback
  }
  return fallback
}

onMounted(async () => {
  if (!moduleEnabled.value) {
    activationLoading.value = false
    return
  }
  await loadActivation()
  if (isActive.value) {
    await loadBranches()
    await loadRows()
  }
})
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Stock por sucursal</h1>
      <p class="text-sm text-gray-500 mt-1">
        Gestiona el inventario de cada sucursal de forma independiente. El stock total se calcula como la suma de las sucursales.
      </p>
    </div>

    <!-- No disponible en el plan -->
    <AppEmptyState
      v-if="!moduleEnabled"
      title="No disponible en tu plan"
      description="La gestión de stock por sucursal está disponible en el plan Large o el plan Punto de Venta."
      icon="pi-lock"
    />

    <!-- Cargando estado de activación -->
    <div v-else-if="activationLoading" class="text-gray-500 py-10 text-center">
      <i class="pi pi-spin pi-spinner text-2xl"></i>
    </div>

    <!-- Disponible pero no activado -->
    <div v-else-if="!isActive" class="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
      <h2 class="text-lg font-semibold text-gray-800 mb-2">Activar gestión nativa de stock por sucursal</h2>
      <p class="text-sm text-gray-600 mb-4">
        Al activarla, el stock total de cada producto pasará a calcularse como la suma de sus sucursales.
        Solo disponible para tiendas sin integración con ERP/NetSuite.
      </p>
      <AppButton :loading="activating" variant="primary" @click="activate">Activar</AppButton>
    </div>

    <!-- Activado: gestión -->
    <div v-else class="space-y-4">
      <div class="bg-white rounded-lg shadow-sm p-4 flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
          <Dropdown
            v-model="selectedBranchId"
            :options="branches"
            optionLabel="tiendadireccion_nombresucursal"
            optionValue="tiendadireccion_id"
            placeholder="Selecciona una sucursal"
            class="w-64"
            @change="onBranchChange"
          />
        </div>
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">Buscar producto</label>
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <input
              v-model="search"
              type="text"
              placeholder="Nombre o SKU"
              class="w-full border border-gray-300 rounded-md px-3 py-2 pl-9 text-sm"
              @input="onSearchInput"
            />
          </span>
        </div>
        <div class="flex items-center gap-2">
          <FileUpload
            mode="basic"
            accept=".csv"
            :auto="true"
            chooseLabel="Importar CSV"
            :customUpload="true"
            :disabled="importing || !selectedBranchId"
            @uploader="onImport"
          />
          <AppButton :loading="saving" :disabled="!hasChanges" variant="primary" @click="save">
            Guardar{{ hasChanges ? ` (${changedItems.length})` : '' }}
          </AppButton>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm">
        <DataTable
          :value="rows"
          :loading="loadingRows"
          :paginator="true"
          :rows="perPage"
          :totalRecords="totalRecords"
          :lazy="true"
          stripedRows
          class="p-datatable-sm"
          responsiveLayout="scroll"
          @page="onPage"
        >
          <template #empty>
            <div class="py-8 text-center text-gray-500">No hay productos para esta sucursal.</div>
          </template>
          <Column field="producto_sku" header="SKU" style="min-width: 120px">
            <template #body="{ data }">
              <span class="text-sm text-gray-600">{{ data.sku || '—' }}</span>
            </template>
          </Column>
          <Column field="nombre" header="Producto" style="min-width: 220px">
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <span class="text-sm">{{ data.nombre }}</span>
                <AppBadge v-if="data.tiene_variantes" variant="info" size="small">variantes</AppBadge>
                <AppBadge v-if="data.stock_ilimitado" variant="neutral" size="small">ilimitado</AppBadge>
              </div>
            </template>
          </Column>
          <Column header="Stock en sucursal" style="min-width: 160px">
            <template #body="{ data }">
              <InputNumber
                v-if="!data.tiene_variantes && !data.stock_ilimitado"
                v-model="data.stock_sucursal"
                :min="0"
                showButtons
                buttonLayout="horizontal"
                class="w-32 p-inputtext-sm"
                :class="{ 'font-semibold': data.stock_sucursal !== data._original }"
              />
              <span v-else class="text-sm text-gray-400" :title="data.tiene_variantes ? 'Editar por variante vía CSV (columna variante_sku)' : 'Stock ilimitado'">
                {{ data.tiene_variantes ? 'por variante' : '∞' }}
              </span>
            </template>
          </Column>
          <Column field="stock_agregado" header="Stock total" style="min-width: 110px">
            <template #body="{ data }">
              <span class="text-sm text-gray-600">{{ data.stock_ilimitado ? '∞' : data.stock_agregado }}</span>
            </template>
          </Column>
        </DataTable>
      </div>

      <p class="text-xs text-gray-400">
        Productos con variantes: usa el import CSV con la columna <code>variante_sku</code> para fijar su stock por sucursal.
      </p>
    </div>
  </div>
</template>
