<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <Button icon="pi pi-arrow-left" text @click="router.push('/marketing/announcement-bars')" />
      <div>
        <h1 class="text-2xl font-bold text-secondary-800">
          {{ isEditMode ? 'Editar Barra de Anuncio' : 'Nueva Barra de Anuncio' }}
        </h1>
        <p class="text-secondary-600 mt-1">Configura tu barra de anuncio con vista previa en tiempo real</p>
      </div>
    </div>

    <!-- Layout de dos columnas -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Columna izquierda: Formulario -->
      <Card>
        <template #content>
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Nombre -->
            <div>
              <label for="bar_nombre" class="block text-sm font-medium text-secondary-700 mb-2">
                Nombre interno <span class="text-red-500">*</span>
              </label>
              <InputText
                id="bar_nombre"
                v-model="formData.bar_nombre"
                placeholder="Ej: Promo Verano 2025"
                class="w-full"
                :class="{ 'p-invalid': errors.bar_nombre }"
              />
              <small v-if="errors.bar_nombre" class="text-red-500">{{ errors.bar_nombre }}</small>
            </div>

            <!-- Texto principal -->
            <div>
              <label for="bar_texto" class="block text-sm font-medium text-secondary-700 mb-2">
                Texto del anuncio <span class="text-red-500">*</span>
              </label>
              <Textarea
                id="bar_texto"
                v-model="formData.bar_texto"
                rows="3"
                placeholder="Ej: ¡Envío gratis en compras mayores a S/100! 🚚"
                class="w-full"
                :class="{ 'p-invalid': errors.bar_texto }"
              />
              <small v-if="errors.bar_texto" class="text-red-500">{{ errors.bar_texto }}</small>
            </div>

            <!-- Posición -->
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                Posición <span class="text-red-500">*</span>
              </label>
              <SelectButton v-model="formData.bar_posicion" :options="BAR_POSITIONS" optionLabel="label" optionValue="value" />
            </div>

            <!-- Colores de la barra -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="bar_bg_color" class="block text-sm font-medium text-secondary-700 mb-2">
                  Color de fondo <span class="text-red-500">*</span>
                </label>
                <ColorPicker v-model="formData.bar_bg_color" format="hex" class="w-full" />
                <InputText v-model="formData.bar_bg_color" class="w-full mt-2" placeholder="#000000" />
              </div>
              <div>
                <label for="bar_text_color" class="block text-sm font-medium text-secondary-700 mb-2">
                  Color de texto <span class="text-red-500">*</span>
                </label>
                <ColorPicker v-model="formData.bar_text_color" format="hex" class="w-full" />
                <InputText v-model="formData.bar_text_color" class="w-full mt-2" placeholder="#FFFFFF" />
              </div>
            </div>

            <Divider />

            <!-- Botón opcional -->
            <div class="space-y-4">
              <div class="flex items-center gap-2">
                <Checkbox v-model="hasButton" :binary="true" inputId="hasButton" />
                <label for="hasButton" class="text-sm font-medium text-secondary-700">
                  Agregar botón de acción
                </label>
              </div>

              <div v-if="hasButton" class="space-y-4 pl-6 border-l-2 border-secondary-200">
                <div>
                  <label for="bar_boton_texto" class="block text-sm font-medium text-secondary-700 mb-2">
                    Texto del botón
                  </label>
                  <InputText
                    id="bar_boton_texto"
                    v-model="formData.bar_boton_texto"
                    placeholder="Ej: Ver ofertas"
                    class="w-full"
                  />
                </div>

                <div>
                  <label for="bar_boton_url" class="block text-sm font-medium text-secondary-700 mb-2">
                    URL del botón
                  </label>
                  <InputText
                    id="bar_boton_url"
                    v-model="formData.bar_boton_url"
                    placeholder="https://mitienda.com/ofertas"
                    class="w-full"
                  />
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-secondary-700 mb-2">
                      Color fondo botón
                    </label>
                    <ColorPicker v-model="formData.bar_boton_bg_color" format="hex" class="w-full" />
                    <InputText v-model="formData.bar_boton_bg_color" class="w-full mt-2" placeholder="#FFFFFF" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-secondary-700 mb-2">
                      Color texto botón
                    </label>
                    <ColorPicker v-model="formData.bar_boton_text_color" format="hex" class="w-full" />
                    <InputText v-model="formData.bar_boton_text_color" class="w-full mt-2" placeholder="#000000" />
                  </div>
                </div>
              </div>
            </div>

            <Divider />

            <!-- Configuración adicional -->
            <div class="space-y-4">
              <div class="flex items-center gap-2">
                <Checkbox v-model="formData.bar_closeable" :binary="true" inputId="closeable" />
                <label for="closeable" class="text-sm font-medium text-secondary-700">
                  Permitir cerrar la barra
                </label>
              </div>

              <div class="flex items-center gap-2">
                <Checkbox v-model="formData.activo" :binary="true" inputId="activo" />
                <label for="activo" class="text-sm font-medium text-secondary-700">
                  Barra activa
                </label>
              </div>
            </div>

            <Divider />

            <!-- Programación -->
            <div class="space-y-4">
              <h3 class="text-sm font-semibold text-secondary-700">Programación (opcional)</h3>

              <div>
                <label for="fecha_inicio" class="block text-sm font-medium text-secondary-700 mb-2">
                  Fecha de inicio
                </label>
                <Calendar
                  v-model="formData.fecha_inicio"
                  showTime
                  hourFormat="24"
                  dateFormat="dd/mm/yy"
                  placeholder="Seleccionar fecha"
                  class="w-full"
                />
              </div>

              <div>
                <label for="fecha_fin" class="block text-sm font-medium text-secondary-700 mb-2">
                  Fecha de fin
                </label>
                <Calendar
                  v-model="formData.fecha_fin"
                  showTime
                  hourFormat="24"
                  dateFormat="dd/mm/yy"
                  placeholder="Seleccionar fecha"
                  class="w-full"
                />
              </div>
            </div>

            <!-- Botones de acción -->
            <div class="flex gap-3 pt-4">
              <Button
                type="submit"
                :label="isEditMode ? 'Guardar cambios' : 'Crear barra'"
                icon="pi pi-check"
                :loading="barsStore.loading"
              />
              <Button
                type="button"
                label="Cancelar"
                severity="secondary"
                outlined
                @click="router.push('/marketing/announcement-bars')"
              />
            </div>
          </form>
        </template>
      </Card>

      <!-- Columna derecha: Preview sticky -->
      <div class="lg:sticky lg:top-6 h-fit">
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-eye text-lg"></i>
              <span>Vista previa</span>
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <!-- Preview superior -->
              <div v-if="formData.bar_posicion === 'top'" class="border border-secondary-200 rounded-lg overflow-hidden">
                <div
                  class="flex items-center justify-between px-6 py-3 relative"
                  :style="{
                    backgroundColor: formData.bar_bg_color,
                    color: formData.bar_text_color
                  }"
                >
                  <div class="flex-1 text-center">
                    <span class="text-sm">{{ formData.bar_texto || 'Tu texto aparecerá aquí...' }}</span>
                  </div>
                  <button
                    v-if="formData.bar_boton_texto && hasButton"
                    class="ml-4 px-4 py-2 rounded text-sm font-medium whitespace-nowrap"
                    :style="{
                      backgroundColor: formData.bar_boton_bg_color || '#FFFFFF',
                      color: formData.bar_boton_text_color || '#000000'
                    }"
                  >
                    {{ formData.bar_boton_texto }}
                  </button>
                  <button v-if="formData.bar_closeable" class="ml-4 opacity-60 hover:opacity-100">
                    <i class="pi pi-times"></i>
                  </button>
                </div>
                <div class="bg-secondary-50 h-32 flex items-center justify-center text-secondary-400">
                  Contenido del sitio
                </div>
              </div>

              <!-- Preview inferior -->
              <div v-if="formData.bar_posicion === 'bottom'" class="border border-secondary-200 rounded-lg overflow-hidden">
                <div class="bg-secondary-50 h-32 flex items-center justify-center text-secondary-400">
                  Contenido del sitio
                </div>
                <div
                  class="flex items-center justify-between px-6 py-3 relative"
                  :style="{
                    backgroundColor: formData.bar_bg_color,
                    color: formData.bar_text_color
                  }"
                >
                  <div class="flex-1 text-center">
                    <span class="text-sm">{{ formData.bar_texto || 'Tu texto aparecerá aquí...' }}</span>
                  </div>
                  <button
                    v-if="formData.bar_boton_texto && hasButton"
                    class="ml-4 px-4 py-2 rounded text-sm font-medium whitespace-nowrap"
                    :style="{
                      backgroundColor: formData.bar_boton_bg_color || '#FFFFFF',
                      color: formData.bar_boton_text_color || '#000000'
                    }"
                  >
                    {{ formData.bar_boton_texto }}
                  </button>
                  <button v-if="formData.bar_closeable" class="ml-4 opacity-60 hover:opacity-100">
                    <i class="pi pi-times"></i>
                  </button>
                </div>
              </div>

              <Message severity="info" :closable="false">
                Esta es una vista previa. La barra se mostrará en tu tienda online cuando esté activa.
              </Message>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAnnouncementBarsStore } from '@/stores/announcement-bars.store'
