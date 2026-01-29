<template>
  <div class="h-full flex flex-col">
    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="loadError" severity="error" :closable="false" class="mb-4">
      {{ loadError }}
    </Message>

    <!-- Page Editor -->
    <template v-else-if="page">
      <!-- Header -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div class="flex items-center gap-4">
          <Button
            icon="pi pi-arrow-left"
            text
            rounded
            severity="secondary"
            @click="handleBack"
          />
          <div>
            <h1 class="text-2xl font-bold text-secondary">{{ page.title }}</h1>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-sm text-secondary-400">/{{ page.slug }}</span>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="editorTypeBadgeClass"
              >
                <i :class="editorTypeIcon" class="mr-1"></i>
                {{ editorTypeLabel }}
              </span>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="page.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
              >
                {{ page.published ? 'Publicada' : 'Borrador' }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button
            label="Configuración"
            icon="pi pi-cog"
            text
            severity="secondary"
            @click="showSettings = true"
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
          :editor-type="page.editor_type"
        />
      </div>
    </template>

    <!-- Settings Sidebar Dialog -->
    <Dialog
      v-model:visible="showSettings"
      header="Configuración de Página"
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div class="space-y-4" v-if="page">
        <!-- Title -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Título</label>
          <InputText
            v-model="settingsForm.title"
            class="w-full"
          />
        </div>

        <!-- Slug -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">URL (slug)</label>
          <div class="flex items-center gap-2">
            <span class="text-secondary-400 text-sm">/</span>
            <InputText
              v-model="settingsForm.slug"
              class="w-full"
            />
          </div>
        </div>

        <!-- Published -->
        <div class="flex items-center gap-3">
          <label class="text-sm font-medium text-secondary-700">Estado</label>
          <Button
            :label="settingsForm.published ? 'Publicada' : 'Borrador'"
            :icon="settingsForm.published ? 'pi pi-eye' : 'pi pi-eye-slash'"
            :severity="settingsForm.published ? 'success' : 'secondary'"
            size="small"
            outlined
            @click="settingsForm.published = !settingsForm.published"
          />
        </div>

        <!-- Meta SEO -->
        <Divider />
        <h3 class="text-sm font-semibold text-secondary-700">SEO</h3>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Meta título</label>
          <InputText
            v-model="settingsForm.meta_title"
            class="w-full"
            placeholder="Título para motores de búsqueda"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Meta descripción</label>
          <Textarea
            v-model="settingsForm.meta_description"
            class="w-full"
            rows="3"
            placeholder="Descripción para motores de búsqueda"
          />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" text @click="showSettings = false" />
        <Button
          label="Guardar Configuración"
          :loading="isSavingSettings"
          @click="handleSaveSettings"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePagesStore } from '@/stores/pages.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import PageContentEditor from '@/components/pages/PageContentEditor.vue'
import type { Page, PageEditorType } from '@/types/page.types'

const route = useRoute()
const router = useRouter()
const pagesStore = usePagesStore()
const toast = useToast()

const page = ref<Page | null>(null)
const content = ref('')
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const isSaving = ref(false)
const showSettings = ref(false)
const isSavingSettings = ref(false)

const settingsForm = reactive({
  title: '',
  slug: '',
  published: false,
  meta_title: '',
  meta_description: '',
})

// Editor type helpers
const editorTypeLabel = computed(() => {
  const labels: Record<PageEditorType, string> = {
    wysiwyg: 'Editor Visual',
    code: 'Editor de Código',
    visual_builder: 'Visual Builder',
  }
  return page.value ? labels[page.value.editor_type] : ''
})

const editorTypeIcon = computed(() => {
  const icons: Record<PageEditorType, string> = {
    wysiwyg: 'pi pi-align-left',
    code: 'pi pi-code',
    visual_builder: 'pi pi-th-large',
  }
  return page.value ? icons[page.value.editor_type] : 'pi pi-file'
})

const editorTypeBadgeClass = computed(() => {
  const classes: Record<PageEditorType, string> = {
    wysiwyg: 'bg-blue-100 text-blue-800',
    code: 'bg-purple-100 text-purple-800',
    visual_builder: 'bg-orange-100 text-orange-800',
  }
  return page.value ? classes[page.value.editor_type] : 'bg-gray-100 text-gray-800'
})

const loadPage = async () => {
  const pageId = Number(route.params.id)

  try {
    isLoading.value = true
    loadError.value = null

    const result = await pagesStore.fetchPageById(pageId)

    if (result) {
      page.value = result
      content.value = result.content

      // Populate settings form
      settingsForm.title = result.title
      settingsForm.slug = result.slug
      settingsForm.published = result.published
      settingsForm.meta_title = result.meta_title || ''
      settingsForm.meta_description = result.meta_description || ''
    } else {
      loadError.value = 'Página no encontrada'
    }
  } catch (err: any) {
    loadError.value = err.response?.data?.messages?.error || 'Error al cargar la página'
  } finally {
    isLoading.value = false
  }
}

const handleSave = async () => {
  if (!page.value) return

  try {
    isSaving.value = true

    const updated = await pagesStore.updatePage(page.value.id, {
      content: content.value,
    })

    page.value = updated

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
      detail: error.response?.data?.message || 'Error al guardar',
      life: 5000,
    })
  } finally {
    isSaving.value = false
  }
}

const handleSaveSettings = async () => {
  if (!page.value) return

  try {
    isSavingSettings.value = true

    const updated = await pagesStore.updatePage(page.value.id, {
      title: settingsForm.title,
      slug: settingsForm.slug,
      published: settingsForm.published,
      meta_title: settingsForm.meta_title || undefined,
      meta_description: settingsForm.meta_description || undefined,
    })

    page.value = updated
    content.value = updated.content

    toast.add({
      severity: 'success',
      summary: 'Guardado',
      detail: 'Configuración actualizada',
      life: 3000,
    })

    showSettings.value = false
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al guardar configuración',
      life: 5000,
    })
  } finally {
    isSavingSettings.value = false
  }
}

const handleBack = () => {
  router.push({ name: 'pages-list' })
}

onMounted(() => {
  loadPage()
})
</script>
