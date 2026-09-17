<template>
  <div>
    <!-- Header -->
    <div class="flex items-center gap-4 mb-6">
      <Button
        icon="pi pi-arrow-left"
        text
        rounded
        severity="secondary"
        @click="$router.push({ name: 'product-lists' })"
      />
      <div class="flex-1">
        <h1 class="text-3xl font-bold text-secondary">
          {{ isEditMode ? 'Editar Lista' : 'Nueva Lista de Productos' }}
        </h1>
        <p class="text-sm text-secondary-500 mt-1">
          {{ isEditMode ? 'Modifica los datos de la lista' : 'Crea una nueva lista de productos' }}
        </p>
      </div>
      <Button
        v-if="isEditMode && publicUrl && savedSlug && savedActive"
        label="Ver en tienda"
        icon="pi pi-external-link"
        severity="secondary"
        outlined
        @click="openInStore"
      />
    </div>

    <!-- Recortador de imagen -->
    <CatalogImageUploader
      v-model:visible="showImageUploader"
      :image-type="activeImageType"
      @upload-success="handleImageUploadSuccess"
    />

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Form -->
    <div v-else class="bg-white rounded-lg shadow p-6">
      <form @submit.prevent="saveList" class="space-y-6">
        <!-- Nombre -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Nombre <span class="text-red-500">*</span>
          </label>
          <InputText
            v-model="formData.productolista_nombre"
            class="w-full"
            :class="{ 'p-invalid': errors.productolista_nombre }"
            placeholder="Ej: Productos destacados, Ofertas del mes"
          />
          <small v-if="errors.productolista_nombre" class="text-red-500">{{ errors.productolista_nombre }}</small>
        </div>

        <!-- URL pública -->
        <div>
          <label for="list-slug" class="block text-sm font-medium text-secondary-700 mb-2">
            URL en la tienda
          </label>
          <div class="flex items-stretch">
            <span
              class="hidden sm:flex items-center px-3 text-sm text-secondary-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-md font-mono truncate max-w-[50%]"
            >
              {{ urlPrefix }}
            </span>
            <InputText
              id="list-slug"
              v-model="formData.productolista_slug"
              class="w-full font-mono text-sm sm:rounded-l-none"
              :class="{ 'p-invalid': errors.productolista_slug }"
              placeholder="ofertas-del-mes"
              @input="slugTouched = true"
              @blur="formData.productolista_slug = slugify(formData.productolista_slug)"
            />
            <Button
              v-if="publicUrl && formData.productolista_slug"
              icon="pi pi-copy"
              severity="secondary"
              outlined
              class="ml-2 shrink-0"
              v-tooltip="'Copiar URL'"
              @click="copyUrl"
            />
          </div>
          <small v-if="errors.productolista_slug" class="text-red-500 block">{{ errors.productolista_slug }}</small>
          <small v-else-if="slugChanged" class="text-yellow-600 block">
            <i class="pi pi-exclamation-triangle mr-1"></i>
            Los enlaces del menú se actualizan solos, pero los que hayas compartido fuera de la tienda dejarán de funcionar.
          </small>
          <small v-else class="text-secondary-500 block">
            Solo letras sin tildes, números y guiones.
            <template v-if="!isActive">La lista está inactiva: la URL no mostrará productos hasta activarla.</template>
          </small>
        </div>

        <!-- Tipo -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Tipo de lista <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              v-for="tipo in listTypes"
              :key="tipo.value"
              class="border-2 rounded-lg p-4 cursor-pointer transition-all"
              :class="formData.productolista_tipo === tipo.value
                ? 'border-primary bg-primary/5'
                : tipo.disabled
                  ? 'border-gray-200 opacity-50 cursor-not-allowed'
                  : 'border-gray-200 hover:border-gray-300'"
              @click="!tipo.disabled && (formData.productolista_tipo = tipo.value)"
            >
              <div class="flex items-center gap-3 mb-2">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center"
                  :class="formData.productolista_tipo === tipo.value ? 'bg-primary text-white' : 'bg-gray-100 text-secondary-500'"
                >
                  <i :class="tipo.icon" class="text-sm"></i>
                </div>
                <h3 class="font-semibold text-secondary text-sm">{{ tipo.label }}</h3>
              </div>
              <p class="text-xs text-secondary-500">{{ tipo.description }}</p>
              <span v-if="tipo.disabled" class="text-xs text-secondary-400 mt-1 block">Próximamente</span>
            </div>
          </div>
          <small v-if="errors.productolista_tipo" class="text-red-500">{{ errors.productolista_tipo }}</small>
        </div>

        <!-- Cantidad de items (solo para listas smart) -->
        <div v-if="formData.productolista_tipo !== 1">
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Cantidad de productos
          </label>
          <InputNumber
            v-model="formData.productolista_cantidaditems"
            :min="1"
            :max="100"
            class="w-full"
            placeholder="10"
          />
          <small class="text-secondary-500">Cantidad de productos a mostrar en la lista</small>
        </div>

        <!-- Estado -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Estado
          </label>
          <div class="flex items-center gap-3">
            <InputSwitch v-model="isActive" />
            <span class="text-secondary-600">
              {{ isActive ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
        </div>

        <!-- Info para listas manuales -->
        <div v-if="formData.productolista_tipo === 1 && !isEditMode" class="bg-primary/5 rounded-lg p-4">
          <div class="flex gap-3">
            <i class="pi pi-info-circle text-primary/80 mt-0.5"></i>
            <div>
              <p class="text-sm text-primary font-medium">Lista manual</p>
              <p class="text-xs text-primary mt-1">
                Después de crear la lista, podrás vincular productos usando el botón de vincular en la lista de listas.
              </p>
            </div>
          </div>
        </div>

        <!-- Descripción -->
        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-2">
            Descripción
          </label>
          <p class="text-xs text-secondary-500 mb-2">
            Se muestra en la cabecera de la lista, antes de los productos. Admite
            los mismos shortcodes que la descripción de un producto.
          </p>
          <QuillEditor
            v-model="formData.productolista_descripcion"
            height="220px"
            toolbar="compact"
          />
        </div>

        <Divider />

        <!-- SEO -->
        <div>
          <h2 class="text-base font-semibold text-secondary mb-1">SEO</h2>
          <p class="text-xs text-secondary-500 mb-3">
            Cómo aparece la lista en Google. Si los dejás vacíos se usa el nombre
            de la lista.
          </p>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Título SEO
              </label>
              <InputText
                v-model="formData.productolista_meta_tittle"
                class="w-full"
                maxlength="300"
                placeholder="Realidad Aumentada | Mi Tienda"
              />
              <small class="text-secondary-500">
                {{ (formData.productolista_meta_tittle?.length || 0) }}/300 caracteres
              </small>
            </div>

            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Descripción SEO
              </label>
              <Textarea
                v-model="formData.productolista_meta_description"
                class="w-full"
                rows="3"
                maxlength="350"
                placeholder="Probá nuestros muebles en tu propia casa desde el celular."
              />
              <small class="text-secondary-500">
                {{ (formData.productolista_meta_description?.length || 0) }}/350 caracteres
              </small>
            </div>
          </div>
        </div>

        <!-- Imágenes: solo al editar, porque la subida necesita el id -->
        <template v-if="isEditMode">
          <Divider />
          <div>
            <h2 class="text-base font-semibold text-secondary mb-1">Imágenes</h2>
            <p class="text-xs text-secondary-500 mb-3">
              Opcionales. La cover encabeza la página de la lista y la OpenGraph
              es la que se ve al compartir el enlace.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div v-for="config in imageConfigs" :key="config.type">
                <p class="text-sm font-medium text-secondary-700 mb-1">{{ config.label }}</p>
                <p class="text-xs text-secondary-400 mb-2">{{ config.dimensions }}</p>

                <div v-if="currentList?.[config.urlField]" class="space-y-2">
                  <img
                    :src="currentList[config.urlField] as string"
                    :class="['w-full rounded object-cover', config.aspectClass]"
                    :alt="config.label"
                  />
                  <div class="flex gap-2">
                    <Button
                      label="Reemplazar"
                      size="small"
                      outlined
                      severity="secondary"
                      @click="openImageUploader(config.type)"
                    />
                    <Button
                      label="Eliminar"
                      size="small"
                      outlined
                      severity="danger"
                      @click="handleDeleteImage(config.type)"
                    />
                  </div>
                </div>

                <Button
                  v-else
                  label="Subir imagen"
                  icon="pi pi-upload"
                  size="small"
                  outlined
                  severity="secondary"
                  @click="openImageUploader(config.type)"
                />
              </div>
            </div>
          </div>
        </template>

        <Divider />

        <!-- Botones -->
        <div class="flex justify-end gap-3 pt-4 border-t">
          <Button
            label="Cancelar"
            text
            severity="secondary"
            @click="$router.push({ name: 'product-lists' })"
          />
          <Button
            :label="isEditMode ? 'Guardar Cambios' : 'Crear Lista'"
            type="submit"
            :loading="isSaving"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProductListStore } from '@/stores/product-list.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import Textarea from 'primevue/textarea'
import Divider from 'primevue/divider'
import ProgressSpinner from 'primevue/progressspinner'
import { QuillEditor } from '@/components/ui'
import CatalogImageUploader from '@/components/catalog/CatalogImageUploader.vue'
import type { CatalogImageType } from '@/components/catalog/CatalogImageUploader.vue'
import { useAuthStore } from '@/stores/auth.store'
import { slugify } from '@/utils/slugify'
import { productListApi } from '@/api/product-list.api'
import type { ProductList, ProductListFormData } from '@/types/product-list.types'

const route = useRoute()
const router = useRouter()
const productListStore = useProductListStore()
const authStore = useAuthStore()
const toast = useToast()

const isLoading = ref(false)
const isSaving = ref(false)
const errors = ref<Record<string, string>>({})

const formData = ref<ProductListFormData>({
  productolista_nombre: '',
  productolista_slug: '',
  productolista_tipo: 1,
  productolista_estado: 1,
  productolista_cantidaditems: null,
  productolista_descripcion: '',
  productolista_meta_tittle: '',
  productolista_meta_description: ''
})

// La lista tal como está guardada: las imágenes se suben de una en una contra
// la API y no pasan por el formulario, así que se leen de acá.
const currentList = ref<ProductList | null>(null)
const showImageUploader = ref(false)
const activeImageType = ref<CatalogImageType>('square')

const imageConfigs: {
  type: CatalogImageType
  label: string
  dimensions: string
  urlField: 'square_r2_url' | 'cover_r2_url' | 'og_r2_url'
  aspectClass: string
}[] = [
  { type: 'square', label: 'Cuadrada (1:1)', dimensions: '400x400 px', urlField: 'square_r2_url', aspectClass: 'aspect-square' },
  { type: 'cover', label: 'Cover (820x360)', dimensions: '820x360 px', urlField: 'cover_r2_url', aspectClass: 'aspect-[820/360]' },
  { type: 'og', label: 'OpenGraph (1200x630)', dimensions: '1200x630 px', urlField: 'og_r2_url', aspectClass: 'aspect-[1200/630]' }
]

const openImageUploader = (type: CatalogImageType) => {
  activeImageType.value = type
  showImageUploader.value = true
}

const handleImageUploadSuccess = async (data: { blob: Blob; fileName: string }) => {
  if (!listId.value) return

  try {
    const file = new File([data.blob], data.fileName, { type: data.blob.type })
    const response = await productListApi.uploadImage(listId.value, file, activeImageType.value)
    currentList.value = response.data ?? null
    toast.add({ severity: 'success', summary: 'Imagen subida', detail: 'La imagen se subió correctamente', life: 3000 })
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.message || 'Error al subir la imagen',
      life: 5000,
    })
  }
}

