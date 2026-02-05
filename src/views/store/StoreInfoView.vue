<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Información de la Tienda</h1>
        <p class="text-sm text-secondary-500 mt-1">
          Datos de tu negocio, contacto y redes sociales
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Form -->
    <div v-else>
      <form @submit.prevent="saveInfo" class="space-y-6">

        <!-- Datos del Negocio -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
            <i class="pi pi-building text-primary"></i>
            Datos del Negocio
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Nombre Comercial
              </label>
              <InputText
                v-model="formData.tienda_nombre_comercial"
                class="w-full"
                placeholder="Nombre de tu tienda"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Razón Social
              </label>
              <InputText
                v-model="formData.tienda_razonsocial"
                class="w-full"
                placeholder="Razón social de la empresa"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                RUC
              </label>
              <InputText
                v-model="formData.tienda_ruc"
                class="w-full"
                placeholder="20XXXXXXXXX"
                maxlength="20"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Rubro
              </label>
              <Dropdown
                v-model="formData.rubro_id"
                :options="storeInfoStore.rubros"
                optionLabel="rubro_nombre"
                optionValue="rubro_id"
                placeholder="Selecciona un rubro"
                showClear
                class="w-full"
              />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Descripción
              </label>
              <Textarea
                v-model="formData.tienda_descripcion"
                class="w-full"
                rows="3"
                placeholder="Describe tu negocio brevemente"
              />
            </div>
          </div>
        </div>

        <!-- Contacto -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
            <i class="pi pi-phone text-primary"></i>
            Contacto
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Email
              </label>
              <InputText
                v-model="formData.tienda_email"
                class="w-full"
                type="email"
                placeholder="contacto@tutienda.com"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Teléfono Fijo
              </label>
              <InputText
                v-model="formData.tienda_telefonofijo1"
                class="w-full"
                placeholder="(01) 123-4567"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Celular
              </label>
              <InputText
                v-model="formData.tienda_telefonocelular1"
                class="w-full"
                placeholder="999 999 999"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                WhatsApp
              </label>
              <InputText
                v-model="formData.tienda_whatsapp"
                class="w-full"
                placeholder="51999999999"
              />
              <small class="text-secondary-400">Formato: código de país + número</small>
            </div>
          </div>
        </div>

        <!-- Redes Sociales -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-secondary mb-4 flex items-center gap-2">
            <i class="pi pi-share-alt text-primary"></i>
            Redes Sociales
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Página Web
              </label>
              <div class="p-inputgroup">
                <span class="p-inputgroup-addon"><i class="pi pi-globe"></i></span>
                <InputText
                  v-model="formData.tienda_url_paginaweb"
                  placeholder="https://www.tutienda.com"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Facebook
              </label>
              <div class="p-inputgroup">
                <span class="p-inputgroup-addon"><i class="pi pi-facebook"></i></span>
                <InputText
                  v-model="formData.tienda_url_facebook"
                  placeholder="https://facebook.com/tutienda"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Instagram
              </label>
              <div class="p-inputgroup">
                <span class="p-inputgroup-addon"><i class="pi pi-instagram"></i></span>
                <InputText
                  v-model="formData.tienda_url_instagram"
                  placeholder="https://instagram.com/tutienda"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Twitter / X
              </label>
              <div class="p-inputgroup">
                <span class="p-inputgroup-addon"><i class="pi pi-twitter"></i></span>
                <InputText
                  v-model="formData.tienda_url_twitter"
                  placeholder="https://x.com/tutienda"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                TikTok
              </label>
              <div class="p-inputgroup">
                <span class="p-inputgroup-addon"><i class="pi pi-video"></i></span>
                <InputText
                  v-model="formData.tienda_url_tiktok"
                  placeholder="https://tiktok.com/@tutienda"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                YouTube
              </label>
              <div class="p-inputgroup">
                <span class="p-inputgroup-addon"><i class="pi pi-youtube"></i></span>
                <InputText
                  v-model="formData.tienda_url_youtube"
                  placeholder="https://youtube.com/@tutienda"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Pinterest
              </label>
              <div class="p-inputgroup">
                <span class="p-inputgroup-addon"><i class="pi pi-pinterest"></i></span>
                <InputText
                  v-model="formData.tienda_url_pinterest"
                  placeholder="https://pinterest.com/tutienda"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                LinkedIn
              </label>
              <div class="p-inputgroup">
                <span class="p-inputgroup-addon"><i class="pi pi-linkedin"></i></span>
                <InputText
                  v-model="formData.tienda_url_linkedin"
                  placeholder="https://linkedin.com/company/tutienda"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Botón Guardar -->
        <div class="flex justify-end">
          <Button
            label="Guardar Cambios"
            icon="pi pi-check"
            type="submit"
            :loading="storeInfoStore.isSaving"
          />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useStoreInfoStore } from '@/stores/store-info.store'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import ProgressSpinner from 'primevue/progressspinner'
