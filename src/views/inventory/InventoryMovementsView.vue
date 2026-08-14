<script setup lang="ts">
/**
 * Kardex: bitácora de todo lo que le pasó al stock, con el registro manual de
 * ingresos, salidas y mermas.
 *
 * Las ventas y sus anulaciones entran solas desde el checkout y el POS; acá
 * solo se registra lo que el comerciante hace a mano.
 */
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dropdown from 'primevue/dropdown'
import Calendar from 'primevue/calendar'
import Dialog from 'primevue/dialog'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import InventoryLineItems, { type InventoryLine } from '@/components/inventory/InventoryLineItems.vue'
import { usePlanStore } from '@/stores/plan.store'
import {
  inventoryApi,
  MOVEMENT_LABELS,
  type KardexMovement,
  type ManualMovementType,
  type MovementType,
  type Warehouse
} from '@/api/inventory.api'

const toast = useToast()
const route = useRoute()
const planStore = usePlanStore()

const moduleEnabled = computed(() => planStore.isModuleEnabled('mod_stock_sucursal'))

const activationLoading = ref(true)
const activating = ref(false)
const isActive = ref(false)

const warehouses = ref<Warehouse[]>([])
const movements = ref<KardexMovement[]>([])
const loading = ref(false)
const page = ref(1)
const perPage = ref(50)
const totalRecords = ref(0)

const filtroAlmacen = ref<number | null>(null)
const filtroTipo = ref<MovementType | null>(null)
const filtroRango = ref<Date[] | null>(null)
const filtroProductoId = ref<number | null>(null)

const tipoOptions = (Object.keys(MOVEMENT_LABELS) as MovementType[]).map((t) => ({
  label: MOVEMENT_LABELS[t],
  value: t
}))

// ─── Diálogo de movimiento manual ───
const dialogVisible = ref(false)
const guardando = ref(false)
const nuevoTipo = ref<ManualMovementType>('entrada')
const nuevoAlmacen = ref<number | null>(null)
const nuevoMotivo = ref('')
const nuevasLineas = ref<InventoryLine[]>([])

const tiposManuales: Array<{ label: string; value: ManualMovementType; hint: string }> = [
  { label: 'Ingreso', value: 'entrada', hint: 'Suma stock: compra a proveedor, devolución de cliente, producción.' },
  { label: 'Salida', value: 'salida', hint: 'Resta stock: consumo interno, muestra, traslado fuera del sistema.' },
  { label: 'Merma', value: 'merma', hint: 'Resta stock por pérdida: rotura, vencimiento, robo.' }
]

const hintTipo = computed(() => tiposManuales.find((t) => t.value === nuevoTipo.value)?.hint ?? '')
const puedeGuardar = computed(() => nuevasLineas.value.length > 0 && !!nuevoAlmacen.value)

function tipoLabel(tipo: MovementType): string {
  return MOVEMENT_LABELS[tipo] ?? tipo
}

function badgeVariant(m: KardexMovement): 'success' | 'danger' | 'info' | 'neutral' {
  if (m.tipo === 'venta' || m.tipo === 'salida' || m.tipo === 'merma') return 'danger'
  if (m.tipo === 'entrada' || m.tipo === 'venta_reversa' || m.tipo === 'devolucion') return 'success'
  if (m.tipo.startsWith('transferencia')) return 'info'
  return 'neutral'
}

function formatFecha(fecha: string): string {
  return fecha?.slice(0, 16).replace('T', ' ') ?? ''
}