const handleDeleteImage = async (type: CatalogImageType) => {
  if (!listId.value) return

  try {
    const response = await productListApi.deleteImage(listId.value, type)
    currentList.value = response.data ?? null
    toast.add({ severity: 'success', summary: 'Imagen eliminada', life: 3000 })
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.response?.data?.message || 'Error al eliminar la imagen',
      life: 5000,
    })
  }
}

const isActive = ref(true)

const isEditMode = computed(() => !!route.params.id)
const listId = computed(() => route.params.id ? parseInt(route.params.id as string) : null)

// Slug y estado tal como están guardados: "Ver en tienda" abre lo publicado, no
// lo que se está escribiendo, y el aviso de enlaces rotos compara contra esto.
const savedSlug = ref('')
const savedActive = ref(false)
// Al crear, el slug sigue al nombre hasta que el comerciante lo edita a mano. Al
// editar nunca: renombrar la lista no debe cambiar una URL ya publicada.
const slugTouched = ref(false)

const storeBaseUrl = computed(() => (authStore.selectedStore?.url || '').replace(/\/+$/, ''))
const urlPrefix = computed(() => `${storeBaseUrl.value.replace(/^https?:\/\//, '') || 'tu-tienda'}/lista/`)
const publicUrl = computed(() =>
  storeBaseUrl.value && formData.value.productolista_slug
    ? `${storeBaseUrl.value}/lista/${formData.value.productolista_slug}`
    : ''
)
const slugChanged = computed(() =>
  isEditMode.value && !!savedSlug.value && slugify(formData.value.productolista_slug) !== savedSlug.value
)

