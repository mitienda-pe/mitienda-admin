<template>
  <div class="h-full flex flex-col">
    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="store.error" severity="error" :closable="false" class="mb-4">
      {{ store.error }}
    </Message>

    <!-- Page Editor -->
    <template v-else-if="store.currentPage">
      <!-- Header -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div class="flex items-center gap-4">
          <Button
            icon="pi pi-arrow-left"
            text
            rounded
            severity="secondary"
            @click="router.push('/legal')"
          />
          <div>
            <h1 class="text-2xl font-bold text-secondary">{{ store.currentPage.title }}</h1>
            <p class="text-sm text-secondary-400 mt-1">Página legal / informativa</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button
            v-if="editorType === 'wysiwyg'"
            label="Generar con IA"
            icon="pi pi-sparkles"
            severity="secondary"
            outlined
            @click="openAiEnhancer"
          />
          <SelectButton
            v-model="editorType"
            :options="editorOptions"
            optionLabel="label"
            optionValue="value"
            :allowEmpty="false"
          />
          <Button
            label="Guardar"
            icon="pi pi-save"
            :loading="isSaving"
            @click="handleSave"
          />
        </div>
      </div>

      <!-- Editor Area -->
      <div class="flex-1 bg-white rounded-lg shadow overflow-hidden" style="min-height: 500px;">
        <PageContentEditor
          v-model="content"
          :editor-type="editorType"
        />
      </div>

      <!-- AI Text Enhancer (only in wysiwyg mode) -->
      <ai-text-enhancer
        v-if="editorType === 'wysiwyg'"
        ref="aiEnhancerRef"
        :id="buttonId"
        editor-type="quill"
        language="es"
        tenant-id="ten-67d88d1d-111ae225"
        :user-id="userId"
        :proxy-endpoint="proxyEndpoint"
        :prompt="aiPrompt"
        :context="aiContext"
        :initial-prompt="aiInitialPrompt"
        hide-trigger
        auto-send
      ></ai-text-enhancer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLegalPagesStore } from '@/stores/legal-pages.store'
import { useStoreInfoStore } from '@/stores/store-info.store'
import { useAuthStore } from '@/stores/auth.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import PageContentEditor from '@/components/pages/PageContentEditor.vue'
import type { PageEditorType } from '@/types/page.types'
import { getLegalButtonId } from '@/config/ai-buttons.config'
import 'ai-text-enhancer'

const route = useRoute()
const router = useRouter()
const store = useLegalPagesStore()
const storeInfoStore = useStoreInfoStore()
const authStore = useAuthStore()
const toast = useToast()

const content = ref('')
const isSaving = ref(false)
const editorType = ref<PageEditorType>('wysiwyg')
const aiEnhancerRef = ref<HTMLElement | null>(null)

const editorOptions = [
  { label: 'Visual', value: 'wysiwyg' },
  { label: 'Código', value: 'code' },
]

// ── AI Text Enhancer config ──

const currentSlug = computed(() => route.params.slug as string)

const proxyEndpoint = computed(() =>
  import.meta.env.DEV
    ? '/llm-proxy'
    : 'https://llmproxy.mitienda.host/index.php/api/llm-proxy'
)

const buttonId = computed(() => getLegalButtonId(currentSlug.value))

const userId = computed(() => String(authStore.selectedStore?.id || ''))

// Business context for the AI
const aiContext = computed(() => {
  const info = storeInfoStore.info
  if (!info) return ''
  const parts: string[] = []
  if (info.tienda_razonsocial) parts.push(`Razón Social: ${info.tienda_razonsocial}`)
  if (info.tienda_ruc) parts.push(`RUC: ${info.tienda_ruc}`)
  if (info.tienda_nombre_comercial) parts.push(`Nombre Comercial: ${info.tienda_nombre_comercial}`)
  if (info.tienda_email) parts.push(`Email: ${info.tienda_email}`)
  if (info.tienda_telefonofijo1) parts.push(`Teléfono: ${info.tienda_telefonofijo1}`)
  if (info.tienda_telefonocelular1) parts.push(`Celular: ${info.tienda_telefonocelular1}`)
  if (info.tienda_whatsapp) parts.push(`WhatsApp: ${info.tienda_whatsapp}`)
  if (info.rubro_nombre) parts.push(`Rubro: ${info.rubro_nombre}`)
  const addr = storeInfoStore.addresses?.[0]
  if (addr?.tiendadireccion_direccion) {
    const dir = [
      addr.tiendadireccion_direccion,
      addr.tiendadireccion_dist,
      addr.tiendadireccion_prov,
      addr.tiendadireccion_dpto
    ].filter(Boolean).join(', ')
    parts.push(`Dirección: ${dir}`)
  }
  return parts.join('\n')
})

