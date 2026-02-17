<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCatalogStore } from '@/stores/catalog.store'
import { productManagementApi } from '@/api/product-management.api'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import MultiSelect from 'primevue/multiselect'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import type { ProductCreatePayload } from '@/types/product.types'

const router = useRouter()
const catalogStore = useCatalogStore()
const toast = useToast()

const saving = ref(false)

const form = ref<ProductCreatePayload>({
  name: '',
  sku: '',
  price: undefined,
  stock: undefined,
  description: '',
  brand_id: null,
  categories: [],
  published: true,
})

const errors = ref<Record<string, string>>({})

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

      <!-- SKU -->
      <div>
        <label for="sku" class="block text-sm font-medium text-gray-700 mb-1">
          SKU
        </label>
        <InputText
          id="sku"
          v-model="form.sku"
          placeholder="Se genera automaticamente si se deja vacio"
          class="w-full"
        />
        <small class="text-gray-400">Codigo unico del producto</small>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- Precio -->
        <div>
          <label for="price" class="block text-sm font-medium text-gray-700 mb-1">
            Precio
          </label>
          <InputNumber
            id="price"
            v-model="form.price"
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

        <!-- Stock -->
        <div>
          <label for="stock" class="block text-sm font-medium text-gray-700 mb-1">
            Stock
          </label>
          <InputNumber
            id="stock"
            v-model="form.stock"
            :min="0"
            :useGrouping="false"
            class="w-full"
            :class="{ 'p-invalid': errors.stock }"
          />
          <small v-if="errors.stock" class="text-red-500">{{ errors.stock }}</small>
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

      <!-- Marca -->
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
        />
      </div>

      <!-- Categorias -->
      <div>
        <label for="categories" class="block text-sm font-medium text-gray-700 mb-1">
          Categorias
        </label>
        <MultiSelect
          id="categories"
          v-model="form.categories"
          :options="catalogStore.categories"
          optionLabel="name"
          optionValue="id"
          placeholder="Seleccionar categorias"
          :maxSelectedLabels="3"
          class="w-full"
        />
      </div>

      <!-- Publicado -->
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
