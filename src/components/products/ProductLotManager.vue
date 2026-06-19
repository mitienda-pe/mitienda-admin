<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Calendar from 'primevue/calendar'
import Button from 'primevue/button'
import InputSwitch from 'primevue/inputswitch'
import AppBadge from '@/components/ui/AppBadge.vue'
import { productsApi } from '@/api/products.api'
import { useProductsStore } from '@/stores/products.store'
import type { ProductLot, ProductLotMovement } from '@/types/product.types'

const props = defineProps<{
  productId: number
  managed: boolean
  storeEnabled: boolean
  hasVariants?: boolean
}>()

const emit = defineEmits<{ (e: 'update:managed', value: boolean): void }>()

const toast = useToast()
const productsStore = useProductsStore()

const lots = ref<ProductLot[]>([])
const loading = ref(false)
const togglingManaged = ref(false)

const variantList = ref<{ id: number; names: string }[]>([])
const hasVariants = computed(() => !!props.hasVariants)

async function loadVariants() {
  if (!props.hasVariants || variantList.value.length) return
  try {
    const res = await productsApi.getVariants(props.productId)
    variantList.value = (res.data?.variants ?? [])
      .filter((v): v is typeof v & { id: number } => typeof v.id === 'number')
      .map(v => ({ id: v.id, names: v.names }))
  } catch {
    variantList.value = []
  }
}

// ─── Toggle gestión por lotes ───────────────────────────────────
const managedModel = computed({
  get: () => props.managed,
  set: (val: boolean) => void setManaged(val)
})

async function setManaged(val: boolean) {
  togglingManaged.value = true
  try {
    const result = await productsStore.updateProduct(props.productId, { lots_managed: val })
    if (result?.success !== false) {
      emit('update:managed', val)
      toast.add({
        severity: 'success',
        summary: val ? 'Control por lotes activado' : 'Control por lotes desactivado',
        detail: val ? 'El stock de este producto se gestiona por lotes con vencimiento.' : '',
        life: 3000
      })
      if (val) { await loadLots(); await loadVariants() }
    }
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.response?.data?.message || 'No se pudo cambiar la configuración', life: 4000 })
  } finally {
    togglingManaged.value = false
  }
}

// ─── Listado de lotes ───────────────────────────────────────────
async function loadLots() {
  loading.value = true
  try {
    const res = await productsApi.getLots(props.productId)
    lots.value = res.data?.items ?? []
  } catch {
    lots.value = []
  } finally {
    loading.value = false
  }
}

function estadoLabel(lot: ProductLot): { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' } {
  if (lot.estado === 2) return { label: 'Baja', variant: 'neutral' }
  if (lot.estado === 0) return { label: 'Agotado', variant: 'neutral' }
  if (lot.vencido) return { label: 'Vencido', variant: 'danger' }
  return { label: 'Activo', variant: 'success' }
}

// ─── Alta de lote ───────────────────────────────────────────────
const showCreate = ref(false)
const saving = ref(false)
const newLot = ref<{
  productoatributo_id: number
  cantidad: number | null
  fecha_vencimiento: Date | null
  fecha_produccion: Date | null
  codigo: string
  costo: number | null
}>({ productoatributo_id: 0, cantidad: null, fecha_vencimiento: null, fecha_produccion: null, codigo: '', costo: null })

function openCreate() {
  newLot.value = { productoatributo_id: 0, cantidad: null, fecha_vencimiento: null, fecha_produccion: null, codigo: '', costo: null }
  showCreate.value = true
}

function toISO(d: Date | null): string | null {
  if (!d) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function saveLot() {
  if (!newLot.value.cantidad || newLot.value.cantidad <= 0) {
    toast.add({ severity: 'warn', summary: 'Cantidad requerida', detail: 'Indica la cantidad del lote', life: 3000 })
    return
  }
  saving.value = true
  try {
    const res = await productsApi.createLot(props.productId, {
      productoatributo_id: hasVariants.value ? newLot.value.productoatributo_id : 0,
      cantidad: newLot.value.cantidad,
      fecha_vencimiento: toISO(newLot.value.fecha_vencimiento),
      fecha_produccion: toISO(newLot.value.fecha_produccion),
      codigo: newLot.value.codigo || null,
      costo: newLot.value.costo
    })
    if (res.success !== false) {
      toast.add({ severity: 'success', summary: 'Lote registrado', life: 3000 })
      showCreate.value = false
      await loadLots()
    }
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.response?.data?.message || 'No se pudo registrar el lote', life: 4000 })
  } finally {
    saving.value = false
  }
}

