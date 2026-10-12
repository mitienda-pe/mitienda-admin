<template>
  <div>
    <div class="flex items-center gap-4 mb-6">
      <Button icon="pi pi-arrow-left" text rounded severity="secondary" @click="goBack" />
      <h1 class="text-3xl font-bold text-secondary">
        {{ isEditMode ? 'Editar bloque interactivo' : 'Nuevo bloque interactivo' }}
      </h1>
    </div>

    <div v-if="isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <form v-else class="bg-white rounded-lg shadow p-6 space-y-6" @submit.prevent="save">
      <div>
        <label class="block text-sm font-medium text-secondary-700 mb-2">
          Nombre <span class="text-red-500">*</span>
        </label>
        <InputText v-model="formData.name" class="w-full" maxlength="120" placeholder="Encuentra tu silla ideal" />
        <small class="text-secondary-500">Uso interno. No se muestra en la tienda.</small>
      </div>

      <div>
        <label class="block text-sm font-medium text-secondary-700 mb-2">
          HTML <span class="text-red-500">*</span>
        </label>
        <Textarea
          v-model="formData.html"
          class="w-full font-mono text-sm"
          rows="16"
          spellcheck="false"
          placeholder="<!doctype html> …"
        />
        <div class="flex justify-between text-xs mt-1">
          <span :class="isTooBig ? 'text-red-600' : 'text-secondary-500'">
            {{ sizeKb }} KB de {{ MAX_KB }} KB
          </span>
        </div>

        <div class="mt-3 rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-secondary-600 space-y-1">
          <p class="font-medium text-secondary-700">Cómo preparar el HTML</p>
          <ul class="list-disc pl-5 space-y-1">
            <li>Todo en un solo archivo: los estilos y el JavaScript van dentro del HTML, no en archivos aparte.</li>
            <li>Las imágenes y fuentes van por URL completa (<code>https://…</code>).</li>
            <li>No puede cargar scripts externos ni enviar datos a otros servidores.</li>
            <li>
              Para llevar al cliente a un producto, usa enlaces que empiecen con <code>/</code>
              (por ejemplo <code>/producto/silla-doro</code>). Los enlaces a otros sitios se abren en una pestaña nueva.
            </li>
            <li>No guarda datos entre visitas (sin cookies ni almacenamiento del navegador).</li>
          </ul>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">Alto inicial (px)</label>
          <InputNumber v-model="formData.min_height" :min="100" :max="2000" :use-grouping="false" class="w-full" />
          <small class="text-secondary-500">
            El espacio que ocupa mientras carga. Después se ajusta solo al contenido.
          </small>
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">Estado</label>
          <div class="flex items-center gap-3">
            <InputSwitch v-model="isPublished" />
            <span class="text-secondary-600">{{ isPublished ? 'Publicado' : 'Borrador' }}</span>
          </div>
          <small class="text-secondary-500">En borrador no sale en la tienda; solo se ve en la vista previa.</small>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t">
        <Button label="Cancelar" text severity="secondary" @click="goBack" />
        <AppButton
          :label="isEditMode ? 'Guardar cambios' : 'Crear bloque'"
          type="submit"
          :loading="isSaving"
          :disabled="!canSave"
        />
      </div>
    </form>

    <div v-if="saved" class="bg-white rounded-lg shadow p-6 mt-6 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-secondary">Vista previa</h2>
          <p class="text-sm text-secondary-500">Muestra la última versión guardada, tal como se verá en la tienda.</p>
        </div>
        <div class="flex items-center gap-2">
          <code class="text-sm bg-gray-100 rounded px-2 py-1">{{ saved.shortcode }}</code>
          <Button icon="pi pi-copy" text rounded severity="secondary" aria-label="Copiar código" @click="copyShortcode" />
        </div>
      </div>

      <!-- Mismo documento y mismo aislamiento que en la tienda. NUNCA sumar
           allow-same-origin: el HTML es código que nadie revisó y esta página
           tiene la sesión del comerciante. -->
      <iframe
        :key="previewUrl"
        ref="previewFrame"
        :src="previewUrl"
        :style="{ height: `${previewHeight}px` }"
        class="w-full border border-gray-200 rounded-lg"
        title="Vista previa del bloque"
        sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        referrerpolicy="no-referrer"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import Textarea from 'primevue/textarea'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { AppButton } from '@/components/ui'
import { embedApi, embedPreviewUrl } from '@/api/embed.api'
import type { StorefrontEmbed, StorefrontEmbedFormData } from '@/types/embed.types'

/** Mismo tope que valida la API (EmbedDocumentService::MAX_HTML_BYTES). */
const MAX_KB = 500

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isEditMode = computed(() => Boolean(route.params.id))
const isLoading = ref(false)
const isSaving = ref(false)
const saved = ref<StorefrontEmbed | null>(null)

const formData = reactive<StorefrontEmbedFormData>({
  name: '',
  html: '',
  status: 0,
  min_height: 400
})

const isPublished = computed({
  get: () => formData.status === 1,
  set: (value: boolean) => {
    formData.status = value ? 1 : 0
  }
})

const sizeKb = computed(() => Math.ceil(new Blob([formData.html]).size / 1024))
const isTooBig = computed(() => sizeKb.value > MAX_KB)
const canSave = computed(() => formData.name.trim() !== '' && formData.html.trim() !== '' && !isTooBig.value)

const previewFrame = ref<HTMLIFrameElement | null>(null)
const previewHeight = ref(400)
const previewUrl = computed(() => (saved.value ? embedPreviewUrl(saved.value) : ''))

const apply = (embed: StorefrontEmbed) => {
  saved.value = embed
  formData.name = embed.name
  formData.html = embed.html ?? formData.html
  formData.status = embed.status
  formData.min_height = embed.min_height
  previewHeight.value = embed.min_height
}

const load = async () => {
  if (!isEditMode.value) return
  isLoading.value = true
  try {
    const response = await embedApi.getById(Number(route.params.id))
    if (response.data) apply(response.data)
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el bloque', life: 5000 })
    goBack()
  } finally {
    isLoading.value = false
  }
}

const save = async () => {
  if (!canSave.value) return
  isSaving.value = true
  try {
    const payload = { ...formData, name: formData.name.trim() }
    if (saved.value) {
      apply(await embedApi.update(saved.value.id, payload))
      toast.add({ severity: 'success', summary: 'Bloque guardado', life: 3000 })
    } else {
      const created = await embedApi.create(payload)
      toast.add({ severity: 'success', summary: 'Bloque creado', life: 3000 })
      router.replace({ name: 'embed-edit', params: { id: created.id } })
      apply(created)
    }
  } catch (err: any) {
    const detail = err?.response?.data?.messages?.error || 'No se pudo guardar el bloque'
    toast.add({ severity: 'error', summary: 'Error', detail, life: 6000 })
  } finally {
    isSaving.value = false
  }
}

const copyShortcode = async () => {
  if (!saved.value) return
  try {
    await navigator.clipboard.writeText(saved.value.shortcode)
    toast.add({ severity: 'success', summary: 'Código copiado', life: 2500 })
  } catch {
    toast.add({ severity: 'warn', summary: 'No se pudo copiar', detail: saved.value.shortcode, life: 6000 })
  }
}

// El documento aislado solo puede avisar su alto por mensaje; lo que identifica
// al remitente es la ventana (su origen llega como 'null').
const onMessage = (event: MessageEvent) => {
  if (!previewFrame.value || event.source !== previewFrame.value.contentWindow) return
  const data = event.data
  if (!data || data.mtEmbed !== 1 || data.type !== 'resize' || typeof data.height !== 'number') return
  if (!Number.isFinite(data.height)) return
  previewHeight.value = Math.min(10000, Math.max(50, Math.ceil(data.height)))
}

const goBack = () => router.push({ name: 'embeds' })

onMounted(() => {
  window.addEventListener('message', onMessage)
  load()
})

onBeforeUnmount(() => window.removeEventListener('message', onMessage))
</script>
