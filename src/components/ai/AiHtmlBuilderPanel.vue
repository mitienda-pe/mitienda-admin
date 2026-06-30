<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    modal
    maximizable
    header="Asistente de HTML con IA"
    :style="{ width: '92vw', maxWidth: '1280px' }"
    :content-style="{ height: '78vh', padding: '0' }"
  >
    <div class="flex flex-col md:flex-row h-full">
      <!-- Chat -->
      <div class="flex flex-col w-full md:w-2/5 border-r border-gray-200 min-h-0">
        <!-- Mensajes -->
        <div ref="logEl" class="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          <div v-if="!chatLog.length" class="text-sm text-secondary-400 text-center py-8">
            <i class="pi pi-sparkles text-2xl mb-2 block text-primary"></i>
            Describe la sección que quieres crear.<br />
            Ej: «Un hero con título, subtítulo y un botón de "Ver catálogo"».
          </div>

          <div
            v-for="(m, i) in chatLog"
            :key="i"
            class="flex"
            :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              v-if="m.role === 'user'"
              class="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-primary text-white whitespace-pre-wrap"
            >
              {{ m.content }}
            </div>
            <div
              v-else
              class="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-white border border-gray-200 text-secondary-600 inline-flex items-center gap-2"
            >
              <i class="pi pi-check-circle text-primary"></i>
              HTML generado
            </div>
          </div>

          <div v-if="streaming" class="flex justify-start">
            <div class="rounded-lg px-3 py-2 text-sm bg-white border border-gray-200 text-secondary-500 inline-flex items-center gap-2">
              <i class="pi pi-spin pi-spinner"></i> Generando…
            </div>
          </div>
        </div>

        <!-- Error -->
        <Message v-if="error" severity="error" :closable="false" class="m-3">
          {{ error }}
        </Message>

        <!-- Input -->
        <div class="border-t border-gray-200 p-3">
          <Textarea
            v-model="input"
            :rows="3"
            class="w-full"
            :placeholder="chatLog.length ? 'Pide un cambio… (ej: «hazlo más grande», «agrega testimonios»)' : 'Describe lo que quieres crear…'"
            :disabled="streaming"
            @keydown.enter.exact.prevent="send"
          />
          <div class="flex justify-between items-center mt-2">
            <small class="text-secondary-400">Enter para enviar · Shift+Enter para salto de línea</small>
            <Button
              label="Enviar"
              icon="pi pi-send"
              size="small"
              :loading="streaming"
              :disabled="!input.trim()"
              @click="send"
            />
          </div>
        </div>
      </div>

      <!-- Preview -->
      <div class="flex flex-col flex-1 min-h-0">
        <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
          <span class="text-sm font-medium text-secondary-600">Vista previa</span>
          <div class="flex items-center gap-1">
            <Button
              icon="pi pi-mobile"
              text
              size="small"
              :severity="previewMode === 'mobile' ? 'primary' : 'secondary'"
              title="Móvil"
              @click="previewMode = 'mobile'"
            />
            <Button
              icon="pi pi-desktop"
              text
              size="small"
              :severity="previewMode === 'desktop' ? 'primary' : 'secondary'"
              title="Escritorio"
              @click="previewMode = 'desktop'"
            />
          </div>
        </div>

        <div class="flex-1 overflow-auto bg-gray-100 flex justify-center p-4">
          <iframe
            :srcdoc="previewSrcdoc"
            sandbox=""
            class="bg-white shadow rounded transition-all"
            :style="previewMode === 'mobile'
              ? { width: '390px', minWidth: '390px', height: '100%' }
              : { width: '100%', height: '100%' }"
            title="Vista previa del HTML generado"
          ></iframe>
        </div>

        <div class="border-t border-gray-200 p-3 flex justify-end gap-2 bg-white">
          <Button label="Cancelar" text severity="secondary" @click="emit('update:visible', false)" />
          <Button
            label="Usar este HTML"
            icon="pi pi-check"
            :disabled="!hasHtml || streaming"
            @click="apply"
          />
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import Message from 'primevue/message'
import { useLlmProxy } from '@/composables/useLlmProxy'
import { useAppearanceStore } from '@/stores/appearance.store'
import { useTypographyStore } from '@/stores/typography.store'
import { sanitizeHtml } from '@/utils/sanitize-html'
import {
  buildBrandContext,
  buildHtmlSystemPrompt,
  buildPreviewThemeVars,
} from '@/config/ai-html-system-prompt'