watch(() => formData.value.productolista_nombre, (name) => {
  if (!isEditMode.value && !slugTouched.value) {
    formData.value.productolista_slug = slugify(name)
  }
})

const openInStore = () => {
  window.open(`${storeBaseUrl.value}/lista/${savedSlug.value}`, '_blank')
}

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(publicUrl.value)
    toast.add({ severity: 'success', summary: 'Copiado', detail: 'URL copiada al portapapeles', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo copiar la URL', life: 3000 })
  }
}

const listTypes = [
  {
    value: 1,
    label: 'Manual',
    icon: 'pi pi-list',
    description: 'Selecciona manualmente los productos que quieres incluir.',
    disabled: false
  },
  {
    value: 2,
    label: 'Más Vendidos',
    icon: 'pi pi-chart-bar',
    description: 'Se genera automáticamente con los productos más vendidos.',
    disabled: true
  },
  {
    value: 3,
    label: 'Nuevos Productos',
    icon: 'pi pi-star',
    description: 'Se genera automáticamente con los productos más recientes.',
    disabled: true
  }
]

// Sync isActive with formData
watch(isActive, (value) => {
  formData.value.productolista_estado = value ? 1 : 0
})

const validateForm = (): boolean => {
  errors.value = {}

  if (!formData.value.productolista_nombre || formData.value.productolista_nombre.trim().length < 2) {
    errors.value.productolista_nombre = 'El nombre es requerido (mínimo 2 caracteres)'
  }

  formData.value.productolista_slug = slugify(formData.value.productolista_slug)
  if (!formData.value.productolista_slug) {
    errors.value.productolista_slug = 'La URL es requerida (letras sin tildes, números y guiones)'
  }

  if (!formData.value.productolista_tipo) {
    errors.value.productolista_tipo = 'El tipo de lista es requerido'
  }

  return Object.keys(errors.value).length === 0
}

