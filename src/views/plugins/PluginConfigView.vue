<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import PluginSlot from '@/components/plugins/PluginSlot.vue'
import { pluginsApi } from '@/api/plugins.api'
import { useToast } from 'primevue/usetoast'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const slug = ref(String(route.params.slug || ''))
const config = ref<Record<string, any> | null>(null)
const configSchema = ref<Record<string, any> | null>(null)
const pluginName = ref<string>('')
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)

async function loadConfig() {
  isLoading.value = true
  error.value = null
  try {
    const [detail, list] = await Promise.all([
      pluginsApi.getConfig(slug.value),
      pluginsApi.list(),
    ])
    config.value = detail.config ?? {}
    configSchema.value = detail.configSchema ?? null
    pluginName.value = list.find((p) => p.slug === slug.value)?.name ?? slug.value
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'No se pudo cargar la configuración'
  } finally {
    isLoading.value = false
  }
}

async function handleUpdate(newConfig: Record<string, any>) {
  isSaving.value = true
  try {
    const updated = await pluginsApi.updateConfig(slug.value, newConfig)
    config.value = updated.config ?? {}
    toast.add({ severity: 'success', summary: 'Configuración guardada', life: 3000 })
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'No se pudo guardar',
      detail: e?.response?.data?.message ?? 'Error al actualizar',
      life: 5000,
    })
  } finally {
    isSaving.value = false
  }
}

onMounted(loadConfig)
</script>

<template>
  <section class="p-6">
    <header class="mb-6 flex items-center justify-between">
      <div>
        <button type="button" class="text-sm text-primary hover:underline" @click="router.push({ name: 'PluginList' })">
          ← Plugins
        </button>
        <h1 class="mt-1 text-2xl font-semibold text-gray-900">{{ pluginName }}</h1>
      </div>
      <span v-if="isSaving" class="text-sm text-gray-500">Guardando...</span>
    </header>

    <div v-if="isLoading" class="text-sm text-gray-500">Cargando configuración...</div>

    <AppErrorState v-else-if="error" :message="error" @retry="loadConfig" />

    <PluginSlot
      v-else
      slot-name="backoffice-settings"
      :plugin-slug="slug"
      :config="config"
      :config-schema="configSchema"
      @update="handleUpdate"
    />
  </section>
</template>
