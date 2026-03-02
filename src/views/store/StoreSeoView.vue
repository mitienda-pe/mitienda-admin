<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useSeoStore } from '@/stores/seo.store'
import { IMAGE_VALIDATION_RULES } from '@/config/image-validation.config'
import { AppButton } from '@/components/ui'
import BrandingUploader from '@/components/appearance/BrandingUploader.vue'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'

const store = useSeoStore()
const toast = useToast()

const ogImageRules = IMAGE_VALIDATION_RULES.ogImage

// Character counters
const titleLength = computed(() => (store.draftSettings.tienda_metadata_titulo || '').length)
const descriptionLength = computed(() => (store.draftSettings.tienda_slogan || '').length)

async function save() {
  const ok = await store.saveSettings()
  if (ok) {
    toast.add({ severity: 'success', summary: 'Configuración guardada', life: 3000 })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.error || 'No se pudo guardar',
      life: 5000
    })
  }
}

async function handleOgImageUpload(file: File) {
  const ok = await store.uploadOgImage(file)
  if (ok) {
    toast.add({ severity: 'success', summary: 'Imagen actualizada', life: 3000 })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: store.error || 'No se pudo subir la imagen',
      life: 5000
    })
  }
}

async function handleOgImageDelete() {
  const ok = await store.deleteOgImage()
  if (ok) {
    toast.add({ severity: 'info', summary: 'Imagen eliminada', life: 3000 })
  }
}

