<script setup lang="ts">
import { onMounted } from 'vue'
import { useStoreMessagesStore } from '@/stores/store-messages.store'
import { AppButton } from '@/components/ui'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import Editor from '@tinymce/tinymce-vue'

// TinyMCE core + minimal plugins
import 'tinymce/tinymce'
import 'tinymce/themes/silver'
import 'tinymce/icons/default'
import 'tinymce/models/dom'
import 'tinymce/plugins/autolink'
import 'tinymce/plugins/lists'
import 'tinymce/plugins/link'
import 'tinymce/plugins/image'

const store = useStoreMessagesStore()
const toast = useToast()

const tinyConfig = {
  skin_url: '/tinymce/skins/ui/oxide',
  content_css: '/tinymce/skins/content/default/content.min.css',
  height: 200,
  menubar: false,
  statusbar: false,
  plugins: ['autolink', 'lists', 'link', 'image'],
  toolbar: 'bold italic | bullist numlist | link image | removeformat',
  content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
  language: 'es',
  language_url: '/tinymce/langs/es.js',
  branding: false,
  promotion: false
}

const MESSAGE_FIELDS = [
  {
    key: 'tiendageneral_texto_entregadomicilio' as const,
    label: 'Entrega a Domicilio',
    icon: 'pi pi-truck',
    hint: 'Mensaje que aparece en la sección de envío a domicilio del checkout.'
  },
  {
    key: 'tiendageneral_texto_recojoentienda' as const,
    label: 'Recojo en Tienda',
    icon: 'pi pi-map-marker',
    hint: 'Mensaje que aparece en la sección de recojo en tienda del checkout.'
  },
  {
    key: 'tiendageneral_texto_paginaconfirmacion' as const,
    label: 'Página de Confirmación',
    icon: 'pi pi-check-circle',
    hint: 'Mensaje en la página después de confirmar el pedido.'
  },
  {
    key: 'tiendageneral_texto_desactivado' as const,
    label: 'Tienda Desactivada',
    icon: 'pi pi-ban',
    hint: 'Texto que se muestra a los visitantes cuando la tienda está fuera de servicio.'
  }
]

function onEditorUpdate(key: keyof typeof store.draftMessages, value: string) {
  store.updateField(key, value || null)
}

async function save() {
  const ok = await store.saveMessages()
  if (ok) {
    toast.add({ severity: 'success', summary: 'Mensajes guardados', life: 3000 })
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: store.error, life: 5000 })
  }
}

onMounted(() => {
  store.fetchMessages()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Mensajes</h1>
        <p class="text-sm text-secondary-500 mt-1">
          Textos personalizados que se muestran en distintas secciones de tu tienda
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <div
        v-for="field in MESSAGE_FIELDS"
        :key="field.key"
        class="bg-white rounded-lg shadow p-6"
      >
        <h2 class="text-lg font-semibold text-secondary mb-1 flex items-center gap-2">
          <i :class="field.icon" class="text-primary" />
          {{ field.label }}
        </h2>
        <p class="text-xs text-gray-400 mb-3">{{ field.hint }}</p>
        <Editor
          :modelValue="store.draftMessages[field.key] || ''"
          :init="tinyConfig"
          @update:modelValue="onEditorUpdate(field.key, $event)"
        />
      </div>

      <!-- Save button -->
      <div class="flex items-center gap-3 pb-8">
        <AppButton
          variant="primary"
          :loading="store.isSaving"
          :disabled="!store.hasChanges"
          @click="save"
        >
          <i class="pi pi-check mr-2" />
          Guardar mensajes
        </AppButton>
        <span v-if="store.hasChanges" class="text-xs text-amber-600">
          Tienes cambios sin guardar
        </span>
      </div>
    </div>
  </div>
</template>
