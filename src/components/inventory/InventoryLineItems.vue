<script setup lang="ts">
/**
 * Editor de líneas para movimientos y transferencias de inventario: busca
 * productos, elige la variante cuando corresponde y edita la cantidad.
 *
 * El saldo disponible se resuelve por producto al agregarlo (`/inventory/stock`),
 * no precargando el stock del almacén: ese listado es paginado y con catálogos
 * grandes casi ninguna línea traería el dato.
 */
import { ref } from 'vue'
import AutoComplete from 'primevue/autocomplete'
import InputNumber from 'primevue/inputnumber'
import Dialog from 'primevue/dialog'
import AppButton from '@/components/ui/AppButton.vue'
import { productsApi } from '@/api/products.api'
import { inventoryApi, type WarehouseVariantStock } from '@/api/inventory.api'
import type { Product } from '@/types/product.types'

export interface InventoryLine {
  producto_id: number
  productoatributo_id: number
  nombre: string
  /** Nombre de la variante ("Talla M / Rojo"), vacío en productos simples. */
  variante: string
  sku: string
  cantidad: number
  /** Saldo actual en el almacén de trabajo, si se pudo resolver. */
  disponible?: number
}

interface SearchResult {
  producto_id: number
  nombre: string
  sku: string
  tiene_variantes: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue: InventoryLine[]
    /** Almacén sobre el que se consultan los saldos. */
    almacenId?: number | null
    placeholder?: string
  }>(),
  { almacenId: null, placeholder: 'Buscar producto por nombre o SKU...' }
)

const emit = defineEmits<{ 'update:modelValue': [InventoryLine[]] }>()

const query = ref('')
const results = ref<SearchResult[]>([])
const searching = ref(false)

// Selector de variante: se abre cuando el producto elegido tiene variantes.
const variantDialog = ref(false)
const variantLoading = ref(false)
const variantProduct = ref<SearchResult | null>(null)
const variants = ref<WarehouseVariantStock[]>([])

function key(productoId: number, varianteId: number): string {
  return `${productoId}:${varianteId}`
}

function yaAgregada(productoId: number, varianteId: number): boolean {
  return props.modelValue.some((l) => key(l.producto_id, l.productoatributo_id) === key(productoId, varianteId))
}

async function search(event: { query: string }) {
  if (event.query.trim().length < 2) {
    results.value = []
    return
  }
  searching.value = true
  try {
    const response = await productsApi.getProducts({ search: event.query, limit: 10 })
    results.value = (response.data ?? []).map((p: Product) => ({
      producto_id: p.id,
      nombre: p.name,
      sku: p.sku,
      tiene_variantes: p.has_variation_attributes === true
    }))
  } catch {
    results.value = []
  } finally {
    searching.value = false
  }
}

async function onSelect(event: { value: SearchResult }) {
  const producto = event.value
  query.value = ''
  results.value = []

  if (producto.tiene_variantes) {
    await abrirVariantes(producto)
    return
  }

  if (yaAgregada(producto.producto_id, 0)) return

  const line: InventoryLine = {
    producto_id: producto.producto_id,
    productoatributo_id: 0,
    nombre: producto.nombre,
    variante: '',
    sku: producto.sku,
    cantidad: 1
  }
  emit('update:modelValue', [...props.modelValue, line])
  resolverSaldo(line)
}

async function abrirVariantes(producto: SearchResult) {
  variantProduct.value = producto
  variants.value = []
  variantDialog.value = true
  variantLoading.value = true
  try {
    const res = await inventoryApi.stock(producto.producto_id, props.almacenId)
    variants.value = res.data?.variantes ?? []
  } catch {
    variants.value = []
  } finally {
    variantLoading.value = false
  }
}

function agregarVariante(v: WarehouseVariantStock) {
  const producto = variantProduct.value
  if (!producto || yaAgregada(producto.producto_id, v.productoatributo_id)) return

  emit('update:modelValue', [
    ...props.modelValue,
    {
      producto_id: producto.producto_id,
      productoatributo_id: v.productoatributo_id,
      nombre: producto.nombre,
      variante: v.nombre ?? '',
      sku: producto.sku,
      cantidad: 1,
      disponible: v.stock_ilimitado ? undefined : v.stock
    }
  ])
}

/** Completa el saldo del producto simple recién agregado. */
async function resolverSaldo(line: InventoryLine) {
  try {
    const res = await inventoryApi.stock(line.producto_id, props.almacenId)
    const p = res.data?.producto
    if (!p || p.stock_ilimitado) return
    emit(
      'update:modelValue',
      props.modelValue.map((l) =>
        key(l.producto_id, l.productoatributo_id) === key(line.producto_id, 0)
          ? { ...l, disponible: p.stock }
          : l
      )
    )
  } catch {
    // Sin el dato la línea sigue siendo válida; solo pierde la ayuda visual.
  }
}