// System prompts per legal page type
const LEGAL_PROMPTS: Record<string, string> = {
  terminos: `Genera los Términos y Condiciones para una tienda en línea en Perú.
Incluye: aceptación de términos, registro de usuarios, proceso de compra, precios e impuestos (IGV),
métodos de pago, plazos de entrega, responsabilidades del comprador, propiedad intelectual,
limitación de responsabilidad, modificaciones a los términos, ley aplicable y jurisdicción (Perú).
Usa el nombre y datos del comercio proporcionados en el contexto.`,

  privacidad: `Genera una Política de Privacidad para una tienda en línea en Perú,
conforme a la Ley N° 29733 (Ley de Protección de Datos Personales).
Incluye: datos recopilados, finalidad del tratamiento, base legal, derechos ARCO,
uso de cookies, terceros con acceso a datos, medidas de seguridad,
retención de datos, contacto del responsable.
Usa el nombre, RUC y datos del comercio del contexto.`,

  devoluciones: `Genera una Política de Calidad, Garantía y Devoluciones para una tienda en línea en Perú,
conforme al Código de Protección del Consumidor (Ley N° 29571).
Incluye: garantía legal, condiciones de devolución, plazos, proceso de reclamo,
reembolsos, cambios, productos excluidos, canal de atención al cliente.
Usa los datos del comercio del contexto.`,

  cookies: `Genera una Política de Cookies para una tienda en línea en Perú.
Incluye: qué son las cookies, tipos utilizados (esenciales, analíticas, marketing),
finalidad de cada tipo, cómo gestionar/desactivar cookies,
cookies de terceros (Google Analytics, redes sociales, pasarelas de pago).
Mantén un tono claro y accesible.`,

  pagos: `Genera la página de Formas de Pago para una tienda en línea en Perú.
Incluye: métodos disponibles (tarjetas de crédito/débito, transferencia bancaria,
billeteras digitales como Yape/Plin, contra entrega si aplica),
seguridad en pagos, moneda (Soles PEN), comprobantes electrónicos,
protección al comprador. Usa los datos del comercio del contexto.`,

  envios: `Genera las Condiciones y Plazos de Entrega para una tienda en línea en Perú.
Incluye: zonas de cobertura (Lima y provincias), plazos estimados,
costos de envío, empresas de courier, seguimiento de pedidos,
envío gratuito si aplica, restricciones, entrega fallida.
Usa la dirección y datos del comercio del contexto.`,

  promociones: `Genera las Condiciones de Promociones y Cupones para una tienda en línea en Perú.
Incluye: condiciones generales de promociones, uso de cupones de descuento,
vigencia, restricciones, acumulación, productos excluidos,
promociones por fechas especiales, derecho a modificar/cancelar promociones.`
}

const aiPrompt = computed(() => {
  const base = `Actúa como un abogado experto en comercio electrónico y protección al consumidor en Perú.\n\n`
  const specific = LEGAL_PROMPTS[currentSlug.value] || 'Genera el contenido legal para esta página.'
  return base + specific + `\n\nImportante:
- NO incluyas el título principal de la página, ya es parte de la plantilla
- Genera contenido en formato Markdown con títulos (##, ###), párrafos, listas y negritas
- NO uses HTML, solo Markdown
- Usa español formal pero accesible
- Adapta al contexto del comercio proporcionado
- Solo responde con el contenido, sin comentarios adicionales`
})

const aiInitialPrompt = computed(() => {
  const title = store.currentPage?.title || 'esta página legal'
  const hasContent = !!content.value?.trim()
  if (hasContent) {
    return `Mejora el contenido de "${title}"`
  }
  return `Genera el contenido de "${title}"`
})

const openAiEnhancer = () => {
  ;(aiEnhancerRef.value as any)?.openModal?.()
}

// ── Page logic ──

// When currentPage loads, populate content
watch(() => store.currentPage, (page) => {
  if (page) {
    content.value = page.content || ''
  }
}, { immediate: true })

const handleSave = async () => {
  const slug = route.params.slug as string
  try {
    isSaving.value = true
    await store.updatePage(slug, content.value)
    toast.add({
      severity: 'success',
      summary: 'Guardado',
      detail: 'Contenido guardado exitosamente',
      life: 3000,
    })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.messages?.error || 'Error al guardar',
      life: 5000,
    })
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  const slug = route.params.slug as string
  store.fetchPage(slug)
  storeInfoStore.fetchInfo()
  storeInfoStore.fetchAddresses()
})
</script>
