<template>
  <div>
    <div v-if="isLoading" class="flex justify-center py-20"><ProgressSpinner /></div>
    <Message v-else-if="loadError" severity="error" :closable="false">{{ loadError }}</Message>

    <template v-else-if="post">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div class="flex items-center gap-4">
          <Button icon="pi pi-arrow-left" text rounded severity="secondary" @click="$router.push({ name: 'blog-posts-list' })" />
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-secondary">Vista Previa</h1>
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" :class="post.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'">
                {{ post.published ? 'Publicada' : 'Borrador' }}
              </span>
            </div>
            <p class="text-sm text-secondary-400 mt-1">{{ post.title }} &mdash; /{{ post.slug }}</p>
          </div>
        </div>
        <Button label="Editar" icon="pi pi-pencil" severity="secondary" outlined @click="$router.push({ name: 'blog-post-edit', params: { id: post.id } })" />
      </div>

      <!-- Preview Frame -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="bg-gray-100 border-b border-gray-200 px-4 py-2 flex items-center gap-3">
          <div class="flex gap-1.5">
            <span class="w-3 h-3 rounded-full bg-red-400"></span>
            <span class="w-3 h-3 rounded-full bg-yellow-400"></span>
            <span class="w-3 h-3 rounded-full bg-green-400"></span>
          </div>
          <div class="flex-1 bg-white rounded px-3 py-1 text-sm text-secondary-500 font-mono">/blog/{{ post.slug }}</div>
        </div>

        <div class="p-8">
          <!-- Post Meta -->
          <div class="mb-6">
            <h1 class="text-3xl font-bold text-secondary mb-3">{{ post.title }}</h1>
            <div class="flex items-center gap-4 text-sm text-secondary-400">
              <span v-if="post.author"><i class="pi pi-user mr-1"></i>{{ post.author }}</span>
              <span><i class="pi pi-calendar mr-1"></i>{{ post.publication_date }}</span>
              <span v-if="post.category_name" class="inline-flex items-center px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-xs font-medium">
                {{ post.category_name }}
              </span>
            </div>
            <p v-if="post.excerpt" class="text-secondary-500 mt-3 italic">{{ post.excerpt }}</p>
          </div>

          <Divider />

          <!-- Content -->
          <div v-if="post.content" class="prose prose-sm sm:prose max-w-none" v-html="sanitize(post.content)"></div>
          <div v-else class="text-center py-12">
            <i class="pi pi-file text-4xl text-secondary-300 mb-3"></i>
            <p class="text-secondary-500">Esta entrada aún no tiene contenido.</p>
            <Button label="Agregar Contenido" icon="pi pi-pencil" class="mt-4" @click="$router.push({ name: 'blog-post-edit', params: { id: post.id } })" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DOMPurify from 'dompurify'
import { useRoute } from 'vue-router'
import { useBlogStore } from '@/stores/blog.store'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import type { BlogPost } from '@/types/blog.types'

const route = useRoute()
const blogStore = useBlogStore()

const sanitize = (html: string) => DOMPurify.sanitize(html)

const post = ref<BlogPost | null>(null)
const isLoading = ref(true)
const loadError = ref<string | null>(null)

onMounted(async () => {
  try {
    const result = await blogStore.fetchPostById(Number(route.params.id))
    if (result) { post.value = result } else { loadError.value = 'Entrada no encontrada' }
  } catch (err: any) {
    loadError.value = err.response?.data?.messages?.error || 'Error al cargar la entrada'
  } finally {
    isLoading.value = false
  }
})
</script>
