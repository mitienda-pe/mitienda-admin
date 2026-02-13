<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import type { CarouselSlide } from '@/types/carousel.types'

interface Props {
  visible: boolean
  slide: CarouselSlide | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [data: { alt_text: string; enlace: string }]
}>()

const altText = ref('')
const enlace = ref('')
const saving = ref(false)

const dialogVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
})

watch(
  () => props.slide,
  slide => {
    if (slide) {
      altText.value = slide.tiendacarruselimagen_titulo || ''
      enlace.value = slide.tiendacarruselimagen_enlace || ''
    }
  },
  { immediate: true }
)

const handleSave = () => {
  saving.value = true
  emit('save', {
    alt_text: altText.value,
    enlace: enlace.value
  })
  saving.value = false
  dialogVisible.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    modal
    header="Editar slide"
    :style="{ width: '480px' }"
  >
    <div class="flex flex-col gap-4">
      <div>
        <label for="alt-text" class="block text-sm font-medium text-secondary-700 mb-1">
          Texto alternativo (Alt)
        </label>
        <InputText
          id="alt-text"
          v-model="altText"
          class="w-full"
          placeholder="Describe la imagen para accesibilidad"
          maxlength="200"
        />
        <small class="text-gray-400">{{ altText.length }}/200 caracteres</small>
      </div>

      <div>
        <label for="enlace" class="block text-sm font-medium text-secondary-700 mb-1">
          Enlace (URL)
        </label>
        <InputText
          id="enlace"
          v-model="enlace"
          class="w-full"
          placeholder="https://... o /ruta-interna"
          maxlength="500"
        />
        <small class="text-gray-400">Deja vacío si no necesita enlace</small>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancelar"
          severity="secondary"
          @click="dialogVisible = false"
        />
        <Button
          label="Guardar"
          icon="pi pi-check"
          @click="handleSave"
          :loading="saving"
        />
      </div>
    </template>
  </Dialog>
</template>
