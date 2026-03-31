<template>
  <div class="space-y-4">
    <!-- No fields needed for this type -->
    <div v-if="!schema || schema.length === 0" class="rounded-md bg-gray-50 px-4 py-3">
      <p class="text-sm text-gray-500">{{ emptyMessage }}</p>
    </div>

    <!-- Dynamic fields -->
    <div v-for="field in schema" :key="field.key">
      <label class="mb-1 block text-sm font-medium text-secondary-700">
        {{ field.label }}
        <span v-if="field.required" class="text-red-500">*</span>
      </label>

      <!-- Number -->
      <InputNumber
        v-if="field.type === 'number'"
        :modelValue="modelValue[field.key]"
        @update:modelValue="updateField(field.key, $event)"
        :min="field.min"
        :max="field.max"
        :placeholder="field.placeholder"
        class="w-full"
        inputClass="w-full"
      />

      <!-- Currency (soles) -->
      <InputNumber
        v-else-if="field.type === 'currency'"
        :modelValue="modelValue[field.key]"
        @update:modelValue="updateField(field.key, $event)"
        :min="field.min"
        :minFractionDigits="2"
        :maxFractionDigits="2"
        mode="currency"
        currency="PEN"
        locale="es-PE"
        :placeholder="field.placeholder"
        class="w-full"
        inputClass="w-full"
      />

      <!-- Percentage -->
      <InputNumber
        v-else-if="field.type === 'percentage'"
        :modelValue="modelValue[field.key]"
        @update:modelValue="updateField(field.key, $event)"
        :min="field.min ?? 1"
        :max="field.max ?? 100"
        suffix="%"
        :placeholder="field.placeholder"
        class="w-full"
        inputClass="w-full"
      />

      <!-- Text -->
      <input
        v-else-if="field.type === 'text'"
        type="text"
        :value="modelValue[field.key] ?? ''"
        @input="updateField(field.key, ($event.target as HTMLInputElement).value)"
        :placeholder="field.placeholder"
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
      />

      <!-- Textarea -->
      <textarea
        v-else-if="field.type === 'textarea'"
        :value="modelValue[field.key] ?? ''"
        @input="updateField(field.key, ($event.target as HTMLTextAreaElement).value)"
        :placeholder="field.placeholder"
        rows="4"
        class="block w-full rounded-md border-gray-300 font-mono text-sm shadow-sm focus:border-primary focus:ring-primary"
      ></textarea>

      <!-- Product Picker -->
      <div v-else-if="field.type === 'product-picker'">
        <AutoComplete
          :modelValue="productDisplayValues[field.key] || ''"
          :suggestions="productSuggestions"
          optionLabel="producto_nombre"
          :placeholder="'Buscar producto...'"
          @complete="searchProducts($event)"
          @item-select="selectProduct(field.key, $event)"
          class="w-full"
          inputClass="w-full"
        >
          <template #option="{ option }">
            <div class="flex items-center gap-2">
              <img
                v-if="option.producto_imagen"
                :src="option.producto_imagen"
                class="h-8 w-8 rounded object-cover"
                alt=""
              />
              <div class="h-8 w-8 rounded bg-gray-200" v-else></div>
              <div>
                <div class="text-sm font-medium">{{ option.producto_nombre }}</div>
                <div class="text-xs text-gray-500">SKU: {{ option.producto_sku }} · S/ {{ option.producto_precio }}</div>
              </div>
            </div>
          </template>
        </AutoComplete>
        <div v-if="modelValue[field.key]" class="mt-1 text-xs text-gray-500">
          ID: {{ modelValue[field.key] }}
        </div>
      </div>

      <!-- Category Picker -->
      <Dropdown
        v-else-if="field.type === 'category-picker'"
        :modelValue="modelValue[field.key]"
        @update:modelValue="updateField(field.key, $event)"
        :options="categories"
        optionLabel="label"
        optionValue="value"
        placeholder="Seleccionar categoría..."
        class="w-full"
        :loading="loadingCategories"
      />

      <!-- Brand Picker -->
      <Dropdown
        v-else-if="field.type === 'brand-picker'"
        :modelValue="modelValue[field.key]"
        @update:modelValue="updateField(field.key, $event)"
        :options="brands"
        optionLabel="label"
        optionValue="value"
        placeholder="Seleccionar marca..."
        class="w-full"
        :loading="loadingBrands"
      />

      <!-- Gamma Picker -->
      <Dropdown
        v-else-if="field.type === 'gamma-picker'"
        :modelValue="modelValue[field.key]"
        @update:modelValue="updateField(field.key, $event)"
        :options="gammas"
        optionLabel="label"
        optionValue="value"
        placeholder="Seleccionar gamma..."
        class="w-full"
        :loading="loadingGammas"
      />

      <!-- Referral Code Picker -->
      <div v-else-if="field.type === 'referral-code-picker'">
        <div v-if="loadingReferralCodes" class="flex items-center gap-2 py-2 text-sm text-gray-500">
          <i class="pi pi-spinner pi-spin"></i> Cargando códigos de referido...
        </div>
        <div v-else-if="referralCodes.length === 0" class="rounded-md bg-yellow-50 px-4 py-3">
          <p class="text-sm text-yellow-700">
            No hay códigos de referido configurados.
            <a href="/marketing/referrals" class="font-medium underline hover:text-yellow-800">Crear códigos de referido</a>
          </p>
        </div>
        <div v-else class="max-h-48 space-y-2 overflow-y-auto rounded-md border border-gray-200 p-3">
          <label
            v-for="rc in referralCodes"
            :key="rc.tiendacodigoreferido_id"
            class="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-gray-50"
          >
            <input
              type="checkbox"
              :checked="(modelValue[field.key] || []).includes(rc.tiendacodigoreferido_id)"
              @change="toggleReferralCode(field.key, rc.tiendacodigoreferido_id)"
              class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900 truncate">{{ rc.tiendacodigoreferido_nombre }}</div>
              <div class="text-xs text-gray-500 font-mono">{{ rc.tiendacodigoreferido_codigo }}</div>
            </div>
            <span
              class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
              :class="rc.tiendacodigoreferido_activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
            >
              {{ rc.tiendacodigoreferido_activo ? 'Activo' : 'Inactivo' }}
            </span>
          </label>
        </div>
        <div v-if="referralCodes.length > 0" class="mt-1 text-xs text-gray-500">
          {{ (modelValue[field.key] || []).length }} de {{ referralCodes.length }} seleccionados
        </div>
      </div>

      <!-- Select -->
      <Dropdown
        v-else-if="field.type === 'select'"
        :modelValue="modelValue[field.key]"
        @update:modelValue="updateField(field.key, $event)"
        :options="field.options"
        optionLabel="label"
        optionValue="value"
        :placeholder="field.placeholder || 'Seleccionar...'"
        class="w-full"
      />

      <!-- Multiselect -->
      <MultiSelect
        v-else-if="field.type === 'multiselect'"
        :modelValue="modelValue[field.key] || []"
        @update:modelValue="updateField(field.key, $event)"
        :options="field.options"
        optionLabel="label"
        optionValue="value"
        :placeholder="field.placeholder || 'Seleccionar...'"
        class="w-full"
        display="chip"
      />

      <!-- Weekday Picker -->
      <div v-else-if="field.type === 'weekday-picker'" class="flex flex-wrap gap-2">
        <label
          v-for="day in weekdays"
          :key="day.value"
          class="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors"
          :class="
            (modelValue[field.key] || {})[day.value]
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-gray-300 text-gray-600 hover:border-gray-400'
          "
        >
          <input
            type="checkbox"
            :checked="(modelValue[field.key] || {})[day.value]"
            @change="toggleWeekday(field.key, day.value)"
            class="sr-only"
          />
          {{ day.label }}
        </label>
      </div>

      <!-- Time Windows -->
      <div v-else-if="field.type === 'time-windows'" class="space-y-2">
        <div
          v-for="(tw, index) in (modelValue[field.key] || [])"
          :key="index"
          class="flex items-center gap-2"
        >
          <input
            type="time"
            :value="tw.start"
            @input="updateTimeWindow(field.key, index, 'start', ($event.target as HTMLInputElement).value)"
            class="block rounded-md border-gray-300 text-sm shadow-sm focus:border-primary focus:ring-primary"
          />
          <span class="text-sm text-gray-500">a</span>
          <input
            type="time"
            :value="tw.end"
            @input="updateTimeWindow(field.key, index, 'end', ($event.target as HTMLInputElement).value)"
            class="block rounded-md border-gray-300 text-sm shadow-sm focus:border-primary focus:ring-primary"
          />
          <button
            type="button"
            @click="removeTimeWindow(field.key, index)"
            class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
          >
            <i class="pi pi-trash text-xs"></i>
          </button>
        </div>
        <button
          type="button"
          @click="addTimeWindow(field.key)"
          class="inline-flex items-center text-xs font-medium text-primary hover:text-primary/80"
        >
          <i class="pi pi-plus mr-1"></i> Agregar ventana horaria
        </button>
      </div>

      <!-- Help text -->
      <p v-if="field.helpText" class="mt-1 text-xs text-gray-500">{{ field.helpText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import InputNumber from 'primevue/inputnumber'
import AutoComplete from 'primevue/autocomplete'
import Dropdown from 'primevue/dropdown'
import MultiSelect from 'primevue/multiselect'
import { productsApi } from '@/api/products.api'
import { categoryApi } from '@/api/category.api'
import { brandApi } from '@/api/brand.api'
import { gammaApi } from '@/api/gamma.api'
import { referralApi } from '@/api/referral.api'
import type { ReferralCode } from '@/types/referral.types'
import {
  getConfigSchema,
  type RuleCategory,
  type ConfigFieldSchema,
} from '@/config/promotion-v2-config-schemas'

const props = defineProps<{
  ruleCategory: RuleCategory
  type: string
  modelValue: Record<string, any>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, any>]
}>()

const schema = computed<ConfigFieldSchema[] | null>(() => {
  return getConfigSchema(props.ruleCategory, props.type)
})

const emptyMessage = computed(() => {
  const messages: Record<string, string> = {
    automatic: 'Esta activación es automática. No requiere configuración adicional.',
    coupon: 'Los cupones se gestionan en la sección de cupones abajo.',
    first_purchase: 'Se aplica automáticamente a la primera compra del cliente.',
    none: 'Sin condiciones — esta promoción aplica para todos los clientes y carritos.',
    free_shipping: 'Se aplicará envío gratis sin límite.',
  }
  return messages[props.type] || 'No requiere configuración adicional.'
})

// --- Product search ---
const productSuggestions = ref<any[]>([])
const productDisplayValues = ref<Record<string, string>>({})

const searchProducts = async (event: { query: string }) => {
  if (event.query.length < 2) return
  try {
    const response = await productsApi.getProducts({ search: event.query, limit: 10 })
    productSuggestions.value = (response.data || []).map((p: any) => ({
      producto_id: p.id,
      producto_nombre: p.name,
      producto_precio: p.price,
      producto_imagen: p.images?.[0]?.url,
      producto_sku: p.sku || '',
    }))
  } catch {
    productSuggestions.value = []
  }
}

const selectProduct = (fieldKey: string, event: { value: any }) => {
  const product = event.value
  productDisplayValues.value[fieldKey] = product.producto_nombre
  updateField(fieldKey, product.producto_id)
}

// --- Categories ---
const categories = ref<{ label: string; value: number }[]>([])
const loadingCategories = ref(false)

const needsCategories = computed(() =>
  schema.value?.some((f) => f.type === 'category-picker') ?? false
)

const loadCategories = async () => {
  if (!needsCategories.value || categories.value.length > 0) return
  loadingCategories.value = true
  try {
    const response = await categoryApi.getAllFlat()
    categories.value = (response.data || []).map((c: any) => ({
      label: c.name || c.categoria_nombre,
      value: c.id || c.categoria_id,
    }))
  } catch {
    categories.value = []
  } finally {
    loadingCategories.value = false
  }
}

onMounted(loadCategories)
watch(needsCategories, (val) => {
  if (val) loadCategories()
})

// --- Brands ---
const brands = ref<{ label: string; value: number }[]>([])
const loadingBrands = ref(false)

const needsBrands = computed(() =>
  schema.value?.some((f) => f.type === 'brand-picker') ?? false
)

const loadBrands = async () => {
  if (!needsBrands.value || brands.value.length > 0) return
  loadingBrands.value = true
  try {
    const response = await brandApi.getAll()
    brands.value = (response.data || []).map((b: any) => ({
      label: b.name,
      value: b.id,
    }))
  } catch {
    brands.value = []
  } finally {
    loadingBrands.value = false
  }
}

onMounted(loadBrands)
watch(needsBrands, (val) => {
  if (val) loadBrands()
})

// --- Gammas ---
const gammas = ref<{ label: string; value: number }[]>([])
const loadingGammas = ref(false)

const needsGammas = computed(() =>
  schema.value?.some((f) => f.type === 'gamma-picker') ?? false
)

const loadGammas = async () => {
  if (!needsGammas.value || gammas.value.length > 0) return
  loadingGammas.value = true
  try {
    const response = await gammaApi.getAll()
    gammas.value = (response.data || []).map((g: any) => ({
      label: g.tiendagamma_nombre || g.name,
      value: g.tiendagamma_id || g.id,
    }))
  } catch {
    gammas.value = []
  } finally {
    loadingGammas.value = false
  }
}

onMounted(loadGammas)
watch(needsGammas, (val) => {
  if (val) loadGammas()
})

// --- Referral Codes ---
const referralCodes = ref<ReferralCode[]>([])
const loadingReferralCodes = ref(false)

const needsReferralCodes = computed(() =>
  schema.value?.some((f) => f.type === 'referral-code-picker') ?? false
)

const loadReferralCodes = async () => {
  if (!needsReferralCodes.value || referralCodes.value.length > 0) return
  loadingReferralCodes.value = true
  try {
    const response = await referralApi.getAll({ per_page: 100 })
    referralCodes.value = response.data || []
  } catch {
    referralCodes.value = []
  } finally {
    loadingReferralCodes.value = false
  }
}

const toggleReferralCode = (fieldKey: string, id: number) => {
  const current = [...(props.modelValue[fieldKey] || [])]
  const index = current.indexOf(id)
  if (index >= 0) {
    current.splice(index, 1)
  } else {
    current.push(id)
  }
  updateField(fieldKey, current)
}

onMounted(loadReferralCodes)
watch(needsReferralCodes, (val) => {
  if (val) loadReferralCodes()
})

// --- Weekdays ---
const weekdays = [
  { label: 'Lun', value: 'monday' },
  { label: 'Mar', value: 'tuesday' },
  { label: 'Mié', value: 'wednesday' },
  { label: 'Jue', value: 'thursday' },
  { label: 'Vie', value: 'friday' },
  { label: 'Sáb', value: 'saturday' },
  { label: 'Dom', value: 'sunday' },
]

const toggleWeekday = (fieldKey: string, day: string) => {
  const current = { ...(props.modelValue[fieldKey] || {}) }
  current[day] = !current[day]
  updateField(fieldKey, current)
}

// --- Time Windows ---
const addTimeWindow = (fieldKey: string) => {
  const current = [...(props.modelValue[fieldKey] || [])]
  current.push({ start: '09:00', end: '18:00' })
  updateField(fieldKey, current)
}

const removeTimeWindow = (fieldKey: string, index: number) => {
  const current = [...(props.modelValue[fieldKey] || [])]
  current.splice(index, 1)
  updateField(fieldKey, current)
}

const updateTimeWindow = (fieldKey: string, index: number, prop: 'start' | 'end', value: string) => {
  const current = [...(props.modelValue[fieldKey] || [])]
  current[index] = { ...current[index], [prop]: value }
  updateField(fieldKey, current)
}

// --- Generic field update ---
const updateField = (key: string, value: any) => {
  const updated = { ...props.modelValue, [key]: value }
  // Remove null/undefined values
  Object.keys(updated).forEach((k) => {
    if (updated[k] === null || updated[k] === undefined || updated[k] === '') {
      delete updated[k]
    }
  })
  emit('update:modelValue', updated)
}
</script>
