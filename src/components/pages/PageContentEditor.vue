<template>
  <div class="h-full w-full">
    <!-- Quill WYSIWYG Editor -->
    <QuillEditor
      v-if="editorType === 'wysiwyg'"
      v-model="localContent"
      height="100%"
      toolbar="full"
    />

    <!-- Monaco Code Editor -->
    <div
      v-else-if="editorType === 'code'"
      ref="monacoContainer"
      class="h-full w-full border border-gray-300 rounded"
    ></div>

    <!-- MTBuilder Visual Builder -->
    <page-builder
      v-else-if="editorType === 'visual_builder'"
      ref="pageBuilderRef"
      :page-id="pageId"
      lang="es"
      mode="external"
      @builder:ready="onBuilderReady"
      @builder:content-changed="onBuilderChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { QuillEditor } from '@/components/ui'
import type * as MonacoTypes from 'monaco-editor'

import type { PageEditorType } from '@/types/page.types'

// Import MTBuilder Web Component
import '@carlosvidalperu/mtbuilder'

interface Props {
  modelValue: string
  editorType: PageEditorType
  pageId?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const localContent = ref(props.modelValue)
const monacoContainer = ref<HTMLElement | null>(null)
let monacoEditor: MonacoTypes.editor.IStandaloneCodeEditor | null = null

// Visual Builder refs and state
const pageBuilderRef = ref<HTMLElement | null>(null)
let builderInitialized = false

// Initialize Monaco Editor (lazy loaded)
const initMonaco = async () => {
  if (props.editorType === 'code' && monacoContainer.value && !monacoEditor) {
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
      }
    }

    monacoEditor = monaco.editor.create(monacoContainer.value, {
      value: localContent.value,
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
        localContent.value = monacoEditor.getValue()
      }
    })
  }
}

// Visual Builder handlers
const onBuilderReady = () => {
  if (builderInitialized) return
  builderInitialized = true

  if (props.modelValue && pageBuilderRef.value) {
    try {
      const parsed = JSON.parse(props.modelValue)
      // If it has {json, html} structure, use json; otherwise use as-is
      const builderData = parsed.json ? JSON.parse(parsed.json) : parsed
      ;(pageBuilderRef.value as any).setPageData(builderData)
    } catch {
      // Content is empty or invalid, start fresh
    }
  }
}

const onBuilderChange = (event: Event) => {
  const customEvent = event as CustomEvent
  const { data, html } = customEvent.detail
  // Store both: JSON for editing, HTML for preview
  localContent.value = JSON.stringify({
    json: JSON.stringify(data),
    html: html
  })
}

// Sync localContent → parent
watch(localContent, (newVal) => {
  emit('update:modelValue', newVal)
})

// Sync parent → localContent
watch(() => props.modelValue, (newVal) => {
  if (newVal !== localContent.value) {
    localContent.value = newVal
    if (monacoEditor && monacoEditor.getValue() !== newVal) {
      monacoEditor.setValue(newVal)
    }
  }
})

onMounted(() => {
  if (props.editorType === 'code') {
    initMonaco()
  }
})

onBeforeUnmount(() => {
  if (monacoEditor) {
    monacoEditor.dispose()
    monacoEditor = null
  }
  builderInitialized = false
})
</script>
