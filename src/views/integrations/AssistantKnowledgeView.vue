<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputSwitch from 'primevue/inputswitch'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { AppButton, AppEmptyState, AppErrorState } from '@/components/ui'
import {
  assistantKnowledgeApi,
  type KnowledgeArticleSummary,
  type KnowledgeIndexing,
  type KnowledgeLimits,
} from '@/api/assistant-knowledge.api'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const articles = ref<KnowledgeArticleSummary[]>([])
const limits = ref<KnowledgeLimits>({ titulo: 160, contenido: 20000 })
const loading = ref(true)
const error = ref(false)

const editorVisible = ref(false)
const editorLoading = ref(false)
const saving = ref(false)
const preview = ref(false)
const editingId = ref<number | null>(null)
const form = ref({ titulo: '', contenido: '', publicado: true })
const fieldErrors = ref<{ titulo?: string; contenido?: string }>({})
/** Cuál se está cambiando desde el listado, para no dejar tocar dos veces. */
const togglingId = ref<number | null>(null)

const contenidoLargo = computed(() => form.value.contenido.length)
const sobraContenido = computed(() => contenidoLargo.value > limits.value.contenido)
const puedeGuardar = computed(
  () => form.value.titulo.trim() !== '' && form.value.contenido.trim() !== '' && !sobraContenido.value
)

/** El comerciante escribe markdown; se sanea antes de pintarlo. */
const previewHtml = computed(() =>
  DOMPurify.sanitize(String(marked.parse(form.value.contenido || '', { async: false, gfm: true, breaks: true })))
)

async function load() {
  loading.value = true
  error.value = false
  try {
    const res = await assistantKnowledgeApi.list()
    articles.value = res.articles
    limits.value = res.limits
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function nuevo() {
  editingId.value = null
  form.value = { titulo: '', contenido: '', publicado: true }
  fieldErrors.value = {}
  preview.value = false
  editorVisible.value = true
}

async function editar(id: number) {
  editingId.value = id
  fieldErrors.value = {}
  preview.value = false
  editorVisible.value = true
  editorLoading.value = true
  try {
    const a = await assistantKnowledgeApi.get(id)
    form.value = { titulo: a.titulo, contenido: a.contenido, publicado: a.publicado }
  } catch {
    editorVisible.value = false
    toast.add({ severity: 'error', summary: 'No se pudo abrir el artículo', life: 4000 })
  } finally {
    editorLoading.value = false
  }
}

/**
 * Guardar y que el asistente lo sepa son dos cosas, y la segunda puede demorar.
 * Se dice cuál de las tres pasó para que nadie pruebe el chat, no vea su texto y
 * crea que no se guardó.
 */
function avisarGuardado(indexing: KnowledgeIndexing, publicado: boolean) {
  if (!publicado) {
    toast.add({
      severity: 'success',
      summary: 'Guardado como borrador',
      detail: 'Tu asistente no lo usa mientras no esté publicado.',
      life: 4000,
    })
  } else if (indexing === 'indexado') {
    toast.add({ severity: 'success', summary: 'Guardado', detail: 'Tu asistente ya lo sabe.', life: 3000 })
  } else if (indexing === 'inactivo') {
    toast.add({
      severity: 'info',
      summary: 'Guardado',
      detail: 'Tu asistente lo va a usar cuando lo actives.',
      life: 5000,
    })
  } else {
    toast.add({
      severity: 'warn',
      summary: 'Guardado',
      detail: 'Tu asistente lo va a tener en las próximas horas.',
      life: 6000,
    })
  }
}

async function guardar() {
  if (!puedeGuardar.value || saving.value) return
  saving.value = true
  fieldErrors.value = {}

  try {
    const input = { ...form.value, titulo: form.value.titulo.trim() }
    const res =
      editingId.value === null
        ? await assistantKnowledgeApi.create(input)
        : await assistantKnowledgeApi.update(editingId.value, input)

    editorVisible.value = false
    avisarGuardado(res.indexing, res.article.publicado)
    await load()
  } catch (e: any) {
    const messages = e?.response?.data?.messages
    if (messages && typeof messages === 'object' && (messages.titulo || messages.contenido)) {
      fieldErrors.value = { titulo: messages.titulo, contenido: messages.contenido }
      preview.value = false
    } else {
      toast.add({
        severity: 'error',
        summary: 'No se pudo guardar',
        detail: 'Tu texto sigue aquí. Vuelve a intentarlo.',
        life: 5000,
      })
    }
  } finally {
    saving.value = false
  }
}

async function cambiarPublicado(a: KnowledgeArticleSummary, publicado: boolean) {
  if (togglingId.value !== null) return
  togglingId.value = a.id
  try {
    const res = await assistantKnowledgeApi.update(a.id, { publicado })
    a.publicado = res.article.publicado
    avisarGuardado(res.indexing, res.article.publicado)
  } catch {
    toast.add({ severity: 'error', summary: 'No se pudo cambiar', life: 4000 })
  } finally {
    togglingId.value = null
  }
}

function eliminar(a: KnowledgeArticleSummary) {
  confirm.require({
    message: `«${a.titulo}» se borra y tu asistente deja de usarlo. No se puede deshacer.`,
    header: 'Eliminar artículo',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await assistantKnowledgeApi.remove(a.id)
        await load()
      } catch {
        toast.add({ severity: 'error', summary: 'No se pudo eliminar', life: 4000 })
      }
    },
  })
}