import type { AnnouncementBarFormData } from '@/types/announcement-bar.types'
import { BAR_POSITIONS } from '@/types/announcement-bar.types'

import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import SelectButton from 'primevue/selectbutton'
import ColorPicker from 'primevue/colorpicker'
import Checkbox from 'primevue/checkbox'
import Calendar from 'primevue/calendar'
import Divider from 'primevue/divider'
import Message from 'primevue/message'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const barsStore = useAnnouncementBarsStore()

const barId = computed(() => {
  const id = route.params.id
  return id === 'new' ? null : Number(id)
})

const isEditMode = computed(() => barId.value !== null)

const hasButton = ref(false)

const formData = reactive<AnnouncementBarFormData>({
  bar_nombre: '',
  bar_texto: '',
  bar_posicion: 'top',
  bar_bg_color: '#000000',
  bar_text_color: '#FFFFFF',
  bar_boton_texto: null,
  bar_boton_url: null,
  bar_boton_bg_color: '#FFFFFF',
  bar_boton_text_color: '#000000',
  bar_closeable: true,
  fecha_inicio: null,
  fecha_fin: null,
  activo: true
})

const errors = reactive({
  bar_nombre: '',
  bar_texto: ''
})

onMounted(async () => {
  if (isEditMode.value && barId.value) {
    try {
      const bar = await barsStore.fetchBar(barId.value)
      Object.assign(formData, {
        bar_nombre: bar.bar_nombre,
        bar_texto: bar.bar_texto,
        bar_posicion: bar.bar_posicion,
        bar_bg_color: bar.bar_bg_color,
        bar_text_color: bar.bar_text_color,
        bar_boton_texto: bar.bar_boton_texto,
        bar_boton_url: bar.bar_boton_url,
        bar_boton_bg_color: bar.bar_boton_bg_color || '#FFFFFF',
        bar_boton_text_color: bar.bar_boton_text_color || '#000000',
        bar_closeable: bar.bar_closeable,
        fecha_inicio: bar.fecha_inicio,
        fecha_fin: bar.fecha_fin,
        activo: bar.activo
      })
      hasButton.value = !!bar.bar_boton_texto
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar la barra de anuncio',
        life: 3000
      })
      router.push('/marketing/announcement-bars')
    }
  }
})

