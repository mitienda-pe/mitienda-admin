<template>
  <div class="quill-editor-wrapper" :style="{ height: height }">
    <button
      v-if="allowSourceMode"
      type="button"
      class="source-toggle"
      :title="mode === 'visual' ? 'Ver/editar HTML fuente' : 'Volver al editor visual'"
      @click="toggleMode"
    >
      <span v-if="mode === 'visual'">&lt;/&gt; HTML</span>
      <span v-else>✎ Visual</span>
    </button>
    <div v-show="mode === 'visual'" ref="editorRef"></div>
    <textarea
      v-show="mode === 'source'"
      ref="textareaRef"
      v-model="rawHtml"
      class="source-textarea"
      spellcheck="false"
      :readonly="readOnly"
      @input="onSourceInput"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

const BlockEmbed = Quill.import('blots/block/embed') as any

class DividerBlot extends BlockEmbed {
  static blotName = 'divider'
  static tagName = 'hr'

  html(): string {
    return '<hr>'
  }
}

Quill.register(DividerBlot)

/**
 * Convierte una URL de YouTube/Vimeo a su URL de embed (la que acepta el blot
 * `video` de Quill, que renderiza <iframe class="ql-video" src=...>).
 * Devuelve null si no reconoce un proveedor de video soportado.
 */
function toEmbedUrl(rawUrl: string): string | null {
  const url = rawUrl.trim()
  if (!url) return null

  // YouTube: watch?v=ID, youtu.be/ID, /embed/ID, /shorts/ID
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/i
  )
  if (yt?.[1]) {
    return `https://www.youtube.com/embed/${yt[1]}`
  }

  // Vimeo: vimeo.com/ID o player.vimeo.com/video/ID
  const vimeo = url.match(/(?:player\.)?vimeo\.com\/(?:video\/)?(\d+)/i)
  if (vimeo?.[1]) {
    return `https://player.vimeo.com/video/${vimeo[1]}`
  }

  return null
}

type ToolbarPreset = 'full' | 'compact'

