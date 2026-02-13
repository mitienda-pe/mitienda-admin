<script setup lang="ts">
import { onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAppearanceConfigStore } from '@/stores/appearance-config.store'
import CatalogPreferencesForm from '@/components/appearance/CatalogPreferences.vue'
import { AppButton } from '@/components/ui'
import type { CatalogPreferences } from '@/types/appearance.types'

const toast = useToast()
const store = useAppearanceConfigStore()

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
  if (!store.isCatalogLoaded) {
    store.fetchCatalogPreferences()
  }
})
</script>

<template>
  <div class="p-6 max-w-4xl">
    <h1 class="text-xl font-semibold text-gray-800 mb-1">Configuración del Catálogo</h1>
    <p class="text-sm text-gray-500 mb-6">
      Configuración de la vista de productos en tu tienda
    </p>

    <div class="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <h2 class="text-base font-semibold text-gray-800">Catálogo</h2>
        <p class="text-xs text-gray-500 mt-0.5">
          Columnas, orden de productos y visibilidad
        </p>
      </div>

      <!-- Loading -->
      <div
        v-if="store.isCatalogLoading"
        class="p-6 flex items-center justify-center py-12"
      >
        <i class="pi pi-spinner pi-spin text-3xl text-primary" />
      </div>

      <!-- Error -->
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

      <!-- Content -->
      <div v-else class="p-6">
        <CatalogPreferencesForm
          :preferences="store.draftCatalog"
          :isSaving="store.isCatalogSaving"
          :hasChanges="store.hasCatalogChanges"
          :showCartIcon="false"
          @update:field="onCatalogFieldUpdate"
          @save="onSaveCatalog"
        />
      </div>
    </div>
  </div>
</template>
