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

    <!-- Imágenes (solo en modo edición) -->
    <div v-if="isEditMode && !isLoading && currentBrand" class="bg-white rounded-lg shadow p-6 mt-6">
      <h3 class="text-lg font-semibold text-secondary mb-4">
        <i class="pi pi-images mr-2"></i>Imágenes
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div v-for="img in imageConfigs" :key="img.type" class="border rounded-lg p-4">
          <h4 class="text-sm font-medium text-secondary-700 mb-3">{{ img.label }}</h4>

          <div v-if="currentBrand[img.urlField]">
            <img
              :src="currentBrand[img.urlField]!"
              :alt="img.label"
              class="w-full rounded object-cover"
              :class="img.aspectClass"
            />
            <div class="flex gap-2 mt-3">
              <Button
                label="Reemplazar"
                icon="pi pi-refresh"
                size="small"
                outlined
                @click="openUploader(img.type)"
              />
              <Button
                label="Eliminar"
                icon="pi pi-trash"
                size="small"
                severity="danger"
                outlined
                @click="handleDeleteImage(img.type)"
              />
            </div>
          </div>

          <div
            v-else
            class="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors"
            :class="img.aspectClass"
            @click="openUploader(img.type)"
          >
            <i class="pi pi-image text-3xl text-gray-400"></i>
            <span class="text-sm text-gray-500 mt-2">Subir imagen</span>
            <span class="text-xs text-gray-400">{{ img.dimensions }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Hint en modo creación -->
    <div v-if="!isEditMode && !isLoading" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
      <div class="flex items-center gap-2 text-blue-700">
        <i class="pi pi-info-circle"></i>
        <span class="text-sm">Guarda primero la marca para poder agregar imágenes.</span>
      </div>
    </div>

    <!-- Image Uploader Dialog -->
    <CatalogImageUploader
      v-model:visible="showImageUploader"
      :image-type="activeImageType"
      @upload-success="handleImageUploadSuccess"
    />
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
import CatalogImageUploader from '@/components/catalog/CatalogImageUploader.vue'
import type { CatalogImageType } from '@/components/catalog/CatalogImageUploader.vue'
import type { Brand, BrandFormData } from '@/types/product.types'

const route = useRoute()
const router = useRouter()
const catalogStore = useCatalogStore()
const toast = useToast()

const isLoading = ref(false)
const isSaving = ref(false)
const errors = ref<Record<string, string>>({})
const currentBrand = ref<Brand | null>(null)
const showImageUploader = ref(false)
const activeImageType = ref<CatalogImageType>('square')

const imageConfigs: {
  type: CatalogImageType
  label: string
  dimensions: string
  urlField: 'square_r2_url' | 'cover_r2_url' | 'og_r2_url'
  aspectClass: string
}[] = [
  { type: 'square', label: 'Cuadrada (1:1)', dimensions: '400x400 px', urlField: 'square_r2_url', aspectClass: 'aspect-square' },
  { type: 'cover', label: 'Cover (820x360)', dimensions: '820x360 px', urlField: 'cover_r2_url', aspectClass: 'aspect-[820/360]' },
  { type: 'og', label: 'OpenGraph (1200x630)', dimensions: '1200x630 px', urlField: 'og_r2_url', aspectClass: 'aspect-[1200/630]' }
]

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
      currentBrand.value = brand
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

const openUploader = (type: CatalogImageType) => {
  activeImageType.value = type
  showImageUploader.value = true
}

const handleImageUploadSuccess = async (data: { blob: Blob; fileName: string }) => {
  if (!brandId.value) return

  try {
    const file = new File([data.blob], data.fileName, { type: data.blob.type })
    const updated = await catalogStore.uploadBrandImage(brandId.value, file, activeImageType.value)
    currentBrand.value = updated

    toast.add({
      severity: 'success',
      summary: 'Imagen subida',
      detail: 'La imagen se ha subido correctamente',
      life: 3000
    })
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.message || 'Error al subir la imagen',
      life: 5000
    })
  }
}

const handleDeleteImage = async (type: CatalogImageType) => {
  if (!brandId.value) return

  try {
    const updated = await catalogStore.deleteBrandImage(brandId.value, type)
    currentBrand.value = updated

    toast.add({
      severity: 'success',
      summary: 'Imagen eliminada',
      detail: 'La imagen se ha eliminado correctamente',
      life: 3000
    })
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.message || 'Error al eliminar la imagen',
      life: 5000
    })
  }
}

onMounted(async () => {
  if (isEditMode.value) {
    await loadBrand()
  }
})
</script>
