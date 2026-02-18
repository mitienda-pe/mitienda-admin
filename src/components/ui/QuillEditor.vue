<template>
  <div class="quill-editor-wrapper" :style="{ height: height }">
    <div ref="editorRef"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

// Register custom <hr> (divider) blot — Quill 2.x doesn't support <hr> natively
const BlockEmbed = Quill.import('blots/block/embed') as any

class DividerBlot extends BlockEmbed {
  static blotName = 'divider'
  static tagName = 'hr'

  html(): string {
    return '<hr>'
  }
}

Quill.register(DividerBlot)

type ToolbarPreset = 'full' | 'compact'

interface Props {
  modelValue?: string
  height?: string
  toolbar?: ToolbarPreset
  placeholder?: string
  readOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  height: '300px',
  toolbar: 'full',
  placeholder: '',
  readOnly: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editorRef = ref<HTMLElement | null>(null)
let quill: Quill | null = null
let isInternalChange = false

const TOOLBAR_FULL = [
  [{ header: [1, 2, 3, 4, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  ['link', 'image'],
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

onMounted(async () => {
  await nextTick()
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
          }
        }
      },
      table: true
    },
    placeholder: props.placeholder,
    readOnly: props.readOnly
  })

  // Set initial content using clipboard API (not innerHTML which bypasses Quill's parser)
  if (props.modelValue) {
    const clipboard = quill.getModule('clipboard') as any
    const delta = clipboard.convert({ html: props.modelValue })
    quill.setContents(delta, 'silent')
    quill.setSelection(0, 0, 'silent')
  }

  // Register change handler after initial content is settled to avoid spurious emissions
  nextTick(() => {
    if (!quill) return
    quill.on('text-change', () => {
      if (!quill || isInternalChange) return
      isInternalChange = true
      const html = quill.getSemanticHTML()
      emit('update:modelValue', html === '<p><br></p>' ? '' : html)
      nextTick(() => {
        isInternalChange = false
      })
    })
  })
})

// Watch for external content changes
watch(
  () => props.modelValue,
  (newVal) => {
    if (isInternalChange || !quill) return
    const currentHtml = quill.getSemanticHTML()
    if (newVal !== currentHtml) {
      isInternalChange = true
      const clipboard = quill.getModule('clipboard') as any
      const delta = clipboard.convert({ html: newVal || '' })
      quill.setContents(delta, 'silent')
      nextTick(() => {
        isInternalChange = false
      })
    }
  }
)

onBeforeUnmount(() => {
  quill = null
})
</script>

<style scoped>
.quill-editor-wrapper {
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

/* Divider (hr) button icon in toolbar */
.quill-editor-wrapper :deep(.ql-divider::before) {
  content: '―';
  font-weight: 700;
  font-size: 14px;
}

/* HR styling inside editor */
.quill-editor-wrapper :deep(hr) {
  border: none;
  border-top: 2px solid #ccc;
  margin: 1em 0;
  cursor: pointer;
}

/* Table styles inside editor */
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
</style>
