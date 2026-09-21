<script setup lang="ts">
import InputText from 'primevue/inputtext'

defineProps<{ label: string }>()
const model = defineModel<string>({ required: true })
</script>

<template>
  <div>
    <label class="block text-sm font-medium text-secondary-700 mb-2">{{ label }}</label>
    <div class="flex gap-2 items-center">
      <input
        v-model="model"
        type="color"
        class="h-10 w-20 border border-secondary-300 rounded cursor-pointer"
        style="min-width: 5rem; padding: 2px;"
      />
      <InputText v-model="model" class="w-32" placeholder="#FFFFFF" />
    </div>
  </div>
</template>
