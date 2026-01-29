<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="loadError" severity="error" :closable="false">
      {{ loadError }}
    </Message>

    <!-- Preview -->
    <template v-else-if="page">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div class="flex items-center gap-4">
          <Button
            icon="pi pi-arrow-left"
            text
            rounded
            severity="secondary"
            @click="$router.push({ name: 'pages-list' })"
          />
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-secondary">Vista Previa</h1>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="page.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'"
              >
                {{ page.published ? 'Publicada' : 'Borrador' }}
              </span>
            </div>
            <p class="text-sm text-secondary-400 mt-1">{{ page.title }} &mdash; /{{ page.slug }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button
            label="Editar"
            icon="pi pi-pencil"
            severity="secondary"
            outlined
            @click="$router.push({ name: 'page-edit', params: { id: page.id } })"
          />
        </div>
      </div>

      <!-- Preview Frame -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <!-- URL Bar -->
        <div class="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center gap-3">
          <div class="flex gap-1.5">
            <span class="w-3 h-3 rounded-full bg-red-400"></span>
            <span class="w-3 h-3 rounded-full bg-yellow-400"></span>
            <span class="w-3 h-3 rounded-full bg-green-400"></span>
          </div>
          <div class="flex-1 bg-white rounded px-3 py-1 text-sm text-secondary-500 font-mono">
            /{{ page.slug }}
          </div>
        </div>

        <!-- Content -->
        <div class="p-8">
          <div
            v-if="page.content"
            class="prose prose-sm sm:prose max-w-none"
            v-html="page.content"
          ></div>
          <div v-else class="text-center py-12">
            <i class="pi pi-file text-4xl text-secondary-300 mb-3"></i>
            <p class="text-secondary-500">Esta página aún no tiene contenido.</p>
            <Button
              label="Agregar Contenido"
              icon="pi pi-pencil"
              class="mt-4"
              @click="$router.push({ name: 'page-edit', params: { id: page.id } })"
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePagesStore } from '@/stores/pages.store'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import type { Page } from '@/types/page.types'

const route = useRoute()
const pagesStore = usePagesStore()

const page = ref<Page | null>(null)
const isLoading = ref(true)
const loadError = ref<string | null>(null)

onMounted(async () => {
  const pageId = Number(route.params.id)

  try {
    const result = await pagesStore.fetchPageById(pageId)

    if (result) {
      page.value = result
    } else {
      loadError.value = 'Página no encontrada'
    }
  } catch (err: any) {
    loadError.value = err.response?.data?.messages?.error || 'Error al cargar la página'
  } finally {
    isLoading.value = false
  }
})
</script>
