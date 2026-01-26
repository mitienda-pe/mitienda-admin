<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <Button
        icon="pi pi-arrow-left"
        text
        rounded
        severity="secondary"
        @click="$router.push({ name: 'categories-list' })"
      />
      <div>
        <h1 class="text-3xl font-bold text-secondary">
          {{ isEditMode ? 'Editar Categoría' : 'Nueva Categoría' }}
        </h1>
        <p class="text-sm text-secondary-500 mt-1">
          {{ isEditMode ? 'Modifica los datos de la categoría' : 'Crea una nueva categoría para organizar tus productos' }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Form -->
    <div v-else class="bg-white rounded-lg shadow p-6">
      <form @submit.prevent="saveCategory" class="space-y-6">
        <!-- Nombre -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Nombre <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="formData.name"
            class="w-full"
            :class="{ 'p-invalid': errors.name }"
            placeholder="Ej: Electrónica, Ropa, Hogar"
          />
          <small v-if="errors.name" class="text-red-500">{{ errors.name }}</small>
        </div>

        <!-- Slug -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Slug (URL)
          </label>
          <InputText
            v-model="formData.slug"
            class="w-full"
            placeholder="electronica"
          />
          <small class="text-secondary-500">Se genera automáticamente si se deja vacío</small>
        </div>

        <!-- Categoría Padre -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Categoría Padre
          </label>
          <Dropdown
            v-model="formData.parent_id"
            :options="parentCategoryOptions"
            optionLabel="name"
            optionValue="id"
            placeholder="Ninguna (categoría raíz)"
            class="w-full"
            showClear
          />
          <small class="text-secondary-500">Deja vacío para crear una categoría principal</small>
        </div>

        <!-- Orden -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Orden
          </label>
          <InputNumber
            v-model="formData.order"
            :min="0"
            class="w-full"
            placeholder="0"
          />
          <small class="text-secondary-500">Menor número = aparece primero</small>
        </div>

        <!-- SEO Section -->
        <Divider />
        <h3 class="text-lg font-semibold text-secondary mb-4">SEO (Opcional)</h3>

        <!-- Meta Title -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Meta Título
          </label>
          <InputText
            v-model="formData.meta_title"
            class="w-full"
            placeholder="Título para motores de búsqueda"
            :maxlength="300"
          />
          <small class="text-secondary-500">{{ (formData.meta_title?.length || 0) }}/300 caracteres</small>
        </div>

        <!-- Meta Description -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Meta Descripción
          </label>
          <Textarea
            v-model="formData.meta_description"
            class="w-full"
            rows="3"
            placeholder="Descripción para motores de búsqueda"
            :maxlength="350"
          />
          <small class="text-secondary-500">{{ (formData.meta_description?.length || 0) }}/350 caracteres</small>
        </div>

        <!-- Botones -->
        <div class="flex justify-end gap-3 pt-4 border-t">
          <Button
            label="Cancelar"
            text
            severity="secondary"
            @click="$router.push({ name: 'categories-list' })"
          />
          <Button
            :label="isEditMode ? 'Guardar Cambios' : 'Crear Categoría'"
            type="submit"
            :loading="isSaving"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCatalogStore } from '@/stores/catalog.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Divider from 'primevue/divider'
import ProgressSpinner from 'primevue/progressspinner'
import type { CategoryFormData } from '@/types/product.types'

const route = useRoute()
const router = useRouter()
const catalogStore = useCatalogStore()
const toast = useToast()

const isLoading = ref(false)
const isSaving = ref(false)
const errors = ref<Record<string, string>>({})

const formData = ref<CategoryFormData>({
  name: '',
  slug: '',
  parent_id: null,
  order: 0,
  meta_title: '',
  meta_description: ''
})

const isEditMode = computed(() => !!route.params.id)
const categoryId = computed(() => route.params.id ? parseInt(route.params.id as string) : null)

// Filter out current category from parent options (can't be parent of itself)
const parentCategoryOptions = computed(() => {
  return catalogStore.flatCategories.filter(cat => cat.id !== categoryId.value)
})

const validateForm = (): boolean => {
  errors.value = {}

  if (!formData.value.name || formData.value.name.trim().length < 2) {
    errors.value.name = 'El nombre es requerido (mínimo 2 caracteres)'
  }

  return Object.keys(errors.value).length === 0
}

const saveCategory = async () => {
  if (!validateForm()) {
    toast.add({
      severity: 'warn',
      summary: 'Validación',
      detail: 'Por favor completa los campos requeridos',
      life: 3000
    })
    return
  }

  try {
    isSaving.value = true

    if (isEditMode.value && categoryId.value) {
      await catalogStore.updateCategory(categoryId.value, formData.value)

      toast.add({
        severity: 'success',
        summary: 'Guardado',
        detail: 'La categoría ha sido actualizada correctamente',
        life: 3000
      })
    } else {
      await catalogStore.createCategory(formData.value)

      toast.add({
        severity: 'success',
        summary: 'Creado',
        detail: 'La categoría ha sido creada correctamente',
        life: 3000
      })
    }

    router.push({ name: 'categories-list' })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al guardar la categoría',
      life: 5000
    })
  } finally {
    isSaving.value = false
  }
}

const loadCategory = async () => {
  if (!categoryId.value) return

  try {
    isLoading.value = true
    const category = await catalogStore.fetchCategoryById(categoryId.value)

    if (category) {
      formData.value = {
        name: category.name,
        slug: category.slug || '',
        parent_id: category.parent_id || null,
        order: category.order || 0,
        meta_title: category.meta_title || '',
        meta_description: category.meta_description || ''
      }
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo cargar la categoría',
      life: 5000
    })
    router.push({ name: 'categories-list' })
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  // Load categories for parent dropdown
  if (catalogStore.flatCategories.length === 0) {
    await catalogStore.fetchCategories()
  }

  // If editing, load category data
  if (isEditMode.value) {
    await loadCategory()
  }
})
</script>
