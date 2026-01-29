<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <Button icon="pi pi-arrow-left" text rounded severity="secondary" @click="$router.push({ name: 'blog-posts-list' })" />
      <h1 class="text-3xl font-bold text-secondary">Nueva Entrada de Blog</h1>
    </div>

    <div class="bg-white rounded-lg shadow p-6">
      <form @submit.prevent="handleCreate">
        <!-- Title -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-secondary-700 mb-1">Título *</label>
          <InputText v-model="form.title" class="w-full" placeholder="Título de la entrada" :class="{ 'p-invalid': errors.title }" />
          <small v-if="errors.title" class="p-error">{{ errors.title }}</small>
        </div>

        <!-- Slug -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-secondary-700 mb-1">URL (slug)</label>
          <div class="flex items-center gap-2">
            <span class="text-secondary-400 text-sm">/</span>
            <InputText v-model="form.slug" class="w-full" placeholder="url-de-la-entrada (se genera automáticamente)" />
          </div>
          <small class="text-secondary-400">Déjalo vacío para generarlo automáticamente desde el título</small>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <!-- Author -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Autor</label>
            <InputText v-model="form.author" class="w-full" placeholder="Nombre del autor" />
          </div>

          <!-- Category -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Categoría</label>
            <Dropdown
              v-model="form.category_id"
              :options="blogStore.categories"
              optionLabel="name"
              optionValue="id"
              placeholder="Seleccionar categoría"
              class="w-full"
              showClear
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <!-- Publication Date -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Fecha de publicación</label>
            <InputText v-model="form.publication_date" type="date" class="w-full" />
          </div>

          <!-- Description (meta) -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Descripción (SEO)</label>
            <InputText v-model="form.description" class="w-full" placeholder="Descripción para motores de búsqueda" />
          </div>
        </div>

        <!-- Excerpt -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-secondary-700 mb-1">Extracto</label>
          <Textarea v-model="form.excerpt" class="w-full" rows="2" placeholder="Resumen corto de la entrada" />
        </div>

        <Divider />

        <!-- Editor Type Selection -->
        <div class="mb-6">
          <h2 class="text-lg font-semibold text-secondary mb-3">Selecciona el tipo de editor</h2>
          <p class="text-sm text-secondary-500 mb-4">La entrada solo podrá ser editada con el editor que elijas ahora.</p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- WYSIWYG -->
            <div
              class="border-2 rounded-lg p-5 cursor-pointer transition-all"
              :class="form.editor_type === 'wysiwyg' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'"
              @click="form.editor_type = 'wysiwyg'"
            >
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="form.editor_type === 'wysiwyg' ? 'bg-primary text-white' : 'bg-gray-100 text-secondary-500'">
                  <i class="pi pi-align-left text-lg"></i>
                </div>
                <h3 class="font-semibold text-secondary">Editor Visual</h3>
              </div>
              <p class="text-sm text-secondary-500">Edita como en un procesador de textos.</p>
            </div>

            <!-- Code -->
            <div
              class="border-2 rounded-lg p-5 cursor-pointer transition-all"
              :class="form.editor_type === 'code' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'"
              @click="form.editor_type = 'code'"
            >
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="form.editor_type === 'code' ? 'bg-primary text-white' : 'bg-gray-100 text-secondary-500'">
                  <i class="pi pi-code text-lg"></i>
                </div>
                <h3 class="font-semibold text-secondary">Editor de Código</h3>
              </div>
              <p class="text-sm text-secondary-500">Escribe HTML con autocompletado y sintaxis.</p>
            </div>

            <!-- Visual Builder (Coming Soon) -->
            <div class="border-2 rounded-lg p-5 opacity-50 cursor-not-allowed border-gray-200">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100 text-secondary-400">
                  <i class="pi pi-th-large text-lg"></i>
                </div>
                <div>
                  <h3 class="font-semibold text-secondary-400">Visual Builder</h3>
                  <span class="text-xs text-orange-500 font-medium">Próximamente</span>
                </div>
              </div>
              <p class="text-sm text-secondary-400">Arrastra y suelta bloques visualmente.</p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3">
          <Button label="Cancelar" severity="secondary" text @click="$router.push({ name: 'blog-posts-list' })" />
          <Button label="Crear y Editar Contenido" icon="pi pi-arrow-right" iconPos="right" type="submit" :loading="isSubmitting" />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBlogStore } from '@/stores/blog.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Divider from 'primevue/divider'
import Dropdown from 'primevue/dropdown'
import type { PageEditorType } from '@/types/page.types'

const router = useRouter()
const blogStore = useBlogStore()
const toast = useToast()

const form = reactive({
  title: '',
  slug: '',
  author: '',
  category_id: null as number | null,
  description: '',
  excerpt: '',
  publication_date: new Date().toISOString().split('T')[0],
  editor_type: 'wysiwyg' as PageEditorType,
})

const errors = reactive<Record<string, string>>({})
const isSubmitting = ref(false)

const handleCreate = async () => {
  Object.keys(errors).forEach(key => delete errors[key])
  if (!form.title.trim()) { errors.title = 'El título es obligatorio'; return }

  try {
    isSubmitting.value = true
    const post = await blogStore.createPost({
      title: form.title,
      slug: form.slug || undefined,
      author: form.author || undefined,
      category_id: form.category_id,
      description: form.description || undefined,
      excerpt: form.excerpt || undefined,
      publication_date: form.publication_date,
      editor_type: form.editor_type,
      content: '',
    })

    toast.add({ severity: 'success', summary: 'Creada', detail: 'Entrada de blog creada exitosamente', life: 3000 })
    router.push({ name: 'blog-post-edit', params: { id: post.id } })
  } catch (error: any) {
    const message = error.response?.data?.messages?.error || error.response?.data?.messages?.slug || error.message || 'Error al crear la entrada'
    toast.add({ severity: 'error', summary: 'Error', detail: message, life: 5000 })
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  blogStore.fetchCategories()
})
</script>
