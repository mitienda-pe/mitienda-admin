<script setup lang="ts">
import type { FontPreset } from '@/types/appearance.types'
import { loadGoogleFont } from '@/stores/typography.store'

interface Props {
  preset: FontPreset
  isSelected?: boolean
}

const props = defineProps<Props>()
defineEmits<{
  select: [preset: FontPreset]
}>()

loadGoogleFont(props.preset.headingFont)
loadGoogleFont(props.preset.bodyFont)
</script>

<template>
  <div
    class="border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md"
    :class="isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'"
    @click="$emit('select', preset)"
  >
    <!-- Font preview area -->
    <div class="p-4 bg-gray-50 border-b border-gray-100 min-h-[80px] flex flex-col justify-center">
      <div
        class="text-lg font-bold text-gray-900 mb-1 truncate"
        :style="{ fontFamily: `'${preset.headingFont}', sans-serif` }"
      >{{ preset.headingFont }}</div>
      <div
        class="text-sm text-gray-600 truncate"
        :style="{ fontFamily: `'${preset.bodyFont}', sans-serif` }"
      >{{ preset.bodyFont }}</div>
    </div>

    <!-- Info -->
    <div class="px-3 py-2 bg-white">
      <div class="text-sm font-medium text-gray-700">{{ preset.name }}</div>
      <div class="text-xs text-gray-400 mt-0.5">{{ preset.description }}</div>
    </div>
  </div>
</template>
