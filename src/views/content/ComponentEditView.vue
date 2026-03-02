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

    <!-- Editor -->
    <template v-else-if="component">
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
            <h1 class="text-2xl font-bold text-secondary">{{ component.name }}</h1>
            <div class="flex items-center gap-2 mt-1">
              <code class="text-sm bg-gray-100 px-2 py-1 rounded">{{ component.code }}</code>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="editorBadgeClass(component.editor_type)"
              >
                <i :class="editorIcon(component.editor_type)" class="mr-1 text-xs"></i>
                {{ editorLabel(component.editor_type) }}
              </span>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="component.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
              >
                {{ component.active ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <div class="flex items-center gap-2 mr-4">
            <label class="text-sm text-secondary-600">Activo</label>
            <InputSwitch
              :modelValue="component.active"
              @update:modelValue="handleToggleActive"
            />
          </div>
          <Button
            label="Guardar"
            icon="pi pi-save"
            :loading="isSaving"
            @click="handleSave"
          />
        </div>
      </div>

      <!-- Content Editor -->
      <PageContentEditor
        v-model="htmlContent"
        :editor-type="component.editor_type || 'code'"
        :page-id="String(component.id)"
        class="flex-1"
        style="min-height: 500px"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useComponentsStore } from '@/stores/components.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputSwitch from 'primevue/inputswitch'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import PageContentEditor from '@/components/pages/PageContentEditor.vue'
import type { StoreComponent, ComponentEditorType } from '@/types/component.types'

const route = useRoute()
const router = useRouter()
const componentsStore = useComponentsStore()
const toast = useToast()

const component = ref<StoreComponent | null>(null)
const htmlContent = ref('')
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const isSaving = ref(false)

const editorIcon = (type: ComponentEditorType) => {
  if (type === 'wysiwyg') return 'pi pi-align-left'
  if (type === 'visual_builder') return 'pi pi-th-large'
  return 'pi pi-code'
}

const editorLabel = (type: ComponentEditorType) => {
  if (type === 'wysiwyg') return 'Visual'
  if (type === 'visual_builder') return 'Builder'
  return 'Código'
}

const editorBadgeClass = (type: ComponentEditorType) => {
  if (type === 'wysiwyg') return 'bg-blue-100 text-blue-800'
  if (type === 'visual_builder') return 'bg-purple-100 text-purple-800'
  return 'bg-gray-100 text-gray-700'
}

const loadComponent = async () => {
  const componentId = Number(route.params.id)

  try {
    isLoading.value = true
    loadError.value = null

    const result = await componentsStore.fetchComponentById(componentId)

    if (result) {
      if (result.type_id !== 2) {
        toast.add({
          severity: 'warn',
          summary: 'No editable',
          detail: 'Solo los componentes de tipo HTML son editables',
          life: 5000,
        })
        router.push({ name: 'content-components' })
        return
      }

      component.value = result
      htmlContent.value = result.html_content || ''
    } else {
      loadError.value = 'Componente no encontrado'
    }
  } catch (err: any) {
    loadError.value =
      err.response?.data?.messages?.error || 'Error al cargar el componente'
  } finally {
    isLoading.value = false
  }
}

const handleSave = async () => {
  if (!component.value) return

  try {
    isSaving.value = true

    const updated = await componentsStore.updateComponent(component.value.id, {
      html_content: htmlContent.value,
    })

    component.value = updated

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

const handleToggleActive = async () => {
  if (!component.value) return

  try {
    await componentsStore.toggleActive(component.value.id)
    if (componentsStore.currentComponent) {
      component.value = componentsStore.currentComponent
    }
    toast.add({
      severity: 'success',
      summary: 'Actualizado',
      detail: component.value.active ? 'Componente activado' : 'Componente desactivado',
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

const handleBack = () => {
  router.push({ name: 'content-components' })
}

onMounted(() => {
  loadComponent()
})
</script>
