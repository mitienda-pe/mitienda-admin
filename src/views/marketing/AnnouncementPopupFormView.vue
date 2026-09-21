<template>
  <div class="space-y-4">
    <div class="flex items-center gap-4">
      <Button icon="pi pi-arrow-left" text @click="goBack" />
      <div>
        <h1 class="text-2xl font-bold text-secondary-800">
          {{ isEditMode ? 'Editar popup' : 'Nuevo popup' }}
        </h1>
        <p class="text-secondary-600 mt-1">Una ventana que aparece sobre tu tienda. Nunca se muestra en el checkout.</p>
      </div>
    </div>

    <div v-if="loadingPopup" class="flex justify-center py-12">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <template #content>
          <form class="space-y-5" @submit.prevent="handleSubmit">
            <!-- Contenido -->
            <section class="space-y-4">
              <h3 class="text-sm font-semibold text-secondary-700">Contenido</h3>

              <div>
                <label for="popup_nombre" class="block text-sm font-medium text-secondary-700 mb-2">
                  Nombre interno <span class="text-red-500">*</span>
                </label>
                <InputText
                  id="popup_nombre"
                  v-model="form.popup_nombre"
                  placeholder="Ej: Cyber Wow octubre"
                  class="w-full"
                  :class="{ 'p-invalid': errors.popup_nombre }"
                />
                <small v-if="errors.popup_nombre" class="text-red-500">{{ errors.popup_nombre }}</small>
              </div>

              <div>
                <label class="block text-sm font-medium text-secondary-700 mb-2">Imagen (opcional)</label>
                <div class="flex items-center gap-3">
                  <img
                    v-if="form.popup_imagen_url"
                    :src="form.popup_imagen_url"
                    alt=""
                    class="w-20 h-20 rounded object-cover border border-secondary-200"
                  />
                  <div class="flex flex-col gap-1">
                    <Button
                      type="button"
                      :label="form.popup_imagen_url ? 'Cambiar imagen' : 'Subir imagen'"
                      icon="pi pi-upload"
                      severity="secondary"
                      outlined
                      size="small"
                      :loading="uploading"
                      @click="imageInput?.click()"
                    />
                    <Button
                      v-if="form.popup_imagen_url"
                      type="button"
                      label="Quitar"
                      icon="pi pi-times"
                      severity="secondary"
                      text
                      size="small"
                      @click="form.popup_imagen_url = null"
                    />
                  </div>
                </div>
                <input
                  ref="imageInput"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  class="hidden"
                  @change="handleImageSelect"
                />
                <small class="text-secondary-500">JPG, PNG, WEBP o GIF, hasta 5 MB. Se muestra arriba del texto.</small>
              </div>

              <div>
                <label for="popup_titulo" class="block text-sm font-medium text-secondary-700 mb-2">Título</label>
                <InputText
                  id="popup_titulo"
                  v-model="form.popup_titulo"
                  placeholder="Ej: ¡20% de descuento en toda la tienda!"
                  class="w-full"
                  maxlength="200"
                />
              </div>

              <div>
                <label for="popup_texto" class="block text-sm font-medium text-secondary-700 mb-2">Texto</label>
                <Textarea
                  id="popup_texto"
                  v-model="form.popup_texto"
                  rows="3"
                  placeholder="Ej: Solo hasta el domingo. Válido en productos seleccionados."
                  class="w-full"
                  :class="{ 'p-invalid': errors.popup_texto }"
                />
                <small v-if="errors.popup_texto" class="text-red-500">{{ errors.popup_texto }}</small>
              </div>

              <div>
                <div class="flex items-center gap-2">
                  <InputSwitch v-model="hasButton" inputId="has_button" />
                  <label for="has_button" class="text-sm font-medium text-secondary-700">Agregar botón</label>
                </div>
                <div v-if="hasButton" class="space-y-4 pl-6 mt-3 border-l-2 border-secondary-200">
                  <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-secondary-700 mb-2">Texto del botón</label>
                      <InputText v-model="form.popup_boton_texto" placeholder="Ej: Ver ofertas" class="w-full" maxlength="100" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-secondary-700 mb-2">Enlace</label>
                      <InputText
                        v-model="form.popup_boton_url"
                        placeholder="/categoria/ofertas"
                        class="w-full"
                        :class="{ 'p-invalid': errors.popup_boton_url }"
                      />
                    </div>
                  </div>
                  <small v-if="errors.popup_boton_url" class="text-red-500">{{ errors.popup_boton_url }}</small>
                  <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <ColorField v-model="buttonBg" label="Fondo del botón" />
                    <ColorField v-model="buttonText" label="Texto del botón" />
                  </div>
                </div>
              </div>
            </section>

            <Divider />

            <!-- Diseño -->
            <section class="space-y-4">
              <h3 class="text-sm font-semibold text-secondary-700">Diseño</h3>
              <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Tamaño</label>
                  <SelectButton v-model="form.popup_tamano" :options="POPUP_SIZES" optionLabel="label" optionValue="value" :allowEmpty="false" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Posición</label>
                  <Dropdown v-model="form.popup_posicion" :options="POPUP_POSITIONS" optionLabel="label" optionValue="value" class="w-full" />
                </div>
              </div>
              <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <ColorField v-model="form.popup_bg_color" label="Color de fondo" />
                <ColorField v-model="form.popup_text_color" label="Color del texto" />
              </div>
            </section>

            <Divider />

            <!-- Cuándo -->
            <section class="space-y-4">
              <h3 class="text-sm font-semibold text-secondary-700">Cuándo aparece</h3>
              <div class="space-y-2">
                <div v-for="t in POPUP_TRIGGERS" :key="t.value" class="flex items-start gap-2">
                  <RadioButton v-model="form.disparador" :inputId="`trigger_${t.value}`" :value="t.value" />
                  <label :for="`trigger_${t.value}`" class="text-sm">
                    <span class="font-medium text-secondary-700">{{ t.label }}</span>
                    <span class="block text-secondary-500">{{ t.hint }}</span>
                  </label>
                </div>
              </div>
              <div v-if="form.disparador === 'delay'" class="flex items-center gap-2">
                <InputNumber v-model="form.disparador_valor" :min="0" :max="120" showButtons inputClass="w-20" />
                <span class="text-sm text-secondary-600">segundos después de cargar</span>
              </div>
              <div v-else-if="form.disparador === 'scroll'" class="flex items-center gap-2">
                <InputNumber v-model="form.disparador_valor" :min="1" :max="100" showButtons suffix="%" inputClass="w-20" />
                <span class="text-sm text-secondary-600">de la página recorrida</span>
              </div>
              <small v-if="errors.disparador_valor" class="text-red-500">{{ errors.disparador_valor }}</small>
            </section>

            <Divider />

            <!-- Dónde -->
            <section class="space-y-4">
              <h3 class="text-sm font-semibold text-secondary-700">Dónde aparece</h3>
              <div class="flex items-center gap-2">
                <InputSwitch v-model="allPages" inputId="all_pages" />
                <label for="all_pages" class="text-sm font-medium text-secondary-700">En todas las páginas</label>
              </div>
              <div v-if="!allPages" class="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6 border-l-2 border-secondary-200">
                <div v-for="p in POPUP_PAGES" :key="p.value" class="flex items-center gap-2">
                  <Checkbox v-model="selectedPages" :inputId="`page_${p.value}`" :value="p.value" />
                  <label :for="`page_${p.value}`" class="text-sm">{{ p.label }}</label>
                </div>
              </div>
              <small v-if="errors.paginas" class="text-red-500">{{ errors.paginas }}</small>
              <div>
                <label class="block text-sm font-medium text-secondary-700 mb-2">Dispositivos</label>
                <SelectButton v-model="form.dispositivo" :options="POPUP_DEVICES" optionLabel="label" optionValue="value" :allowEmpty="false" />
              </div>
            </section>

            <Divider />

            <!-- Frecuencia -->
            <section class="space-y-4">
              <h3 class="text-sm font-semibold text-secondary-700">Cada cuánto se repite</h3>
              <Dropdown v-model="form.frecuencia" :options="POPUP_FREQUENCIES" optionLabel="label" optionValue="value" class="w-full" />
              <div v-if="form.frecuencia === 'days'" class="flex items-center gap-2">
                <span class="text-sm text-secondary-600">Cada</span>
                <InputNumber v-model="form.frecuencia_dias" :min="1" :max="365" showButtons inputClass="w-20" />
                <span class="text-sm text-secondary-600">días</span>
              </div>
              <small v-if="errors.frecuencia_dias" class="text-red-500">{{ errors.frecuencia_dias }}</small>
              <small class="block text-secondary-500">
                Se cuenta por navegador desde que el visitante lo ve: no le vuelve a aparecer hasta que se cumpla este plazo.
              </small>
            </section>

            <Divider />

            <!-- Programación -->
            <section class="space-y-4">
              <h3 class="text-sm font-semibold text-secondary-700">Programación (opcional)</h3>
              <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Desde</label>
                  <Calendar v-model="fechaInicio" showTime hourFormat="24" dateFormat="dd/mm/yy" placeholder="Sin fecha" showButtonBar class="w-full" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-secondary-700 mb-2">Hasta</label>
                  <Calendar v-model="fechaFin" showTime hourFormat="24" dateFormat="dd/mm/yy" placeholder="Sin fecha" showButtonBar class="w-full" />
                </div>
              </div>
              <small v-if="errors.fecha_fin" class="text-red-500">{{ errors.fecha_fin }}</small>
              <div class="flex items-center gap-2">
                <InputSwitch v-model="form.activo" inputId="activo" />
                <label for="activo" class="text-sm font-medium text-secondary-700">{{ form.activo ? 'Activo' : 'Inactivo' }}</label>
              </div>
            </section>

            <div class="flex gap-3 pt-2">
              <Button
                type="submit"
                :label="isEditMode ? 'Guardar cambios' : 'Crear popup'"
                icon="pi pi-check"
                :loading="saving"
                :disabled="uploading"
              />
              <Button type="button" label="Cancelar" severity="secondary" outlined @click="goBack" />
            </div>
          </form>
        </template>
      </Card>

      <!-- Vista previa -->
      <div class="lg:sticky lg:top-6 h-fit">
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-eye text-lg"></i>
              <span>Vista previa</span>
            </div>
          </template>
          <template #content>
            <div
              class="relative rounded-lg overflow-hidden border border-secondary-200 bg-secondary-100 h-[28rem] flex p-4"
              :class="previewAlign"
            >
              <div v-if="form.popup_posicion === 'center'" class="absolute inset-0 bg-black/40"></div>
              <div
                class="relative rounded-xl shadow-xl overflow-hidden w-full"
                :class="form.popup_tamano === 'sm' ? 'max-w-[16rem]' : 'max-w-[22rem]'"
                :style="{ backgroundColor: form.popup_bg_color, color: form.popup_text_color }"
              >
                <button type="button" class="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/30 text-white flex items-center justify-center">
                  <i class="pi pi-times text-xs"></i>
                </button>
                <img v-if="form.popup_imagen_url" :src="form.popup_imagen_url" alt="" class="w-full max-h-48 object-cover" />
                <div class="p-5 text-center space-y-2">
                  <div v-if="form.popup_titulo" class="text-lg font-bold leading-snug">{{ form.popup_titulo }}</div>
                  <p v-if="form.popup_texto" class="text-sm whitespace-pre-line opacity-90">{{ form.popup_texto }}</p>
                  <p v-if="!form.popup_titulo && !form.popup_texto && !form.popup_imagen_url" class="text-sm opacity-60">
                    Agrega una imagen, un título o un texto
                  </p>
                  <span
                    v-if="hasButton && form.popup_boton_texto"
                    class="inline-block mt-2 px-5 py-2 rounded-md text-sm font-semibold"
                    :style="{ backgroundColor: buttonBg, color: buttonText }"
                  >
                    {{ form.popup_boton_texto }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { announcementPopupsApi } from '@/api/announcement-popups.api'
import type { AnnouncementPopupPayload, PopupPage } from '@/types/announcement-popup.types'
import {
  POPUP_DEVICES,
  POPUP_FREQUENCIES,
  POPUP_PAGES,
  POPUP_POSITIONS,
  POPUP_SIZES,
  POPUP_TRIGGERS
} from '@/types/announcement-popup.types'
import ColorField from '@/components/marketing/ColorField.vue'

import Button from 'primevue/button'
import Calendar from 'primevue/calendar'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import Divider from 'primevue/divider'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import InputText from 'primevue/inputtext'
import ProgressSpinner from 'primevue/progressspinner'
import RadioButton from 'primevue/radiobutton'
import SelectButton from 'primevue/selectbutton'
import Textarea from 'primevue/textarea'

const LIST_PATH = '/marketing/announcement-popups'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const popupId = computed(() => (route.params.id === 'new' ? null : Number(route.params.id)))
const isEditMode = computed(() => popupId.value !== null)

const form = reactive<AnnouncementPopupPayload>({
  popup_nombre: '',
  popup_titulo: '',
  popup_texto: '',
  popup_imagen_url: null,
  popup_tamano: 'md',
  popup_posicion: 'center',
  popup_bg_color: '#FFFFFF',
  popup_text_color: '#111827',
  popup_boton_texto: '',
  popup_boton_url: '',
  popup_boton_bg_color: null,
  popup_boton_text_color: null,
  disparador: 'delay',
  disparador_valor: 3,
  paginas: null,
  dispositivo: 'all',
  frecuencia: 'session',
  frecuencia_dias: 7,
  fecha_inicio: null,
  fecha_fin: null,
  activo: true
})

const hasButton = ref(false)
const buttonBg = ref('#00B2A6')
const buttonText = ref('#FFFFFF')
const allPages = ref(true)
const selectedPages = ref<PopupPage[]>([])
const fechaInicio = ref<Date | null>(null)
const fechaFin = ref<Date | null>(null)

const loadingPopup = ref(false)
const saving = ref(false)
const uploading = ref(false)
const imageInput = ref<HTMLInputElement | null>(null)
const errors = reactive<Record<string, string>>({})

const previewAlign = computed(() => {
  switch (form.popup_posicion) {
    case 'bottom-left': return 'items-end justify-start'
    case 'bottom-right': return 'items-end justify-end'
    default: return 'items-center justify-center'
  }
})

onMounted(async () => {
  if (!popupId.value) return
  loadingPopup.value = true
  try {
    const popup = await announcementPopupsApi.getById(popupId.value)
    Object.assign(form, {
      ...popup,
      popup_titulo: popup.popup_titulo ?? '',
      popup_texto: popup.popup_texto ?? '',
      popup_boton_texto: popup.popup_boton_texto ?? '',
      popup_boton_url: popup.popup_boton_url ?? '',
      frecuencia_dias: popup.frecuencia_dias ?? 7
    })
    hasButton.value = !!popup.popup_boton_texto
    buttonBg.value = popup.popup_boton_bg_color || buttonBg.value
    buttonText.value = popup.popup_boton_text_color || buttonText.value
    allPages.value = !popup.paginas?.length
    selectedPages.value = popup.paginas ?? []
    fechaInicio.value = parseServerDate(popup.fecha_inicio)
    fechaFin.value = parseServerDate(popup.fecha_fin)
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el popup', life: 3000 })
    router.push(LIST_PATH)
  } finally {
    loadingPopup.value = false
  }
})

function goBack() {
  router.push(LIST_PATH)
}

// "2026-09-21 10:00:00" (hora de la tienda) → Date local. El reemplazo por "T"
// evita el Invalid Date de Safari con el formato de MySQL.
function parseServerDate(value: string | null): Date | null {
  if (!value) return null
  const date = new Date(value.replace(' ', 'T'))
  return Number.isNaN(date.getTime()) ? null : date
}

// Date → "YYYY-MM-DD HH:mm:00" en hora local, sin pasar por UTC.
function toServerDate(date: Date | null): string | null {
  if (!date) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`
}

async function handleImageSelect(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (file.size > 5 * 1024 * 1024) {
    toast.add({ severity: 'warn', summary: 'Imagen muy pesada', detail: 'La imagen no puede superar 5 MB', life: 4000 })
    return
  }

  uploading.value = true
  try {
    form.popup_imagen_url = await announcementPopupsApi.uploadImage(file)
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo subir la imagen', life: 3000 })
  } finally {
    uploading.value = false
  }
}

function validate(): boolean {
  Object.keys(errors).forEach(k => delete errors[k])

  if (!form.popup_nombre.trim()) {
    errors.popup_nombre = 'El nombre es requerido'
  }
  if (!form.popup_titulo?.trim() && !form.popup_texto?.trim() && !form.popup_imagen_url) {
    errors.popup_texto = 'Agrega al menos una imagen, un título o un texto'
  }
  if (hasButton.value && (!form.popup_boton_texto?.trim() || !form.popup_boton_url?.trim())) {
    errors.popup_boton_url = 'El botón necesita texto y enlace'
  }
  if (!allPages.value && selectedPages.value.length === 0) {
    errors.paginas = 'Elige al menos una página'
  }
  if (form.frecuencia === 'days' && !form.frecuencia_dias) {
    errors.frecuencia_dias = 'Indica cada cuántos días'
  }
  if (fechaInicio.value && fechaFin.value && fechaFin.value <= fechaInicio.value) {
    errors.fecha_fin = 'La fecha de fin debe ser posterior a la de inicio'
  }

  return Object.keys(errors).length === 0
}

function buildPayload(): AnnouncementPopupPayload {
  return {
    ...form,
    popup_boton_texto: hasButton.value ? form.popup_boton_texto : null,
    popup_boton_url: hasButton.value ? form.popup_boton_url : null,
    popup_boton_bg_color: hasButton.value ? buttonBg.value : null,
    popup_boton_text_color: hasButton.value ? buttonText.value : null,
    paginas: allPages.value ? null : selectedPages.value,
    frecuencia_dias: form.frecuencia === 'days' ? form.frecuencia_dias : null,
    fecha_inicio: toServerDate(fechaInicio.value),
    fecha_fin: toServerDate(fechaFin.value)
  }
}

async function handleSubmit() {
  if (!validate()) return

  saving.value = true
  try {
    const payload = buildPayload()
    if (popupId.value) {
      await announcementPopupsApi.update(popupId.value, payload)
    } else {
      await announcementPopupsApi.create(payload)
    }
    toast.add({
      severity: 'success',
      summary: isEditMode.value ? 'Guardado' : 'Creado',
      detail: isEditMode.value ? 'Popup actualizado' : 'Popup creado',
      life: 3000
    })
    router.push(LIST_PATH)
  } catch (error: any) {
    const serverErrors = error?.response?.data?.messages
    if (serverErrors && typeof serverErrors === 'object') {
      Object.assign(errors, serverErrors)
    }
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: isEditMode.value ? 'No se pudo guardar el popup' : 'No se pudo crear el popup',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
:deep(.p-inputtext) {
  border: 1px solid #d1d5db !important;
}
</style>
