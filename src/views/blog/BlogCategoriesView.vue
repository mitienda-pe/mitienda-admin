<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div class="flex items-center gap-4">
        <Button icon="pi pi-arrow-left" text rounded severity="secondary" @click="$router.push({ name: 'blog-posts-list' })" />
        <div>
          <h1 class="text-3xl font-bold text-secondary">Categorías del Blog</h1>
          <p class="text-sm text-secondary-500 mt-1">{{ blogStore.categories.length }} categorías</p>
        </div>
      </div>
      <Button label="Nueva Categoría" icon="pi pi-plus" @click="openCreateDialog" />
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-20"><ProgressSpinner /></div>

    <!-- Lista -->
    <div v-else-if="blogStore.categories.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <Card v-for="cat in blogStore.categories" :key="cat.id" class="hover:shadow-lg transition-shadow">
        <template #content>
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-lg font-semibold text-secondary">{{ cat.name }}</h3>
              <p class="text-sm text-secondary-400">{{ cat.slug }}</p>
            </div>
            <div class="flex gap-2">
              <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" @click="openEditDialog(cat)" />
              <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="confirmDelete(cat)" />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white rounded-lg shadow p-12 text-center">
      <i class="pi pi-folder text-6xl text-secondary-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">No hay categorías</h3>
      <p class="text-secondary-500 mb-4">Comienza creando tu primera categoría de blog.</p>
      <Button label="Nueva Categoría" icon="pi pi-plus" @click="openCreateDialog" />
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:visible="showFormDialog" :header="editingCategory ? 'Editar Categoría' : 'Nueva Categoría'" :modal="true" :style="{ width: '400px' }">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Nombre *</label>
          <InputText v-model="categoryForm.name" class="w-full" placeholder="Nombre de la categoría" :class="{ 'p-invalid': formError }" />
          <small v-if="formError" class="p-error">{{ formError }}</small>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="showFormDialog = false" />
        <Button :label="editingCategory ? 'Guardar' : 'Crear'" :loading="isSubmitting" @click="handleSubmitCategory" />
      </template>
    </Dialog>

    <!-- Delete Dialog -->
    <Dialog v-model:visible="showDeleteDialog" header="Confirmar Eliminación" :modal="true" :style="{ width: '400px' }">
      <p>¿Estás seguro de eliminar la categoría <strong>{{ categoryToDelete?.name }}</strong>?</p>
      <template #footer>
        <Button label="Cancelar" text @click="showDeleteDialog = false" />
        <Button label="Eliminar" severity="danger" :loading="isDeleting" @click="handleDeleteCategory" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useBlogStore } from '@/stores/blog.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import ProgressSpinner from 'primevue/progressspinner'
import type { BlogCategory } from '@/types/blog.types'

const blogStore = useBlogStore()
const toast = useToast()

const isLoading = ref(true)
const showFormDialog = ref(false)
const editingCategory = ref<BlogCategory | null>(null)
const categoryForm = reactive({ name: '' })
const formError = ref('')
const isSubmitting = ref(false)

const showDeleteDialog = ref(false)
const categoryToDelete = ref<BlogCategory | null>(null)
const isDeleting = ref(false)

const openCreateDialog = () => {
  editingCategory.value = null
  categoryForm.name = ''
  formError.value = ''
  showFormDialog.value = true
}

const openEditDialog = (cat: BlogCategory) => {
  editingCategory.value = cat
  categoryForm.name = cat.name
  formError.value = ''
  showFormDialog.value = true
}

const handleSubmitCategory = async () => {
  formError.value = ''
  if (!categoryForm.name.trim()) { formError.value = 'El nombre es obligatorio'; return }

  try {
    isSubmitting.value = true
    if (editingCategory.value) {
      await blogStore.updateCategory(editingCategory.value.id, { name: categoryForm.name })
      toast.add({ severity: 'success', summary: 'Actualizada', detail: 'Categoría actualizada', life: 3000 })
    } else {
      await blogStore.createCategory({ name: categoryForm.name })
      toast.add({ severity: 'success', summary: 'Creada', detail: 'Categoría creada', life: 3000 })
    }
    showFormDialog.value = false
  } catch (error: any) {
    const msg = error.response?.data?.messages?.name || error.response?.data?.messages?.error || 'Error al guardar'
    formError.value = typeof msg === 'string' ? msg : Object.values(msg).flat().join(', ')
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = (cat: BlogCategory) => {
  categoryToDelete.value = cat
  showDeleteDialog.value = true
}

const handleDeleteCategory = async () => {
  if (!categoryToDelete.value) return
  try {
    isDeleting.value = true
    await blogStore.deleteCategory(categoryToDelete.value.id)
    toast.add({ severity: 'success', summary: 'Eliminada', detail: 'Categoría eliminada', life: 3000 })
    showDeleteDialog.value = false
    categoryToDelete.value = null
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'Error al eliminar', life: 5000 })
  } finally {
    isDeleting.value = false
  }
}

onMounted(async () => {
  await blogStore.fetchCategories()
  isLoading.value = false
})
</script>