// ─── Baja por merma ─────────────────────────────────────────────
const showBaja = ref(false)
const bajaTarget = ref<ProductLot | null>(null)
const bajaMotivo = ref('')
const bajaLoading = ref(false)

function confirmBaja(lot: ProductLot) {
  bajaTarget.value = lot
  bajaMotivo.value = ''
  showBaja.value = true
}

async function doBaja() {
  if (!bajaTarget.value) return
  bajaLoading.value = true
  try {
    const res = await productsApi.bajaLot(bajaTarget.value.lote_id, bajaMotivo.value || undefined)
    if (res.success !== false) {
      toast.add({ severity: 'success', summary: 'Lote dado de baja', life: 3000 })
      showBaja.value = false
      await loadLots()
    }
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: e?.response?.data?.message || 'No se pudo dar de baja', life: 4000 })
  } finally {
    bajaLoading.value = false
  }
}

// ─── Kardex ─────────────────────────────────────────────────────
const showKardex = ref(false)
const kardex = ref<ProductLotMovement[]>([])
const kardexLoading = ref(false)

async function openKardex(lot?: ProductLot) {
  showKardex.value = true
  kardexLoading.value = true
  try {
    const res = await productsApi.getLotKardex(props.productId, lot ? { lote_id: lot.lote_id } : {})
    kardex.value = res.data?.items ?? []
  } catch {
    kardex.value = []
  } finally {
    kardexLoading.value = false
  }
}

const tipoLabels: Record<string, string> = {
  ingreso: 'Ingreso', salida: 'Venta', merma: 'Merma', ajuste: 'Ajuste', devolucion: 'Devolución'
}

function variantName(id: number): string {
  if (!id) return 'Producto'
  return variantList.value.find(v => v.id === id)?.names || `Variante ${id}`
}

watch(() => props.managed, (val) => { if (val) { loadLots(); loadVariants() } })
onMounted(() => { if (props.managed) { loadLots(); loadVariants() } })
</script>