function formatear(fecha: string | null): string {
  if (!fecha) return ''
  const d = new Date(fecha.replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? fecha : d.toLocaleDateString('es-PE')
}

onMounted(load)
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <div class="mb-4">
      <AppButton variant="text" @click="router.push('/integrations/providers/shopping_chat')">
        <i class="pi pi-arrow-left mr-2" />
        Volver al Asistente IA
      </AppButton>
    </div>

    <div class="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Base de conocimiento</h1>
        <p class="text-sm text-gray-500 mt-1 max-w-2xl">
          Lo que escribas aquí, tu asistente lo usa para responder: tallas, cuidados,
          horarios, cómo comprar. Un artículo por tema, escrito como se lo explicarías
          a un cliente.
        </p>
      </div>
      <AppButton v-if="!loading && !error && articles.length > 0" @click="nuevo">
        <i class="pi pi-plus mr-2" />
        Nuevo artículo
      </AppButton>
    </div>

    <AppErrorState v-if="error" message="No se pudieron cargar los artículos." @retry="load" />

    <div v-else-if="loading" class="flex justify-center py-16">
      <i class="pi pi-spinner pi-spin text-3xl text-primary" />
    </div>

    <AppEmptyState
      v-else-if="articles.length === 0"
      icon="pi-book"
      title="Todavía no escribiste ningún artículo"
      description="Empieza por lo que más te preguntan tus clientes. Con un párrafo alcanza."
      action-label="Escribir el primero"
      action-icon="pi-plus"
      @action="nuevo"
    />

    <template v-else>
      <!--
        Lo que cambia día a día no va en un texto: el asistente ya lo lee en vivo
        y, si el artículo dice otra cosa, le cree al dato en vivo. Se avisa acá
        para que nadie escriba una tarifa y después se pregunte por qué no la usa.
      -->
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 flex items-start gap-2">
        <i class="pi pi-info-circle text-gray-500 mt-0.5" />
        <p class="text-sm text-gray-600">
          No hace falta escribir precios, stock ni costos de envío: tu asistente los
          consulta en tu tienda al momento. Si un artículo dice una cifra distinta,
          responde con la de tu tienda.
        </p>
      </div>

      <div class="bg-white rounded-lg shadow divide-y divide-gray-100">
        <div v-for="a in articles" :key="a.id" class="p-4 flex items-center gap-4">
          <button class="flex-1 min-w-0 text-left" @click="editar(a.id)">
            <p class="font-medium text-gray-800 truncate hover:text-primary transition-colors">
              {{ a.titulo }}
            </p>
            <p class="text-xs text-gray-400 mt-0.5">
              {{ a.caracteres.toLocaleString('es-PE') }} caracteres
              <span v-if="a.actualizado_en"> · editado el {{ formatear(a.actualizado_en) }}</span>
            </p>
          </button>

          <label class="flex items-center gap-2 text-xs text-gray-500 whitespace-nowrap">
            <InputSwitch
              :model-value="a.publicado"
              :disabled="togglingId !== null"
              @update:model-value="(v: boolean) => cambiarPublicado(a, v)"
            />
            {{ a.publicado ? 'Publicado' : 'Borrador' }}
          </label>

          <button
            class="text-gray-400 hover:text-primary transition-colors"
            aria-label="Editar artículo"
            @click="editar(a.id)"
          >
            <i class="pi pi-pencil" />
          </button>
          <button
            class="text-gray-400 hover:text-red-600 transition-colors"
            aria-label="Eliminar artículo"
            @click="eliminar(a)"
          >
            <i class="pi pi-trash" />
          </button>
        </div>
      </div>
    </template>

    <Dialog
      v-model:visible="editorVisible"
      modal
      :header="editingId === null ? 'Nuevo artículo' : 'Editar artículo'"
      :style="{ width: '48rem' }"
      :breakpoints="{ '768px': '95vw' }"
      :close-on-escape="false"
    >
      <div v-if="editorLoading" class="flex justify-center py-16">
        <i class="pi pi-spinner pi-spin text-3xl text-primary" />
      </div>

      <div v-else class="space-y-4">
        <div>
          <label for="kb-titulo" class="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <InputText
            id="kb-titulo"
            v-model="form.titulo"
            :maxlength="limits.titulo"
            placeholder="Por ejemplo: Guía de tallas de polos"
            class="w-full"
            :class="{ 'p-invalid': fieldErrors.titulo }"
          />
          <p v-if="fieldErrors.titulo" class="text-xs text-red-600 mt-1">{{ fieldErrors.titulo }}</p>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <label for="kb-contenido" class="block text-sm font-medium text-gray-700">Contenido</label>
            <div class="flex gap-1 text-xs">
              <button
                class="px-2 py-1 rounded transition-colors"
                :class="!preview ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:text-gray-700'"
                @click="preview = false"
              >
                Escribir
              </button>
              <button
                class="px-2 py-1 rounded transition-colors"
                :class="preview ? 'bg-primary/10 text-primary' : 'text-gray-500 hover:text-gray-700'"
                @click="preview = true"
              >
                Vista previa
              </button>
            </div>
          </div>

          <Textarea
            v-if="!preview"
            id="kb-contenido"
            v-model="form.contenido"
            rows="14"
            class="w-full font-mono text-sm"
            :class="{ 'p-invalid': fieldErrors.contenido || sobraContenido }"
            placeholder="## Polos&#10;Las tallas van de S a XL. Si estás entre dos, elige la más grande.&#10;&#10;| Talla | Pecho |&#10;|---|---|&#10;| S | 90 cm |&#10;| M | 96 cm |"
          />
          <div
            v-else
            class="prose prose-sm max-w-none border border-gray-200 rounded-md p-4 min-h-[21rem] overflow-x-auto"
            v-html="previewHtml"
          />

          <div class="flex items-start justify-between gap-4 mt-1">
            <p v-if="fieldErrors.contenido" class="text-xs text-red-600">{{ fieldErrors.contenido }}</p>
            <p v-else class="text-xs text-gray-400">
              Puedes usar markdown: <code>## Subtítulo</code>, <code>- lista</code>,
              <code>**negrita**</code> y tablas. Los subtítulos ayudan a tu asistente a
              encontrar la parte que responde cada pregunta.
            </p>
            <span
              class="text-xs whitespace-nowrap"
              :class="sobraContenido ? 'text-red-600 font-medium' : 'text-gray-400'"
            >
              {{ contenidoLargo.toLocaleString('es-PE') }} / {{ limits.contenido.toLocaleString('es-PE') }}
            </span>
          </div>
        </div>

        <label class="flex items-center gap-3 text-sm text-gray-700">
          <InputSwitch v-model="form.publicado" />
          <span>
            Publicado
            <span class="block text-xs text-gray-400">
              Si lo apagas queda como borrador y tu asistente no lo usa.
            </span>
          </span>
        </label>
      </div>

      <template #footer>
        <AppButton variant="secondary" :disabled="saving" @click="editorVisible = false">
          Cancelar
        </AppButton>
        <AppButton :loading="saving" :disabled="!puedeGuardar || editorLoading" @click="guardar">
          Guardar
        </AppButton>
      </template>
    </Dialog>
  </div>
</template>