import type { StoreInfoUpdateRequest } from '@/types/store.types'

const storeInfoStore = useStoreInfoStore()
const toast = useToast()
const isLoading = ref(false)

const formData = ref<StoreInfoUpdateRequest>({
  tienda_nombre_comercial: '',
  tienda_razonsocial: '',
  tienda_ruc: '',
  tienda_descripcion: '',
  rubro_id: null,
  tienda_email: '',
  tienda_telefonofijo1: '',
  tienda_telefonocelular1: '',
  tienda_whatsapp: '',
  tienda_url_paginaweb: '',
  tienda_url_facebook: '',
  tienda_url_instagram: '',
  tienda_url_twitter: '',
  tienda_url_tiktok: '',
  tienda_url_pinterest: '',
  tienda_url_youtube: '',
  tienda_url_linkedin: ''
})

const loadData = async () => {
  try {
    isLoading.value = true
    await Promise.all([
      storeInfoStore.fetchInfo(),
      storeInfoStore.fetchRubros()
    ])

    if (storeInfoStore.info) {
      formData.value = {
        tienda_nombre_comercial: storeInfoStore.info.tienda_nombre_comercial || '',
        tienda_razonsocial: storeInfoStore.info.tienda_razonsocial || '',
        tienda_ruc: storeInfoStore.info.tienda_ruc || '',
        tienda_descripcion: storeInfoStore.info.tienda_descripcion || '',
        rubro_id: storeInfoStore.info.rubro_id || null,
        tienda_email: storeInfoStore.info.tienda_email || '',
        tienda_telefonofijo1: storeInfoStore.info.tienda_telefonofijo1 || '',
        tienda_telefonocelular1: storeInfoStore.info.tienda_telefonocelular1 || '',
        tienda_whatsapp: storeInfoStore.info.tienda_whatsapp || '',
        tienda_url_paginaweb: storeInfoStore.info.tienda_url_paginaweb || '',
        tienda_url_facebook: storeInfoStore.info.tienda_url_facebook || '',
        tienda_url_instagram: storeInfoStore.info.tienda_url_instagram || '',
        tienda_url_twitter: storeInfoStore.info.tienda_url_twitter || '',
        tienda_url_tiktok: storeInfoStore.info.tienda_url_tiktok || '',
        tienda_url_pinterest: storeInfoStore.info.tienda_url_pinterest || '',
        tienda_url_youtube: storeInfoStore.info.tienda_url_youtube || '',
        tienda_url_linkedin: storeInfoStore.info.tienda_url_linkedin || ''
      }
    }
  } finally {
    isLoading.value = false
  }
}

const saveInfo = async () => {
  try {
    await storeInfoStore.saveInfo(formData.value)

    toast.add({
      severity: 'success',
      summary: 'Guardado',
      detail: 'La información ha sido actualizada correctamente',
      life: 3000
    })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.messages
        ? Object.values(error.response.data.messages).join(', ')
        : error.response?.data?.message || 'Error al guardar la información',
      life: 5000
    })
  }
}

onMounted(() => {
  loadData()
})
</script>
