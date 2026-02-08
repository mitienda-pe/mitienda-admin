<script setup lang="ts">
import { onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAppearanceConfigStore } from '@/stores/appearance-config.store'
import { IMAGE_VALIDATION_RULES } from '@/config/image-validation.config'
import BrandingUploader from '@/components/appearance/BrandingUploader.vue'
import { AppButton } from '@/components/ui'

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

onMounted(() => {
  if (!store.isLoaded) {
    store.fetchConfig()
  }
})
</script>

<template>
  <div class="max-w-3xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Configuración de la Tienda</h1>
      <p class="mt-1 text-sm text-gray-500">
        Configura la identidad visual de tu tienda
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
    </template>
  </div>
</template>
