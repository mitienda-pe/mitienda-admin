<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useDopplerStore } from '@/stores/doppler.store'
import { AppInput, UnsavedChangesBar } from '@/components/ui'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'

const store = useDopplerStore()
const toast = useToast()

const urlError = computed(() => {
  const val = store.draftSettings.tienda_doppler_script_url
  if (!val || val.trim() === '') return false
  try {
    // eslint-disable-next-line no-new
    new URL(val.trim())
    return false
  } catch {
    return true
  }
})

const hasValidationErrors = computed(() => urlError.value)

async function save() {
  if (hasValidationErrors.value) {
    toast.add({
      severity: 'warn',
      summary: 'Revisa los campos',
      detail: 'La URL del script no es válida',
      life: 4000
    })
    return
  }
  const ok = await store.saveSettings()
  if (ok) {
    toast.add({ severity: 'success', summary: 'Configuración guardada', life: 3000 })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.error || 'No se pudo guardar',
      life: 5000
    })
  }
}

onMounted(() => {
  store.fetchSettings()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Doppler</h1>
        <p class="text-sm text-secondary-500 mt-1">
          Conecta el script de seguimiento de Doppler para email marketing (carritos abandonados y
          productos visitados)
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Card: Doppler tracking script -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-envelope text-primary" />
          Script de seguimiento
          <span
            v-if="store.savedSettings.is_installed"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"
          >
            Conectado
          </span>
          <span
            v-else
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500"
          >
            No conectado
          </span>
        </h2>

        <div class="bg-primary/5 border border-primary/10 rounded-lg p-4 mb-5">
          <p class="text-xs text-primary">
            Normalmente Doppler instala este script automáticamente al conectar la integración. Aquí
            puedes ver o ajustar la configuración manualmente. El script se inyecta en tu tienda para
            que Doppler detecte productos visitados y recupere carritos abandonados.
          </p>
        </div>

        <div class="space-y-5">
          <!-- Source URL -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">
              URL del script (Source URL)
            </label>
            <p class="text-xs text-gray-400 mb-2">
              URL del script de seguimiento que provee Doppler.
            </p>
            <AppInput
              :model-value="store.draftSettings.tienda_doppler_script_url || ''"
              type="url"
              placeholder="https://app.fromdoppler.com/.../script.js"
              :error="urlError ? 'Ingresa una URL válida (https://...)' : false"
              @update:model-value="store.updateField('tienda_doppler_script_url', ($event as string) || null)"
            />
          </div>

          <!-- Reference -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">
              Referencia
            </label>
            <p class="text-xs text-gray-400 mb-2">
              Entorno declarado por Doppler (ej. INT, QA, PROD).
            </p>
            <AppInput
              :model-value="store.draftSettings.tienda_doppler_script_ref || ''"
              placeholder="PROD"
              @update:model-value="store.updateField('tienda_doppler_script_ref', ($event as string) || null)"
            />
          </div>
        </div>
      </div>
    </div>

    <UnsavedChangesBar
      :dirty="store.hasChanges"
      :save-disabled="hasValidationErrors"
      :loading="store.isSaving"
      save-label="Guardar configuración"
      @save="save"
    />
  </div>
</template>
