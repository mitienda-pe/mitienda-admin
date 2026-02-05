<template>
  <div class="h-full w-full">
    <!-- TinyMCE WYSIWYG Editor -->
    <Editor
      v-if="editorType === 'wysiwyg'"
      v-model="localContent"
      :init="tinyConfig"
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
import Editor from '@tinymce/tinymce-vue'
import type * as MonacoTypes from 'monaco-editor'

// Import TinyMCE
import 'tinymce/tinymce'
import 'tinymce/themes/silver'
import 'tinymce/icons/default'
import 'tinymce/models/dom'
// Import plugins
import 'tinymce/plugins/advlist'
import 'tinymce/plugins/autolink'
import 'tinymce/plugins/lists'
import 'tinymce/plugins/link'
import 'tinymce/plugins/image'
import 'tinymce/plugins/charmap'
import 'tinymce/plugins/preview'
import 'tinymce/plugins/anchor'
import 'tinymce/plugins/searchreplace'
import 'tinymce/plugins/visualblocks'
import 'tinymce/plugins/code'
import 'tinymce/plugins/fullscreen'
import 'tinymce/plugins/insertdatetime'
import 'tinymce/plugins/media'
import 'tinymce/plugins/table'
import 'tinymce/plugins/help'
import 'tinymce/plugins/wordcount'

import type { PageEditorType } from '@/types/page.types'

// Import MTBuilder Web Component (TODO: install package when available)
// import '@carlosvidalperu/mtbuilder'

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

// TinyMCE Configuration (extended for full pages)
const tinyConfig = {
  skin_url: '/tinymce/skins/ui/oxide',
  content_css: '/tinymce/skins/content/default/content.min.css',
  height: '100%',
  menubar: true,
  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'help', 'wordcount'
  ],
  toolbar:
    'undo redo | blocks | ' +
    'bold italic underline strikethrough forecolor backcolor | ' +
    'alignleft aligncenter alignright alignjustify | ' +
    'bullist numlist outdent indent | ' +
    'link image media table | ' +
    'code fullscreen | removeformat | help',
  content_style: 'body { font-family: Helvetica, Arial, sans-serif; font-size: 14px; max-width: 900px; margin: 0 auto; padding: 16px; }',
  language: 'es',
  language_url: '/tinymce/langs/es.js',
  promotion: false,
  branding: false,
}

// Initialize Monaco Editor (lazy loaded)
const initMonaco = async () => {
  if (props.editorType === 'code' && monacoContainer.value && !monacoEditor) {
    await nextTick()

    const monaco = await import('monaco-editor')
    const loader = (await import('@monaco-editor/loader')).default
    loader.config({ monaco })

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
