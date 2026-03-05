<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div class="flex items-center gap-4">
        <Button icon="pi pi-arrow-left" text rounded severity="secondary" @click="$router.push({ name: 'blog-posts-list' })" />
        <div>
          <h1 class="text-3xl font-bold text-secondary">Autores del Blog</h1>
          <p class="text-sm text-secondary-500 mt-1">{{ blogStore.authors.length }} autores</p>
        </div>
      </div>
      <Button label="Nuevo Autor" icon="pi pi-plus" @click="openCreateDialog" />
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-20"><ProgressSpinner /></div>

    <!-- Lista -->
    <div v-else-if="blogStore.authors.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <Card v-for="author in blogStore.authors" :key="author.id" class="hover:shadow-lg transition-shadow">
        <template #content>
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-lg font-semibold text-secondary">{{ author.name }}</h3>
              <p class="text-sm text-secondary-400">{{ author.slug }}</p>
              <p v-if="author.bio" class="text-sm text-secondary-500 mt-1 line-clamp-2">{{ author.bio }}</p>
            </div>
            <div class="flex gap-2">
              <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" @click="openEditDialog(author)" />
              <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="confirmDelete(author)" />
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white rounded-lg shadow p-12 text-center">
      <i class="pi pi-user text-6xl text-secondary-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">No hay autores</h3>
      <p class="text-secondary-500 mb-4">Comienza creando tu primer autor de blog.</p>
      <Button label="Nuevo Autor" icon="pi pi-plus" @click="openCreateDialog" />
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog v-model:visible="showFormDialog" :header="editingAuthor ? 'Editar Autor' : 'Nuevo Autor'" :modal="true" :style="{ width: '450px' }">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Nombre *</label>
          <InputText v-model="authorForm.name" class="w-full" placeholder="Nombre del autor" :class="{ 'p-invalid': formError }" />
          <small v-if="formError" class="p-error">{{ formError }}</small>
        </div>
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Biografía</label>
          <Textarea v-model="authorForm.bio" class="w-full" rows="3" placeholder="Breve biografía del autor" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="showFormDialog = false" />
        <Button :label="editingAuthor ? 'Guardar' : 'Crear'" :loading="isSubmitting" @click="handleSubmitAuthor" />
      </template>
    </Dialog>

    <!-- Delete Dialog -->
    <Dialog v-model:visible="showDeleteDialog" header="Confirmar Eliminación" :modal="true" :style="{ width: '400px' }">
      <p>¿Estás seguro de eliminar al autor <strong>{{ authorToDelete?.name }}</strong>?</p>
      <template #footer>
        <Button label="Cancelar" text @click="showDeleteDialog = false" />
        <Button label="Eliminar" severity="danger" :loading="isDeleting" @click="handleDeleteAuthor" />
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
import Textarea from 'primevue/textarea'
import ProgressSpinner from 'primevue/progressspinner'
import type { BlogAuthor } from '@/types/blog.types'

const blogStore = useBlogStore()
const toast = useToast()

const isLoading = ref(true)
const showFormDialog = ref(false)
const editingAuthor = ref<BlogAuthor | null>(null)
const authorForm = reactive({ name: '', bio: '' })
const formError = ref('')
const isSubmitting = ref(false)

const showDeleteDialog = ref(false)
const authorToDelete = ref<BlogAuthor | null>(null)
const isDeleting = ref(false)

const openCreateDialog = () => {
  editingAuthor.value = null
  authorForm.name = ''
  authorForm.bio = ''
  formError.value = ''
  showFormDialog.value = true
}

const openEditDialog = (author: BlogAuthor) => {
  editingAuthor.value = author
  authorForm.name = author.name
  authorForm.bio = author.bio || ''
  formError.value = ''
  showFormDialog.value = true
}

const handleSubmitAuthor = async () => {
  formError.value = ''
  if (!authorForm.name.trim()) { formError.value = 'El nombre es obligatorio'; return }

  try {
    isSubmitting.value = true
    const data = { name: authorForm.name, bio: authorForm.bio || null }
    if (editingAuthor.value) {
      await blogStore.updateAuthor(editingAuthor.value.id, data)
      toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Autor actualizado', life: 3000 })
    } else {
      await blogStore.createAuthor(data)
      toast.add({ severity: 'success', summary: 'Creado', detail: 'Autor creado', life: 3000 })
    }
    showFormDialog.value = false
  } catch (error: any) {
    const msg = error.response?.data?.messages?.name || error.response?.data?.messages?.error || 'Error al guardar'
    formError.value = typeof msg === 'string' ? msg : Object.values(msg).flat().join(', ')
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = (author: BlogAuthor) => {
  authorToDelete.value = author
  showDeleteDialog.value = true
}

const handleDeleteAuthor = async () => {
  if (!authorToDelete.value) return
  try {
    isDeleting.value = true
    await blogStore.deleteAuthor(authorToDelete.value.id)
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Autor eliminado', life: 3000 })
    showDeleteDialog.value = false
    authorToDelete.value = null
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'Error al eliminar', life: 5000 })
  } finally {
    isDeleting.value = false
  }
}

onMounted(async () => {
  await blogStore.fetchAuthors()
  isLoading.value = false
})
</script>
