<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import { pluginsApi, type PluginAssignment } from '@/api/plugins.api'

const router = useRouter()
const plugins = ref<PluginAssignment[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)

async function loadPlugins() {
  isLoading.value = true
  error.value = null
  try {
    plugins.value = await pluginsApi.list()
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'No se pudieron cargar los plugins'
  } finally {
    isLoading.value = false
  }
}

function openPlugin(slug: string) {
  router.push({ name: 'PluginConfig', params: { slug } })
}

onMounted(loadPlugins)
</script>

<template>
  <section class="p-6">
    <header class="mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">Plugins</h1>
      <p class="mt-1 text-sm text-gray-500">
        Gestiona los plugins activos de tu tienda. Cada plugin ofrece una experiencia personalizada en tu storefront.
      </p>
    </header>

    <div v-if="isLoading" class="text-sm text-gray-500">Cargando plugins...</div>

    <AppErrorState v-else-if="error" :message="error" @retry="loadPlugins" />

    <AppEmptyState
      v-else-if="plugins.length === 0"
      title="Sin plugins activos"
      description="Todavía no tienes plugins asignados. Contacta a soporte para activarlos."
    />

    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <button
        v-for="p in plugins"
        :key="p.assignment_id"
        type="button"
        class="rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-primary hover:shadow-md"
        @click="openPlugin(p.slug)"
      >
        <h2 class="text-base font-semibold text-gray-900">{{ p.name }}</h2>
        <p v-if="p.description" class="mt-1 text-sm text-gray-500">{{ p.description }}</p>
        <div class="mt-3 flex flex-wrap gap-1">
          <span
            v-for="s in p.slots"
            :key="s"
            class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
          >
            {{ s }}
          </span>
        </div>
      </button>
    </div>
  </section>
</template>
