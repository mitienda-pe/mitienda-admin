<template>
  <div class="h-full flex flex-col">
    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="loadError" severity="error" :closable="false" class="mb-4">{{ loadError }}</Message>

    <!-- Post Editor -->
    <template v-else-if="post">
      <!-- Header -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div class="flex items-center gap-4">
          <Button icon="pi pi-arrow-left" text rounded severity="secondary" @click="$router.push({ name: 'blog-posts-list' })" />
          <div>
            <h1 class="text-2xl font-bold text-secondary">{{ post.title }}</h1>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-sm text-secondary-400">/{{ post.slug }}</span>
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :class="editorTypeBadgeClass">
                <i :class="editorTypeIcon" class="mr-1"></i>{{ editorTypeLabel }}
              </span>
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :class="post.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'">
                {{ post.published ? 'Publicada' : 'Borrador' }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button label="Vista Previa" icon="pi pi-eye" text severity="secondary" @click="$router.push({ name: 'blog-post-preview', params: { id: post.id } })" />
          <Button label="Configuración" icon="pi pi-cog" text severity="secondary" @click="showSettings = true" />
          <Button label="Guardar" icon="pi pi-save" :loading="isSaving" @click="handleSave" />
        </div>
      </div>

      <!-- Editor Area -->
      <div class="flex-1 bg-white rounded-lg shadow overflow-hidden" style="min-height: 500px;">
        <PageContentEditor v-model="content" :editor-type="post.editor_type" />
      </div>
    </template>

    <!-- Settings Dialog -->
    <Dialog v-model:visible="showSettings" header="Configuración de Entrada" :modal="true" :style="{ width: '500px' }">
      <div class="space-y-4" v-if="post">
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Título</label>
          <InputText v-model="settingsForm.title" class="w-full" />
        </div>
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">URL (slug)</label>
          <div class="flex items-center gap-2">
            <span class="text-secondary-400 text-sm">/</span>
            <InputText v-model="settingsForm.slug" class="w-full" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Autor</label>
            <Dropdown
              v-model="settingsForm.author_id"
              :options="blogStore.authors"
              optionLabel="name"
              optionValue="id"
              placeholder="Sin autor"
              class="w-full"
              showClear
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Categoría</label>
            <Dropdown
              v-model="settingsForm.category_id"
              :options="blogStore.categories"
              optionLabel="name"
              optionValue="id"
              placeholder="Sin categoría"
              class="w-full"
              showClear
            />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Fecha de publicación</label>
            <InputText v-model="settingsForm.publication_date" type="date" class="w-full" />
          </div>
          <div class="flex items-center gap-3 pt-6">
            <label class="text-sm font-medium text-secondary-700">Estado</label>
            <Button
              :label="settingsForm.published ? 'Publicada' : 'Borrador'"
              :icon="settingsForm.published ? 'pi pi-eye' : 'pi pi-eye-slash'"
              :severity="settingsForm.published ? 'success' : 'secondary'"
              size="small" outlined
              @click="settingsForm.published = !settingsForm.published"
            />
          </div>
        </div>
        <Divider />
        <h3 class="text-sm font-semibold text-secondary-700">Imagen Destacada</h3>
        <div>
          <div v-if="settingsForm.image_url" class="mb-2">
            <div class="relative inline-block">
              <img :src="settingsForm.image_url" alt="Imagen destacada" class="w-full max-h-48 object-cover rounded border border-gray-200" />
              <Button
                icon="pi pi-times"
                severity="danger"
                size="small"
                rounded
                class="!absolute top-1 right-1"
                @click="settingsForm.image_url = null"
              />
            </div>
          </div>
          <div v-if="!settingsForm.image_url">
            <input ref="imageInputRef" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="handleImageUpload" />
            <Button
              label="Subir Imagen"
              icon="pi pi-image"
              severity="secondary"
              outlined
              :loading="isUploadingImage"
              @click="imageInputRef?.click()"
            />
          </div>
          <div v-else>
            <input ref="imageInputRef" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="handleImageUpload" />
            <Button
              label="Cambiar"
              icon="pi pi-upload"
              severity="secondary"
              text
              size="small"
              :loading="isUploadingImage"
              @click="imageInputRef?.click()"
            />
          </div>
        </div>
        <Divider />
        <h3 class="text-sm font-semibold text-secondary-700">SEO</h3>
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Descripción (meta)</label>
          <Textarea v-model="settingsForm.description" class="w-full" rows="2" placeholder="Descripción para motores de búsqueda" />
        </div>
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Extracto</label>
          <Textarea v-model="settingsForm.excerpt" class="w-full" rows="2" placeholder="Resumen corto" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" text @click="showSettings = false" />
        <Button label="Guardar Configuración" :loading="isSavingSettings" @click="handleSaveSettings" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useBlogStore } from '@/stores/blog.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import PageContentEditor from '@/components/pages/PageContentEditor.vue'
