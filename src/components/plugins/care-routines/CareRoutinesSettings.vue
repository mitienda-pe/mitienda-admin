<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { rutinasApi, type Rutina, type RutinaSavePayload } from '@/api/rutinas.api'
import { productsApi } from '@/api/products.api'

// El add-on gestiona sus rutinas vía endpoints dedicados (/rutinas*), no vía
// el config-schema genérico de plugins; por eso ignoramos las props recibidas.
defineProps<{ config?: Record<string, any> | null; configSchema?: Record<string, any> | null }>()

const toast = useToast()

// ─── Modelo editable ────────────────────────────────────────
interface PickedProduct {
  producto_id: number
  producto_nombre: string
  producto_imagen?: string | null
  producto_precio?: number
}
interface EditPaso {
  key: number
  nombre: string
  subtitulo: string
  productos: PickedProduct[]
}
interface EditArea {
  key: number
  nombre: string
  subtitulo: string
  icono: string
  pasos: EditPaso[]
}
interface EditForm {
  nombre: string
  descripcion: string
  tipopiel: string
  mostrar_siempre: boolean
  activo: boolean
  areas: EditArea[]
}

let keySeq = 1
const nextKey = () => keySeq++

const rutinas = ref<Rutina[]>([])
const isLoadingList = ref(true)
const isSaving = ref(false)
const editingId = ref<number | null>(null) // null = ninguna; 0 = nueva
const form = reactive<EditForm>(blankForm())

function blankForm(): EditForm {
  return { nombre: '', descripcion: '', tipopiel: '', mostrar_siempre: false, activo: true, areas: [] }
}

function resetForm(next: Partial<EditForm> = {}) {
  Object.assign(form, blankForm(), next)
}

// ─── Carga ──────────────────────────────────────────────────
async function loadList() {
  isLoadingList.value = true
  try {
    const { data } = await rutinasApi.getAll({ per_page: 100 })
    rutinas.value = data
  } catch {
    toast.add({ severity: 'error', summary: 'No se pudieron cargar las rutinas', life: 4000 })
  } finally {
    isLoadingList.value = false
  }
}

async function openNew() {
  editingId.value = 0
  resetForm()
}

async function openEdit(id: number) {
  try {
    const r = await rutinasApi.getById(id)
    editingId.value = id
    resetForm({
      nombre: r.tiendarutina_nombre ?? '',
      descripcion: r.tiendarutina_descripcion ?? '',
      tipopiel: r.tiendarutina_tipopiel ?? '',
      mostrar_siempre: Number(r.tiendarutina_mostrar_siempre) === 1,
      activo: Number(r.tiendarutina_activo) === 1,
      areas: (r.areas ?? []).map((a) => ({
        key: nextKey(),
        nombre: a.tiendarutinaarea_nombre ?? '',
        subtitulo: a.tiendarutinaarea_subtitulo ?? '',
        icono: a.tiendarutinaarea_icono ?? '',
        pasos: (a.pasos ?? []).map((p) => ({
          key: nextKey(),
          nombre: p.tiendarutinapaso_nombre ?? '',
          subtitulo: p.tiendarutinapaso_subtitulo ?? '',
          productos: (p.productos ?? []).map((prod) => ({
            producto_id: prod.producto_id,
            producto_nombre: prod.producto_nombre ?? `#${prod.producto_id}`,
            producto_imagen: prod.producto_imagen ?? null,
            producto_precio: prod.producto_precio,
          })),
        })),
      })),
    })
  } catch {
    toast.add({ severity: 'error', summary: 'No se pudo cargar la rutina', life: 4000 })
  }
}

function closeEditor() {
  editingId.value = null
}

// ─── Edición del árbol ──────────────────────────────────────
function addArea() {
  form.areas.push({ key: nextKey(), nombre: '', subtitulo: '', icono: '', pasos: [] })
}
function removeArea(i: number) {
  form.areas.splice(i, 1)
}
function moveArea(i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= form.areas.length) return
  const [a] = form.areas.splice(i, 1)
  form.areas.splice(j, 0, a)
}
function addPaso(area: EditArea) {
  area.pasos.push({ key: nextKey(), nombre: '', subtitulo: '', productos: [] })
}
function removePaso(area: EditArea, i: number) {
  area.pasos.splice(i, 1)
}
function movePaso(area: EditArea, i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= area.pasos.length) return
  const [p] = area.pasos.splice(i, 1)
  area.pasos.splice(j, 0, p)
}
function removeProduct(paso: EditPaso, i: number) {
  paso.productos.splice(i, 1)
}

