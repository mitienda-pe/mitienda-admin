<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalogStore } from '@/stores/catalog.store'
import { useGammaStore } from '@/stores/gamma.store'
import { productManagementApi } from '@/api/product-management.api'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Tree from 'primevue/tree'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import type { ProductCreatePayload } from '@/types/product.types'

const router = useRouter()
const catalogStore = useCatalogStore()
const gammaStore = useGammaStore()
const toast = useToast()

const saving = ref(false)

const form = ref<ProductCreatePayload>({
  name: '',
  sku: '',
  barcode: '',
  price: undefined,
  price_without_tax: undefined,
  tax_affectation: 1,
  igv_percent: 18,
  stock: undefined,
  unlimited_stock: false,
  description: '',
  description_short: '',
  brand_id: null,
  gamma_id: null,
  categories: [],
  published: true,
  order: undefined,
})

const errors = ref<Record<string, string>>({})

const taxAffectationOptions = [
  { label: 'Gravado (con IGV)', value: 1 },
  { label: 'Exonerado', value: 2 },
  { label: 'Inafecto', value: 3 },
]

// ── Category tree for TreeSelect ──
interface TreeNode {
  key: string
  label: string
  children?: TreeNode[]
}

const toTreeNodes = (cats: any[]): TreeNode[] =>
  cats.map(c => ({
    key: String(c.id),
    label: c.name,
    ...(c.sub?.length ? { children: toTreeNodes(c.sub) } : {}),
  }))

const categoryTreeNodes = computed(() => toTreeNodes(catalogStore.categories))

const collectAllKeys = (nodes: TreeNode[]): Record<string, boolean> => {
  const keys: Record<string, boolean> = {}
  const walk = (list: TreeNode[]) => {
    for (const n of list) {
      keys[n.key] = true
      if (n.children) walk(n.children)
    }
  }
  walk(nodes)
  return keys
}

const expandedCategoryKeys = ref<Record<string, boolean>>({})

watch(categoryTreeNodes, nodes => {
  expandedCategoryKeys.value = collectAllKeys(nodes)
}, { immediate: true })

const selectedCategoryKeys = computed({
  get() {
    const obj: Record<string, any> = {}
    for (const id of form.value.categories || []) {
      obj[String(id)] = { checked: true, partialChecked: false }
    }
    return obj
  },
  set(val: Record<string, any> | null) {
    if (!val) {
      form.value.categories = []
      return
    }
    form.value.categories = Object.entries(val)
      .filter(([, v]) => v.checked)
      .map(([k]) => Number(k))
  },
})

// ── Gamma cascading ──
const gammaOptions = computed(() => gammaStore.gammasByBrand || [])

const handleBrandChange = async () => {
  form.value.gamma_id = null
  gammaStore.clearGammasByBrand()
  if (form.value.brand_id) {
    await gammaStore.fetchByBrand(form.value.brand_id)
  }
}

// ── Price auto-calculation ──
const onPriceChange = (value: number | null) => {
  form.value.price = value ?? undefined
  if (form.value.tax_affectation === 1 && value != null) {
    const igv = (form.value.igv_percent || 18) / 100
    form.value.price_without_tax = parseFloat((value / (1 + igv)).toFixed(8))
  } else if (form.value.tax_affectation !== 1 && value != null) {
    form.value.price_without_tax = value
  }
}

const onPriceWithoutTaxChange = (value: number | null) => {
  form.value.price_without_tax = value ?? undefined
  if (form.value.tax_affectation === 1 && value != null) {
    const igv = (form.value.igv_percent || 18) / 100
    form.value.price = parseFloat((value * (1 + igv)).toFixed(2))
  } else if (form.value.tax_affectation !== 1 && value != null) {
    form.value.price = value
  }
}

const onTaxAffectationChange = () => {
  if (form.value.tax_affectation === 1) {
    if (form.value.price != null) {
      const igv = (form.value.igv_percent || 18) / 100
      form.value.price_without_tax = parseFloat((form.value.price / (1 + igv)).toFixed(8))
    }
  } else {
    if (form.value.price != null) {
      form.value.price_without_tax = form.value.price
    }
  }
}

