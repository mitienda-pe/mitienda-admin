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
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
              >
                <i class="pi pi-code mr-1 text-xs"></i>
                {{ component.type_name }}
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

      <!-- Monaco Editor -->
      <div
        ref="monacoContainer"
        class="flex-1 bg-white rounded-lg shadow overflow-hidden border border-gray-300"
        style="min-height: 500px;"
      ></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useComponentsStore } from '@/stores/components.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputSwitch from 'primevue/inputswitch'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import type { StoreComponent } from '@/types/component.types'
import type * as MonacoTypes from 'monaco-editor'

const route = useRoute()
const router = useRouter()
const componentsStore = useComponentsStore()
const toast = useToast()

const component = ref<StoreComponent | null>(null)
const htmlContent = ref('')
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const isSaving = ref(false)

const monacoContainer = ref<HTMLElement | null>(null)
let monacoEditor: MonacoTypes.editor.IStandaloneCodeEditor | null = null

const initMonaco = async () => {
  if (!monacoContainer.value) return

  await nextTick()

  const monaco = await import('monaco-editor')

  // Configure web workers for Monaco in production builds
  self.MonacoEnvironment = {
    getWorker(_: string, label: string) {
      if (label === 'html' || label === 'handlebars' || label === 'razor') {
        return new Worker(
          new URL('monaco-editor/esm/vs/language/html/html.worker.js', import.meta.url),
          { type: 'module' }
        )
      }
      if (label === 'css' || label === 'scss' || label === 'less') {
        return new Worker(
          new URL('monaco-editor/esm/vs/language/css/css.worker.js', import.meta.url),
          { type: 'module' }
        )
      }
      if (label === 'json') {
        return new Worker(
          new URL('monaco-editor/esm/vs/language/json/json.worker.js', import.meta.url),
          { type: 'module' }
        )
      }
      if (label === 'javascript' || label === 'typescript') {
        return new Worker(
          new URL('monaco-editor/esm/vs/language/typescript/ts.worker.js', import.meta.url),
          { type: 'module' }
        )
      }
      return new Worker(
        new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url),
        { type: 'module' }
      )
    },
  }

  monacoEditor = monaco.editor.create(monacoContainer.value, {
    value: htmlContent.value,
    language: 'html',
    theme: 'vs',
    automaticLayout: true,
    minimap: { enabled: true },
    wordWrap: 'on',
    fontSize: 14,
    tabSize: 2,
    formatOnPaste: true,
    suggestOnTriggerCharacters: true,
  })

  monacoEditor.onDidChangeModelContent(() => {
    if (monacoEditor) {
      htmlContent.value = monacoEditor.getValue()
    }
  })
}

const loadComponent = async () => {
  const componentId = Number(route.params.id)

  try {
    isLoading.value = true
    loadError.value = null

    const result = await componentsStore.fetchComponentById(componentId)

    if (result) {
      // Redirect if not HTML type
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
      isLoading.value = false

      await nextTick()
      await initMonaco()
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
      detail: 'Contenido HTML guardado exitosamente',
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

onBeforeUnmount(() => {
  if (monacoEditor) {
    monacoEditor.dispose()
    monacoEditor = null
  }
})
</script>
