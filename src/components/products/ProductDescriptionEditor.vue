<template>
  <Dialog v-model:visible="visible" modal :header="dialogTitle" :style="{ width: '90vw', maxHeight: '90vh' }"
    @hide="handleClose">
    <div class="h-[70vh]">
      <!-- Quill WYSIWYG Editor -->
      <QuillEditor v-if="editorMode === 'wysiwyg'" v-model="localContent" height="100%" toolbar="full" />

      <!-- Monaco Code Editor -->
      <div v-else ref="monacoContainer" class="h-full w-full border border-gray-300 rounded"></div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancelar" severity="secondary" @click="handleClose" />
        <Button label="Guardar" @click="handleSave" />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import { QuillEditor } from '@/components/ui'
import type * as MonacoTypes from 'monaco-editor'

interface Props {
  modelValue: boolean
  content: string
  mode: 'wysiwyg' | 'code'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [content: string]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const editorMode = ref(props.mode)
const localContent = ref(props.content)
const monacoContainer = ref<HTMLElement | null>(null)
let monacoEditor: MonacoTypes.editor.IStandaloneCodeEditor | null = null

const dialogTitle = computed(() => {
  return editorMode.value === 'wysiwyg' ? 'Editar Descripcion (Texto)' : 'Editar Descripcion (Codigo HTML)'
})

// Initialize Monaco Editor
const initMonaco = async () => {
  if (editorMode.value === 'code' && monacoContainer.value && !monacoEditor) {
    await nextTick()

    const monaco = await import('monaco-editor')

    // Configure web workers for Monaco in production builds
    if (!self.MonacoEnvironment) {
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
        }
      }
    }

    monacoEditor = monaco.editor.create(monacoContainer.value, {
      value: localContent.value,
      language: 'html',
      theme: 'vs',
      automaticLayout: true,
      minimap: { enabled: true },
      wordWrap: 'on',
      fontSize: 14
    })

    // Update localContent when Monaco editor changes
    monacoEditor.onDidChangeModelContent(() => {
      if (monacoEditor) {
        localContent.value = monacoEditor.getValue()
      }
    })
  }
}

// Watch for editor mode changes
watch(() => props.mode, (newMode) => {
  editorMode.value = newMode
  if (newMode === 'code') {
    nextTick(() => initMonaco())
  }
})

// Watch for visible changes — always reset content from props on dialog open
watch(visible, (isVisible) => {
  if (isVisible) {
    // Reset from fresh props every time the dialog opens
    localContent.value = props.content
    editorMode.value = props.mode
    if (editorMode.value === 'code') {
      nextTick(() => initMonaco())
    }
  } else if (monacoEditor) {
    monacoEditor.dispose()
    monacoEditor = null
  }
})

// Watch for content changes from parent
watch(() => props.content, (newContent) => {
  localContent.value = newContent
  if (monacoEditor) {
    monacoEditor.setValue(newContent)
  }
})

onMounted(() => {
  if (visible.value && editorMode.value === 'code') {
    initMonaco()
  }
})

const handleSave = () => {
  emit('save', localContent.value)
  handleClose()
}

const handleClose = () => {
  if (monacoEditor) {
    monacoEditor.dispose()
    monacoEditor = null
  }
  emit('update:modelValue', false)
}
</script>
