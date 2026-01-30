<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-secondary">Páginas Legales</h1>
      <p class="text-sm text-secondary-500 mt-1">
        Contenido legal e informativo de tu tienda: términos, políticas y condiciones.
      </p>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="store.error" severity="error" :closable="false">
      {{ store.error }}
    </Message>

    <!-- Pages List -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="page in store.pages"
        :key="page.slug"
        class="bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <h3 class="text-base font-semibold text-secondary-800">
              {{ page.title }}
            </h3>
            <div class="flex items-center gap-2 mt-1.5">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="page.hasContent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
              >
                <i :class="page.hasContent ? 'pi pi-check-circle' : 'pi pi-circle'" class="mr-1 text-[10px]"></i>
                {{ page.hasContent ? 'Con contenido' : 'Sin contenido' }}
              </span>
            </div>
            <p v-if="page.contentPreview" class="text-sm text-secondary-500 mt-2 line-clamp-2">
              {{ page.contentPreview }}
            </p>
            <p v-else class="text-sm text-secondary-400 mt-2 italic">
              Esta página aún no tiene contenido.
            </p>
          </div>
          <Button
            icon="pi pi-pencil"
            label="Editar"
            size="small"
            outlined
            @click="router.push({ name: 'legal-page-edit', params: { slug: page.slug } })"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLegalPagesStore } from '@/stores/legal-pages.store'
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()
const store = useLegalPagesStore()

onMounted(() => {
  store.fetchPages()
})
</script>