interface Props {
  visible: boolean
  modelValue?: string
  buttonId?: string
  context?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  context: '',
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  apply: [html: string]
}>()

const { generateFromMessages, error } = useLlmProxy()
const appearanceStore = useAppearanceStore()
const typographyStore = useTypographyStore()

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

const messages = ref<ChatMessage[]>([])
const input = ref('')
const currentHtml = ref('')
const streaming = ref(false)
const brandReady = ref(false)
const previewMode = ref<'mobile' | 'desktop'>('desktop')
const logEl = ref<HTMLElement | null>(null)

let brandInitialized = false

const chatLog = computed(() => messages.value.filter((m) => m.role !== 'system'))
const hasHtml = computed(() => !!sanitizeHtml(currentHtml.value).trim())

/** Quita fences markdown que el modelo pudiera añadir por error. */
function stripFences(s: string): string {
  return s
    .trim()
    .replace(/^```(?:html)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
}

const fontLinks = computed(() => {
  if (!brandReady.value) return ''
  const t = typographyStore.savedTypography.body
  const families = [...new Set([t.headingFont, t.bodyFont])]
  return families
    .map(
      (f) =>
        `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(
          f
        )}:wght@400;500;700&display=swap">`
    )
    .join('')
})

const previewSrcdoc = computed(() => {
  const themeVars = brandReady.value
    ? buildPreviewThemeVars(appearanceStore.savedColors, typographyStore.savedTypography)
    : ''
  const body = sanitizeHtml(currentHtml.value)
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${fontLinks.value}<style>${themeVars} html,body{margin:0} body{padding:16px;font-family:var(--theme-font-body, system-ui, sans-serif);background:var(--theme-body-bg,#fff);color:var(--theme-body-text,#333);} img{max-width:100%;height:auto;}</style></head><body>${body}</body></html>`
})

/** Carga colores/tipografías de la tienda y siembra el system prompt una vez. */
async function ensureBrand() {
  if (brandInitialized) return
  if (!appearanceStore.isLoaded) await appearanceStore.fetchColors()
  if (!typographyStore.isLoaded) await typographyStore.fetchTypography()

  const brandContext = buildBrandContext(
    appearanceStore.savedColors,
    typographyStore.savedTypography
  )
  messages.value = [{ role: 'system', content: buildHtmlSystemPrompt(brandContext) }]

  // Si ya hay HTML en el editor, sembrarlo como turno previo para poder iterar.
  const existing = stripFences(props.modelValue || '')
  if (existing) {
    messages.value.push({ role: 'assistant', content: existing })
    currentHtml.value = existing
  }

  brandReady.value = true
  brandInitialized = true
}

async function scrollLogToBottom() {
  await nextTick()
  if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight
}

async function send() {
  const text = input.value.trim()
  if (!text || streaming.value) return

  await ensureBrand()

  messages.value.push({ role: 'user', content: text })
  input.value = ''
  streaming.value = true
  currentHtml.value = ''
  scrollLogToBottom()

  try {
    const result = await generateFromMessages(
      // temperatura baja → HTML más determinista; max_tokens alto → la página
      // completa no se trunca (el default del proxy es 2000).
      { messages: messages.value, buttonId: props.buttonId, temperature: 0.4, maxTokens: 8000 },
      (accumulated) => {
        currentHtml.value = stripFences(accumulated)
      }
    )
    const clean = stripFences(result)
    currentHtml.value = clean
    messages.value.push({ role: 'assistant', content: clean })
    scrollLogToBottom()
  } catch {
    // error ya queda registrado en el composable
  } finally {
    streaming.value = false
  }
}

function apply() {
  const clean = sanitizeHtml(currentHtml.value).trim()
  if (!clean) return
  emit('apply', clean)
  emit('update:visible', false)
}

watch(
  () => props.visible,
  (v) => {
    if (v) ensureBrand()
  }
)
</script>