const saveList = async () => {
  if (!validateForm()) {
    toast.add({
      severity: 'warn',
      summary: 'Validación',
      detail: 'Por favor completa los campos requeridos',
      life: 3000
    })
    return
  }

  try {
    isSaving.value = true

    const payload = {
      productolista_nombre: formData.value.productolista_nombre,
      productolista_slug: formData.value.productolista_slug,
      productolista_tipo: formData.value.productolista_tipo,
      productolista_estado: formData.value.productolista_estado,
      productolista_cantidaditems: formData.value.productolista_tipo !== 1
        ? formData.value.productolista_cantidaditems
        : null,
      productolista_descripcion: formData.value.productolista_descripcion || null,
      productolista_meta_tittle: formData.value.productolista_meta_tittle || null,
      productolista_meta_description: formData.value.productolista_meta_description || null
    }

    if (isEditMode.value && listId.value) {
      await productListStore.update(listId.value, payload)

      toast.add({
        severity: 'success',
        summary: 'Guardado',
        detail: 'La lista ha sido actualizada correctamente',
        life: 3000
      })
    } else {
      await productListStore.create(payload)

      toast.add({
        severity: 'success',
        summary: 'Creado',
        detail: 'La lista ha sido creada correctamente',
        life: 3000
      })
    }

    router.push({ name: 'product-lists' })
  } catch (error: any) {
    const messages = error.response?.data?.messages || {}
    if (messages.productolista_slug) {
      errors.value.productolista_slug = messages.productolista_slug
    }
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: messages.productolista_slug || messages.productolista_nombre || messages.error || error.response?.data?.message || 'Error al guardar la lista',
      life: 5000
    })
  } finally {
    isSaving.value = false
  }
}

const loadList = async () => {
  if (!listId.value) return

  try {
    isLoading.value = true
    const list = await productListStore.fetchById(listId.value)

    if (list) {
      formData.value = {
        productolista_nombre: list.productolista_nombre,
        // El panel legacy crea listas sin slug (hoy se sirven por código): se
        // propone uno desde el nombre para que guardar no exija escribirlo.
        productolista_slug: list.productolista_slug || slugify(list.productolista_nombre),
        productolista_tipo: list.productolista_tipo,
        productolista_estado: list.productolista_estado,
        productolista_cantidaditems: list.productolista_cantidaditems,
        productolista_descripcion: list.productolista_descripcion || '',
        productolista_meta_tittle: list.productolista_meta_tittle || '',
        productolista_meta_description: list.productolista_meta_description || ''
      }
      currentList.value = list
      isActive.value = list.productolista_estado == 1
      savedSlug.value = list.productolista_slug || ''
      savedActive.value = isActive.value
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo cargar la lista',
      life: 5000
    })
    router.push({ name: 'product-lists' })
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (isEditMode.value) {
    await loadList()
  }
})
</script>
