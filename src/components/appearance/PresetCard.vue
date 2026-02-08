<script setup lang="ts">
import type { ColorPreset } from '@/types/appearance.types'

interface Props {
  preset: ColorPreset
  isSelected?: boolean
}

defineProps<Props>()
defineEmits<{
  select: [preset: ColorPreset]
}>()
</script>

<template>
  <div
    class="border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md"
    :class="isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'"
    @click="$emit('select', preset)"
  >
    <!-- Color preview strips -->
    <div class="h-24 flex flex-col">
      <div
        class="flex-1 flex items-center px-3"
        :style="{ backgroundColor: preset.colors.header.background }"
      >
        <div
          class="w-2.5 h-2.5 rounded-full"
          :style="{ backgroundColor: preset.colors.header.accent }"
        />
        <div
          class="ml-2 h-1.5 w-12 rounded-full opacity-60"
          :style="{ backgroundColor: preset.colors.header.text }"
        />
      </div>
      <div
        class="h-3 flex items-center px-3 gap-2"
        :style="{ backgroundColor: preset.colors.navbar.background }"
      >
        <div
          class="h-1 w-6 rounded-full opacity-60"
          :style="{ backgroundColor: preset.colors.navbar.links }"
        />
        <div
          class="h-1 w-6 rounded-full opacity-60"
          :style="{ backgroundColor: preset.colors.navbar.links }"
        />
      </div>
      <div
        class="flex-[2] px-3 py-1.5 flex gap-1.5"
        :style="{ backgroundColor: preset.colors.body.background }"
      >
        <div class="flex-1 rounded border border-gray-200/50 bg-white/50 p-1">
          <div class="bg-gray-200/50 h-5 rounded mb-1" />
          <div
            class="h-1 w-8 rounded-full opacity-50"
            :style="{ backgroundColor: preset.colors.body.text }"
          />
          <div
            class="h-3 mt-1 rounded"
            :style="{ backgroundColor: preset.colors.body.buttonBg }"
          />
        </div>
        <div class="flex-1 rounded border border-gray-200/50 bg-white/50 p-1">
          <div class="bg-gray-200/50 h-5 rounded mb-1" />
          <div
            class="h-1 w-8 rounded-full opacity-50"
            :style="{ backgroundColor: preset.colors.body.text }"
          />
          <div
            class="h-3 mt-1 rounded"
            :style="{ backgroundColor: preset.colors.body.buttonBg }"
          />
        </div>
      </div>
      <div
        class="h-4 flex items-center px-3"
        :style="{ backgroundColor: preset.colors.footer.background }"
      >
        <div
          class="h-1 w-10 rounded-full opacity-50"
          :style="{ backgroundColor: preset.colors.footer.text }"
        />
      </div>
    </div>

    <!-- Name -->
    <div class="px-3 py-2 bg-white border-t border-gray-100">
      <span class="text-sm font-medium text-gray-700">{{ preset.name }}</span>
    </div>
  </div>
</template>
