<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <Button
        icon="pi pi-arrow-left"
        text
        rounded
        severity="secondary"
        @click="$router.push({ name: 'pages-list' })"
      />
      <h1 class="text-3xl font-bold text-secondary">Nueva Página</h1>
    </div>

    <!-- Step 1: Page Info + Editor Selection -->
    <div class="bg-white rounded-lg shadow p-6">
      <form @submit.prevent="handleCreate">
        <!-- Title -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-secondary-700 mb-1">Título *</label>
          <InputText
            v-model="form.title"
            class="w-full"
            placeholder="Título de la página"
            :class="{ 'p-invalid': errors.title }"
          />
          <small v-if="errors.title" class="p-error">{{ errors.title }}</small>
        </div>

        <!-- Slug -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-secondary-700 mb-1">URL (slug)</label>
          <div class="flex items-center gap-2">
            <span class="text-secondary-400 text-sm">/</span>
            <InputText
              v-model="form.slug"
              class="w-full"
              placeholder="url-de-la-pagina (se genera automáticamente)"
            />
          </div>
          <small class="text-secondary-400">Déjalo vacío para generarlo automáticamente desde el título</small>
        </div>

        <!-- Meta SEO -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Meta título (SEO)</label>
            <InputText
              v-model="form.meta_title"
              class="w-full"
              placeholder="Título para motores de búsqueda"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Meta descripción (SEO)</label>
            <InputText
              v-model="form.meta_description"
              class="w-full"
              placeholder="Descripción para motores de búsqueda"
            />
          </div>
        </div>

        <Divider />

        <!-- Editor Type Selection -->
        <div class="mb-6">
          <h2 class="text-lg font-semibold text-secondary mb-3">Selecciona el tipo de editor</h2>
          <p class="text-sm text-secondary-500 mb-4">
            La página solo podrá ser editada con el editor que elijas ahora.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- WYSIWYG -->
            <div
              class="border-2 rounded-lg p-5 cursor-pointer transition-all"
              :class="form.editor_type === 'wysiwyg'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'"
              @click="form.editor_type = 'wysiwyg'"
            >
              <div class="flex items-center gap-3 mb-3">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="form.editor_type === 'wysiwyg' ? 'bg-primary text-white' : 'bg-gray-100 text-secondary-500'"
                >
                  <i class="pi pi-align-left text-lg"></i>
                </div>
                <h3 class="font-semibold text-secondary">Editor Visual</h3>
              </div>
              <p class="text-sm text-secondary-500">
                Edita como en un procesador de textos. Ideal para contenido con formato básico.
              </p>
            </div>

            <!-- Code -->
            <div
              class="border-2 rounded-lg p-5 cursor-pointer transition-all"
              :class="form.editor_type === 'code'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'"
              @click="form.editor_type = 'code'"
            >
              <div class="flex items-center gap-3 mb-3">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="form.editor_type === 'code' ? 'bg-primary text-white' : 'bg-gray-100 text-secondary-500'"
                >
                  <i class="pi pi-code text-lg"></i>
                </div>
                <h3 class="font-semibold text-secondary">Editor de Código</h3>
              </div>
              <p class="text-sm text-secondary-500">
                Escribe HTML directamente con autocompletado y resaltado de sintaxis.
              </p>
            </div>

            <!-- Visual Builder -->
            <div
              class="border-2 rounded-lg p-5 cursor-pointer transition-all"
              :class="form.editor_type === 'visual_builder'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'"
              @click="form.editor_type = 'visual_builder'"
            >
              <div class="flex items-center gap-3 mb-3">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="form.editor_type === 'visual_builder' ? 'bg-primary text-white' : 'bg-gray-100 text-secondary-500'"
                >
                  <i class="pi pi-th-large text-lg"></i>
                </div>
                <h3 class="font-semibold text-secondary">Visual Builder</h3>
              </div>
              <p class="text-sm text-secondary-500">
                Arrastra y suelta bloques para diseñar tu página visualmente.
              </p>
            </div>
          </div>

          <small v-if="errors.editor_type" class="p-error">{{ errors.editor_type }}</small>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3">
          <Button
            label="Cancelar"
            severity="secondary"
            text
            @click="$router.push({ name: 'pages-list' })"
          />
          <Button
            label="Crear y Editar Contenido"
            icon="pi pi-arrow-right"
            iconPos="right"
            type="submit"
            :loading="isSubmitting"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { usePagesStore } from '@/stores/pages.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Divider from 'primevue/divider'
import type { PageEditorType } from '@/types/page.types'

const router = useRouter()
const pagesStore = usePagesStore()
const toast = useToast()

const form = reactive({
  title: '',
  slug: '',
  meta_title: '',
  meta_description: '',
  editor_type: 'wysiwyg' as PageEditorType,
})

const errors = reactive<Record<string, string>>({})
const isSubmitting = ref(false)

const handleCreate = async () => {
  // Reset errors
  Object.keys(errors).forEach(key => delete errors[key])

  // Validate
  if (!form.title.trim()) {
    errors.title = 'El título es obligatorio'
    return
  }

  try {
    isSubmitting.value = true

    const page = await pagesStore.createPage({
      title: form.title,
      slug: form.slug || undefined,
      editor_type: form.editor_type,
      meta_title: form.meta_title || undefined,
      meta_description: form.meta_description || undefined,
      content: '',
    })

    toast.add({
      severity: 'success',
      summary: 'Creada',
      detail: 'Página creada exitosamente',
      life: 3000,
    })

    // Navigate to edit page to add content
    router.push({ name: 'page-edit', params: { id: page.id } })
  } catch (error: any) {
    const message = error.response?.data?.messages?.error
      || error.response?.data?.messages?.slug
      || error.message
      || 'Error al crear la página'

    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 5000,
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>