// ─── Preset Altea (según el diseño) ─────────────────────────
function applyAltearPreset() {
  const facialSteps = [
    ['Limpieza', 'Higiene diaria'],
    ['Tratamiento', 'Trata necesidades específicas'],
    ['Hidratación', 'Restaura y mantiene la hidratación'],
    ['Fotoprotección', 'Protege tu piel cada día'],
    ['Específicos', 'Contorno de ojos, labios, etc.'],
  ]
  const bodySteps = [
    ['Limpieza', 'Higiene diaria'],
    ['Tratamiento', 'Trata necesidades específicas'],
    ['Hidratación', 'Restaura y mantiene la hidratación'],
    ['Fotoprotección', 'Protege tu piel cada día'],
    ['Específicos', 'Áreas especiales, manos, pies, etc.'],
  ]
  const suppSteps = [
    ['Nutrición de la piel', 'Vitaminas y antioxidantes'],
    ['Salud capilar', 'Fortalece tu cabello y uñas'],
    ['Bienestar general', 'Apoyo a tu salud integral'],
  ]
  const mk = (steps: string[][]): EditPaso[] =>
    steps.map(([nombre, subtitulo]) => ({ key: nextKey(), nombre, subtitulo, productos: [] }))

  form.areas = [
    { key: nextKey(), nombre: 'Rostro', subtitulo: 'Cuidado facial día y noche', icono: '', pasos: mk(facialSteps) },
    { key: nextKey(), nombre: 'Cuerpo', subtitulo: 'Higiene, hidratación y tratamiento corporal', icono: '', pasos: mk(bodySteps) },
    { key: nextKey(), nombre: 'Suplementos dietéticos', subtitulo: 'Complementa tu rutina desde adentro', icono: '', pasos: mk(suppSteps) },
  ]
}

// ─── Buscador de productos (picker) ─────────────────────────
const pickerOpen = ref(false)
const pickerTarget = ref<EditPaso | null>(null)
const pickerQuery = ref('')
const pickerResults = ref<PickedProduct[]>([])
const pickerLoading = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

function openPicker(paso: EditPaso) {
  pickerTarget.value = paso
  pickerQuery.value = ''
  pickerResults.value = []
  pickerOpen.value = true
}
function closePicker() {
  pickerOpen.value = false
  pickerTarget.value = null
}
function onPickerInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(runSearch, 300)
}
async function runSearch() {
  const q = pickerQuery.value.trim()
  if (q.length < 2) {
    pickerResults.value = []
    return
  }
  pickerLoading.value = true
  try {
    const res = await productsApi.getProducts({ search: q, limit: 10 })
    pickerResults.value = (res.data ?? []).map((p: any) => ({
      producto_id: Number(p.id),
      producto_nombre: p.name ?? p.title ?? `#${p.id}`,
      producto_imagen: p.images?.[0]?.url ?? p.images?.[0]?.thumbnail ?? (typeof p.images?.[0] === 'string' ? p.images[0] : null),
      producto_precio: Number(p.price ?? 0),
    }))
  } catch {
    pickerResults.value = []
  } finally {
    pickerLoading.value = false
  }
}
function pickProduct(p: PickedProduct) {
  const paso = pickerTarget.value
  if (!paso) return
  if (paso.productos.some((x) => x.producto_id === p.producto_id)) {
    toast.add({ severity: 'info', summary: 'Ese producto ya está en el paso', life: 2500 })
    return
  }
  paso.productos.push(p)
}

// ─── Guardar / eliminar / toggle ────────────────────────────
function buildPayload(): RutinaSavePayload {
  return {
    tiendarutina_nombre: form.nombre.trim(),
    tiendarutina_descripcion: form.descripcion || null,
    tiendarutina_tipopiel: form.tipopiel || null,
    tiendarutina_mostrar_siempre: form.mostrar_siempre ? 1 : 0,
    tiendarutina_activo: form.activo ? 1 : 0,
    areas: form.areas.map((a) => ({
      tiendarutinaarea_nombre: a.nombre.trim() || 'Área',
      tiendarutinaarea_subtitulo: a.subtitulo || null,
      tiendarutinaarea_icono: a.icono || null,
      pasos: a.pasos.map((p) => ({
        tiendarutinapaso_nombre: p.nombre.trim() || 'Paso',
        tiendarutinapaso_subtitulo: p.subtitulo || null,
        productos: p.productos.map((prod) => prod.producto_id),
      })),
    })),
  }
}

async function save() {
  if (!form.nombre.trim()) {
    toast.add({ severity: 'warn', summary: 'La rutina necesita un nombre', life: 3000 })
    return
  }
  isSaving.value = true
  try {
    const payload = buildPayload()
    if (editingId.value && editingId.value > 0) {
      await rutinasApi.update(editingId.value, payload)
    } else {
      const created = await rutinasApi.create(payload)
      editingId.value = created.tiendarutina_id
    }
    toast.add({ severity: 'success', summary: 'Rutina guardada', life: 3000 })
    await loadList()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'No se pudo guardar', detail: e?.response?.data?.message, life: 5000 })
  } finally {
    isSaving.value = false
  }
}

