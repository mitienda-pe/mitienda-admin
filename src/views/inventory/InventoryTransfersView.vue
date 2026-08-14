<script setup lang="ts">
/**
 * Transferencias entre almacenes: mover mercadería de uno a otro en un paso.
 *
 * El total de la tienda no cambia, solo se redistribuye. Requiere que la tienda
 * gestione stock por almacén; si no lo hace, el API responde con el motivo y acá
 * se muestra tal cual en vez de inventar una explicación.
 */
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import InventoryLineItems, { type InventoryLine } from '@/components/inventory/InventoryLineItems.vue'
import { usePlanStore } from '@/stores/plan.store'
import { inventoryApi, type Transfer, type TransferDetail, type TransferShortage, type Warehouse } from '@/api/inventory.api'

const toast = useToast()
const planStore = usePlanStore()

const moduleEnabled = computed(() => planStore.isModuleEnabled('mod_stock_sucursal'))

const loading = ref(false)
// Arranca en true: hasta saber cuántos almacenes hay no se puede decidir entre
// el listado y el aviso de "necesitas dos almacenes", y mostrarlo antes de
// tiempo le dice al comerciante algo falso sobre su tienda.
const cargandoAlmacenes = ref(true)
const transfers = ref<Transfer[]>([])
const warehouses = ref<Warehouse[]>([])
const page = ref(1)
const perPage = ref(50)
const totalRecords = ref(0)

// ─── Nueva transferencia ───
const dialogVisible = ref(false)
const guardando = ref(false)
const origenId = ref<number | null>(null)
const destinoId = ref<number | null>(null)
const nota = ref('')
const lineas = ref<InventoryLine[]>([])
const faltantes = ref<TransferShortage[]>([])

// ─── Detalle ───
const detalleVisible = ref(false)
const detalle = ref<TransferDetail | null>(null)
const cargandoDetalle = ref(false)

const destinosDisponibles = computed(() =>
  warehouses.value.filter((w) => w.id !== origenId.value)
)

const puedeGuardar = computed(
  () =>
    !!origenId.value &&
    !!destinoId.value &&
    origenId.value !== destinoId.value &&
    lineas.value.length > 0
)

function formatFecha(fecha: string): string {
  return fecha?.slice(0, 16).replace('T', ' ') ?? ''
}

async function loadWarehouses() {
  cargandoAlmacenes.value = true
  try {
    const res = await inventoryApi.warehouses()
    warehouses.value = res.data?.items ?? []
  } catch {
    warehouses.value = []
  } finally {
    cargandoAlmacenes.value = false
  }
}

async function loadTransfers() {
  loading.value = true
  try {
    const res = await inventoryApi.transfers(page.value)
    transfers.value = res.data?.items ?? []
    totalRecords.value = res.data?.pagination?.total_items ?? 0
    perPage.value = res.data?.pagination?.per_page ?? 50
  } catch (e: unknown) {
    toast.add({ severity: 'error', summary: 'Error', detail: extractMessage(e, 'No se pudieron cargar las transferencias'), life: 4000 })
  } finally {
    loading.value = false
  }
}

function onPage(e: { page: number }) {
  page.value = e.page + 1
  loadTransfers()
}

function abrirDialogo() {
  origenId.value = warehouses.value[0]?.id ?? null
  destinoId.value = null
  nota.value = ''
  lineas.value = []
  faltantes.value = []
  dialogVisible.value = true
}

/**
 * Al cambiar el origen se descartan las líneas: sus saldos disponibles ya no
 * corresponden y dejarlas ahí invitaría a enviar cantidades imposibles.
 */
function onOrigenChange() {
  lineas.value = []
  faltantes.value = []
  if (destinoId.value === origenId.value) destinoId.value = null
}

async function guardar() {
  if (!puedeGuardar.value || !origenId.value || !destinoId.value) return
  guardando.value = true
  faltantes.value = []
  try {
    const res = await inventoryApi.createTransfer({
      origen_id: origenId.value,
      destino_id: destinoId.value,
      nota: nota.value.trim() || undefined,
      items: lineas.value.map((l) => ({
        producto_id: l.producto_id,
        productoatributo_id: l.productoatributo_id || undefined,
        cantidad: l.cantidad
      }))
    })
    toast.add({
      severity: 'success',
      summary: 'Transferencia registrada',
      detail: `${res.data?.unidades_total ?? 0} unidad(es) movida(s)`,
      life: 4000
    })
    dialogVisible.value = false
    page.value = 1
    await loadTransfers()
  } catch (e: unknown) {
    const shortages = extractShortages(e)
    if (shortages.length) {
      faltantes.value = shortages
      toast.add({ severity: 'warn', summary: 'Stock insuficiente', detail: 'Revisa las cantidades marcadas.', life: 5000 })
    } else {
      toast.add({ severity: 'error', summary: 'No se pudo transferir', detail: extractMessage(e, 'Error al registrar la transferencia'), life: 5000 })
    }
  } finally {
    guardando.value = false
  }
}