function toIsoDate(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

async function loadActivation() {
  activationLoading.value = true
  try {
    const res = await inventoryApi.getActivation()
    isActive.value = res.data?.enabled ?? false
  } catch {
    isActive.value = false
  } finally {
    activationLoading.value = false
  }
}

async function loadWarehouses() {
  try {
    const res = await inventoryApi.warehouses()
    warehouses.value = res.data?.items ?? []
    nuevoAlmacen.value = res.data?.default_id || warehouses.value[0]?.id || null
  } catch {
    warehouses.value = []
  }
}

async function loadMovements() {
  loading.value = true
  try {
    const [desde, hasta] = filtroRango.value ?? []
    const res = await inventoryApi.kardex({
      producto_id: filtroProductoId.value,
      almacen_id: filtroAlmacen.value,
      tipo: filtroTipo.value,
      desde: desde ? toIsoDate(desde) : null,
      hasta: hasta ? toIsoDate(hasta) : null,
      page: page.value,
      per_page: perPage.value
    })
    movements.value = res.data?.items ?? []
    totalRecords.value = res.data?.pagination?.total_items ?? 0
    perPage.value = res.data?.pagination?.per_page ?? 50
  } catch (e: unknown) {
    toast.add({ severity: 'error', summary: 'Error', detail: extractMessage(e, 'No se pudieron cargar los movimientos'), life: 4000 })
  } finally {
    loading.value = false
  }
}

function aplicarFiltros() {
  page.value = 1
  loadMovements()
}

function limpiarFiltros() {
  filtroAlmacen.value = null
  filtroTipo.value = null
  filtroRango.value = null
  filtroProductoId.value = null
  aplicarFiltros()
}

function onPage(e: { page: number }) {
  page.value = e.page + 1
  loadMovements()
}

function abrirDialogo() {
  nuevoTipo.value = 'entrada'
  nuevoMotivo.value = ''
  nuevasLineas.value = []
  dialogVisible.value = true
}

async function guardarMovimiento() {
  if (!puedeGuardar.value || !nuevoAlmacen.value) return
  guardando.value = true
  try {
    const res = await inventoryApi.createMovement({
      tipo: nuevoTipo.value,
      almacen_id: nuevoAlmacen.value,
      motivo: nuevoMotivo.value.trim() || undefined,
      items: nuevasLineas.value.map((l) => ({
        producto_id: l.producto_id,
        productoatributo_id: l.productoatributo_id || undefined,
        cantidad: l.cantidad
      }))
    })
    const aplicados = res.data?.aplicados ?? 0
    const errores = res.data?.errores?.length ?? 0
    toast.add({
      severity: errores ? 'warn' : 'success',
      summary: 'Movimiento registrado',
      detail: `${aplicados} producto(s) actualizado(s)` + (errores ? `, ${errores} con error` : ''),
      life: 4000
    })
    dialogVisible.value = false
    page.value = 1
    await loadMovements()
  } catch (e: unknown) {
    toast.add({ severity: 'error', summary: 'No se pudo registrar', detail: extractMessage(e, 'Error al registrar el movimiento'), life: 5000 })
  } finally {
    guardando.value = false
  }
}

async function activar() {
  activating.value = true
  try {
    const res = await inventoryApi.setActivation(true)
    isActive.value = res.data?.enabled ?? false
    if (isActive.value) {
      toast.add({ severity: 'success', summary: 'Activado', detail: 'El inventario quedó activo. Desde ahora las ventas se registran en el kardex.', life: 4000 })
      await loadWarehouses()
      await loadMovements()
    }
  } catch (e: unknown) {
    toast.add({ severity: 'error', summary: 'No se pudo activar', detail: extractMessage(e, 'No disponible para esta tienda'), life: 5000 })
  } finally {
    activating.value = false
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
  // Permite entrar filtrado desde la ficha de un producto.
  const productoId = Number(route.query.producto_id)
  if (Number.isFinite(productoId) && productoId > 0) {
    filtroProductoId.value = productoId
  }
  await loadActivation()
  if (isActive.value) {
    await loadWarehouses()
    await loadMovements()
  }
})
</script>

<template>
  <div class="p-6">
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Inventario</h1>
        <p class="text-sm text-gray-500 mt-1">
          Kardex de movimientos: qué entró, qué salió y por qué. Las ventas y sus anulaciones se registran solas.
        </p>
      </div>
      <AppButton
        v-if="isActive"
        icon="pi pi-plus"
        label="Registrar movimiento"
        @click="abrirDialogo"
      />
    </div>

    <AppEmptyState
      v-if="!moduleEnabled"
      title="No disponible en tu plan"
      description="El inventario con kardex está disponible en el plan Large y en el plan Punto de Venta. También puede agregarse a tu plan actual."
      icon="pi-lock"
    />

    <div v-else-if="activationLoading" class="text-gray-500 py-10 text-center">
      <i class="pi pi-spin pi-spinner text-2xl"></i>
    </div>

    <!-- Disponible pero sin activar -->
    <div v-else-if="!isActive" class="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
      <h2 class="text-lg font-semibold text-gray-800 mb-2">Activar el inventario</h2>
      <p class="text-sm text-gray-600 mb-4">
        Al activarlo, cada venta deja su salida en el kardex y vas a poder registrar ingresos, salidas
        y transferencias entre tus almacenes. Nada cambia en el stock que ya tienes cargado.
      </p>
      <AppButton label="Activar inventario" :loading="activating" @click="activar" />
    </div>

    <template v-else>
      <!-- Filtros -->
      <div class="bg-white rounded-lg shadow-sm p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div class="w-56">
          <label class="block text-xs font-medium text-gray-600 mb-1">Almacén</label>
          <Dropdown
            v-model="filtroAlmacen"
            :options="warehouses"
            option-label="nombre"
            option-value="id"
            placeholder="Todos"
            show-clear
            class="w-full"
            @change="aplicarFiltros"
          />
        </div>
        <div class="w-56">
          <label class="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
          <Dropdown
            v-model="filtroTipo"
            :options="tipoOptions"
            option-label="label"
            option-value="value"
            placeholder="Todos"
            show-clear
            class="w-full"
            @change="aplicarFiltros"
          />
        </div>
        <div class="w-72">
          <label class="block text-xs font-medium text-gray-600 mb-1">Fechas</label>
          <Calendar
            v-model="filtroRango"
            selection-mode="range"
            date-format="dd/mm/yy"
            placeholder="Todo el periodo"
            show-icon
            class="w-full"
            @date-select="aplicarFiltros"
          />
        </div>
        <AppButton label="Limpiar" variant="text" @click="limpiarFiltros" />
      </div>

      <!-- Tabla -->
      <div class="bg-white rounded-lg shadow-sm">
        <DataTable
          :value="movements"
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
                title="Sin movimientos"
                description="Cuando registres un ingreso o se haga una venta, el movimiento aparece acá."
                icon="pi-inbox"
              />
            </div>
          </template>

          <Column field="fecha" header="Fecha" style="width: 150px">
            <template #body="{ data }">
              <span class="text-sm text-gray-600 whitespace-nowrap">{{ formatFecha(data.fecha) }}</span>
            </template>
          </Column>

          <Column field="tipo" header="Tipo" style="width: 170px">
            <template #body="{ data }">
              <AppBadge :variant="badgeVariant(data)" :label="tipoLabel(data.tipo)" size="small" />
            </template>
          </Column>

          <Column field="producto" header="Producto">
            <template #body="{ data }">
              <div class="min-w-0">
                <p class="text-sm text-gray-800 truncate">{{ data.producto ?? `#${data.producto_id}` }}</p>
                <p class="text-xs text-gray-500">{{ data.sku || 'sin SKU' }}</p>
              </div>
            </template>
          </Column>

          <Column field="almacen" header="Almacén" style="width: 200px">
            <template #body="{ data }">
              <span class="text-sm text-gray-700">{{ data.almacen ?? '—' }}</span>
              <span v-if="data.contraparte" class="text-xs text-gray-500 block">
                <i class="pi pi-arrow-right text-[10px]"></i> {{ data.contraparte }}
              </span>
            </template>
          </Column>

          <Column field="cantidad" header="Cantidad" style="width: 110px">
            <template #body="{ data }">
              <span
                class="text-sm font-semibold"
                :class="data.cantidad >= 0 ? 'text-primary' : 'text-red-600'"
              >
                {{ data.cantidad > 0 ? '+' : '' }}{{ data.cantidad }}
              </span>
            </template>
          </Column>

          <Column header="Saldo" style="width: 130px">
            <template #body="{ data }">
              <span class="text-sm text-gray-600">
                {{ data.stock_anterior }} <i class="pi pi-arrow-right text-[10px]"></i>
                <strong class="text-gray-800">{{ data.stock_resultante }}</strong>
              </span>
            </template>
          </Column>

          <Column header="Detalle">
            <template #body="{ data }">
              <p v-if="data.motivo" class="text-sm text-gray-700">{{ data.motivo }}</p>
              <p v-if="data.venta_codigo" class="text-xs text-gray-500">Venta {{ data.venta_codigo }}</p>
              <p v-else-if="data.transferencia_id" class="text-xs text-gray-500">
                Transferencia #{{ data.transferencia_id }}
              </p>
              <p v-else-if="!data.motivo && data.referencia" class="text-xs text-gray-500">{{ data.referencia }}</p>
            </template>
          </Column>
        </DataTable>
      </div>
    </template>

    <!-- Diálogo de movimiento manual -->
    <Dialog
      v-model:visible="dialogVisible"
      modal
      header="Registrar movimiento"
      :style="{ width: '640px' }"
      :breakpoints="{ '768px': '95vw' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tipo de movimiento</label>
          <Dropdown
            v-model="nuevoTipo"
            :options="tiposManuales"
            option-label="label"
            option-value="value"
            class="w-full"
          />
          <p class="text-xs text-gray-500 mt-1">{{ hintTipo }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Almacén</label>
          <Dropdown
            v-model="nuevoAlmacen"
            :options="warehouses"
            option-label="nombre"
            option-value="id"
            placeholder="Selecciona un almacén"
            class="w-full"
          />
        </div>

        <AppInput
          v-model="nuevoMotivo"
          label="Motivo"
          placeholder="Ej: compra a proveedor, rotura en almacén..."
          :maxlength="191"
        />

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Productos</label>
          <InventoryLineItems v-model="nuevasLineas" :almacen-id="nuevoAlmacen" />
        </div>
      </div>

      <template #footer>
        <AppButton label="Cancelar" variant="text" @click="dialogVisible = false" />
        <AppButton
          label="Registrar"
          :loading="guardando"
          :disabled="!puedeGuardar"
          @click="guardarMovimiento"
        />
      </template>
    </Dialog>
  </div>
</template>
