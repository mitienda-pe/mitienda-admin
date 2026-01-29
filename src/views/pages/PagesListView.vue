<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Páginas</h1>
        <p class="text-sm text-secondary-500 mt-1">
          {{ pagesStore.pages.length }} páginas registradas
        </p>
      </div>
      <Button
        label="Nueva Página"
        icon="pi pi-plus"
        @click="$router.push({ name: 'page-create' })"
      />
    </div>

    <!-- Búsqueda -->
    <div class="mb-6">
      <SearchBar
        v-model="searchQuery"
        placeholder="Buscar páginas..."
      />
    </div>

    <!-- Loading -->
    <div v-if="pagesStore.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="pagesStore.error" severity="error" :closable="false">
      {{ pagesStore.error }}
    </Message>

    <!-- Lista de Páginas -->
    <div v-else-if="filteredPages.length > 0" class="space-y-3">
      <div
        v-for="page in filteredPages"
        :key="page.id"
        class="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3">
              <h3 class="text-lg font-semibold text-secondary truncate">{{ page.title }}</h3>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="editorTypeBadgeClass(page.editor_type)"
              >
                <i :class="editorTypeIcon(page.editor_type)" class="mr-1"></i>
                {{ editorTypeLabel(page.editor_type) }}
              </span>
            </div>
            <p class="text-sm text-secondary-400 mt-1">/{{ page.slug }}</p>
          </div>

          <div class="flex items-center gap-3 ml-4">
            <div class="flex items-center gap-2" v-tooltip.top="page.published ? 'Publicada' : 'Borrador'">
              <InputSwitch
                :modelValue="page.published"
                @update:modelValue="handleTogglePublished(page)"
              />
            </div>
            <Button
              v-tooltip.top="'Vista previa'"
              icon="pi pi-eye"
              text
              rounded
              size="small"
              severity="secondary"
              @click="$router.push({ name: 'page-preview', params: { id: page.id } })"
            />
            <Button
              v-tooltip.top="'Editar'"
              icon="pi pi-pencil"
              text
              rounded
              size="small"
              severity="secondary"
              @click="$router.push({ name: 'page-edit', params: { id: page.id } })"
            />
            <Button
              v-tooltip.top="'Eliminar'"
              icon="pi pi-trash"
              text
              rounded
              size="small"
              severity="danger"
              @click="confirmDelete(page)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white rounded-lg shadow p-12 text-center">
      <i class="pi pi-file-edit text-6xl text-secondary-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">No hay páginas</h3>
      <p class="text-secondary-500 mb-4">
        {{ searchQuery ? 'No se encontraron páginas con ese criterio' : 'Comienza creando tu primera página' }}
      </p>
      <Button
        v-if="!searchQuery"
        label="Nueva Página"
        icon="pi pi-plus"
        @click="$router.push({ name: 'page-create' })"
      />
    </div>

    <!-- Dialog Confirmar Eliminación -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Confirmar Eliminación"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <p>¿Estás seguro de eliminar la página <strong>{{ pageToDelete?.title }}</strong>?</p>
      <p class="text-sm text-secondary-500 mt-2">Esta acción no se puede deshacer.</p>

      <template #footer>
        <Button label="Cancelar" text @click="showDeleteDialog = false" />
        <Button
          label="Eliminar"
          severity="danger"
          :loading="isDeleting"
          @click="deletePage"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePagesStore } from '@/stores/pages.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputSwitch from 'primevue/inputswitch'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import SearchBar from '@/components/common/SearchBar.vue'
import type { Page, PageEditorType } from '@/types/page.types'

const pagesStore = usePagesStore()
const toast = useToast()

const searchQuery = ref('')
const showDeleteDialog = ref(false)
const pageToDelete = ref<Page | null>(null)
const isDeleting = ref(false)

const filteredPages = computed(() => {
  if (!searchQuery.value) return pagesStore.pages

  const query = searchQuery.value.toLowerCase()
  return pagesStore.pages.filter(page =>
    page.title.toLowerCase().includes(query) ||
    page.slug.toLowerCase().includes(query)
  )
})

const editorTypeLabel = (type: PageEditorType) => {
  const labels: Record<PageEditorType, string> = {
    wysiwyg: 'WYSIWYG',
    code: 'Código HTML',
    visual_builder: 'Visual Builder',
  }
  return labels[type] || type
}

const editorTypeIcon = (type: PageEditorType) => {
  const icons: Record<PageEditorType, string> = {
    wysiwyg: 'pi pi-align-left',
    code: 'pi pi-code',
    visual_builder: 'pi pi-th-large',
  }
  return icons[type] || 'pi pi-file'
}

const editorTypeBadgeClass = (type: PageEditorType) => {
  const classes: Record<PageEditorType, string> = {
    wysiwyg: 'bg-blue-100 text-blue-800',
    code: 'bg-purple-100 text-purple-800',
    visual_builder: 'bg-orange-100 text-orange-800',
  }
  return classes[type] || 'bg-gray-100 text-gray-800'
}

const handleTogglePublished = async (page: Page) => {
  try {
    await pagesStore.togglePublished(page.id)
    toast.add({
      severity: 'success',
      summary: 'Actualizado',
      detail: page.published ? 'Página despublicada' : 'Página publicada',
      life: 3000,
    })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al cambiar estado',
      life: 5000,
    })
  }
}

const confirmDelete = (page: Page) => {
  pageToDelete.value = page
  showDeleteDialog.value = true
}

const deletePage = async () => {
  if (!pageToDelete.value) return

  try {
    isDeleting.value = true
    await pagesStore.deletePage(pageToDelete.value.id)

    toast.add({
      severity: 'success',
      summary: 'Eliminada',
      detail: 'La página ha sido eliminada correctamente',
      life: 3000,
    })

    showDeleteDialog.value = false
    pageToDelete.value = null
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al eliminar la página',
      life: 5000,
    })
  } finally {
    isDeleting.value = false
  }
}

onMounted(async () => {
  await pagesStore.fetchPages()
})
</script>