interface Props {
  modelValue?: string
  height?: string
  toolbar?: ToolbarPreset
  placeholder?: string
  readOnly?: boolean
  /**
   * Permite alternar entre el editor visual (Quill) y un textarea con el HTML
   * fuente. Útil para campos CMS donde el merchant pega HTML con CSS custom
   * que Quill simplificaría al convertir a su formato Delta.
   *
   * Nota: alternar Source → Visual puede simplificar el HTML (Quill solo
   * preserva un subconjunto de tags/atributos). Mientras el usuario edite
   * solo en modo Source, el HTML se preserva tal cual.
   */
  allowSourceMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  height: '300px',
  toolbar: 'full',
  placeholder: '',
  readOnly: false,
  allowSourceMode: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorRef = ref<HTMLElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const mode = ref<'visual' | 'source'>('visual')
const rawHtml = ref<string>(props.modelValue || '')
let quill: Quill | null = null

const TOOLBAR_FULL = [
  [{ header: [1, 2, 3, 4, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  ['link', 'image', 'video'],
  ['table', 'divider'],
  ['clean']
]

const TOOLBAR_COMPACT = [
  ['bold', 'italic'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['link', 'image'],
  ['clean']
]

function getToolbar(): unknown[] {
  return props.toolbar === 'compact' ? TOOLBAR_COMPACT : TOOLBAR_FULL
}

function loadIntoQuill(html: string) {
  if (!quill) return
  const clipboard = quill.getModule('clipboard') as any
  const delta = clipboard.convert({ html: html || '' })
  quill.setContents(delta, 'silent')
}

function toggleMode() {
  if (mode.value === 'visual') {
    if (quill) {
      const current = quill.getSemanticHTML()
      if (current !== rawHtml.value) {
        rawHtml.value = current
      }
    }
    mode.value = 'source'
  } else {
    loadIntoQuill(rawHtml.value)
    mode.value = 'visual'
  }
}

function onSourceInput() {
  emit('update:modelValue', rawHtml.value)
}

onMounted(() => {
  if (!editorRef.value) return

  quill = new Quill(editorRef.value, {
    theme: 'snow',
    modules: {
      toolbar: {
        container: getToolbar(),
        handlers: {
          table: function () {
            const tableModule = quill?.getModule('table') as any
            if (tableModule) {
              tableModule.insertTable(3, 3)
            }
          },
          divider: function () {
            const range = quill?.getSelection(true)
            if (!quill || !range) return
            quill.insertText(range.index, '\n', Quill.sources.USER)
            quill.insertEmbed(range.index + 1, 'divider', true, Quill.sources.USER)
            quill.setSelection(range.index + 2, Quill.sources.SILENT)
          },
          video: function () {
            if (!quill) return
            const input = window.prompt(
              'Pega la URL del video de YouTube o Vimeo:'
            )
            if (!input) return
            const embedUrl = toEmbedUrl(input)
            if (!embedUrl) {
              window.alert(
                'No se reconoció la URL. Usa un enlace de YouTube o Vimeo.'
              )
              return
            }
            const range = quill.getSelection(true)
            const index = range ? range.index : quill.getLength()
            quill.insertEmbed(index, 'video', embedUrl, Quill.sources.USER)
            quill.setSelection(index + 1, Quill.sources.SILENT)
          }
        }
      },
      table: true
    },
    placeholder: props.placeholder,
    readOnly: props.readOnly
  })

  ;(window as any).quillInstance = quill

  if (props.modelValue) {
    loadIntoQuill(props.modelValue)
    quill.setSelection(0, 0, 'silent')
  }

  quill.on('text-change', (_delta: any, _oldDelta: any, source: string) => {
    if (!quill || source === 'silent') return
    if (mode.value !== 'visual') return
    const html = quill.getSemanticHTML()
    const normalized = html === '<p><br></p>' ? '' : html
    rawHtml.value = normalized
    emit('update:modelValue', normalized)
  })
})

/**
 * Inserta texto plano en la posición del cursor. Funciona tanto en modo visual
 * (Quill) como en modo source (textarea). Usado para insertar shortcodes desde
 * un botón externo en el editor de páginas CMS.
 */
function insertText(text: string) {
  if (mode.value === 'source') {
    const ta = textareaRef.value
    const start = ta?.selectionStart ?? rawHtml.value.length
    const end = ta?.selectionEnd ?? start
    rawHtml.value = rawHtml.value.slice(0, start) + text + rawHtml.value.slice(end)
    emit('update:modelValue', rawHtml.value)
    nextTick(() => {
      if (!ta) return
      ta.focus()
      const pos = start + text.length
      ta.setSelectionRange(pos, pos)
    })
    return
  }

  if (!quill) return
  const range = quill.getSelection(true)
  const index = range ? range.index : quill.getLength()
  quill.insertText(index, text, Quill.sources.USER)
  quill.setSelection(index + text.length, Quill.sources.SILENT)
}

defineExpose({ insertText })

watch(
  () => props.modelValue,
  (newVal) => {
    const val = newVal || ''
    if (mode.value === 'source') {
      if (val !== rawHtml.value) {
        rawHtml.value = val
      }
      return
    }
    if (!quill) return
    const currentHtml = quill.getSemanticHTML()
    if (val !== currentHtml) {
      loadIntoQuill(val)
      rawHtml.value = val
    }
  }
)

onBeforeUnmount(() => {
  if ((window as any).quillInstance === quill) {
    delete (window as any).quillInstance
  }
  quill = null
})
</script>

<style scoped>
.quill-editor-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
}

.quill-editor-wrapper :deep(.ql-container) {
  flex: 1;
  overflow-y: auto;
  font-family: Helvetica, Arial, sans-serif;
  font-size: 14px;
}

.quill-editor-wrapper :deep(.ql-toolbar) {
  border-top-left-radius: 0.375rem;
  border-top-right-radius: 0.375rem;
  background: #f9fafb;
}

.quill-editor-wrapper :deep(.ql-container) {
  border-bottom-left-radius: 0.375rem;
  border-bottom-right-radius: 0.375rem;
}

.quill-editor-wrapper :deep(.ql-divider::before) {
  content: '―';
  font-weight: 700;
  font-size: 14px;
}

.quill-editor-wrapper :deep(hr) {
  border: none;
  border-top: 2px solid #ccc;
  margin: 1em 0;
  cursor: pointer;
}

/* Solo el iframe embebido en el contenido; NO el botón del toolbar
   (Quill también marca el botón con la clase .ql-video). */
.quill-editor-wrapper :deep(.ql-editor iframe.ql-video) {
  display: block;
  width: 100%;
  max-width: 100%;
  aspect-ratio: 16 / 9;
  height: auto;
  margin: 0.5em 0;
  border: 0;
}

.quill-editor-wrapper :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.5em 0;
}

.quill-editor-wrapper :deep(table td) {
  border: 1px solid #ccc;
  padding: 6px 10px;
  min-width: 50px;
}

.source-toggle {
  position: absolute;
  top: 6px;
  right: 8px;
  z-index: 5;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #4b5563;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  cursor: pointer;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.02em;
  transition: background-color 120ms, color 120ms, border-color 120ms;
}

.source-toggle:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.source-toggle:active {
  background: #e5e7eb;
}

.source-textarea {
  flex: 1;
  width: 100%;
  padding: 12px 14px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  line-height: 1.55;
  color: #111827;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  resize: none;
  outline: none;
  tab-size: 2;
}

.source-textarea:focus {
  border-color: #00b2a6;
  box-shadow: 0 0 0 3px rgba(0, 178, 166, 0.15);
}
</style>
