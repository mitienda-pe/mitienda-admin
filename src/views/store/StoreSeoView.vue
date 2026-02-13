<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useSeoStore } from '@/stores/seo.store'
import { IMAGE_VALIDATION_RULES } from '@/config/image-validation.config'
import { AppButton } from '@/components/ui'
import IdPillsInput from '@/components/ui/IdPillsInput.vue'
import BrandingUploader from '@/components/appearance/BrandingUploader.vue'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'

const store = useSeoStore()
const toast = useToast()

const ogImageRules = IMAGE_VALIDATION_RULES.ogImage

const analyticsPattern = /^(G-[A-Z0-9]+|UA-\d+-\d+)$/i
const gtmPattern = /^GTM-[A-Z0-9]+$/i

// Character counters
const titleLength = computed(() => (store.draftSettings.tienda_metadata_titulo || '').length)
const descriptionLength = computed(() => (store.draftSettings.tienda_slogan || '').length)

// Validation: check each comma-separated ID individually
const analyticsError = computed(() => {
  const val = store.draftSettings.tienda_codigo_google_analytics
  if (!val || val.trim() === '') return false
  return val.split(',').some(id => !analyticsPattern.test(id.trim()))
})

const gtmError = computed(() => {
  const val = store.draftSettings.tienda_google_tagmanager
  if (!val || val.trim() === '') return false
  return val.split(',').some(id => !gtmPattern.test(id.trim()))
})

const hasValidationErrors = computed(() => analyticsError.value || gtmError.value)

async function save() {
  if (hasValidationErrors.value) {
    toast.add({
      severity: 'warn',
      summary: 'Revisa los campos',
      detail: 'Hay errores de formato en los campos de Google',
      life: 4000
    })
    return
  }
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

function copyToClipboard(url: string) {
  navigator.clipboard.writeText(url)
  toast.add({ severity: 'info', summary: 'URL copiada al portapapeles', life: 2000 })
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
        <h1 class="text-3xl font-bold text-secondary">Google y SEO</h1>
        <p class="text-sm text-secondary-500 mt-1">
          Configura las herramientas de Google y optimiza tu tienda para buscadores
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
      <!-- Card 1: Google Analytics & Tag Manager -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-chart-bar text-primary" />
          Google Analytics y Tag Manager
        </h2>

        <div class="space-y-5">
          <!-- Google Analytics -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">
              ID de Google Analytics
            </label>
            <p class="text-xs text-gray-400 mb-2">
              Tu ID de medición de Google Analytics 4 (GA4). Lo encuentras en
              <strong>Administrador &gt; Flujos de datos &gt; Tu flujo web</strong>. Si usas
              Universal Analytics, también acepta el formato UA. Puedes agregar varios IDs.
            </p>
            <IdPillsInput
              :model-value="store.draftSettings.tienda_codigo_google_analytics"
              :pattern="analyticsPattern"
              placeholder="G-XXXXXXXXXX"
              format-hint="Formato no válido. Usa G-XXXXXXXXXX o UA-XXXXXXXX-X"
              @update:model-value="store.updateField('tienda_codigo_google_analytics', $event)"
            />
          </div>

          <hr class="border-gray-100" />

          <!-- Google Tag Manager -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">
              ID de Google Tag Manager
            </label>
            <p class="text-xs text-gray-400 mb-2">
              Tu ID de contenedor de GTM. Lo encuentras en
              <strong>tagmanager.google.com</strong> al seleccionar tu contenedor. GTM te permite
              gestionar todos tus tags de seguimiento desde un solo lugar. Puedes agregar varios IDs.
            </p>
            <IdPillsInput
              :model-value="store.draftSettings.tienda_google_tagmanager"
              :pattern="gtmPattern"
              placeholder="GTM-XXXXXXX"
              format-hint="Formato no válido. Usa GTM-XXXXXXX"
              @update:model-value="store.updateField('tienda_google_tagmanager', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Card 2: Google Search Console & Feeds -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-search text-primary" />
          Google Search Console y Feeds
        </h2>

        <div class="space-y-5">
          <!-- Site Verification -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">
              Etiqueta de verificación
            </label>
            <p class="text-xs text-gray-400 mb-2">
              Pega aquí el valor del atributo <code class="bg-gray-100 px-1 rounded">content</code>
              de la meta etiqueta de verificación de Google Search Console. Lo encuentras en
              <strong>Search Console &gt; Verificar propiedad &gt; Método de etiqueta HTML</strong>.
            </p>
            <input
              type="text"
              :value="store.draftSettings.tienda_tag_google_site_verification || ''"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="Ej: 50c0bu9KxMLZhH1IS5iaijX0u4IuORJS2Rbg_WPfBjA"
              @input="
                store.updateField(
                  'tienda_tag_google_site_verification',
                  ($event.target as HTMLInputElement).value || null
                )
              "
            />
          </div>

          <hr class="border-gray-100" />

          <!-- Sitemap URL -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1"> Sitemap </label>
            <p class="text-xs text-gray-400 mb-2">
              URL de tu archivo sitemap.xml. Envíalo a Google Search Console para mejorar la
              indexación de tu tienda.
            </p>
            <div class="flex items-center gap-2">
              <code
                class="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-sm text-gray-600 truncate border border-gray-200"
              >
                {{ store.draftSettings.sitemap_url }}
              </code>
              <button
                class="shrink-0 p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                title="Copiar URL"
                @click="copyToClipboard(store.draftSettings.sitemap_url)"
              >
                <i class="pi pi-copy" />
              </button>
            </div>
          </div>

          <hr class="border-gray-100" />

          <!-- Product Feed URL -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">
              Feed de productos (Google Merchant Center)
            </label>
            <p class="text-xs text-gray-400 mb-2">
              URL del feed de productos para Google Merchant Center. Usa esta URL para sincronizar
              tu catálogo con Google Shopping y mostrar tus productos en los resultados de Google.
            </p>
            <div class="flex items-center gap-2">
              <code
                class="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-sm text-gray-600 truncate border border-gray-200"
              >
                {{ store.draftSettings.product_feed_url }}
              </code>
              <button
                class="shrink-0 p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                title="Copiar URL"
                @click="copyToClipboard(store.draftSettings.product_feed_url)"
              >
                <i class="pi pi-copy" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Card 3: SEO - Title & Description -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
          <i class="pi pi-search-plus text-primary" />
          SEO - Título y Descripción
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

      <!-- Card 4: OpenGraph Image -->
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

      <!-- Card 5: Previews -->
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
          :disabled="!store.hasChanges || hasValidationErrors"
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
