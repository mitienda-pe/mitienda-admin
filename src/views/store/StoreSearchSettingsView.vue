<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useSearchSettingsStore } from '@/stores/search-settings.store'
import { AppButton, UnsavedChangesBar } from '@/components/ui'
import Chips from 'primevue/chips'
import InputSwitch from 'primevue/inputswitch'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'

const store = useSearchSettingsStore()
const toast = useToast()

const limits = computed(
  () =>
    store.savedSettings.limits ?? {
      max_groups: 200,
      max_terms_per_group: 10,
      min_term_length: 2,
      max_term_length: 60
    }
)

const canAddGroup = computed(() => store.draftSettings.synonyms.length < limits.value.max_groups)

/** Errores por grupo que se pueden detectar sin ir al servidor. */
const groupErrors = computed(() =>
  store.draftSettings.synonyms.map(group => {
    const terms = group.map(t => t.trim()).filter(t => t !== '')
    if (terms.length === 0) return null
    if (terms.length < 2) return 'Agrega al menos otro término equivalente'
    if (terms.length > limits.value.max_terms_per_group)
      return `Máximo ${limits.value.max_terms_per_group} términos por grupo`
    const tooLong = terms.find(t => t.length > limits.value.max_term_length)
    if (tooLong) return `«${tooLong}» supera los ${limits.value.max_term_length} caracteres`
    return null
  })
)

const hasValidationErrors = computed(() => groupErrors.value.some(e => e !== null))

async function save() {
  if (hasValidationErrors.value) {
    toast.add({
      severity: 'warn',
      summary: 'Revisa los sinónimos',
      detail: 'Hay grupos incompletos o con términos muy largos',
      life: 4000
    })
    return
  }
  const ok = await store.saveSettings()
  if (ok) {
    toast.add({
      severity: 'success',
      summary: 'Ajustes guardados',
      detail: store.lastMessage || undefined,
      life: 4000
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'No se pudo guardar',
      detail: store.error || 'Intenta nuevamente',
      life: 6000
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
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-secondary">
        Buscador
      </h1>
      <p class="text-sm text-secondary-500 mt-1">
        Ajusta cómo el buscador de tu tienda online encuentra tus productos
      </p>
    </div>

    <div
      v-if="store.isLoading"
      class="flex justify-center py-20"
    >
      <ProgressSpinner />
    </div>

    <div
      v-else
      class="space-y-6"
    >
      <!-- Sinónimos -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-1 flex items-center gap-2">
          <i class="pi pi-sync text-primary" />
          Sinónimos
        </h2>
        <p class="text-sm text-secondary-500 mb-4">
          Agrupa palabras que tus clientes usan para lo mismo. Si alguien busca cualquiera de ellas,
          verá los productos que tengan cualquiera de las otras, sin que tengas que escribirlas en la
          descripción.
        </p>

        <div class="bg-primary/5 border border-primary/10 rounded-lg p-4 mb-5 text-xs text-primary space-y-1">
          <p>
            <strong>Ejemplo:</strong> protector solar · bloqueador solar · fotoprotector
          </p>
          <p>
            Escribe cada término y presiona Enter o coma. Los términos de varias palabras se buscan
            completos: «bloqueador solar» no se activa si el cliente escribe solo «bloqueador».
          </p>
        </div>

        <div
          v-if="store.draftSettings.synonyms.length === 0"
          class="text-center py-8 text-secondary-400"
        >
          <i class="pi pi-sync text-3xl mb-2" />
          <p class="text-sm">
            Aún no tienes sinónimos. El buscador encuentra solo lo que está escrito en tus productos.
          </p>
        </div>

        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="(_group, index) in store.draftSettings.synonyms"
            :key="index"
            class="flex items-start gap-2"
          >
            <div class="flex-1">
              <Chips
                v-model="store.draftSettings.synonyms[index]"
                separator=","
                add-on-blur
                :allow-duplicate="false"
                placeholder="Escribe un término y presiona Enter"
                class="w-full"
                :class="{ 'p-invalid': groupErrors[index] }"
              />
              <small
                v-if="groupErrors[index]"
                class="text-red-500"
              >{{ groupErrors[index] }}</small>
            </div>
            <AppButton
              icon="pi pi-trash"
              variant="text"
              aria-label="Eliminar grupo"
              @click="store.removeGroup(index)"
            />
          </div>
        </div>

        <div class="mt-4">
          <AppButton
            label="Agregar grupo de sinónimos"
            icon="pi pi-plus"
            variant="outlined"
            size="small"
            :disabled="!canAddGroup"
            @click="store.addGroup()"
          />
        </div>
      </div>

      <!-- Modo exacto -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-start justify-between gap-6">
          <div>
            <h2 class="text-lg font-semibold text-secondary mb-1 flex items-center gap-2">
              <i class="pi pi-bullseye text-primary" />
              Búsqueda exacta
            </h2>
            <p class="text-sm text-secondary-500">
              El buscador deja de corregir errores de tipeo y solo muestra productos que tengan
              <strong>todas</strong> las palabras buscadas. Úsalo si prefieres pocos resultados
              precisos a muchos aproximados. Los sinónimos siguen funcionando.
            </p>
            <p class="text-xs text-secondary-400 mt-2">
              También aplica al buscador de productos del POS.
            </p>
          </div>
          <InputSwitch v-model="store.draftSettings.strict_mode" />
        </div>
      </div>
    </div>

    <UnsavedChangesBar
      :dirty="store.hasChanges"
      :save-disabled="hasValidationErrors"
      :loading="store.isSaving"
      save-label="Guardar ajustes"
      @save="save"
    />
  </div>
</template>
