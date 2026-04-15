<template>
  <div class="flex flex-col">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Plantilla</h1>
        <p class="text-sm text-secondary-500 mt-1">
          Organiza los bloques de contenido en cada página de tu storefront
        </p>
      </div>
      <Button
        label="Guardar página"
        icon="pi pi-save"
        :loading="sectionsStore.isSaving"
        @click="handleSave"
      />
    </div>

    <!-- Page Tabs -->
    <div class="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto pb-0">
      <button
        v-for="pageDef in PAGE_DEFINITIONS"
        :key="pageDef.id"
        class="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap border border-b-0 -mb-px focus:outline-none"
        :class="
          activePage === pageDef.id
            ? 'bg-white border-gray-200 text-primary'
            : 'border-transparent text-secondary-500 hover:text-primary hover:bg-gray-50'
        "
        @click="selectPage(pageDef.id)"
      >
        {{ pageDef.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="sectionsStore.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Builder -->
    <div v-else class="flex gap-6">
      <!-- Main: Zones editor -->
      <div class="flex-1 min-w-0 space-y-6">
        <div v-for="zone in activeZones" :key="zone.ubicacion">
          <!-- Zone label (only when 2 zones) -->
          <div v-if="activeZones.length > 1" class="flex items-center gap-3 mb-3">
            <span class="text-xs font-semibold uppercase tracking-wider text-secondary-400">
              {{ ZONE_LABELS[zone.ubicacion] }}
            </span>
            <div class="flex-1 h-px bg-gray-200"></div>
          </div>

          <!-- Drop zone container -->
          <div
            class="border-2 border-dashed rounded-xl p-4 min-h-36 transition-colors"
            :class="
              zoneSections(zone.ubicacion).length
                ? 'border-primary/25 bg-primary-50/20'
                : 'border-gray-200 bg-gray-50/50'
            "
          >
            <!-- Empty state -->
            <div
              v-if="!zoneSections(zone.ubicacion).length"
              class="flex flex-col items-center justify-center py-10 text-secondary-300"
            >
              <i class="pi pi-th-large text-4xl mb-3 opacity-40"></i>
              <p class="text-sm">
                Arrastra bloques desde el panel o agrega una nueva sección.
              </p>
            </div>

            <!-- Sections list -->
            <div v-else class="space-y-3 mb-3">
              <div
                v-for="(cols, sIdx) in zoneSections(zone.ubicacion)"
                :key="sIdx"
                class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                <!-- Toolbar -->
                <div class="flex items-center gap-1 px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                  <span class="text-xs text-secondary-400 font-medium flex-1">
                    Sección {{ sIdx + 1 }} — {{ cols.length }}
                    {{ cols.length === 1 ? 'columna' : 'columnas' }}
                  </span>
                  <Button
                    v-tooltip.top="'Mover arriba'"
                    icon="pi pi-angle-up"
                    text rounded size="small" severity="secondary"
                    :disabled="sIdx === 0"
                    @click="sectionsStore.moveSectionUp(activePage, zone.ubicacion, sIdx)"
                  />
                  <Button
                    v-tooltip.top="'Mover abajo'"
                    icon="pi pi-angle-down"
                    text rounded size="small" severity="secondary"
                    :disabled="sIdx === zoneSections(zone.ubicacion).length - 1"
                    @click="sectionsStore.moveSectionDown(activePage, zone.ubicacion, sIdx, zoneSections(zone.ubicacion).length)"
                  />
                  <Button
                    v-tooltip.top="'Eliminar sección'"
                    icon="pi pi-trash"
                    text rounded size="small" severity="danger"
                    @click="confirmRemove(zone.ubicacion, sIdx)"
                  />
                </div>

                <!-- Columns -->
                <div class="flex gap-2 p-3">
                  <div
                    v-for="(col, cIdx) in cols"
                    :key="cIdx"
                    class="flex-1 min-h-24 rounded-lg border-2 border-dashed cursor-pointer transition-all"
                    :class="colSlotClass(col, zone.ubicacion, sIdx, cIdx)"
                    @dragover.prevent
                    @dragenter.prevent="setDragOver(`${zone.ubicacion}-${sIdx}-${cIdx}`)"
                    @dragleave="clearDragOver(`${zone.ubicacion}-${sIdx}-${cIdx}`)"
                    @drop.prevent="handleDrop(zone.ubicacion, sIdx, cIdx)"
                    @click="handleColumnClick(zone.ubicacion, sIdx, cIdx)"
                  >
                    <!-- Predefined block chip -->
                    <div v-if="col.bloque_codigo" class="p-2.5 h-full flex flex-col">
                      <div class="flex items-start justify-between gap-1">
                        <div class="flex items-center gap-2 min-w-0">
                          <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary shrink-0">
                            <i :class="getPredefinedBlock(col.bloque_codigo)?.icon ?? 'pi pi-box'" class="text-sm"></i>
                          </span>
                          <div class="min-w-0">
                            <p class="text-xs font-semibold text-secondary truncate">
                              {{ col.config?.titulo || getPredefinedBlock(col.bloque_codigo)?.label || col.bloque_codigo }}
                            </p>
                            <p class="text-xs text-secondary-400 mt-0.5">
                              {{ blockConfigSummary(col) }}
                            </p>
                          </div>
                        </div>
                        <div class="flex items-center gap-0.5 shrink-0">
                          <button
                            class="text-gray-300 hover:text-primary transition-colors"
                            title="Configurar"
                            @click.stop="openBlockConfig(zone.ubicacion, sIdx, cIdx, col)"
                          >
                            <i class="pi pi-cog text-xs"></i>
                          </button>
                          <button
                            class="text-gray-300 hover:text-red-400 transition-colors"
                            title="Quitar"
                            @click.stop="sectionsStore.clearColumn(activePage, zone.ubicacion, sIdx, cIdx)"
                          >
                            <i class="pi pi-times text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- User component chip -->
                    <div v-else-if="!isColEmpty(col)" class="p-2.5 h-full flex flex-col">
                      <div class="flex items-start justify-between gap-1">
                        <div class="min-w-0">
                          <p class="text-xs font-semibold text-secondary truncate">
                            {{ getComponentName(col.componente_id) }}
                          </p>
                          <p class="text-xs text-secondary-400 mt-0.5">
                            {{ getComponentTypeName(col.componente_id) }}
                          </p>
                        </div>
                        <button
                          class="shrink-0 text-gray-300 hover:text-red-400 transition-colors"
                          title="Quitar"
                          @click.stop="sectionsStore.clearColumn(activePage, zone.ubicacion, sIdx, cIdx)"
                        >
                          <i class="pi pi-times text-xs"></i>
                        </button>
                      </div>
                    </div>

                    <!-- Empty slot -->
                    <div v-else class="flex flex-col items-center justify-center h-24 text-secondary-300 gap-1">
                      <i class="pi pi-arrow-down text-base opacity-50"></i>
                      <span class="text-xs">Arrastra un bloque</span>
                      <span class="text-xs opacity-60">o click para componente</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Add section button -->
            <Button
              icon="pi pi-plus"
              label="Agregar sección"
              text severity="secondary"
              class="w-full text-sm"
              @click="openAddSection(zone.ubicacion)"
            />
          </div>
        </div>
      </div>

      <!-- Right panel -->
      <div class="w-64 shrink-0 space-y-4">

        <!-- Predefined Blocks -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div class="px-4 py-3 border-b border-gray-100">
            <h3 class="text-sm font-semibold text-secondary">Bloques predefinidos</h3>
            <p class="text-xs text-secondary-400 mt-0.5">Arrastra al área de contenido</p>
          </div>
          <div class="p-2 space-y-1">
            <div
              v-for="block in PREDEFINED_BLOCKS"
              :key="block.codigo"
              draggable="true"
              class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50 cursor-grab active:cursor-grabbing hover:border-primary/40 hover:bg-primary-50/50 transition-all select-none"
              :class="draggedBlock === block.codigo ? 'opacity-50 border-primary/40 bg-primary-50' : ''"
              @dragstart="startDrag(block.codigo)"
              @dragend="endDrag"
            >
              <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary shrink-0">
                <i :class="block.icon" class="text-sm"></i>
              </span>
              <div class="min-w-0">
                <p class="text-xs font-semibold text-secondary truncate">{{ block.label }}</p>
                <p class="text-xs text-secondary-400 truncate">{{ block.descripcion }}</p>
              </div>
              <i class="pi pi-grip-vertical text-gray-300 text-xs ml-auto shrink-0"></i>
            </div>
          </div>
        </div>

        <!-- User Components -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div class="px-4 py-3 border-b border-gray-100">
            <h3 class="text-sm font-semibold text-secondary">Componentes HTML</h3>
            <p class="text-xs text-secondary-400 mt-0.5">Click en columna para asignar</p>
          </div>
          <div v-if="componentsLoading" class="flex justify-center p-6">
            <ProgressSpinner style="width: 24px; height: 24px" />
          </div>
          <div v-else class="p-2 max-h-64 overflow-y-auto">
            <div
              v-if="!htmlComponents.length"
              class="text-center py-6 text-secondary-300"
            >
              <i class="pi pi-code text-xl mb-2 block opacity-40"></i>
              <p class="text-xs">Sin componentes HTML</p>
            </div>
            <div
              v-for="comp in htmlComponents"
              :key="comp.id"
              class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
            >
              <span class="inline-flex items-center justify-center w-6 h-6 rounded bg-purple-100 text-purple-600 shrink-0 text-xs">
                <i class="pi pi-code"></i>
              </span>
              <p class="text-xs font-medium text-secondary truncate">{{ comp.name }}</p>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- ── Add Section Dialog ─────────────────────────────────────────── -->
    <Dialog
      v-model:visible="addSectionVisible"
      header="Agregar sección"
      :modal="true"
      :style="{ width: '460px' }"
      :draggable="false"
    >
      <p class="text-sm text-secondary-500 mb-5">
        Elige la distribución de columnas para la nueva sección:
      </p>
      <div class="grid grid-cols-2 gap-3">
        <button
          v-for="layout in COLUMN_LAYOUTS"
          :key="layout.cols"
          class="flex flex-col items-center gap-3 p-5 border-2 rounded-xl transition-all text-center hover:border-primary hover:bg-primary-50 border-gray-200"
          @click="confirmAddSection(layout.cols)"
        >
          <div class="flex gap-1.5 w-full h-8">
            <div v-for="c in layout.cols" :key="c" class="flex-1 bg-gray-200 rounded-md"></div>
          </div>
          <span class="text-sm font-medium text-secondary">{{ layout.label }}</span>
        </button>
      </div>
    </Dialog>

    <!-- ── Component Selector Dialog ─────────────────────────────────── -->
    <Dialog
      v-model:visible="selectorVisible"
      header="Asignar componente HTML"
      :modal="true"
      :style="{ width: '440px' }"
      :draggable="false"
    >
      <p class="text-xs text-secondary-400 mb-3">
        Para bloques predefinidos (carrusel, categorías, etc.) arrastra desde el panel derecho.
      </p>
      <div class="mb-3">
        <IconField iconPosition="left">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="selectorSearch"
            placeholder="Buscar componente..."
            class="w-full"
            size="small"
          />
        </IconField>
      </div>

      <div class="max-h-72 overflow-y-auto -mx-1 px-1 space-y-0.5">
        <!-- Clear option -->
        <button
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 text-left transition-colors"
          @click="applyComponent(0)"
        >
          <i class="pi pi-times-circle text-red-400 text-sm"></i>
          <span class="text-sm text-red-500 font-medium">Vaciar columna</span>
        </button>
        <div class="h-px bg-gray-100 my-1"></div>

        <!-- Component list (HTML type only) -->
        <button
          v-for="comp in filteredComponents"
          :key="comp.id"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary-50 hover:text-primary text-left transition-colors"
          @click="applyComponent(comp.id)"
        >
          <span class="inline-flex items-center justify-center w-7 h-7 rounded bg-purple-100 text-purple-600 shrink-0 text-xs">
            <i class="pi pi-code"></i>
          </span>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-secondary">{{ comp.name }}</p>
          </div>
        </button>

        <div v-if="!filteredComponents.length" class="text-center py-6 text-secondary-400">
          <p class="text-sm">Sin componentes HTML disponibles</p>
        </div>
      </div>
    </Dialog>

    <!-- ── Block Config Dialog ───────────────────────────────────────── -->
    <Dialog
      v-model:visible="blockConfigVisible"
      :header="`Configurar: ${getPredefinedBlock(blockConfigCode)?.label ?? blockConfigCode}`"
      :modal="true"
      :style="{ width: '520px' }"
      :draggable="false"
    >
      <div class="space-y-5">
        <!-- Title -->
        <div>
          <label class="block text-sm font-medium text-secondary mb-1.5">Título personalizado</label>
          <InputText
            v-model="blockConfigForm.titulo"
            class="w-full"
            :placeholder="getPredefinedBlock(blockConfigCode)?.label ?? 'Título por defecto'"
          />
          <p class="text-xs text-secondary-400 mt-1">Dejar vacío para usar el título por defecto</p>
        </div>

        <!-- Bg Color -->
        <div>
          <label class="block text-sm font-medium text-secondary mb-1.5">Color de fondo</label>
          <div class="flex items-center gap-3">
            <ColorPicker v-model="blockConfigBgHex" format="hex" />
            <InputText v-model="blockConfigForm.bg_color" class="w-32" placeholder="#ffffff" />
            <button
              v-if="blockConfigForm.bg_color"
              class="text-xs text-secondary-400 hover:text-red-400"
              @click="blockConfigForm.bg_color = ''"
            >
              Limpiar
            </button>
          </div>
        </div>

        <!-- Limit -->
        <div>
          <label class="block text-sm font-medium text-secondary mb-1.5">Cantidad de items a mostrar</label>
          <InputNumber
            v-model="blockConfigForm.limite"
            :min="0"
            :max="50"
            placeholder="0"
            class="w-full"
            showButtons
          />
          <p class="text-xs text-secondary-400 mt-1">0 = mostrar todos</p>
        </div>

        <!-- Item Selector -->
        <div v-if="getPredefinedBlock(blockConfigCode)?.itemsType">
          <label class="block text-sm font-medium text-secondary mb-1.5">
            Seleccionar {{ getPredefinedBlock(blockConfigCode)?.itemsLabel }} específicos
          </label>
          <MultiSelect
            v-model="blockConfigForm.items"
            :options="blockConfigItems"
            optionLabel="name"
            optionValue="id"
            :loading="blockConfigItemsLoading"
            :placeholder="`Todos (sin filtro)`"
            :maxSelectedLabels="3"
            class="w-full"
            filter
            :filterPlaceholder="`Buscar ${getPredefinedBlock(blockConfigCode)?.itemsLabel?.toLowerCase()}...`"
          />
          <p class="text-xs text-secondary-400 mt-1">Dejar vacío para mostrar todos</p>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" text severity="secondary" @click="blockConfigVisible = false" />
        <Button label="Aplicar" icon="pi pi-check" @click="saveBlockConfig" />
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTemplateSectionsStore } from '@/stores/template-sections.store'
import { useComponentsStore } from '@/stores/components.store'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import {
  PAGE_DEFINITIONS,
  COLUMN_LAYOUTS,
  ZONE_LABELS,
  PREDEFINED_BLOCKS,
} from '@/types/template-section.types'
import type { SectionColumn, BlockConfig } from '@/types/template-section.types'
import { catalogApi } from '@/api/catalog.api'
import { productsApi } from '@/api/products.api'
import { productListApi } from '@/api/product-list.api'
import { comboApi } from '@/api/combo.api'
import { gammaApi } from '@/api/gamma.api'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import MultiSelect from 'primevue/multiselect'
import ColorPicker from 'primevue/colorpicker'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import ProgressSpinner from 'primevue/progressspinner'
import ConfirmDialog from 'primevue/confirmdialog'

const sectionsStore = useTemplateSectionsStore()
const componentsStore = useComponentsStore()
const toast = useToast()
const confirm = useConfirm()

// ── Page state ────────────────────────────────────────────────────────────────

const activePage = ref(PAGE_DEFINITIONS[0].id)
const activePageDef = computed(() => PAGE_DEFINITIONS.find(p => p.id === activePage.value))
const activeZones = computed(() =>
  (activePageDef.value?.zones ?? ['header']).map(z => ({ ubicacion: z as 'header' | 'footer' })),
)

async function selectPage(pageId: number) {
  activePage.value = pageId
  await sectionsStore.loadPage(pageId)
}

// ── Sections helpers ──────────────────────────────────────────────────────────

function zoneSections(ubicacion: 'header' | 'footer'): SectionColumn[][] {
  return sectionsStore.getSections(activePage.value, ubicacion)
}

function isColEmpty(col: SectionColumn): boolean {
  const id = col.componente_id
  return !col.bloque_codigo && (!id || id === 0 || id === '0')
}

// ── Predefined block helpers ──────────────────────────────────────────────────

function getPredefinedBlock(codigo: string) {
  return PREDEFINED_BLOCKS.find(b => b.codigo === codigo)
}

// ── Drag and drop ─────────────────────────────────────────────────────────────

const draggedBlock = ref<string | null>(null)
const dragOverKey = ref<string | null>(null)

function startDrag(bloqueCodigo: string) {
  draggedBlock.value = bloqueCodigo
}

function endDrag() {
  draggedBlock.value = null
  dragOverKey.value = null
}

function setDragOver(key: string) {
  if (draggedBlock.value) dragOverKey.value = key
}

function clearDragOver(key: string) {
  if (dragOverKey.value === key) dragOverKey.value = null
}

function handleDrop(ubicacion: 'header' | 'footer', sIdx: number, cIdx: number) {
  if (!draggedBlock.value) return
  sectionsStore.assignBlock(activePage.value, ubicacion, sIdx, cIdx, draggedBlock.value)
  draggedBlock.value = null
  dragOverKey.value = null
}

function colSlotClass(col: SectionColumn, ubicacion: 'header' | 'footer', sIdx: number, cIdx: number): string {
  const key = `${ubicacion}-${sIdx}-${cIdx}`
  const isDragOver = dragOverKey.value === key
  if (isDragOver) return 'border-primary bg-primary-50/60 scale-[1.01] shadow-sm'
  if (col.bloque_codigo) return 'border-primary/40 bg-primary-50/30 hover:border-primary/60'
  if (!isColEmpty(col)) return 'border-purple-200 bg-purple-50/30 hover:border-purple-300'
  return 'border-gray-200 hover:border-primary/50 hover:bg-primary-50/30'
}

// ── Components ────────────────────────────────────────────────────────────────

const componentsLoading = ref(false)
const htmlComponents = computed(() => componentsStore.components.filter(c => c.type_id === 2))

function getComponentName(id: number | string): string {
  const comp = componentsStore.components.find(c => c.id === Number(id))
  return comp?.name ?? `Componente #${id}`
}

function getComponentTypeName(id: number | string): string {
  const comp = componentsStore.components.find(c => c.id === Number(id))
  return comp?.type_name ?? ''
}

// ── Add Section Dialog ────────────────────────────────────────────────────────

const addSectionVisible = ref(false)
const pendingUbicacion = ref<'header' | 'footer'>('header')

function openAddSection(ubicacion: 'header' | 'footer') {
  pendingUbicacion.value = ubicacion
  addSectionVisible.value = true
}

function confirmAddSection(numCols: number) {
  sectionsStore.addSection(activePage.value, pendingUbicacion.value, numCols)
  addSectionVisible.value = false
}

// ── Remove section confirm ────────────────────────────────────────────────────

function confirmRemove(ubicacion: 'header' | 'footer', zoneIdx: number) {
  confirm.require({
    message: '¿Eliminar esta sección? Se perderá la configuración de sus columnas.',
    header: 'Eliminar sección',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: () => sectionsStore.removeSection(activePage.value, ubicacion, zoneIdx),
  })
}

// ── Component Selector (HTML components only) ─────────────────────────────────

const selectorVisible = ref(false)
const selectorSearch = ref('')
const pendingCol = ref<{ ubicacion: 'header' | 'footer'; sIdx: number; cIdx: number } | null>(null)

const filteredComponents = computed(() => {
  const q = selectorSearch.value.toLowerCase().trim()
  return htmlComponents.value.filter(c => !q || c.name.toLowerCase().includes(q))
})

function handleColumnClick(ubicacion: 'header' | 'footer', sIdx: number, cIdx: number) {
  const sections = zoneSections(ubicacion)
  const col = sections[sIdx]?.[cIdx]
  if (col?.bloque_codigo) {
    openBlockConfig(ubicacion, sIdx, cIdx, col)
  } else {
    openSelector(ubicacion, sIdx, cIdx)
  }
}

function openSelector(ubicacion: 'header' | 'footer', sIdx: number, cIdx: number) {
  pendingCol.value = { ubicacion, sIdx, cIdx }
  selectorSearch.value = ''
  selectorVisible.value = true
}

function applyComponent(componentId: number) {
  if (!pendingCol.value) return
  const { ubicacion, sIdx, cIdx } = pendingCol.value
  if (componentId === 0) {
    sectionsStore.clearColumn(activePage.value, ubicacion, sIdx, cIdx)
  } else {
    sectionsStore.assignComponent(activePage.value, ubicacion, sIdx, cIdx, componentId)
  }
  selectorVisible.value = false
  pendingCol.value = null
}

// ── Block Config Dialog ──────────────────────────────────────────────────────

const blockConfigVisible = ref(false)
const blockConfigTarget = ref<{ ubicacion: 'header' | 'footer'; sIdx: number; cIdx: number } | null>(null)
const blockConfigCode = ref('')
const blockConfigForm = ref<BlockConfig>({ titulo: '', bg_color: '', limite: 0, items: [] })
const blockConfigItems = ref<{ id: number; name: string }[]>([])
const blockConfigItemsLoading = ref(false)

// Two-way hex binding for ColorPicker (expects hex without #)
const blockConfigBgHex = computed({
  get: () => (blockConfigForm.value.bg_color || '').replace('#', ''),
  set: (v: string) => { blockConfigForm.value.bg_color = v ? `#${v}` : '' },
})

function blockConfigSummary(col: SectionColumn): string {
  const parts: string[] = []
  if (col.config?.titulo) parts.push(`"${col.config.titulo}"`)
  if (col.config?.limite) parts.push(`máx ${col.config.limite}`)
  if (col.config?.items?.length) parts.push(`${col.config.items.length} seleccionados`)
  if (col.config?.bg_color) parts.push(col.config.bg_color)
  return parts.length ? parts.join(' · ') : 'Bloque predefinido — click para configurar'
}

function openBlockConfig(ubicacion: 'header' | 'footer', sIdx: number, cIdx: number, col: SectionColumn) {
  blockConfigTarget.value = { ubicacion, sIdx, cIdx }
  blockConfigCode.value = col.bloque_codigo!
  blockConfigForm.value = {
    titulo: col.config?.titulo ?? '',
    bg_color: col.config?.bg_color ?? '',
    limite: col.config?.limite ?? 0,
    items: col.config?.items ? [...col.config.items] : [],
  }
  blockConfigVisible.value = true
  loadBlockConfigItems(col.bloque_codigo!)
}

async function loadBlockConfigItems(bloqueCodigo: string) {
  const blockDef = getPredefinedBlock(bloqueCodigo)
  if (!blockDef?.itemsType) {
    blockConfigItems.value = []
    return
  }
  blockConfigItemsLoading.value = true
  blockConfigItems.value = []
  try {
    switch (blockDef.itemsType) {
      case 'categorias': {
        const res = await catalogApi.getCategories()
        blockConfigItems.value = (res.data ?? []).map((c: any) => ({ id: c.id, name: c.name }))
        break
      }
      case 'marcas': {
        const res = await catalogApi.getBrands()
        blockConfigItems.value = (res.data ?? []).map((b: any) => ({ id: b.id, name: b.name }))
        break
      }
      case 'productos': {
        const res = await productsApi.getProducts({ limit: 200 })
        blockConfigItems.value = (res.data ?? []).map((p: any) => ({ id: p.id, name: p.name }))
        break
      }
      case 'listas': {
        const res = await productListApi.getAll()
        blockConfigItems.value = (res.data ?? []).map((l: any) => ({
          id: l.productolista_id ?? l.id,
          name: l.productolista_nombre ?? l.name,
        }))
        break
      }
      case 'combos': {
        const res = await comboApi.getAll()
        blockConfigItems.value = (res.data ?? []).map((c: any) => ({
          id: c.tiendacombo_id ?? c.id,
          name: c.tiendacombo_nombre ?? c.name,
        }))
        break
      }
      case 'gamas': {
        const res = await gammaApi.getAll()
        blockConfigItems.value = (res.data ?? []).map((g: any) => ({
          id: g.tiendagamma_id ?? g.id,
          name: g.tiendagamma_nombre ?? g.name,
        }))
        break
      }
    }
  } catch (e) {
    console.error('Error loading block config items:', e)
  } finally {
    blockConfigItemsLoading.value = false
  }
}

function saveBlockConfig() {
  if (!blockConfigTarget.value) return
  const { ubicacion, sIdx, cIdx } = blockConfigTarget.value
  const config: BlockConfig = {}
  if (blockConfigForm.value.titulo) config.titulo = blockConfigForm.value.titulo
  if (blockConfigForm.value.bg_color) config.bg_color = blockConfigForm.value.bg_color
  if (blockConfigForm.value.limite && blockConfigForm.value.limite > 0) config.limite = blockConfigForm.value.limite
  if (blockConfigForm.value.items?.length) config.items = blockConfigForm.value.items
  sectionsStore.updateBlockConfig(activePage.value, ubicacion, sIdx, cIdx, Object.keys(config).length ? config : undefined as any)
  blockConfigVisible.value = false
}

// ── Save ──────────────────────────────────────────────────────────────────────

async function handleSave() {
  const ok = await sectionsStore.savePage(activePage.value)
  toast.add(
    ok
      ? { severity: 'success', summary: 'Guardado', detail: 'Plantilla guardada correctamente', life: 3000 }
      : { severity: 'error', summary: 'Error', detail: sectionsStore.error ?? 'No se pudo guardar', life: 5000 },
  )
}

// ── Init ──────────────────────────────────────────────────────────────────────

onMounted(async () => {
  componentsLoading.value = true
  await componentsStore.fetchComponents({ limit: 200 })
  componentsLoading.value = false
  await sectionsStore.loadPage(activePage.value)
})
</script>