function validateForm(): boolean {
  errors.bar_nombre = ''
  errors.bar_texto = ''

  let valid = true

  if (!formData.bar_nombre.trim()) {
    errors.bar_nombre = 'El nombre es requerido'
    valid = false
  }

  if (!formData.bar_texto.trim()) {
    errors.bar_texto = 'El texto del anuncio es requerido'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validateForm()) return

  // Limpiar campos de botón si no está habilitado
  const dataToSubmit = { ...formData }
  if (!hasButton.value) {
    dataToSubmit.bar_boton_texto = null
    dataToSubmit.bar_boton_url = null
    dataToSubmit.bar_boton_bg_color = null
    dataToSubmit.bar_boton_text_color = null
  }

  try {
    if (isEditMode.value && barId.value) {
      await barsStore.updateBar(barId.value, dataToSubmit)
      toast.add({
        severity: 'success',
        summary: 'Actualizada',
        detail: 'Barra de anuncio actualizada exitosamente',
        life: 3000
      })
    } else {
      await barsStore.createBar(dataToSubmit)
      toast.add({
        severity: 'success',
        summary: 'Creada',
        detail: 'Barra de anuncio creada exitosamente',
        life: 3000
      })
    }
    router.push('/marketing/announcement-bars')
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: isEditMode.value
        ? 'No se pudo actualizar la barra de anuncio'
        : 'No se pudo crear la barra de anuncio',
      life: 3000
    })
  }
}
</script>