async function verDetalle(id: number) {
  detalleVisible.value = true
  cargandoDetalle.value = true
  detalle.value = null
  try {
    const res = await inventoryApi.transfer(id)
    detalle.value = res.data ?? null
  } catch (e: unknown) {
    toast.add({ severity: 'error', summary: 'Error', detail: extractMessage(e, 'No se pudo cargar la transferencia'), life: 4000 })
    detalleVisible.value = false
  } finally {
    cargandoDetalle.value = false
  }
}

function nombreProducto(productoId: number, varianteId: number): string {
  const line = lineas.value.find(
    (l) => l.producto_id === productoId && l.productoatributo_id === varianteId
  )
  if (!line) return `#${productoId}`

  return line.variante ? `${line.nombre} · ${line.variante}` : line.nombre
}

function extractShortages(e: unknown): TransferShortage[] {
  if (typeof e === 'object' && e !== null) {
    const anyE = e as { response?: { status?: number; data?: { data?: { faltantes?: TransferShortage[] } } } }
    if (anyE.response?.status === 422) {
      return anyE.response.data?.data?.faltantes ?? []
    }
  }
  return []
}

function extractMessage(e: unknown, fallback: string): string {
  if (typeof e === 'object' && e !== null) {
    const anyE = e as { response?: { data?: { message?: string } }; message?: string }
    return anyE.response?.data?.message || anyE.message || fallback
  }
  return fallback
}

onMounted(async () => {
  if (!moduleEnabled.value) return
  await loadWarehouses()
  await loadTransfers()
})
</script>

