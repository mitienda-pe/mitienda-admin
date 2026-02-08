<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAppearanceStore } from '@/stores/appearance.store'
import type { ColorPreset, PresetCategory } from '@/types/appearance.types'
import { PRESET_CATEGORIES } from '@/types/appearance.types'
import { COLOR_PRESETS } from '@/config/color-presets'
import PresetCard from '@/components/appearance/PresetCard.vue'

const router = useRouter()
const toast = useToast()
const store = useAppearanceStore()

const searchQuery = ref('')
const selectedCategory = ref<PresetCategory>('all')

const filteredPresets = computed(() => {
  let result = COLOR_PRESETS

  if (selectedCategory.value !== 'all') {
    result = result.filter(p => p.category === selectedCategory.value)
  }

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    result = result.filter(p => p.name.toLowerCase().includes(query))
  }

  return result
})

function onSelectPreset(preset: ColorPreset) {
  store.applyPreset(preset.colors)
  toast.add({
    severity: 'info',
    summary: 'Preset aplicado',
    detail: `Se aplicó "${preset.name}". Recuerda publicar los cambios.`,
    life: 3000,
  })
  router.push('/appearance/colors')
}
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <router-link
        to="/appearance/colors"
        class="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-3"
      >
        <i class="pi pi-arrow-left text-xs" />
        Volver al Editor
      </router-link>
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Biblioteca de Presets</h1>
          <p class="mt-1 text-sm text-gray-500">
            Elige una paleta de colores prediseñada para tu tienda
          </p>
        </div>
        <button
          class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-400 cursor-not-allowed"
          disabled
          title="Próximamente"
        >
          <i class="pi pi-plus mr-1" />
          Crear Paleta Personalizada
        </button>
      </div>
    </div>

    <!-- Search + Filters -->
    <div class="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div class="relative flex-1 max-w-md">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar presets por nombre..."
          class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary"
        />
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-sm text-gray-500 mr-1">Filtrar:</span>
        <button
          v-for="cat in PRESET_CATEGORIES"
          :key="cat.id"
          class="px-3 py-1 text-sm rounded-full border transition-colors"
          :class="
            selectedCategory === cat.id
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
          "
          @click="selectedCategory = cat.id"
        >
          {{ cat.label }}
        </button>
      </div>
    </div>

    <!-- Presets Grid -->
    <div v-if="filteredPresets.length" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      <PresetCard
        v-for="preset in filteredPresets"
        :key="preset.id"
        :preset="preset"
        @select="onSelectPreset"
      />
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-16">
      <i class="pi pi-palette text-4xl text-gray-300 mb-3" />
      <p class="text-gray-500">No se encontraron presets</p>
      <button
        v-if="searchQuery || selectedCategory !== 'all'"
        class="mt-2 text-sm text-primary hover:underline"
        @click="searchQuery = ''; selectedCategory = 'all'"
      >
        Limpiar filtros
      </button>
    </div>
  </div>
</template>
