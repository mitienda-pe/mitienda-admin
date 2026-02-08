<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useTypographyStore } from '@/stores/typography.store'
import { TYPOGRAPHY_SECTIONS } from '@/types/appearance.types'
import type { StoreTypographyConfig, FontPreset } from '@/types/appearance.types'
import { FONT_PRESETS } from '@/config/font-presets'
import FontSelector from '@/components/appearance/FontSelector.vue'
import FontScaleSlider from '@/components/appearance/FontScaleSlider.vue'
import FontPreview from '@/components/appearance/FontPreview.vue'
import FontPresetCard from '@/components/appearance/FontPresetCard.vue'
import { AppButton } from '@/components/ui'

const toast = useToast()
const store = useTypographyStore()

const quickPresets = FONT_PRESETS.slice(0, 4)
const expandedSections = ref<Record<string, boolean>>({
  header: true,
  navbar: true,
  body: true,
  footer: true,
})

function toggleSection(id: string) {
  expandedSections.value[id] = !expandedSections.value[id]
}

function onApplyPreset(preset: FontPreset) {
  store.applyPreset(preset.headingFont, preset.bodyFont)
  toast.add({
    severity: 'info',
    summary: 'Preset aplicado',
    detail: `Se aplicó "${preset.name}". Recuerda publicar los cambios.`,
    life: 3000,
  })
}

async function onSave() {
  const success = await store.saveTypography()
  if (success) {
    toast.add({
      severity: 'success',
      summary: 'Tipografía publicada',
      detail: 'La tipografía se actualizó correctamente',
      life: 3000,
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.error || 'No se pudo guardar la tipografía',
      life: 5000,
    })
  }
}

function onDiscard() {
  store.resetToSaved()
  toast.add({
    severity: 'info',
    summary: 'Cambios descartados',
    detail: 'Se restauró la tipografía guardada',
    life: 2000,
  })
}

type SectionKey = keyof Omit<StoreTypographyConfig, 'scale'>

onMounted(() => {
  if (!store.isLoaded) {
    store.fetchTypography()
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Tipografía de la Tienda</h1>
      <p class="mt-1 text-sm text-gray-500">
        Personaliza las fuentes de cada sección de tu tienda virtual
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
      <AppButton variant="outlined" class="mt-3" @click="store.fetchTypography()">
        Reintentar
      </AppButton>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Unsaved changes banner -->
      <div
        v-if="store.hasUnsavedChanges"
        class="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center justify-between"
      >
        <div class="flex items-center gap-2">
          <i class="pi pi-exclamation-circle text-amber-600" />
          <span class="text-sm text-amber-800">Tienes cambios sin publicar</span>
        </div>
        <div class="flex items-center gap-2">
          <AppButton variant="text" size="small" @click="onDiscard">
            Descartar
          </AppButton>
          <AppButton variant="primary" size="small" :loading="store.isSaving" @click="onSave">
            Publicar Cambios
          </AppButton>
        </div>
      </div>

      <!-- Quick Presets -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Combinaciones Rápidas
          </h2>
          <router-link
            to="/appearance/typography/presets"
            class="text-sm text-primary hover:underline"
          >
            Ver Biblioteca
          </router-link>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <FontPresetCard
            v-for="preset in quickPresets"
            :key="preset.id"
            :preset="preset"
            @select="onApplyPreset"
          />
        </div>
      </div>

      <!-- Two column layout -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <!-- Left: Typography sections -->
        <div class="lg:col-span-3 space-y-4">
          <!-- Global Scale -->
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <FontScaleSlider
              :modelValue="store.draftTypography.scale"
              @update:modelValue="store.updateScale($event)"
            />
          </div>

          <!-- Per-section font selectors -->
          <div
            v-for="section in TYPOGRAPHY_SECTIONS"
            :key="section.id"
            class="bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            <!-- Section header -->
            <button
              class="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              @click="toggleSection(section.id)"
            >
              <div class="flex items-center gap-2">
                <i :class="section.icon" class="text-gray-500" />
                <span class="font-medium text-gray-800">{{ section.title }}</span>
                <span class="text-xs text-gray-400">(2 fuentes)</span>
              </div>
              <i
                class="pi text-gray-400 transition-transform"
                :class="expandedSections[section.id] ? 'pi-chevron-up' : 'pi-chevron-down'"
              />
            </button>

            <!-- Section fields -->
            <div
              v-show="expandedSections[section.id]"
              class="p-4 space-y-4"
            >
              <FontSelector
                :label="'Fuente de Títulos'"
                :modelValue="store.draftTypography[section.id as SectionKey].headingFont"
                @update:modelValue="store.updateSectionFont(section.id as SectionKey, 'headingFont', $event)"
              />
              <FontSelector
                :label="'Fuente de Texto'"
                :modelValue="store.draftTypography[section.id as SectionKey].bodyFont"
                @update:modelValue="store.updateSectionFont(section.id as SectionKey, 'bodyFont', $event)"
              />
            </div>
          </div>

          <!-- Save buttons -->
          <div class="flex items-center gap-3 pt-2">
            <AppButton
              variant="primary"
              :loading="store.isSaving"
              :disabled="!store.hasUnsavedChanges"
              @click="onSave"
            >
              <i class="pi pi-check mr-2" />
              Publicar Cambios
            </AppButton>
            <AppButton
              variant="outlined"
              :disabled="!store.hasUnsavedChanges"
              @click="onDiscard"
            >
              Descartar
            </AppButton>
          </div>
        </div>

        <!-- Right: Live preview -->
        <div class="lg:col-span-2">
          <div class="lg:sticky lg:top-6">
            <FontPreview :typography="store.draftTypography" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