function remove(line: InventoryLine) {
  emit(
    'update:modelValue',
    props.modelValue.filter(
      (l) => key(l.producto_id, l.productoatributo_id) !== key(line.producto_id, line.productoatributo_id)
    )
  )
}

function updateQty(line: InventoryLine, cantidad: number | null) {
  emit(
    'update:modelValue',
    props.modelValue.map((l) =>
      key(l.producto_id, l.productoatributo_id) === key(line.producto_id, line.productoatributo_id)
        ? { ...l, cantidad: Math.max(1, cantidad ?? 1) }
        : l
    )
  )
}

function excede(line: InventoryLine): boolean {
  return line.disponible !== undefined && line.cantidad > line.disponible
}
</script>

<template>
  <div>
    <AutoComplete
      v-model="query"
      :suggestions="results"
      option-label="nombre"
      :placeholder="placeholder"
      class="w-full"
      :loading="searching"
      @complete="search"
      @item-select="onSelect"
    >
      <template #option="{ option }">
        <div class="flex items-center justify-between gap-3 w-full">
          <div class="flex flex-col min-w-0">
            <span class="text-sm text-gray-800 truncate">{{ option.nombre }}</span>
            <span class="text-xs text-gray-500">{{ option.sku || 'sin SKU' }}</span>
          </div>
          <span v-if="option.tiene_variantes" class="text-xs text-primary whitespace-nowrap">
            elegir variante
          </span>
        </div>
      </template>
    </AutoComplete>

    <p v-if="!modelValue.length" class="text-sm text-gray-500 mt-3">
      Todavía no agregaste productos.
    </p>

    <div v-else class="mt-3 border border-gray-200 rounded-lg divide-y">
      <div
        v-for="line in modelValue"
        :key="`${line.producto_id}:${line.productoatributo_id}`"
        class="flex items-center gap-3 p-3"
      >
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-800 truncate">
            {{ line.nombre }}
            <span v-if="line.variante" class="text-gray-500">· {{ line.variante }}</span>
          </p>
          <p class="text-xs" :class="excede(line) ? 'text-red-600' : 'text-gray-500'">
            {{ line.sku || 'sin SKU' }}
            <span v-if="line.disponible !== undefined"> · disponible: {{ line.disponible }}</span>
          </p>
        </div>

        <InputNumber
          :model-value="line.cantidad"
          :min="1"
          :max="999999"
          show-buttons
          button-layout="horizontal"
          input-class="w-16 text-center"
          decrement-button-class="p-button-secondary"
          increment-button-class="p-button-secondary"
          @update:model-value="(v: number) => updateQty(line, v)"
        />

        <AppButton
          icon="pi pi-trash"
          variant="text"
          size="small"
          aria-label="Quitar producto"
          @click="remove(line)"
        />
      </div>
    </div>

    <p v-if="modelValue.some(excede)" class="text-sm text-red-600 mt-2">
      Hay líneas que superan el stock disponible.
    </p>

    <!-- Selector de variante -->
    <Dialog
      v-model:visible="variantDialog"
      modal
      :header="variantProduct?.nombre ?? 'Variantes'"
      :style="{ width: '520px' }"
      :breakpoints="{ '768px': '95vw' }"
    >
      <div v-if="variantLoading" class="py-6 text-center text-gray-500">
        <i class="pi pi-spin pi-spinner text-xl"></i>
      </div>

      <p v-else-if="!variants.length" class="text-sm text-gray-500 py-4">
        Este producto no tiene variantes activas.
      </p>

      <div v-else class="border border-gray-200 rounded-lg divide-y max-h-80 overflow-y-auto">
        <div
          v-for="v in variants"
          :key="v.productoatributo_id"
          class="flex items-center justify-between gap-3 p-3"
        >
          <div class="min-w-0">
            <p class="text-sm text-gray-800 truncate">{{ v.nombre || `Variante ${v.productoatributo_id}` }}</p>
            <p class="text-xs text-gray-500">
              {{ v.stock_ilimitado ? 'stock ilimitado' : `disponible: ${v.stock}` }}
            </p>
          </div>
          <AppButton
            :label="yaAgregada(variantProduct?.producto_id ?? 0, v.productoatributo_id) ? 'Agregada' : 'Agregar'"
            variant="outlined"
            size="small"
            :disabled="yaAgregada(variantProduct?.producto_id ?? 0, v.productoatributo_id)"
            @click="agregarVariante(v)"
          />
        </div>
      </div>

      <template #footer>
        <AppButton label="Listo" variant="text" @click="variantDialog = false" />
      </template>
    </Dialog>
  </div>
</template>
