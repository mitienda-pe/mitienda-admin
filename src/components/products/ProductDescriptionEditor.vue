<template>
  <Dialog v-model:visible="visible" modal :style="{ width: '90vw', maxHeight: '90vh' }"
    @hide="handleClose">
    <template #header>
      <span class="font-semibold text-lg">{{ dialogTitle }}</span>
    </template>

    <div class="h-[70vh]">
      <!-- Quill WYSIWYG Editor -->
      <QuillEditor v-if="editorMode === 'wysiwyg'" v-model="localContent" height="100%" toolbar="full" />

      <!-- Monaco Code Editor -->
      <div v-else ref="monacoContainer" class="h-full w-full border border-gray-300 rounded"></div>
    </div>

    <!-- AI Text Enhancer (only in wysiwyg mode) -->
    <ai-text-enhancer
      v-if="editorMode === 'wysiwyg'"
      :id="buttonId"
      ref="aiEnhancerRef"
      editor-type="quill"
      language="es"
      tenant-id="ten-67d88d1d-111ae225"
      :user-id="userId"
      :proxy-endpoint="proxyEndpoint"
      :prompt="aiPrompt"
      :context="aiContext"
      :image-url="aiImageUrl"
      :initial-prompt="aiInitialPrompt"
      supports-images="true"
      hide-trigger
      auto-send
    ></ai-text-enhancer>

    <template #footer>
      <div class="flex justify-between items-center w-full">
        <Button
          v-if="editorMode === 'wysiwyg'"
          label="Mejorar con IA"
          icon="pi pi-sparkles"
          size="small"
          severity="secondary"
          outlined
          @click="openAiEnhancer"
        />
        <span v-else />
        <div class="flex gap-2">
          <Button label="Cancelar" severity="secondary" @click="handleClose" />
          <Button label="Guardar" @click="handleSave" />
        </div>
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
import 'ai-text-enhancer'
import { useAuthStore } from '@/stores/auth.store'
import { AI_BUTTON_IDS } from '@/config/ai-buttons.config'

interface Props {
  modelValue: boolean
  content: string
  mode: 'wysiwyg' | 'code'
  productContext?: {
    name: string
    sku: string
    barcode: string
    categories: string[]
    brand: string
    price: number
    comparePrice?: number
    descriptionShort: string
    weight?: number
    weightUnit: string
    height?: number
    width?: number
    length?: number
    dimensionsUnit: string
    hasVariants: boolean
    imageUrl: string
  }
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

const authStore = useAuthStore()

const editorMode = ref(props.mode)
const localContent = ref(props.content)
const monacoContainer = ref<HTMLElement | null>(null)
let monacoEditor: MonacoTypes.editor.IStandaloneCodeEditor | null = null

const aiEnhancerRef = ref<HTMLElement | null>(null)
const userId = computed(() => String(authStore.selectedStore?.id || ''))

const dialogTitle = computed(() => {
  return editorMode.value === 'wysiwyg' ? 'Editar Descripcion (Texto)' : 'Editar Descripcion (Codigo HTML)'
})

const proxyEndpoint = computed(() => {
  return import.meta.env.DEV
    ? '/llm-proxy'
    : 'https://llmproxy.mitienda.host/index.php/api/llm-proxy'
})

const buttonId = computed(() => AI_BUTTON_IDS.product.description)

const aiPrompt = computed(() => {
  return `Instrucciones de generacion/mejora:\n\n` +
    `1. Actua como un experto en redaccion de descripciones de productos para tiendas en linea en Peru.\n\n` +
    `2. Tu tarea es generar o mejorar la descripcion de un producto con un enfoque atractivo y persuasivo, destacando sus caracteristicas principales, beneficios y posibles usos, optimizando el contenido para el mercado peruano.\n\n` +
    `3. Si el usuario ya ha escrito una descripcion: Mejorala manteniendo su esencia, pero haciendola mas clara, persuasiva y optimizada para ventas.\n\n` +
    `4. Si la descripcion esta vacia: Genera una nueva descripcion atractiva, destacando caracteristicas y beneficios.\n\n` +
    `5. Si el producto pertenece a una marca reconocida y tiene un modelo o part number: Considera especificaciones tecnicas adicionales y detalles relevantes que puedan encontrarse en fuentes confiables.\n\n` +
    `6. Adapta la descripcion al mercado peruano: Usa terminos y expresiones locales si es relevante, menciona envios dentro de Peru y considera detalles como metodos de pago populares en el pais.\n\n` +
    `7. Usa un tono profesional y cercano, adaptado a una tienda en linea.\n\n` +
    `8. Si hay una imagen del producto, aprovecha los detalles visuales para enriquecer la descripcion.\n\n` +
    `9. Si aplica, menciona informacion relevante del comercio para reforzar la confianza del comprador (envios, garantia, atencion al cliente, etc.).\n\n` +
    `10. Manten el texto claro, sin repeticiones innecesarias, y optimizado para SEO si es posible.\n\n` +
    `*Importante:* Solo responde con la descripcion generada o mejorada, sin agregar ningun otro comentario, explicacion o texto adicional.`
})

const aiContext = computed(() => {
  const ctx = props.productContext
  if (!ctx) return ''

  const parts: string[] = []
  parts.push(`Nombre: ${ctx.name || 'Sin nombre'}`)
  parts.push(`Codigo/SKU: ${ctx.sku || 'Sin codigo'}`)
  if (ctx.barcode) parts.push(`Codigo de barras: ${ctx.barcode}`)
  parts.push(`Categoria: ${ctx.categories?.join(', ') || 'Sin categoria'}`)
  parts.push(`Marca: ${ctx.brand || 'Sin marca'}`)
  if (ctx.price) parts.push(`Precio: S/ ${ctx.price.toFixed(2)}`)
  if (ctx.comparePrice && ctx.comparePrice > ctx.price) {
    parts.push(`Precio anterior: S/ ${ctx.comparePrice.toFixed(2)} (descuento ${Math.round((1 - ctx.price / ctx.comparePrice) * 100)}%)`)
  }
  if (ctx.descriptionShort) parts.push(`Descripcion corta: ${ctx.descriptionShort}`)
  if (ctx.weight) parts.push(`Peso: ${ctx.weight} ${ctx.weightUnit}`)
  if (ctx.height && ctx.width && ctx.length) {
    parts.push(`Dimensiones: ${ctx.height} x ${ctx.width} x ${ctx.length} ${ctx.dimensionsUnit}`)
  }
  if (ctx.hasVariants) parts.push(`Este producto tiene variantes (tallas, colores, etc.)`)

  return parts.join('\n') + '\n\n'
})

// Skip image-url in dev mode to avoid CloudFront CORS errors from localhost
const aiImageUrl = computed(() => {
  if (import.meta.env.DEV) return ''
  return props.productContext?.imageUrl || ''
})

const aiInitialPrompt = computed(() => {
  const ctx = props.productContext
  if (!ctx?.name) return ''
  const hasContent = !!props.content?.trim()
  if (hasContent) {
    return `Mejora la descripción de "${ctx.name}"`
  }
  return `Genera una descripción atractiva para "${ctx.name}"`
})

const openAiEnhancer = () => {
  ;(aiEnhancerRef.value as any)?.openModal?.()
}

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
