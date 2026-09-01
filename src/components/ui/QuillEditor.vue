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
    <div v-if="uploadingImages > 0" class="upload-indicator">
      <i class="pi pi-spin pi-spinner"></i>
      {{ uploadingImages === 1 ? 'Subiendo imagen…' : `Subiendo ${uploadingImages} imágenes…` }}
    </div>
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
import { imageGalleryApi } from '@/api/image-gallery.api'

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

/** Hosts permitidos para embeds vía <iframe>. Match exacto de hostname. */
const ALLOWED_VIDEO_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  'player.vimeo.com',
  'iframe.cloudflarestream.com'
])

function isAllowedVideoSrc(src: string | undefined | null): boolean {
  if (!src) return false
  try {
    const url = new URL(src, 'https://invalid.local')
    if (url.protocol !== 'https:') return false
    const host = url.hostname.toLowerCase()
    return ALLOWED_VIDEO_HOSTS.has(host) || host.endsWith('.cloudflarestream.com')
  } catch {
    return false
  }
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

/**
 * Sin un handler propio, el botón de imagen de Quill 2 incrusta el archivo como
 * data URI base64 dentro del HTML. Las columnas de contenido son TEXT (65 535
 * bytes), así que MySQL truncaba la entrada en silencio y dejaba el HTML cortado
 * a la mitad. Todo lo que entre al editor como base64 (botón, pegado o
 * arrastrado) se sube a R2 y se reemplaza por su URL.
 */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

const uploadingImages = ref(0)
let fileInput: HTMLInputElement | null = null
let pendingInsertIndex = 0
/** Imágenes base64 que ya tienen una subida en curso, para no duplicarla. */
const inFlightDataImages = new WeakSet<HTMLImageElement>()

/**
 * Sube el archivo a R2 vía la galería de imágenes de la tienda y devuelve su
 * URL pública, o null si la validación o la subida fallaron (ya avisadas).
 */
async function uploadImageFile(file: File, failureMessage: string): Promise<string | null> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    window.alert('Formato de imagen no válido. Usa JPG, PNG o WebP.')
    return null
  }
  if (file.size > MAX_IMAGE_BYTES) {
    window.alert('La imagen no debe superar 10MB.')
    return null
  }

  uploadingImages.value++
  try {
    const result = await imageGalleryApi.uploadImage(file, file.name)
    return result.url
  } catch (error: any) {
    window.alert(error?.response?.data?.message || failureMessage)
    return null
  } finally {
    uploadingImages.value--
  }
}

/**
 * Decodifica un data URI a File. Se decodifica a mano en vez de con fetch()
 * para no depender de que la CSP permita el esquema `data:` en connect-src.
 */
function dataUrlToFile(dataUrl: string): File | null {
  const match = dataUrl.match(/^data:([^;,]+)(;base64)?,([\s\S]*)$/)
  if (!match) return null

  const [, mime, base64Flag, payload] = match
  let buffer: ArrayBuffer
  try {
    if (base64Flag) {
      const binary = atob(payload)
      buffer = new ArrayBuffer(binary.length)
      const view = new Uint8Array(buffer)
      for (let i = 0; i < binary.length; i++) {
        view[i] = binary.charCodeAt(i)
      }
    } else {
      const encoded = new TextEncoder().encode(decodeURIComponent(payload))
      buffer = new ArrayBuffer(encoded.length)
      new Uint8Array(buffer).set(encoded)
    }
  } catch {
    return null
  }

  const extension = (mime.split('/')[1] || 'png').replace('jpeg', 'jpg')
  return new File([buffer], `imagen-${Date.now()}.${extension}`, { type: mime })
}

/** Abre el selector de archivos del botón de imagen del toolbar. */
function pickImage() {
  if (!quill || props.readOnly) return

  const range = quill.getSelection(true)
  pendingInsertIndex = range ? range.index : quill.getLength()

  if (!fileInput) {
    fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = ALLOWED_IMAGE_TYPES.join(',')
    fileInput.style.display = 'none'
    fileInput.addEventListener('change', async () => {
      const file = fileInput?.files?.[0]
      if (fileInput) fileInput.value = ''
      if (!file) return

      const url = await uploadImageFile(file, 'No se pudo subir la imagen.')
      if (!url || !quill) return

      const index = Math.min(pendingInsertIndex, quill.getLength())
      quill.insertEmbed(index, 'image', url, Quill.sources.USER)
      quill.setSelection(index + 1, Quill.sources.SILENT)
    })
    document.body.appendChild(fileInput)
  }

  fileInput.click()
}

/** Sube una imagen base64 ya insertada y la sustituye por la versión en R2. */
async function replaceDataImage(node: HTMLImageElement, dataUrl: string) {
  const file = dataUrlToFile(dataUrl)
  const url = file
    ? await uploadImageFile(file, 'No se pudo subir una imagen incrustada; se quitó del contenido.')
    : null

  if (!file) {
    window.alert('No se pudo leer una imagen incrustada; se quitó del contenido.')
  }

  if (!quill || !quill.root.contains(node)) return

  const blot = Quill.find(node)
  if (!blot) return

  const index = quill.getIndex(blot as any)
  quill.deleteText(index, 1, Quill.sources.USER)
  if (url) {
    quill.insertEmbed(index, 'image', url, Quill.sources.USER)
  }
}

/**
 * Barre el editor buscando imágenes base64 (pegadas desde Word/Docs o soltadas
 * sobre el editor, que Quill inserta como data URI) y las migra a R2.
 */
function sweepDataImages() {
  if (!quill || props.readOnly) return

  const images = Array.from(quill.root.querySelectorAll('img')) as HTMLImageElement[]
  for (const node of images) {
    const src = node.getAttribute('src') || ''
    if (!src.startsWith('data:image/')) continue
    if (inFlightDataImages.has(node)) continue

    inFlightDataImages.add(node)
    void replaceDataImage(node, src)
  }
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
          image: function () {
            pickImage()
          },
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

  // Quill registra el blot `video` con la clase `ql-video`, así que un <iframe>
  // pegado SIN esa clase (embed code crudo de YouTube/Vimeo) no se reconoce y se
  // descarta al convertir. Este matcher convierte cualquier iframe de un host
  // confiable en un embed de video válido; los demás iframes se eliminan.
  const Delta = Quill.import('delta') as any
  const clipboard = quill.getModule('clipboard') as any
  clipboard.addMatcher('IFRAME', (node: HTMLElement) => {
    const rawSrc = node.getAttribute('src') || ''
    const embed = toEmbedUrl(rawSrc) || rawSrc
    const delta = new Delta()
    if (isAllowedVideoSrc(embed)) {
      delta.insert({ video: embed })
    }
    return delta
  })

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
    sweepDataImages()
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
  fileInput?.remove()
  fileInput = null
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

.upload-indicator {
  position: absolute;
  bottom: 10px;
  right: 12px;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 500;
  color: #ffffff;
  background: rgba(0, 178, 166, 0.95);
  border-radius: 4px;
  pointer-events: none;
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
