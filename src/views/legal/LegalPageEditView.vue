<template>
  <div class="h-full flex flex-col">
    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="store.error" severity="error" :closable="false" class="mb-4">
      {{ store.error }}
    </Message>

    <!-- Page Editor -->
    <template v-else-if="store.currentPage">
      <!-- Header -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div class="flex items-center gap-4">
          <Button
            icon="pi pi-arrow-left"
            text
            rounded
            severity="secondary"
            @click="router.push('/legal')"
          />
          <div>
            <h1 class="text-2xl font-bold text-secondary">{{ store.currentPage.title }}</h1>
            <p class="text-sm text-secondary-400 mt-1">Página legal / informativa</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <SelectButton
            v-model="editorType"
            :options="editorOptions"
            optionLabel="label"
            optionValue="value"
            :allowEmpty="false"
          />
          <Button
            label="Guardar"
            icon="pi pi-save"
            :loading="isSaving"
            @click="handleSave"
          />
        </div>
      </div>

      <!-- Editor Area -->
      <div class="flex-1 bg-white rounded-lg shadow overflow-hidden" style="min-height: 500px;">
        <PageContentEditor
          v-model="content"
          :editor-type="editorType"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLegalPagesStore } from '@/stores/legal-pages.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import PageContentEditor from '@/components/pages/PageContentEditor.vue'
import type { PageEditorType } from '@/types/page.types'

const route = useRoute()
const router = useRouter()
const store = useLegalPagesStore()
const toast = useToast()

const content = ref('')
const isSaving = ref(false)
const editorType = ref<PageEditorType>('wysiwyg')

const editorOptions = [
  { label: 'Visual', value: 'wysiwyg' },
  { label: 'Código', value: 'code' },
]

// When currentPage loads, populate content
watch(() => store.currentPage, (page) => {
  if (page) {
    content.value = page.content || ''
  }
}, { immediate: true })

const handleSave = async () => {
  const slug = route.params.slug as string
  try {
    isSaving.value = true
    await store.updatePage(slug, content.value)
    toast.add({
      severity: 'success',
      summary: 'Guardado',
      detail: 'Contenido guardado exitosamente',
      life: 3000,
    })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.messages?.error || 'Error al guardar',
      life: 5000,
    })
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  const slug = route.params.slug as string
  store.fetchPage(slug)
})
</script>
