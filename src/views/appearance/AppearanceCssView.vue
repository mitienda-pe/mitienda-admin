<script setup lang="ts">
import { onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAppearanceCssStore } from '@/stores/appearance-css.store'
import CssCodeEditor from '@/components/appearance/CssCodeEditor.vue'
import { AppButton, UnsavedChangesBar } from '@/components/ui'

const toast = useToast()
const store = useAppearanceCssStore()

async function onSave() {
  const success = await store.saveCss()
  if (success) {
    toast.add({
      severity: 'success',
      summary: 'CSS publicado',
      detail: 'Los cambios pueden demorar hasta 3 minutos en verse reflejados en tu tienda. Haz hard refresh (Ctrl+Shift+R) para verificar.',
      life: 5000,
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.error || 'No se pudo guardar el CSS personalizado',
      life: 5000,
    })
  }
}

function onDiscard() {
  store.resetToSaved()
  toast.add({
    severity: 'info',
    summary: 'Cambios descartados',
    detail: 'Se restauró el CSS guardado',
    life: 2000,
  })
}

onMounted(() => {
  if (!store.isLoaded) {
    store.fetchCss()
  }
})
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">CSS personalizado</h1>
      <p class="mt-1 text-sm text-gray-500">
        Agrega reglas CSS propias para ajustar el diseño de tu tienda virtual.
      </p>
    </div>

    <!-- Aviso: solo CSS -->
    <div class="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <i class="pi pi-info-circle mt-0.5 text-amber-500" />
      <div class="text-sm text-amber-800">
        <p class="font-medium">Solo se permite CSS.</p>
        <p class="mt-0.5">
          Por seguridad y compatibilidad con la nueva tienda, no se admite JavaScript ni HTML.
          Cualquier etiqueta o script que intentes incluir será removido automáticamente al guardar.
        </p>
      </div>
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
      <AppButton variant="outlined" class="mt-3" @click="store.fetchCss()">
        Reintentar
      </AppButton>
    </div>

    <!-- Editor -->
    <template v-else>
      <CssCodeEditor v-model="store.draftCss" height="60vh" />
    </template>

    <UnsavedChangesBar
      :dirty="store.hasUnsavedChanges"
      :loading="store.isSaving"
      save-label="Publicar Cambios"
      show-discard
      @save="onSave"
      @discard="onDiscard"
    />
  </div>
</template>
