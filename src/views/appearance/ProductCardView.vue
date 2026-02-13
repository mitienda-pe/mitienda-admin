<script setup lang="ts">
import { onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useProductCardStore } from '@/stores/product-card.store'
import { AppButton } from '@/components/ui'
import CardStyleSelector from '@/components/appearance/CardStyleSelector.vue'
import BorderRadiusSelector from '@/components/appearance/BorderRadiusSelector.vue'
import HoverEffectSelector from '@/components/appearance/HoverEffectSelector.vue'
import ButtonTypeSelector from '@/components/appearance/ButtonTypeSelector.vue'
import ImageDisplaySelector from '@/components/appearance/ImageDisplaySelector.vue'
import ProductCardPreview from '@/components/appearance/ProductCardPreview.vue'
import type {
  CardStyle,
  BorderRadius,
  HoverEffect,
  ButtonType,
  ImageDisplay
} from '@/types/product-card.types'

const toast = useToast()
const store = useProductCardStore()

async function onSave() {
  const success = await store.saveConfig()
  if (success) {
    toast.add({
      severity: 'success',
      summary: 'Configuración guardada',
      detail: 'La configuración de viñeta se actualizó correctamente',
      life: 3000
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.error || 'No se pudo guardar la configuración',
      life: 5000
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
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Viñeta de Producto</h1>
      <p class="mt-1 text-sm text-gray-500">
        Configura la apariencia de las tarjetas de producto en tu tienda
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
    <div v-else class="flex gap-6 items-start">
      <!-- Left: Configuration -->
      <div class="flex-1 space-y-6">
        <!-- Card Style -->
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 class="text-base font-semibold text-gray-800">Estilo de Viñeta</h2>
            <p class="text-xs text-gray-500 mt-0.5">
              Define cómo se ve la tarjeta de producto
            </p>
          </div>
          <div class="p-6">
            <CardStyleSelector
              :modelValue="store.draftConfig.card_style"
              @update:modelValue="store.updateField('card_style', $event as CardStyle)"
            />
          </div>
        </div>

        <!-- Border Radius -->
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 class="text-base font-semibold text-gray-800">Bordes</h2>
            <p class="text-xs text-gray-500 mt-0.5">
              Redondeo de las esquinas de la tarjeta
            </p>
          </div>
          <div class="p-6">
            <BorderRadiusSelector
              :modelValue="store.draftConfig.border_radius"
              @update:modelValue="store.updateField('border_radius', $event as BorderRadius)"
            />
          </div>
        </div>

        <!-- Hover Effect -->
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 class="text-base font-semibold text-gray-800">Efectos Hover</h2>
            <p class="text-xs text-gray-500 mt-0.5">
              Animación al pasar el cursor sobre la tarjeta
            </p>
          </div>
          <div class="p-6">
            <HoverEffectSelector
              :modelValue="store.draftConfig.hover_effect"
              @update:modelValue="store.updateField('hover_effect', $event as HoverEffect)"
            />
          </div>
        </div>

        <!-- Button Type -->
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 class="text-base font-semibold text-gray-800">Botón de Acción</h2>
            <p class="text-xs text-gray-500 mt-0.5">
              Botón que aparece en la tarjeta de producto
            </p>
          </div>
          <div class="p-6">
            <ButtonTypeSelector
              :modelValue="store.draftConfig.button_type"
              @update:modelValue="store.updateField('button_type', $event as ButtonType)"
            />
          </div>
        </div>

        <!-- Image Display & Content -->
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 class="text-base font-semibold text-gray-800">Contenido</h2>
            <p class="text-xs text-gray-500 mt-0.5">
              Imágenes múltiples y atributos en la tarjeta
            </p>
          </div>
          <div class="p-6">
            <ImageDisplaySelector
              :modelValue="store.draftConfig.image_display"
              @update:modelValue="store.updateField('image_display', $event as ImageDisplay)"
            />
          </div>
        </div>

        <!-- Save -->
        <div class="flex items-center gap-3 pb-6">
          <AppButton
            variant="primary"
            :loading="store.isSaving"
            :disabled="!store.hasUnsavedChanges"
            @click="onSave"
          >
            <i class="pi pi-check mr-2" />
            Guardar configuración
          </AppButton>
          <AppButton
            v-if="store.hasUnsavedChanges"
            variant="text"
            @click="store.resetToSaved()"
          >
            Descartar cambios
          </AppButton>
          <span v-if="store.hasUnsavedChanges" class="text-xs text-amber-600">
            Tienes cambios sin guardar
          </span>
        </div>
      </div>

      <!-- Right: Live Preview (sticky) -->
      <div class="w-72 shrink-0 sticky top-24">
        <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 class="text-base font-semibold text-gray-800">Vista previa</h2>
          </div>
          <div class="p-6 bg-gray-50/50">
            <ProductCardPreview :config="store.draftConfig" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
