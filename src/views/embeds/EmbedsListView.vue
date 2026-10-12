<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Bloques interactivos</h1>
        <p class="text-sm text-secondary-500 mt-1">
          HTML con JavaScript (un test de producto, una calculadora) que se muestra dentro de tus páginas.
        </p>
      </div>
      <AppButton icon="pi pi-plus" label="Nuevo bloque" @click="$router.push({ name: 'embed-create' })" />
    </div>

    <div v-if="isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <AppErrorState v-else-if="error" :message="error" @retry="load" />

    <AppEmptyState
      v-else-if="embeds.length === 0"
      icon="pi pi-code"
      title="Todavía no hay bloques"
      message="Pega el HTML de tu experiencia interactiva y obtén un código corto para insertarla en cualquier página."
    >
      <AppButton icon="pi pi-plus" label="Crear el primero" @click="$router.push({ name: 'embed-create' })" />
    </AppEmptyState>

    <div v-else class="bg-white rounded-lg shadow overflow-hidden">
      <DataTable :value="embeds" data-key="id" responsive-layout="scroll">
        <Column header="Nombre">
          <template #body="{ data }">
            <p class="font-medium text-secondary">{{ data.name }}</p>
            <p class="text-xs text-secondary-400">{{ formatSize(data.html_bytes) }}</p>
          </template>
        </Column>

        <Column header="Estado" style="width: 9rem">
          <template #body="{ data }">
            <AppBadge :severity="data.status === 1 ? 'success' : 'secondary'">
              {{ data.status === 1 ? 'Publicado' : 'Borrador' }}
            </AppBadge>
          </template>
        </Column>

        <Column header="Código para insertar" style="width: 20rem">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <code class="text-sm bg-gray-100 rounded px-2 py-1">{{ data.shortcode }}</code>
              <Button
                icon="pi pi-copy"
                text
                rounded
                severity="secondary"
                aria-label="Copiar código"
                @click="copyShortcode(data)"
              />
            </div>
          </template>
        </Column>

        <Column style="width: 8rem">
          <template #body="{ data }">
            <div class="flex gap-2 justify-end">
              <Button
                icon="pi pi-pencil"
                text
                rounded
                severity="secondary"
                aria-label="Editar"
                @click="$router.push({ name: 'embed-edit', params: { id: data.id } })"
              />
              <Button
                icon="pi pi-trash"
                text
                rounded
                severity="danger"
                aria-label="Eliminar"
                @click="confirmRemove(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <p v-if="embeds.length" class="text-xs text-secondary-400 mt-3">
      Pega el código en una página, en un bloque de la plantilla o en la descripción de un producto.
      Un bloque en borrador no se muestra en la tienda.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { AppButton, AppBadge, AppEmptyState, AppErrorState } from '@/components/ui'
import { embedApi } from '@/api/embed.api'
import type { StorefrontEmbed } from '@/types/embed.types'

const toast = useToast()
const confirm = useConfirm()

const embeds = ref<StorefrontEmbed[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

const formatSize = (bytes?: number) => `${Math.max(1, Math.round((bytes ?? 0) / 1024))} KB`

const load = async () => {
  isLoading.value = true
  error.value = null
  try {
    const response = await embedApi.getAll()
    embeds.value = response.data ?? []
  } catch {
    error.value = 'No se pudieron cargar los bloques'
  } finally {
    isLoading.value = false
  }
}

const copyShortcode = async (embed: StorefrontEmbed) => {
  try {
    await navigator.clipboard.writeText(embed.shortcode)
    toast.add({ severity: 'success', summary: 'Código copiado', life: 2500 })
  } catch {
    toast.add({ severity: 'warn', summary: 'No se pudo copiar', detail: embed.shortcode, life: 6000 })
  }
}

const confirmRemove = (embed: StorefrontEmbed) => {
  confirm.require({
    header: 'Eliminar bloque',
    // El shortcode queda escrito en las páginas: sin el bloque, ahí no se pinta nada.
    message: `"${embed.name}" dejará de mostrarse en todas las páginas donde esté insertado.`,
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await embedApi.remove(embed.id)
        embeds.value = embeds.value.filter(e => e.id !== embed.id)
        toast.add({ severity: 'success', summary: 'Bloque eliminado', life: 3000 })
      } catch {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar', life: 5000 })
      }
    }
  })
}

onMounted(load)
</script>
