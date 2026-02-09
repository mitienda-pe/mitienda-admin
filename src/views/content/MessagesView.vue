<script setup lang="ts">
import { onMounted } from 'vue'
import { useStoreMessagesStore } from '@/stores/store-messages.store'
import { AppButton } from '@/components/ui'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'

const store = useStoreMessagesStore()
const toast = useToast()

const MESSAGE_FIELDS = [
  {
    key: 'tiendageneral_texto_entregadomicilio' as const,
    label: 'Entrega a Domicilio',
    icon: 'pi pi-truck',
    hint: 'Mensaje que aparece en la sección de envío a domicilio del checkout.',
    placeholder: 'Ej: Los envíos se realizan de lunes a viernes...',
    maxLength: undefined
  },
  {
    key: 'tiendageneral_texto_recojoentienda' as const,
    label: 'Recojo en Tienda',
    icon: 'pi pi-map-marker',
    hint: 'Mensaje que aparece en la sección de recojo en tienda del checkout.',
    placeholder: 'Ej: Puedes recoger tu pedido en nuestra tienda...',
    maxLength: undefined
  },
  {
    key: 'tiendageneral_texto_paginaconfirmacion' as const,
    label: 'Página de Confirmación',
    icon: 'pi pi-check-circle',
    hint: 'Mensaje en la página después de confirmar el pedido. Máximo 250 caracteres.',
    placeholder: 'Ej: ¡Gracias por tu compra! Te enviaremos un correo con los detalles...',
    maxLength: 250
  },
  {
    key: 'tiendageneral_texto_desactivado' as const,
    label: 'Tienda Desactivada',
    icon: 'pi pi-ban',
    hint: 'Texto que se muestra a los visitantes cuando la tienda está fuera de servicio.',
    placeholder: 'Ej: Estamos en mantenimiento, volvemos pronto...',
    maxLength: undefined
  }
]

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
        <textarea
          :value="store.draftMessages[field.key] || ''"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          rows="3"
          :placeholder="field.placeholder"
          :maxlength="field.maxLength"
          @input="store.updateField(field.key, ($event.target as HTMLTextAreaElement).value || null)"
        />
        <p
          v-if="field.maxLength"
          class="text-xs text-gray-400 mt-1 text-right"
        >
          {{ (store.draftMessages[field.key] || '').length }} / {{ field.maxLength }}
        </p>
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