<template>
  <Card v-if="storeEnabled || managed">
    <template #title>
      <div class="flex items-center justify-between">
        <span class="text-base font-semibold">Control por lotes y vencimiento</span>
        <div class="flex items-center gap-2">
          <span class="text-sm text-secondary-600">Gestionar por lotes</span>
          <InputSwitch v-model="managedModel" :disabled="togglingManaged || !storeEnabled" />
        </div>
      </div>
    </template>
    <template #content>
      <p v-if="!storeEnabled" class="text-xs text-amber-600">
        Activa primero el control por lotes en Configuración de tienda para gestionar productos por lote.
      </p>

      <div v-else-if="!managed" class="text-sm text-gray-500">
        Activa el interruptor para llevar el stock de este producto por lotes con fecha de vencimiento.
        Al activarlo, el stock actual se convierte en un lote de apertura y deja de editarse directamente.
      </div>

      <div v-else>
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs text-gray-400">
            El stock se descuenta automáticamente según la estrategia de la tienda (FEFO/FIFO). No se puede vender de lotes vencidos.
          </p>
          <div class="flex gap-2">
            <Button icon="pi pi-history" label="Kardex" size="small" text @click="openKardex()" />
            <Button icon="pi pi-plus" label="Registrar lote" size="small" @click="openCreate" />
          </div>
        </div>

        <DataTable :value="lots" :loading="loading" size="small" stripedRows
          dataKey="lote_id" :rows="10" :paginator="lots.length > 10">
          <template #empty>
            <div class="text-center text-gray-400 py-4 text-sm">Aún no hay lotes registrados.</div>
          </template>
          <Column header="Estado">
            <template #body="{ data }">
              <AppBadge :variant="estadoLabel(data).variant" :label="estadoLabel(data).label" />
            </template>
          </Column>
          <Column v-if="hasVariants" header="Variante">
            <template #body="{ data }">{{ variantName(data.productoatributo_id) }}</template>
          </Column>
          <Column field="codigo" header="Código">
            <template #body="{ data }">{{ data.codigo || '—' }}</template>
          </Column>
          <Column header="Vence">
            <template #body="{ data }">
              <span :class="{ 'text-red-600 font-medium': data.vencido }">{{ data.fecha_vencimiento || 'Sin caducidad' }}</span>
            </template>
          </Column>
          <Column field="cantidad" header="Saldo">
            <template #body="{ data }">{{ data.cantidad }}</template>
          </Column>
          <Column header="" style="width: 7rem">
            <template #body="{ data }">
              <div class="flex gap-1 justify-end">
                <Button icon="pi pi-history" text rounded size="small" title="Kardex del lote" @click="openKardex(data)" />
                <Button v-if="data.estado !== 2" icon="pi pi-trash" text rounded size="small" severity="danger" title="Dar de baja (merma)" @click="confirmBaja(data)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </template>
  </Card>

  <!-- Dialog: registrar lote -->
  <Dialog v-model:visible="showCreate" header="Registrar lote" :modal="true" style="width: 460px">
    <div class="space-y-4">
      <div v-if="hasVariants">
        <label class="block text-sm font-medium text-secondary-700 mb-1">Variante</label>
        <select v-model.number="newLot.productoatributo_id" class="w-full border border-gray-300 rounded-md p-2 text-sm">
          <option :value="0">Selecciona una variante</option>
          <option v-for="v in variantList" :key="v.id" :value="v.id">{{ v.names }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-secondary-700 mb-1">Cantidad <span class="text-red-500">*</span></label>
        <InputNumber v-model="newLot.cantidad" :min="0" :useGrouping="false" class="w-full" inputClass="w-full" />
      </div>
      <div>
        <label class="block text-sm font-medium text-secondary-700 mb-1">Fecha de vencimiento</label>
        <Calendar v-model="newLot.fecha_vencimiento" dateFormat="yy-mm-dd" showIcon class="w-full" />
      </div>
      <div>
        <label class="block text-sm font-medium text-secondary-700 mb-1">Fecha de producción (opcional)</label>
        <Calendar v-model="newLot.fecha_produccion" dateFormat="yy-mm-dd" showIcon class="w-full" />
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Código de lote</label>
          <InputText v-model="newLot.codigo" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Costo (opcional)</label>
          <InputNumber v-model="newLot.costo" :min="0" mode="decimal" :maxFractionDigits="4" class="w-full" inputClass="w-full" />
        </div>
      </div>
    </div>
    <template #footer>
      <Button label="Cancelar" text @click="showCreate = false" />
      <Button label="Registrar" :loading="saving" @click="saveLot" />
    </template>
  </Dialog>

  <!-- Dialog: baja por merma -->
  <Dialog v-model:visible="showBaja" header="Dar de baja (merma)" :modal="true" style="width: 420px">
    <div class="space-y-3">
      <p class="text-sm text-secondary-700">
        Se descontará el saldo restante del lote
        <strong v-if="bajaTarget?.codigo">{{ bajaTarget?.codigo }}</strong>
        del stock. Esta acción no se puede deshacer.
      </p>
      <div>
        <label class="block text-sm font-medium text-secondary-700 mb-1">Motivo (opcional)</label>
        <InputText v-model="bajaMotivo" class="w-full" placeholder="Vencido, dañado, etc." />
      </div>
    </div>
    <template #footer>
      <Button label="Cancelar" text @click="showBaja = false" />
      <Button label="Dar de baja" severity="danger" :loading="bajaLoading" @click="doBaja" />
    </template>
  </Dialog>

  <!-- Dialog: kardex -->
  <Dialog v-model:visible="showKardex" header="Kardex de lotes" :modal="true" style="width: 640px">
    <DataTable :value="kardex" :loading="kardexLoading" size="small" stripedRows :rows="15" :paginator="kardex.length > 15">
      <template #empty>
        <div class="text-center text-gray-400 py-4 text-sm">Sin movimientos.</div>
      </template>
      <Column field="fecha" header="Fecha" />
      <Column header="Tipo">
        <template #body="{ data }">{{ tipoLabels[data.tipo] || data.tipo }}</template>
      </Column>
      <Column header="Lote">
        <template #body="{ data }">#{{ data.lote_id }}</template>
      </Column>
      <Column field="cantidad" header="Cantidad" />
      <Column field="cantidad_resultante" header="Saldo" />
      <Column field="referencia" header="Ref.">
        <template #body="{ data }">{{ data.referencia || '—' }}</template>
      </Column>
    </DataTable>
  </Dialog>
</template>