async function removeRutina(r: Rutina) {
  if (!confirm(`¿Eliminar la rutina "${r.tiendarutina_nombre}"?`)) return
  try {
    await rutinasApi.delete(r.tiendarutina_id)
    if (editingId.value === r.tiendarutina_id) closeEditor()
    toast.add({ severity: 'success', summary: 'Rutina eliminada', life: 3000 })
    await loadList()
  } catch {
    toast.add({ severity: 'error', summary: 'No se pudo eliminar', life: 4000 })
  }
}

async function toggleRutina(r: Rutina) {
  try {
    await rutinasApi.toggle(r.tiendarutina_id)
    await loadList()
  } catch {
    toast.add({ severity: 'error', summary: 'No se pudo cambiar el estado', life: 4000 })
  }
}

onMounted(loadList)
</script>

<template>
  <div class="care-routines">
    <p class="mb-4 text-sm text-gray-600">
      Define rutinas de cuidado agrupadas por área (Rostro, Cuerpo, Suplementos) y paso
      (Limpieza, Tratamiento, Hidratación…). En el carrito, cuando el cliente agregue un
      producto de la rutina, se le sugerirán los pasos que le faltan.
    </p>

    <!-- Lista de rutinas -->
    <div v-if="editingId === null">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">Rutinas</h2>
        <button type="button" class="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90" @click="openNew">
          + Nueva rutina
        </button>
      </div>

      <div v-if="isLoadingList" class="text-sm text-gray-500">Cargando…</div>
      <div v-else-if="!rutinas.length" class="rounded border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
        Aún no hay rutinas. Crea la primera para empezar.
      </div>
      <ul v-else class="divide-y divide-gray-200 rounded border border-gray-200">
        <li v-for="r in rutinas" :key="r.tiendarutina_id" class="flex items-center justify-between px-4 py-3">
          <div>
            <p class="text-sm font-medium text-gray-900">{{ r.tiendarutina_nombre }}</p>
            <p v-if="r.tiendarutina_tipopiel" class="text-xs text-gray-500">{{ r.tiendarutina_tipopiel }}</p>
          </div>
          <div class="flex items-center gap-2">
            <span
              class="rounded-full px-2 py-0.5 text-xs"
              :class="Number(r.tiendarutina_activo) === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
            >
              {{ Number(r.tiendarutina_activo) === 1 ? 'Activa' : 'Inactiva' }}
            </span>
            <button type="button" class="text-sm text-primary hover:underline" @click="openEdit(r.tiendarutina_id)">Editar</button>
            <button type="button" class="text-sm text-gray-500 hover:underline" @click="toggleRutina(r)">
              {{ Number(r.tiendarutina_activo) === 1 ? 'Desactivar' : 'Activar' }}
            </button>
            <button type="button" class="text-sm text-red-600 hover:underline" @click="removeRutina(r)">Eliminar</button>
          </div>
        </li>
      </ul>
    </div>

    <!-- Editor -->
    <div v-else class="space-y-6">
      <div class="flex items-center justify-between">
        <button type="button" class="text-sm text-primary hover:underline" @click="closeEditor">← Volver</button>
        <button
          type="button"
          class="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          :disabled="isSaving"
          @click="save"
        >
          {{ isSaving ? 'Guardando…' : 'Guardar rutina' }}
        </button>
      </div>

      <!-- Metadatos -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-gray-700">Nombre de la rutina</span>
          <input v-model="form.nombre" type="text" placeholder="Ej. Rutina Altea" class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-gray-700">Tipo de piel / necesidad (opcional)</span>
          <input v-model="form.tipopiel" type="text" placeholder="Ej. Piel grasa" class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </label>
        <label class="block md:col-span-2">
          <span class="mb-1 block text-sm font-medium text-gray-700">Descripción (opcional)</span>
          <textarea v-model="form.descripcion" rows="2" class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
        </label>
        <label class="flex items-center gap-2">
          <input v-model="form.activo" type="checkbox" class="rounded border-gray-300 text-primary" />
          <span class="text-sm text-gray-700">Activa</span>
        </label>
        <label class="flex items-center gap-2">
          <input v-model="form.mostrar_siempre" type="checkbox" class="rounded border-gray-300 text-primary" />
          <span class="text-sm text-gray-700">Mostrar siempre en el carrito (aunque no haya un producto de la rutina)</span>
        </label>
      </div>

      <!-- Áreas -->
      <div class="flex items-center justify-between">
        <h3 class="text-base font-semibold text-gray-900">Áreas y pasos</h3>
        <div class="flex gap-2">
          <button v-if="!form.areas.length" type="button" class="text-sm text-primary hover:underline" @click="applyAltearPreset">
            Usar estructura sugerida (Altea)
          </button>
          <button type="button" class="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50" @click="addArea">
            + Área
          </button>
        </div>
      </div>

      <div v-for="(area, ai) in form.areas" :key="area.key" class="rounded border border-gray-200 p-4">
        <div class="mb-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-xs font-medium text-gray-500">Área</span>
            <input v-model="area.nombre" type="text" placeholder="Ej. Rostro" class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs font-medium text-gray-500">Subtítulo</span>
            <input v-model="area.subtitulo" type="text" placeholder="Ej. Cuidado facial día y noche" class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </label>
        </div>
        <div class="mb-3 flex items-center gap-3 text-xs">
          <button type="button" class="text-gray-500 hover:underline" @click="moveArea(ai, -1)">↑ Subir</button>
          <button type="button" class="text-gray-500 hover:underline" @click="moveArea(ai, 1)">↓ Bajar</button>
          <button type="button" class="text-red-600 hover:underline" @click="removeArea(ai)">Eliminar área</button>
        </div>

        <!-- Pasos -->
        <div class="space-y-3 border-t border-gray-100 pt-3">
          <div v-for="(paso, pi) in area.pasos" :key="paso.key" class="rounded bg-gray-50 p-3">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input v-model="paso.nombre" type="text" placeholder="Paso (Ej. Limpieza)" class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
              <input v-model="paso.subtitulo" type="text" placeholder="Subtítulo (Ej. Higiene diaria)" class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
            </div>

            <!-- Productos del paso -->
            <div class="mt-2 flex flex-wrap items-center gap-2">
              <span
                v-for="(prod, xi) in paso.productos"
                :key="prod.producto_id"
                class="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs text-gray-700 ring-1 ring-gray-200"
              >
                {{ prod.producto_nombre }}
                <button type="button" class="text-gray-400 hover:text-red-600" @click="removeProduct(paso, xi)">✕</button>
              </span>
              <button type="button" class="text-xs text-primary hover:underline" @click="openPicker(paso)">+ Agregar producto</button>
            </div>

            <div class="mt-2 flex items-center gap-3 text-xs">
              <button type="button" class="text-gray-500 hover:underline" @click="movePaso(area, pi, -1)">↑</button>
              <button type="button" class="text-gray-500 hover:underline" @click="movePaso(area, pi, 1)">↓</button>
              <button type="button" class="text-red-600 hover:underline" @click="removePaso(area, pi)">Eliminar paso</button>
            </div>
          </div>

          <button type="button" class="text-sm text-primary hover:underline" @click="addPaso(area)">+ Paso</button>
        </div>
      </div>
    </div>

    <!-- Picker de productos -->
    <div v-if="pickerOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" @click.self="closePicker">
      <div class="w-full max-w-lg rounded-lg bg-white p-4 shadow-xl">
        <div class="mb-3 flex items-center justify-between">
          <h4 class="text-sm font-semibold text-gray-900">Agregar producto al paso</h4>
          <button type="button" class="text-gray-400 hover:text-gray-700" @click="closePicker">✕</button>
        </div>
        <input
          v-model="pickerQuery"
          type="text"
          placeholder="Buscar producto por nombre o SKU…"
          class="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          @input="onPickerInput"
        />
        <div class="mt-3 max-h-72 overflow-y-auto">
          <p v-if="pickerLoading" class="py-4 text-center text-sm text-gray-500">Buscando…</p>
          <p v-else-if="pickerQuery.trim().length >= 2 && !pickerResults.length" class="py-4 text-center text-sm text-gray-500">Sin resultados.</p>
          <ul v-else class="divide-y divide-gray-100">
            <li v-for="p in pickerResults" :key="p.producto_id" class="flex items-center gap-3 py-2">
              <img v-if="p.producto_imagen" :src="p.producto_imagen" :alt="p.producto_nombre" class="h-10 w-10 rounded object-cover" />
              <div class="h-10 w-10 rounded bg-gray-100" v-else />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm text-gray-800">{{ p.producto_nombre }}</p>
                <p v-if="p.producto_precio" class="text-xs text-gray-500">S/ {{ p.producto_precio.toFixed(2) }}</p>
              </div>
              <button type="button" class="rounded bg-primary px-3 py-1 text-xs font-medium text-white hover:bg-primary/90" @click="pickProduct(p)">
                Agregar
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
