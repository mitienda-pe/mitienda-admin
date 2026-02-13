<script setup lang="ts">
import { onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAppearanceConfigStore } from '@/stores/appearance-config.store'
import { IMAGE_VALIDATION_RULES } from '@/config/image-validation.config'
import BrandingUploader from '@/components/appearance/BrandingUploader.vue'
import CatalogPreferencesForm from '@/components/appearance/CatalogPreferences.vue'
import { AppButton } from '@/components/ui'
import type { CatalogPreferences } from '@/types/appearance.types'

const toast = useToast()
const store = useAppearanceConfigStore()

const logoRules = IMAGE_VALIDATION_RULES.logo
const faviconRules = IMAGE_VALIDATION_RULES.favicon

async function onUploadLogo(file: File) {
  const success = await store.uploadLogo(file)
  if (success) {
    toast.add({
      severity: 'success',
      summary: 'Logotipo actualizado',
      detail: 'El logotipo se subió correctamente',
      life: 3000,
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.error || 'No se pudo subir el logotipo',
      life: 5000,
    })
  }
}

async function onUploadFavicon(file: File) {
  const success = await store.uploadFavicon(file)
  if (success) {
    toast.add({
      severity: 'success',
      summary: 'Favicon actualizado',
      detail: 'El favicon se subió correctamente',
      life: 3000,
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.error || 'No se pudo subir el favicon',
      life: 5000,
    })
  }
}

async function onDeleteLogo() {
  const success = await store.deleteLogo()
  if (success) {
    toast.add({
      severity: 'info',
      summary: 'Logotipo eliminado',
      detail: 'El logotipo se eliminó correctamente',
      life: 3000,
    })
  }
}

async function onDeleteFavicon() {
  const success = await store.deleteFavicon()
  if (success) {
    toast.add({
      severity: 'info',
      summary: 'Favicon eliminado',
      detail: 'El favicon se eliminó correctamente',
      life: 3000,
    })
  }
}

function onCatalogFieldUpdate(field: keyof CatalogPreferences, value: number) {
  store.updateCatalogField(field, value)
}

async function onSaveCatalog() {
  const success = await store.saveCatalogPreferences()
  if (success) {
    toast.add({
      severity: 'success',
      summary: 'Preferencias guardadas',
      detail: 'Las preferencias del catálogo se actualizaron correctamente',
      life: 3000,
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.catalogError || 'No se pudieron guardar las preferencias',
      life: 5000,
    })
  }
}

onMounted(() => {
  if (!store.isLoaded) {
    store.fetchConfig()
  }
  if (!store.isCatalogLoaded) {
    store.fetchCatalogPreferences()
  }
})
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Configuración de la Tienda</h1>
      <p class="mt-1 text-sm text-gray-500">
        Configura la identidad visual y preferencias de tu tienda
      </p>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex items-center justify-center py-20">
      <i class="pi pi-spinner pi-spin text-4xl text-primary" />
    </div>

    <!-- Error -->
    <div
      v-else-if="store.error && !store.isLoaded"
      class="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
    >
      <i class="pi pi-exclamation-triangle text-red-500 text-3xl mb-2" />
      <p class="text-red-700">{{ store.error }}</p>
      <AppButton variant="outlined" class="mt-3" @click="store.fetchConfig()">
        Reintentar
      </AppButton>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Identidad Visual -->
      <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <!-- Section title -->
        <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 class="text-base font-semibold text-gray-800">Identidad Visual</h2>
          <p class="text-xs text-gray-500 mt-0.5">Logotipo y favicon de tu tienda</p>
        </div>

        <div class="p-6 space-y-8">
          <!-- Logo uploader -->
          <BrandingUploader
            label="Logotipo"
            :currentUrl="store.logoUrl"
            :isUploading="store.isUploadingLogo"
            :rules="logoRules"
            hint="Recomendado: SVG o PNG con fondo transparente, mínimo 200px de ancho"
            @upload="onUploadLogo"
            @delete="onDeleteLogo"
          />

          <!-- Divider -->
          <hr class="border-gray-100" />

          <!-- Favicon uploader -->
          <BrandingUploader
            label="Favicon"
            :currentUrl="store.faviconUrl"
            :isUploading="store.isUploadingFavicon"
            :rules="faviconRules"
            hint="Recomendado: PNG cuadrado de 512x512px o SVG"
            @upload="onUploadFavicon"
            @delete="onDeleteFavicon"
          />
        </div>
      </div>

      <!-- Catálogo -->
      <div class="bg-white border border-gray-200 rounded-lg overflow-hidden mt-6">
        <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 class="text-base font-semibold text-gray-800">Catálogo</h2>
          <p class="text-xs text-gray-500 mt-0.5">
            Configuración de la vista de productos
          </p>
        </div>

        <!-- Catalog loading -->
        <div
          v-if="store.isCatalogLoading"
          class="p-6 flex items-center justify-center py-12"
        >
          <i class="pi pi-spinner pi-spin text-3xl text-primary" />
        </div>

        <!-- Catalog error -->
        <div
          v-else-if="store.catalogError && !store.isCatalogLoaded"
          class="p-6 text-center"
        >
          <i class="pi pi-exclamation-triangle text-red-500 text-2xl mb-2" />
          <p class="text-sm text-red-700">{{ store.catalogError }}</p>
          <AppButton
            variant="outlined"
            class="mt-3"
            @click="store.fetchCatalogPreferences()"
          >
            Reintentar
          </AppButton>
        </div>

        <!-- Catalog content -->
        <div v-else class="p-6">
          <CatalogPreferencesForm
            :preferences="store.draftCatalog"
            :isSaving="store.isCatalogSaving"
            :hasChanges="store.hasCatalogChanges"
            :showProductOrder="false"
            :showHideOutOfStock="false"
            @update:field="onCatalogFieldUpdate"
            @save="onSaveCatalog"
          />
        </div>
      </div>
    </template>
  </div>
</template>
