<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <Button
        icon="pi pi-arrow-left"
        text
        rounded
        severity="secondary"
        @click="$router.push({ name: 'brands-list' })"
      />
      <div>
        <h1 class="text-3xl font-bold text-secondary">
          {{ isEditMode ? 'Editar Marca' : 'Nueva Marca' }}
        </h1>
        <p class="text-sm text-secondary-500 mt-1">
          {{ isEditMode ? 'Modifica los datos de la marca' : 'Crea una nueva marca para tus productos' }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Form -->
    <div v-else class="bg-white rounded-lg shadow p-6">
      <form @submit.prevent="saveBrand" class="space-y-6">
        <!-- Nombre -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Nombre <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="formData.name"
            class="w-full"
            :class="{ 'p-invalid': errors.name }"
            placeholder="Ej: Samsung, Apple, Nike"
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
            placeholder="samsung"
          />
          <small class="text-secondary-500">Se genera automáticamente si se deja vacío</small>
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
            @click="$router.push({ name: 'brands-list' })"
          />
          <Button
            :label="isEditMode ? 'Guardar Cambios' : 'Crear Marca'"
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
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Divider from 'primevue/divider'
import ProgressSpinner from 'primevue/progressspinner'
import type { BrandFormData } from '@/types/product.types'

const route = useRoute()
const router = useRouter()
const catalogStore = useCatalogStore()
const toast = useToast()

const isLoading = ref(false)
const isSaving = ref(false)
const errors = ref<Record<string, string>>({})

const formData = ref<BrandFormData>({
  name: '',
  slug: '',
  meta_title: '',
  meta_description: ''
})

const isEditMode = computed(() => !!route.params.id)
const brandId = computed(() => route.params.id ? parseInt(route.params.id as string) : null)

const validateForm = (): boolean => {
  errors.value = {}

  if (!formData.value.name || formData.value.name.trim().length < 2) {
    errors.value.name = 'El nombre es requerido (mínimo 2 caracteres)'
  }

  return Object.keys(errors.value).length === 0
}

const saveBrand = async () => {
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

    if (isEditMode.value && brandId.value) {
      await catalogStore.updateBrand(brandId.value, formData.value)

      toast.add({
        severity: 'success',
        summary: 'Guardado',
        detail: 'La marca ha sido actualizada correctamente',
        life: 3000
      })
    } else {
      await catalogStore.createBrand(formData.value)

      toast.add({
        severity: 'success',
        summary: 'Creado',
        detail: 'La marca ha sido creada correctamente',
        life: 3000
      })
    }

    router.push({ name: 'brands-list' })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al guardar la marca',
      life: 5000
    })
  } finally {
    isSaving.value = false
  }
}

const loadBrand = async () => {
  if (!brandId.value) return

  try {
    isLoading.value = true
    const brand = await catalogStore.fetchBrandById(brandId.value)

    if (brand) {
      formData.value = {
        name: brand.name,
        slug: brand.slug || '',
        meta_title: brand.meta_title || '',
        meta_description: brand.meta_description || ''
      }
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo cargar la marca',
      life: 5000
    })
    router.push({ name: 'brands-list' })
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (isEditMode.value) {
    await loadBrand()
  }
})
</script>
