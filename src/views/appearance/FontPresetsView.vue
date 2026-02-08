<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useTypographyStore } from '@/stores/typography.store'
import type { FontPreset } from '@/types/appearance.types'
import { FONT_PRESETS } from '@/config/font-presets'
import FontPresetCard from '@/components/appearance/FontPresetCard.vue'

const router = useRouter()
const toast = useToast()
const store = useTypographyStore()

const searchQuery = ref('')

const filteredPresets = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return FONT_PRESETS
  return FONT_PRESETS.filter(
    p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.headingFont.toLowerCase().includes(q) ||
      p.bodyFont.toLowerCase().includes(q)
  )
})

function onSelectPreset(preset: FontPreset) {
  store.applyPreset(preset.headingFont, preset.bodyFont)
  toast.add({
    severity: 'info',
    summary: 'Preset aplicado',
    detail: `Se aplicó "${preset.name}". Redirigiendo al editor...`,
    life: 2000,
  })
  router.push('/appearance/typography')
}
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <router-link
        to="/appearance/typography"
        class="inline-flex items-center text-sm text-primary hover:underline mb-3"
      >
        <i class="pi pi-arrow-left mr-1" />
        Volver al Editor
      </router-link>
      <h1 class="text-2xl font-bold text-gray-900">Biblioteca de Combinaciones</h1>
      <p class="mt-1 text-sm text-gray-500">
        Explora combinaciones de fuentes curadas para tu tienda
      </p>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <div class="relative max-w-md">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por nombre o fuente..."
          class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-primary text-sm"
        />
      </div>
    </div>

    <!-- Presets grid -->
    <div
      v-if="filteredPresets.length"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <FontPresetCard
        v-for="preset in filteredPresets"
        :key="preset.id"
        :preset="preset"
        @select="onSelectPreset"
      />
    </div>

    <!-- Empty state -->
    <div v-else class="text-center py-12 text-gray-500">
      <i class="pi pi-search text-4xl mb-3 text-gray-300" />
      <p>No se encontraron combinaciones con "{{ searchQuery }}"</p>
    </div>
  </div>
</template>