<template>
  <div class="p-6">
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Transferencias entre almacenes</h1>
        <p class="text-sm text-gray-500 mt-1">
          Mueve mercadería de un almacén a otro. El stock total de la tienda no cambia: solo se redistribuye.
        </p>
      </div>
      <AppButton
        v-if="moduleEnabled && !cargandoAlmacenes && warehouses.length > 1"
        icon="pi pi-plus"
        label="Nueva transferencia"
        @click="abrirDialogo"
      />
    </div>

    <AppEmptyState
      v-if="!moduleEnabled"
      title="No disponible en tu plan"
      description="Las transferencias entre almacenes están disponibles en el plan Large y en el plan Punto de Venta."
      icon="pi-lock"
    />

    <div v-else-if="cargandoAlmacenes" class="text-gray-500 py-10 text-center">
      <i class="pi pi-spin pi-spinner text-2xl"></i>
    </div>

    <AppEmptyState
      v-else-if="warehouses.length < 2"
      title="Necesitas al menos dos almacenes"
      description="Marca como almacén al menos dos de tus direcciones para poder transferir mercadería entre ellas."
      icon="pi-map-marker"
    />

    <div v-else class="bg-white rounded-lg shadow-sm">
      <DataTable
        :value="transfers"
        :loading="loading"
        lazy
        paginator
        :rows="perPage"
        :total-records="totalRecords"
        :first="(page - 1) * perPage"
        data-key="id"
        responsive-layout="scroll"
        @page="onPage"
      >
        <template #empty>
          <div class="py-8">
            <AppEmptyState
              title="Sin transferencias"
              description="Cuando muevas mercadería entre almacenes, el historial aparece acá."
              icon="pi-inbox"
            />
          </div>
        </template>

        <Column field="id" header="#" style="width: 80px">
          <template #body="{ data }">
            <span class="text-sm text-gray-600">#{{ data.id }}</span>
          </template>
        </Column>

        <Column field="fecha" header="Fecha" style="width: 160px">
          <template #body="{ data }">
            <span class="text-sm text-gray-600 whitespace-nowrap">{{ formatFecha(data.fecha) }}</span>
          </template>
        </Column>

        <Column header="Ruta">
          <template #body="{ data }">
            <span class="text-sm text-gray-800">{{ data.origen ?? data.origen_id }}</span>
            <i class="pi pi-arrow-right text-xs text-gray-400 mx-2"></i>
            <span class="text-sm text-gray-800">{{ data.destino ?? data.destino_id }}</span>
          </template>
        </Column>

        <Column header="Contenido" style="width: 200px">
          <template #body="{ data }">
            <span class="text-sm text-gray-700">
              {{ data.items_count }} producto(s) · {{ data.unidades_total }} unidad(es)
            </span>
          </template>
        </Column>

        <Column field="estado" header="Estado" style="width: 120px">
          <template #body="{ data }">
            <AppBadge
              :variant="data.estado === 'confirmada' ? 'success' : 'neutral'"
              :label="data.estado === 'confirmada' ? 'Confirmada' : 'Anulada'"
              size="small"
            />
          </template>
        </Column>

        <Column header="" style="width: 100px">
          <template #body="{ data }">
            <AppButton label="Ver" variant="text" size="small" @click="verDetalle(data.id)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Nueva transferencia -->
    <Dialog
      v-model:visible="dialogVisible"
      modal
      header="Nueva transferencia"
      :style="{ width: '680px' }"
      :breakpoints="{ '768px': '95vw' }"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <Dropdown
              v-model="origenId"
              :options="warehouses"
              option-label="nombre"
              option-value="id"
              placeholder="Almacén de origen"
              class="w-full"
              @change="onOrigenChange"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Hacia</label>
            <Dropdown
              v-model="destinoId"
              :options="destinosDisponibles"
              option-label="nombre"
              option-value="id"
              placeholder="Almacén de destino"
              class="w-full"
            />
          </div>
        </div>

        <AppInput v-model="nota" label="Nota" placeholder="Ej: reposición semanal" :maxlength="191" />

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Productos</label>
          <InventoryLineItems v-model="lineas" :almacen-id="origenId" />
        </div>

        <div v-if="faltantes.length" class="bg-red-50 border border-red-200 rounded-lg p-3">
          <p class="text-sm font-medium text-red-700 mb-1">Sin stock suficiente en el origen</p>
          <ul class="text-sm text-red-600 space-y-0.5">
            <li v-for="f in faltantes" :key="`${f.producto_id}:${f.productoatributo_id}`">
              {{ nombreProducto(f.producto_id, f.productoatributo_id) }}:
              pediste {{ f.solicitado }}, hay {{ f.disponible }}
            </li>
          </ul>
        </div>
      </div>

      <template #footer>
        <AppButton label="Cancelar" variant="text" @click="dialogVisible = false" />
        <AppButton label="Transferir" :loading="guardando" :disabled="!puedeGuardar" @click="guardar" />
      </template>
    </Dialog>

    <!-- Detalle -->
    <Dialog
      v-model:visible="detalleVisible"
      modal
      :header="detalle ? `Transferencia #${detalle.transferencia.id}` : 'Transferencia'"
      :style="{ width: '680px' }"
      :breakpoints="{ '768px': '95vw' }"
    >
      <div v-if="cargandoDetalle" class="py-8 text-center text-gray-500">
        <i class="pi pi-spin pi-spinner text-2xl"></i>
      </div>

      <div v-else-if="detalle" class="space-y-4">
        <div class="text-sm text-gray-700">
          <p>
            <strong>{{ detalle.transferencia.origen }}</strong>
            <i class="pi pi-arrow-right text-xs text-gray-400 mx-2"></i>
            <strong>{{ detalle.transferencia.destino }}</strong>
          </p>
          <p class="text-gray-500">{{ formatFecha(detalle.transferencia.fecha) }}</p>
          <p v-if="detalle.transferencia.nota" class="mt-1">{{ detalle.transferencia.nota }}</p>
        </div>

        <div class="border border-gray-200 rounded-lg divide-y">
          <div
            v-for="mov in detalle.movimientos"
            :key="mov.id"
            class="flex items-center justify-between p-3"
          >
            <div class="min-w-0">
              <p class="text-sm text-gray-800 truncate">{{ mov.producto ?? `#${mov.producto_id}` }}</p>
              <p class="text-xs text-gray-500">
                {{ mov.tipo === 'transferencia_salida' ? 'Salida' : 'Entrada' }} ·
                saldo {{ mov.stock_anterior }} → {{ mov.stock_resultante }}
              </p>
            </div>
            <span
              class="text-sm font-semibold"
              :class="mov.cantidad >= 0 ? 'text-primary' : 'text-red-600'"
            >
              {{ mov.cantidad > 0 ? '+' : '' }}{{ mov.cantidad }}
            </span>
          </div>
        </div>
      </div>

      <template #footer>
        <AppButton label="Cerrar" variant="text" @click="detalleVisible = false" />
      </template>
    </Dialog>
  </div>
</template>
