<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useAppearanceStore } from '@/stores/appearance.store'
import { COLOR_SECTIONS } from '@/types/appearance.types'
import type { StoreColorConfig, ColorPreset } from '@/types/appearance.types'
import { COLOR_PRESETS } from '@/config/color-presets'
import ColorPickerField from '@/components/appearance/ColorPickerField.vue'
import ColorPreview from '@/components/appearance/ColorPreview.vue'
import PresetCard from '@/components/appearance/PresetCard.vue'
import { AppButton } from '@/components/ui'

const toast = useToast()
const store = useAppearanceStore()

const quickPresets = COLOR_PRESETS.slice(0, 4)
const expandedSections = ref<Record<string, boolean>>({
  header: true,
  navbar: true,
  body: true,
  footer: true,
})

function toggleSection(id: string) {
  expandedSections.value[id] = !expandedSections.value[id]
}

function getSectionColor(sectionId: keyof StoreColorConfig, field: string): string {
  const section = store.draftColors[sectionId] as Record<string, string>
  return section[field] ?? '#000000'
}

function setSectionColor(sectionId: keyof StoreColorConfig, field: string, value: string) {
  store.updateSectionColor(sectionId, field, value)
}

function onApplyPreset(preset: ColorPreset) {
  store.applyPreset(preset.colors)
  toast.add({
    severity: 'info',
    summary: 'Preset aplicado',
    detail: `Se aplicó "${preset.name}". Recuerda publicar los cambios.`,
    life: 3000,
  })
}

async function onSave() {
  const success = await store.saveColors()
  if (success) {
    toast.add({
      severity: 'success',
      summary: 'Colores publicados',
      detail: 'Los colores se actualizaron correctamente',
      life: 3000,
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.error || 'No se pudieron guardar los colores',
      life: 5000,
    })
  }
}

function onDiscard() {
  store.resetToSaved()
  toast.add({
    severity: 'info',
    summary: 'Cambios descartados',
    detail: 'Se restauraron los colores guardados',
    life: 2000,
  })
}

onMounted(() => {
  if (!store.isLoaded) {
    store.fetchColors()
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Colores de la Tienda</h1>
      <p class="mt-1 text-sm text-gray-500">
        Personaliza los colores de cada sección de tu tienda virtual
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
      <AppButton variant="outlined" class="mt-3" @click="store.fetchColors()">
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
            Presets Rápidos
          </h2>
          <router-link
            to="/appearance/colors/presets"
            class="text-sm text-primary hover:underline"
          >
            Ver Biblioteca
          </router-link>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PresetCard
            v-for="preset in quickPresets"
            :key="preset.id"
            :preset="preset"
            @select="onApplyPreset"
          />
        </div>
      </div>

      <!-- Two column layout -->
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <!-- Left: Color sections -->
        <div class="lg:col-span-3 space-y-4">
          <div
            v-for="section in COLOR_SECTIONS"
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
                <span class="text-xs text-gray-400">({{ section.fields.length }} colores)</span>
              </div>
              <i
                class="pi text-gray-400 transition-transform"
                :class="expandedSections[section.id] ? 'pi-chevron-up' : 'pi-chevron-down'"
              />
            </button>

            <!-- Section fields -->
            <div
              v-show="expandedSections[section.id]"
              class="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <ColorPickerField
                v-for="field in section.fields"
                :key="field.key"
                :label="field.label"
                :modelValue="getSectionColor(section.id, field.key)"
                @update:modelValue="setSectionColor(section.id, field.key, $event)"
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
            <ColorPreview :colors="store.draftColors" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
