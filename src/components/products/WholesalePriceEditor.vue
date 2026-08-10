<script setup lang="ts">
/**
 * Editor de precios por mayor (descuentos por volumen) de un producto.
 *
 * Cada fila es un TRAMO: "a partir de N unidades, S/X por unidad". No es un
 * porcentaje — es el precio final por unidad, igual que en el panel legacy, que
 * escribe la misma tabla (`productospreciosxmayor`).
 *
 * Guarda contra su propio endpoint (`PUT /products/{id}/wholesale-prices`), que
 * reemplaza el set completo. Deliberadamente NO se engancha al submit del
 * formulario del producto: son dos recursos distintos y mezclarlos obligaría a
 * guardar el producto entero para tocar un tramo.
 */
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import { AppButton, AppBadge } from '@/components/ui'
import { productsApi } from '@/api/products.api'
import type { WholesalePriceTier } from '@/types/product.types'
import { useFormatters } from '@/composables/useFormatters'

const { currencyIso } = useFormatters()

const props = defineProps<{
  productId: number
  /** Precio base con IGV, para calcular el descuento de cada tramo. */
  basePrice?: number | null
  hasVariants?: boolean
}>()

const toast = useToast()

const tiers = ref<WholesalePriceTier[]>([])
const loading = ref(false)
const saving = ref(false)
/** Se apaga el bloque entero si el plan no incluye el módulo (403). */
const available = ref(true)

const variantOptions = ref<{ label: string; value: number | null }[]>([
  { label: 'Todas las variantes', value: null },
])

// ─── Carga ──────────────────────────────────────────────────────

async function load() {
  loading.value = true
  try {
    const res = await productsApi.getWholesalePrices(props.productId)
    tiers.value = (res.data ?? []).map(t => ({
      id: t.id,
      variant_id: t.variant_id ?? null,
      quantity: Number(t.quantity),
      price: Number(t.price),
    }))
  } catch (err: any) {
    // 403 = el plan no incluye mod_listaprecioxmayor. No es un error que el
    // vendedor deba ver: simplemente no se muestra la sección.
    if (err?.response?.status === 403) {
      available.value = false
    } else {
      toast.add({
        severity: 'error',
        summary: 'No se pudieron cargar los precios por mayor',
        life: 4000,
      })
    }
  } finally {
    loading.value = false
  }
}

async function loadVariants() {
  if (!props.hasVariants) return
  try {
    const res = await productsApi.getVariants(props.productId)
    const list = (res.data?.variants ?? [])
      .filter((v): v is typeof v & { id: number } => typeof v.id === 'number')
      .map(v => ({ label: v.names, value: v.id as number | null }))
    variantOptions.value = [{ label: 'Todas las variantes', value: null }, ...list]
  } catch {
    // Sin variantes cargadas el selector queda con "Todas": el tramo a nivel
    // producto sigue siendo válido, así que no vale romper el editor por esto.
  }
}

onMounted(async () => {
  await load()
  if (available.value) await loadVariants()
})

// ─── Edición ────────────────────────────────────────────────────

function addTier() {
  const lastQuantity = tiers.value.length
    ? Math.max(...tiers.value.map(t => t.quantity))
    : 0
  tiers.value.push({
    variant_id: null,
    quantity: lastQuantity >= 2 ? lastQuantity * 2 : 6,
    price: props.basePrice ? Number((props.basePrice * 0.9).toFixed(2)) : 0,
  })
}

function removeTier(index: number) {
  tiers.value.splice(index, 1)
}

/** Descuento del tramo contra el precio base, para orientar al vendedor. */
function discountLabel(tier: WholesalePriceTier): string | null {
  const base = Number(props.basePrice ?? 0)
  if (!base || !tier.price || tier.price >= base) return null
  return `-${Math.round(((base - tier.price) / base) * 100)}%`
}

const variantLabel = (variantId: number | null) =>
  variantOptions.value.find(o => o.value === variantId)?.label ?? 'Todas las variantes'

/**
 * Validaciones espejo de las del backend, para no gastar un round-trip:
 * cantidad >= 2, precio > 0 y sin cantidades repetidas dentro de la misma
 * variante. El aviso de "precio mayor o igual al base" NO bloquea el guardado
 * (el motor simplemente no lo aplicaría), pero se avisa.
 */
