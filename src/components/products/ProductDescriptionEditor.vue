<template>
  <Dialog v-model:visible="visible" modal :header="dialogTitle" :style="{ width: '90vw', maxHeight: '90vh' }"
    @hide="handleClose">
    <div class="h-[70vh]">
      <!-- TinyMCE Editor -->
      <Editor v-if="editorMode === 'wysiwyg'" v-model="localContent" :init="tinyConfig" />

      <!-- Monaco Editor -->
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
import Editor from '@tinymce/tinymce-vue'
import * as monaco from 'monaco-editor'
import loader from '@monaco-editor/loader'

// Configure Monaco loader
loader.config({ monaco })

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
let monacoEditor: monaco.editor.IStandaloneCodeEditor | null = null

const dialogTitle = computed(() => {
  return editorMode.value === 'wysiwyg' ? 'Editar Descripción (Texto)' : 'Editar Descripción (Código HTML)'
})

// TinyMCE Configuration
const tinyConfig = {
  base_url: '/tinymce',
  suffix: '.min',
  height: '100%',
  menubar: true,
  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
  ],
  toolbar: 'undo redo | blocks | ' +
    'bold italic forecolor | alignleft aligncenter ' +
    'alignright alignjustify | bullist numlist outdent indent | ' +
    'removeformat | help',
  content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
  language: 'es',
  language_url: '/tinymce/langs/es.js'
}

// Initialize Monaco Editor
const initMonaco = async () => {
  if (editorMode.value === 'code' && monacoContainer.value && !monacoEditor) {
    await nextTick()
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

// Watch for visible changes
watch(visible, (isVisible) => {
  if (isVisible && editorMode.value === 'code') {
    nextTick(() => initMonaco())
  } else if (!isVisible && monacoEditor) {
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