import { imageGalleryApi } from '@/api/image-gallery.api'
import type { BlogPost } from '@/types/blog.types'
import type { PageEditorType } from '@/types/page.types'

const route = useRoute()
const blogStore = useBlogStore()
const toast = useToast()

const post = ref<BlogPost | null>(null)
const content = ref('')
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const isSaving = ref(false)
const showSettings = ref(false)
const isSavingSettings = ref(false)

const imageInputRef = ref<HTMLInputElement | null>(null)
const isUploadingImage = ref(false)

const settingsForm = reactive({
  title: '',
  slug: '',
  author_id: null as number | null,
  category_id: null as number | null,
  image_url: null as string | null,
  publication_date: '',
  published: false,
  description: '',
  excerpt: '',
})

const editorTypeLabel = computed(() => {
  const labels: Record<PageEditorType, string> = { wysiwyg: 'Editor Visual', code: 'Editor de Código', visual_builder: 'Visual Builder' }
  return post.value ? labels[post.value.editor_type] : ''
})
const editorTypeIcon = computed(() => {
  const icons: Record<PageEditorType, string> = { wysiwyg: 'pi pi-align-left', code: 'pi pi-code', visual_builder: 'pi pi-th-large' }
  return post.value ? icons[post.value.editor_type] : 'pi pi-file'
})
const editorTypeBadgeClass = computed(() => {
  const classes: Record<PageEditorType, string> = { wysiwyg: 'bg-blue-100 text-blue-800', code: 'bg-purple-100 text-purple-800', visual_builder: 'bg-orange-100 text-orange-800' }
  return post.value ? classes[post.value.editor_type] : 'bg-gray-100 text-gray-800'
})

const loadPost = async () => {
  const postId = Number(route.params.id)
  try {
    isLoading.value = true
    loadError.value = null
    const result = await blogStore.fetchPostById(postId)
    if (result) {
      post.value = result
      content.value = result.content
      settingsForm.title = result.title
      settingsForm.slug = result.slug
      settingsForm.author_id = result.author_id
      settingsForm.category_id = result.category_id
      settingsForm.image_url = result.image_url
      settingsForm.publication_date = result.publication_date
      settingsForm.published = result.published
      settingsForm.description = result.description
      settingsForm.excerpt = result.excerpt
    } else {
      loadError.value = 'Entrada no encontrada'
    }
  } catch (err: any) {
    loadError.value = err.response?.data?.messages?.error || 'Error al cargar la entrada'
  } finally {
    isLoading.value = false
  }
}

const handleSave = async () => {
  if (!post.value) return
  try {
    isSaving.value = true
    const updated = await blogStore.updatePost(post.value.id, { content: content.value })
    post.value = updated
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Contenido guardado exitosamente', life: 3000 })
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'Error al guardar', life: 5000 })
  } finally {
    isSaving.value = false
  }
}

const handleSaveSettings = async () => {
  if (!post.value) return
  try {
    isSavingSettings.value = true
    const updated = await blogStore.updatePost(post.value.id, {
      title: settingsForm.title,
      slug: settingsForm.slug,
      author_id: settingsForm.author_id,
      category_id: settingsForm.category_id,
      image_url: settingsForm.image_url,
      publication_date: settingsForm.publication_date,
      published: settingsForm.published,
      description: settingsForm.description,
      excerpt: settingsForm.excerpt,
    })
    // Update post metadata but preserve current editor content (unsaved edits)
    const currentContent = content.value
    post.value = updated
    content.value = currentContent
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Configuración actualizada', life: 3000 })
    showSettings.value = false
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'Error al guardar configuración', life: 5000 })
  } finally {
    isSavingSettings.value = false
  }
}

const handleImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Formato no soportado. Usa JPG, PNG o WebP.', life: 5000 })
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'La imagen no debe superar 10MB.', life: 5000 })
    return
  }

  try {
    isUploadingImage.value = true
    const result = await imageGalleryApi.uploadImage(file, post.value?.title || 'Blog image')
    settingsForm.image_url = result.url
    toast.add({ severity: 'success', summary: 'Imagen subida', detail: 'Recuerda guardar la configuración', life: 3000 })
  } catch (error: any) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.message || 'Error al subir imagen', life: 5000 })
  } finally {
    isUploadingImage.value = false
    input.value = ''
  }
}

onMounted(() => {
  loadPost()
  blogStore.fetchCategories()
  blogStore.fetchAuthors()
})
</script>