const validationError = computed<string | null>(() => {
  const seen = new Set<string>()

  for (const tier of tiers.value) {
    if (!tier.quantity || tier.quantity < 2) {
      return 'La cantidad de cada tramo debe ser 2 o mayor.'
    }
    if (!tier.price || tier.price <= 0) {
      return 'El precio de cada tramo debe ser mayor a 0.'
    }
    const key = `${tier.variant_id ?? 0}:${tier.quantity}`
    if (seen.has(key)) {
      return `Hay dos tramos con la misma cantidad (${tier.quantity}) para ${variantLabel(tier.variant_id).toLowerCase()}.`
    }
    seen.add(key)
  }

  return null
})

const ineffectiveTiers = computed(() => {
  const base = Number(props.basePrice ?? 0)
  if (!base) return []
  return tiers.value.filter(t => t.price >= base)
})

async function save() {
  if (validationError.value) {
    toast.add({ severity: 'warn', summary: validationError.value, life: 5000 })
    return
  }

  saving.value = true
  try {
    const res = await productsApi.saveWholesalePrices(
      props.productId,
      tiers.value.map(t => ({
        variant_id: t.variant_id ?? null,
        quantity: t.quantity,
        price: t.price,
      }))
    )
    tiers.value = (res.data ?? []).map(t => ({
      id: t.id,
      variant_id: t.variant_id ?? null,
      quantity: Number(t.quantity),
      price: Number(t.price),
    }))
    toast.add({
      severity: 'success',
      summary: 'Precios por mayor guardados',
      life: 3000,
    })
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'No se pudieron guardar los precios por mayor',
      detail: err?.response?.data?.message ?? err?.response?.data?.messages?.error,
      life: 5000,
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Card v-if="available">
    <template #title>
      <div class="flex items-center gap-2">
        <span class="text-lg">Precios por mayor</span>
        <AppBadge v-if="tiers.length" variant="info">{{ tiers.length }}</AppBadge>
      </div>
    </template>

    <template #content>
      <p class="text-sm text-secondary-600 mb-4">
        Define un precio unitario menor a partir de cierta cantidad. Se aplica automáticamente
        en la tienda cuando el cliente llega a esa cantidad de <em>ese</em> producto.
      </p>

      <div v-if="loading" class="text-sm text-secondary-500 py-4">
        Cargando tramos...
      </div>

      <div v-else>
        <div v-if="!tiers.length" class="text-sm text-secondary-500 border border-dashed border-gray-300 rounded-lg p-4 text-center">
          Este producto no tiene precios por mayor.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(tier, index) in tiers"
            :key="index"
            class="flex flex-wrap items-end gap-3 border-b border-gray-100 pb-3"
          >
            <div v-if="hasVariants" class="flex-1 min-w-[160px]">
              <label class="block text-xs font-medium text-secondary-600 mb-1">Variante</label>
              <Dropdown
                v-model="tier.variant_id"
                :options="variantOptions"
                option-label="label"
                option-value="value"
                class="w-full"
              />
            </div>

            <div class="w-28">
              <label class="block text-xs font-medium text-secondary-600 mb-1">Desde</label>
              <InputNumber
                v-model="tier.quantity"
                :min="2"
                :use-grouping="false"
                class="w-full"
              />
            </div>

            <div class="w-40">
              <label class="block text-xs font-medium text-secondary-600 mb-1">Precio unitario</label>
              <InputNumber
                v-model="tier.price"
                mode="currency"
                :currency="currencyIso"
                currencyDisplay="narrowSymbol"
                locale="es-PE"
                :min="0"
                :min-fraction-digits="2"
                class="w-full"
              />
            </div>

            <div class="flex items-center gap-2 pb-2">
              <span v-if="discountLabel(tier)" class="text-xs font-semibold text-primary">
                {{ discountLabel(tier) }}
              </span>
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                aria-label="Eliminar tramo"
                @click="removeTier(index)"
              />
            </div>
          </div>
        </div>

        <p v-if="hasVariants" class="text-xs text-secondary-500 mt-3">
          Los tramos de una variante reemplazan a los de "Todas las variantes" para esa variante.
        </p>

        <p v-if="validationError" class="text-xs text-red-600 mt-3">
          {{ validationError }}
        </p>

        <p v-else-if="ineffectiveTiers.length" class="text-xs text-amber-600 mt-3">
          {{ ineffectiveTiers.length === 1 ? 'Un tramo tiene' : `${ineffectiveTiers.length} tramos tienen` }}
          un precio mayor o igual al precio base: no se van a aplicar.
        </p>

        <div class="flex items-center justify-between gap-3 mt-4">
          <AppButton
            label="Agregar tramo"
            icon="pi pi-plus"
            variant="text"
            size="small"
            @click="addTier"
          />
          <AppButton
            label="Guardar"
            :loading="saving"
            size="small"
            @click="save"
          />
        </div>
      </div>
    </template>
  </Card>
</template>