onMounted(() => {
  store.fetchSettings()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">SEO</h1>
        <p class="text-sm text-secondary-500 mt-1">
          Optimiza tu tienda para buscadores y redes sociales
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <div
      v-else-if="store.error && !store.draftSettings.store_url"
      class="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
    >
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2" />
      <p class="text-red-600">{{ store.error }}</p>
      <AppButton variant="outlined" class="mt-4" @click="store.fetchSettings()">
        Reintentar
      </AppButton>
    </div>

    <!-- Content -->
    <div v-else class="space-y-6">
      <!-- Card 1: SEO - Title & Description -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-search-plus text-primary" />
          Título y Descripción
        </h2>

        <div class="space-y-5">
          <!-- Title -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">
              Título de la página principal
            </label>
            <p class="text-xs text-gray-400 mb-2">
              El título que aparece en la pestaña del navegador y en los resultados de Google. Se
              recomienda un máximo de 60 caracteres para que se muestre completo en los resultados de
              búsqueda.
            </p>
            <input
              type="text"
              :value="store.draftSettings.tienda_metadata_titulo || ''"
              maxlength="70"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="Ej: Mi Tienda - Los mejores productos en línea"
              @input="
                store.updateField(
                  'tienda_metadata_titulo',
                  ($event.target as HTMLInputElement).value || null
                )
              "
            />
            <p
              class="text-xs mt-1 text-right"
              :class="titleLength > 60 ? 'text-amber-500' : 'text-gray-400'"
            >
              {{ titleLength }}/60 caracteres
              <span v-if="titleLength > 60">(puede cortarse en los resultados)</span>
            </p>
          </div>

          <hr class="border-gray-100" />

          <!-- Meta Description -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">
              Meta descripción
            </label>
            <p class="text-xs text-gray-400 mb-2">
              La descripción que aparece debajo del título en los resultados de Google. Se recomienda
              un máximo de 160 caracteres. Incluye palabras clave relevantes para atraer clics.
            </p>
            <textarea
              :value="store.draftSettings.tienda_slogan || ''"
              maxlength="250"
              rows="3"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
              placeholder="Ej: Encuentra los mejores productos con envío a todo el Perú. Compra online de forma segura y recibe tu pedido en casa."
              @input="
                store.updateField(
                  'tienda_slogan',
                  ($event.target as HTMLTextAreaElement).value || null
                )
              "
            />
            <p
              class="text-xs mt-1 text-right"
              :class="descriptionLength > 160 ? 'text-amber-500' : 'text-gray-400'"
            >
              {{ descriptionLength }}/160 caracteres
              <span v-if="descriptionLength > 160">(puede cortarse en los resultados)</span>
            </p>
          </div>
        </div>
      </div>

      <!-- Card 2: OpenGraph Image -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-image text-primary" />
          Imagen para redes sociales (Open Graph)
        </h2>
        <p class="text-xs text-gray-400 mb-4">
          Esta imagen se muestra cuando alguien comparte el enlace de tu tienda en Facebook,
          Twitter, WhatsApp u otras redes sociales. El tamaño recomendado es
          <strong>1200 x 630 píxeles</strong>.
        </p>

        <BrandingUploader
          :current-url="store.draftSettings.tienda_meta_img_url"
          :is-uploading="store.isUploadingOgImage"
          :rules="ogImageRules"
          label="Imagen Open Graph"
          hint="JPG, PNG o WebP. Mínimo 1200x630px. Máximo 5 MB."
          @upload="handleOgImageUpload"
          @delete="handleOgImageDelete"
        />

        <!-- Social preview -->
        <div v-if="store.draftSettings.tienda_meta_img_url" class="mt-5">
          <p class="text-xs font-medium text-secondary-700 mb-2">
            Vista previa en redes sociales:
          </p>
          <div class="border border-gray-200 rounded-lg overflow-hidden max-w-md">
            <img
              :src="store.draftSettings.tienda_meta_img_url"
              alt="Vista previa Open Graph"
              class="w-full aspect-[1200/630] object-cover"
            />
            <div class="p-3 bg-gray-50">
              <p class="text-xs text-gray-400 uppercase truncate">
                {{ store.draftSettings.store_url?.replace('https://', '') }}
              </p>
              <p class="text-sm font-medium text-secondary truncate">
                {{ store.draftSettings.tienda_metadata_titulo || 'Título de tu tienda' }}
              </p>
              <p class="text-xs text-gray-500 line-clamp-2">
                {{ store.draftSettings.tienda_slogan || 'Descripción de tu tienda...' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 3: Previews -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-eye text-primary" />
          Vista previa en Google
        </h2>
        <p class="text-xs text-gray-400 mb-4">
          Así se vería tu tienda en los resultados de búsqueda de Google:
        </p>

        <!-- Google SERP preview -->
        <div class="max-w-xl bg-white border border-gray-100 rounded-lg p-4">
          <p class="text-xl text-blue-700 hover:underline cursor-default leading-tight">
            {{
              store.draftSettings.tienda_metadata_titulo || 'Título de tu tienda - Agrega uno arriba'
            }}
          </p>
          <p class="text-sm text-green-700 mt-0.5">
            {{ store.draftSettings.store_url }}
          </p>
          <p class="text-sm text-gray-600 mt-1 line-clamp-2">
            {{
              store.draftSettings.tienda_slogan ||
              'Agrega una meta descripción para mostrar información sobre tu tienda en los resultados de Google.'
            }}
          </p>
        </div>

        <!-- Auto-generated OG tags info -->
        <div class="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4">
          <h3 class="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1.5">
            <i class="pi pi-info-circle" />
            Tags Open Graph generados automáticamente
          </h3>
          <p class="text-xs text-blue-600 mb-3">
            Además de los campos que configuras arriba, se generan automáticamente estos tags para
            mejorar cómo se muestra tu tienda al compartirla:
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div class="text-xs">
              <span class="font-mono text-blue-700">og:site_name</span>
              <span class="text-blue-500 ml-1">Nombre de tu tienda</span>
            </div>
            <div class="text-xs">
              <span class="font-mono text-blue-700">og:url</span>
              <span class="text-blue-500 ml-1">URL canónica</span>
            </div>
            <div class="text-xs">
              <span class="font-mono text-blue-700">og:type</span>
              <span class="text-blue-500 ml-1">"website"</span>
            </div>
            <div class="text-xs">
              <span class="font-mono text-blue-700">og:locale</span>
              <span class="text-blue-500 ml-1">"es_PE"</span>
            </div>
            <div class="text-xs">
              <span class="font-mono text-blue-700">twitter:card</span>
              <span class="text-blue-500 ml-1">"summary_large_image"</span>
            </div>
            <div class="text-xs">
              <span class="font-mono text-blue-700">og:image:width</span>
              <span class="text-blue-500 ml-1">1200</span>
            </div>
          </div>
        </div>
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
          Guardar configuración
        </AppButton>
        <span v-if="store.hasChanges" class="text-xs text-amber-600">
          Tienes cambios sin guardar
        </span>
      </div>
    </div>
  </div>
</template>
