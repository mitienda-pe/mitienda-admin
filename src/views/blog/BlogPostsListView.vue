<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Blog</h1>
        <p class="text-sm text-secondary-500 mt-1">
          {{ blogStore.posts.length }} entradas registradas
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button
          label="Categorías"
          icon="pi pi-folder"
          severity="secondary"
          outlined
          @click="$router.push({ name: 'blog-categories' })"
        />
        <Button
          label="Nueva Entrada"
          icon="pi pi-plus"
          @click="$router.push({ name: 'blog-post-create' })"
        />
      </div>
    </div>

    <!-- Búsqueda -->
    <div class="mb-6">
      <SearchBar
        v-model="searchQuery"
        placeholder="Buscar entradas del blog..."
      />
    </div>

    <!-- Loading -->
    <div v-if="blogStore.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="blogStore.error" severity="error" :closable="false">
      {{ blogStore.error }}
    </Message>

    <!-- Lista -->
    <div v-else-if="filteredPosts.length > 0" class="space-y-3">
      <div
        v-for="post in filteredPosts"
        :key="post.id"
        class="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-3 flex-wrap">
              <h3 class="text-lg font-semibold text-secondary truncate">{{ post.title }}</h3>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="editorTypeBadgeClass(post.editor_type)"
              >
                <i :class="editorTypeIcon(post.editor_type)" class="mr-1"></i>
                {{ editorTypeLabel(post.editor_type) }}
              </span>
              <span
                v-if="post.category_name"
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800"
              >
                <i class="pi pi-folder mr-1"></i>
                {{ post.category_name }}
              </span>
            </div>
            <div class="flex items-center gap-3 mt-1 text-sm text-secondary-400">
              <span>/{{ post.slug }}</span>
              <span v-if="post.author">
                <i class="pi pi-user mr-1"></i>{{ post.author }}
              </span>
              <span>
                <i class="pi pi-calendar mr-1"></i>{{ post.publication_date }}
              </span>
            </div>
            <p v-if="post.excerpt" class="text-sm text-secondary-500 mt-1 truncate">{{ post.excerpt }}</p>
          </div>

          <div class="flex items-center gap-3 ml-4">
            <div class="flex items-center gap-2" v-tooltip.top="post.published ? 'Publicada' : 'Borrador'">
              <InputSwitch
                :modelValue="post.published"
                @update:modelValue="handleTogglePublished(post)"
              />
            </div>
            <Button
              v-tooltip.top="'Vista previa'"
              icon="pi pi-eye"
              text
              rounded
              size="small"
              severity="secondary"
              @click="$router.push({ name: 'blog-post-preview', params: { id: post.id } })"
            />
            <Button
              v-tooltip.top="'Editar'"
              icon="pi pi-pencil"
              text
              rounded
              size="small"
              severity="secondary"
              @click="$router.push({ name: 'blog-post-edit', params: { id: post.id } })"
            />
            <Button
              v-tooltip.top="'Eliminar'"
              icon="pi pi-trash"
              text
              rounded
              size="small"
              severity="danger"
              @click="confirmDelete(post)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white rounded-lg shadow p-12 text-center">
      <i class="pi pi-book text-6xl text-secondary-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">No hay entradas de blog</h3>
      <p class="text-secondary-500 mb-4">
        {{ searchQuery ? 'No se encontraron entradas con ese criterio' : 'Comienza creando tu primera entrada' }}
      </p>
      <Button
        v-if="!searchQuery"
        label="Nueva Entrada"
        icon="pi pi-plus"
        @click="$router.push({ name: 'blog-post-create' })"
      />
    </div>

    <!-- Dialog Confirmar Eliminación -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Confirmar Eliminación"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <p>¿Estás seguro de eliminar la entrada <strong>{{ postToDelete?.title }}</strong>?</p>
      <p class="text-sm text-secondary-500 mt-2">Esta acción no se puede deshacer.</p>
      <template #footer>
        <Button label="Cancelar" text @click="showDeleteDialog = false" />
        <Button
          label="Eliminar"
          severity="danger"
          :loading="isDeleting"
          @click="deletePost"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBlogStore } from '@/stores/blog.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputSwitch from 'primevue/inputswitch'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import SearchBar from '@/components/common/SearchBar.vue'
import type { BlogPost } from '@/types/blog.types'
import type { PageEditorType } from '@/types/page.types'

const blogStore = useBlogStore()
const toast = useToast()

const searchQuery = ref('')
const showDeleteDialog = ref(false)
const postToDelete = ref<BlogPost | null>(null)
const isDeleting = ref(false)

const filteredPosts = computed(() => {
  if (!searchQuery.value) return blogStore.posts
  const query = searchQuery.value.toLowerCase()
  return blogStore.posts.filter(post =>
    post.title.toLowerCase().includes(query) ||
    post.slug.toLowerCase().includes(query) ||
    post.author.toLowerCase().includes(query)
  )
})

const editorTypeLabel = (type: PageEditorType) => {
  const labels: Record<PageEditorType, string> = { wysiwyg: 'WYSIWYG', code: 'Código HTML', visual_builder: 'Visual Builder' }
  return labels[type] || type
}
const editorTypeIcon = (type: PageEditorType) => {
  const icons: Record<PageEditorType, string> = { wysiwyg: 'pi pi-align-left', code: 'pi pi-code', visual_builder: 'pi pi-th-large' }
  return icons[type] || 'pi pi-file'
}
const editorTypeBadgeClass = (type: PageEditorType) => {
  const classes: Record<PageEditorType, string> = { wysiwyg: 'bg-blue-100 text-blue-800', code: 'bg-purple-100 text-purple-800', visual_builder: 'bg-orange-100 text-orange-800' }
  return classes[type] || 'bg-gray-100 text-gray-800'
}

const handleTogglePublished = async (post: BlogPost) => {
  try {
    await blogStore.togglePublished(post.id)
    toast.add({ severity: 'success', summary: 'Actualizado', detail: post.published ? 'Entrada despublicada' : 'Entrada publicada', life: 3000 })
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'Error al cambiar estado', life: 5000 })
  }
}

const confirmDelete = (post: BlogPost) => {
  postToDelete.value = post
  showDeleteDialog.value = true
}

const deletePost = async () => {
  if (!postToDelete.value) return
  try {
    isDeleting.value = true
    await blogStore.deletePost(postToDelete.value.id)
    toast.add({ severity: 'success', summary: 'Eliminada', detail: 'La entrada ha sido eliminada correctamente', life: 3000 })
    showDeleteDialog.value = false
    postToDelete.value = null
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'Error al eliminar la entrada', life: 5000 })
  } finally {
    isDeleting.value = false
  }
}

onMounted(async () => {
  await blogStore.fetchPosts()
})
</script>