onMounted(async () => {
  if (catalogStore.categories.length === 0 || catalogStore.brands.length === 0) {
    await catalogStore.fetchAll()
  }
})

const validate = (): boolean => {
  errors.value = {}

  if (!form.value.name || form.value.name.trim().length < 3) {
    errors.value.name = 'El nombre debe tener al menos 3 caracteres'
  }

  if (form.value.price != null && form.value.price < 0) {
    errors.value.price = 'El precio no puede ser negativo'
  }

  if (form.value.stock != null && form.value.stock < 0) {
    errors.value.stock = 'El stock no puede ser negativo'
  }

  return Object.keys(errors.value).length === 0
}

const handleSave = async () => {
  if (!validate()) return

  try {
    saving.value = true
    const response = await productManagementApi.createProduct(form.value)
    if (response.success && response.data) {
      toast.add({
        severity: 'success',
        summary: 'Producto creado',
        detail: `"${form.value.name}" se creo correctamente`,
        life: 3000,
      })
      router.push({ name: 'ProductDetail', params: { id: response.data.id } })
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo crear el producto',
        life: 5000,
      })
    }
  } catch (err: any) {
    const message = err.response?.data?.message || 'Error al crear el producto'
    toast.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <Button
        icon="pi pi-arrow-left"
        text
        rounded
        severity="secondary"
        @click="router.push({ name: 'Products' })"
      />
      <h1 class="text-3xl font-bold text-secondary">Nuevo Producto</h1>
    </div>

    <div class="bg-white rounded-lg shadow p-6 space-y-5">
      <!-- Nombre -->
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
          Nombre del producto <span class="text-red-500">*</span>
        </label>
        <InputText
          id="name"
          v-model="form.name"
          placeholder="Ej: Polo basico algodon"
          class="w-full"
          :class="{ 'p-invalid': errors.name }"
        />
        <small v-if="errors.name" class="text-red-500">{{ errors.name }}</small>
      </div>

      <!-- SKU + Barcode -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="sku" class="block text-sm font-medium text-gray-700 mb-1">
            SKU
          </label>
          <InputText
            id="sku"
            v-model="form.sku"
            placeholder="Se genera automaticamente"
            class="w-full"
          />
          <small class="text-gray-400">Codigo unico del producto</small>
        </div>
        <div>
          <label for="barcode" class="block text-sm font-medium text-gray-700 mb-1">
            Codigo de barras
          </label>
          <InputText
            id="barcode"
            v-model="form.barcode"
            placeholder="Ej: 7501234567890"
            class="w-full"
          />
        </div>
      </div>

      <!-- Precios e Impuestos -->
      <div class="border-t border-gray-100 pt-4">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">Precios e Impuestos</h3>

        <!-- Afectacion IGV -->
        <div class="mb-4">
          <label for="tax" class="block text-sm font-medium text-gray-700 mb-1">
            Afectacion IGV
          </label>
          <Dropdown
            id="tax"
            v-model="form.tax_affectation"
            :options="taxAffectationOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full md:w-64"
            @change="onTaxAffectationChange"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Precio con IGV -->
          <div>
            <label for="price" class="block text-sm font-medium text-gray-700 mb-1">
              Precio con IGV (S/)
            </label>
            <InputNumber
              id="price"
              :modelValue="form.price"
              @update:modelValue="onPriceChange"
              mode="currency"
              currency="PEN"
              locale="es-PE"
              :min="0"
              :minFractionDigits="2"
              :maxFractionDigits="2"
              class="w-full"
              :class="{ 'p-invalid': errors.price }"
            />
            <small v-if="errors.price" class="text-red-500">{{ errors.price }}</small>
          </div>

          <!-- Precio sin IGV -->
          <div>
            <label for="price-no-tax" class="block text-sm font-medium text-gray-700 mb-1">
              Precio sin IGV (S/)
            </label>
            <InputNumber
              id="price-no-tax"
              :modelValue="form.price_without_tax"
              @update:modelValue="onPriceWithoutTaxChange"
              :min="0"
              :minFractionDigits="2"
              :maxFractionDigits="8"
              class="w-full"
            />
            <small class="text-gray-400">Hasta 8 decimales</small>
          </div>
        </div>
      </div>

      <!-- Stock -->
      <div class="border-t border-gray-100 pt-4">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">Stock</h3>
        <div class="flex items-center gap-4">
          <div class="flex-1 max-w-[200px]">
            <InputNumber
              id="stock"
              v-model="form.stock"
              :min="0"
              :useGrouping="false"
              :disabled="form.unlimited_stock"
              class="w-full"
              :class="{ 'p-invalid': errors.stock }"
            />
            <small v-if="errors.stock" class="text-red-500">{{ errors.stock }}</small>
          </div>
          <div class="flex items-center gap-2">
            <Checkbox
              id="unlimited"
              v-model="form.unlimited_stock"
              :binary="true"
            />
            <label for="unlimited" class="text-sm text-gray-700 cursor-pointer">
              Stock ilimitado
            </label>
          </div>
        </div>
      </div>

      <!-- Descripcion -->
      <div>
        <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
          Descripcion
        </label>
        <Textarea
          id="description"
          v-model="form.description"
          rows="4"
          class="w-full"
          placeholder="Descripcion breve del producto..."
        />
      </div>

      <!-- Descripcion corta -->
      <div>
        <label for="desc-short" class="block text-sm font-medium text-gray-700 mb-1">
          Descripcion corta
        </label>
        <Textarea
          id="desc-short"
          v-model="form.description_short"
          rows="2"
          class="w-full"
          placeholder="Resumen para listados..."
        />
      </div>

      <!-- Marca + Gamma -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="brand" class="block text-sm font-medium text-gray-700 mb-1">
            Marca
          </label>
          <Dropdown
            id="brand"
            v-model="form.brand_id"
            :options="catalogStore.brands"
            optionLabel="name"
            optionValue="id"
            placeholder="Seleccionar marca"
            showClear
            class="w-full"
            @change="handleBrandChange"
          />
        </div>
        <div>
          <label for="gamma" class="block text-sm font-medium text-gray-700 mb-1">
            Gamma (sub-marca)
          </label>
          <Dropdown
            id="gamma"
            v-model="form.gamma_id"
            :options="gammaOptions"
            optionLabel="tiendagamma_nombre"
            optionValue="tiendagamma_id"
            placeholder="Seleccionar gamma"
            showClear
            class="w-full"
            :disabled="!form.brand_id || gammaOptions.length === 0"
          />
          <small v-if="form.brand_id && gammaOptions.length === 0" class="text-gray-500">
            Sin gammas para esta marca
          </small>
        </div>
      </div>

      <!-- Categorias -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Categorias
        </label>
        <div class="border border-gray-300 rounded-md max-h-64 overflow-y-auto">
          <Tree
            v-model:selectionKeys="selectedCategoryKeys"
            :value="categoryTreeNodes"
            v-model:expandedKeys="expandedCategoryKeys"
            selectionMode="checkbox"
            class="p-0 border-none"
          />
        </div>
      </div>

      <!-- Publicado + Orden -->
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2">
          <Checkbox
            id="published"
            v-model="form.published"
            :binary="true"
          />
          <label for="published" class="text-sm font-medium text-gray-700 cursor-pointer">
            Publicar inmediatamente
          </label>
        </div>
        <div class="flex items-center gap-2">
          <label for="order" class="text-sm font-medium text-gray-700">Orden:</label>
          <InputNumber
            id="order"
            v-model="form.order"
            :min="0"
            :useGrouping="false"
            class="w-20"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3 pt-4 border-t border-gray-100">
        <Button
          label="Crear Producto"
          icon="pi pi-check"
          :loading="saving"
          @click="handleSave"
        />
        <Button
          label="Cancelar"
          severity="secondary"
          outlined
          @click="router.push({ name: 'Products' })"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-tree) {
  padding: 0;
}

:deep(.p-tree .p-treenode-children) {
  padding-left: 1.5rem;
}
</style>
