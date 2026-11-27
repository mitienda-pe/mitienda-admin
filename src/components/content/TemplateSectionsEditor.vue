<template>
  <div class="flex gap-6">
    <!-- Main: Zones editor -->
    <div class="flex-1 min-w-0 space-y-6">
      <slot name="before" />

      <div v-for="zone in zoneList" :key="zone.ubicacion">
        <!-- Zone label (only when more than one zone) -->
        <div v-if="zoneList.length > 1" class="flex items-center gap-3 mb-3">
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
            class="flex flex-col items-center justify-center py-10 px-4 text-center text-secondary-300"
          >
            <i class="pi pi-th-large text-4xl mb-3 opacity-40"></i>
            <p class="text-sm">
              {{ zoneEmptyMessage(zone.ubicacion) }}
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
                <Dropdown
                  v-tooltip.top="'Ancho de la sección'"
                  :model-value="sectionsStore.getSectionWidth(page, zone.ubicacion, sIdx)"
                  :options="SECTION_WIDTH_OPTIONS"
                  option-label="label"
                  option-value="value"
                  class="w-36 text-xs"
                  @update:model-value="sectionsStore.setSectionWidth(page, zone.ubicacion, sIdx, $event)"
                >
                  <template #option="{ option }">
                    <div>
                      <div class="flex items-center gap-2 text-sm">
                        <i :class="option.icon" class="text-xs"></i>
                        <span>{{ option.label }}</span>
                      </div>
                      <p class="text-xs text-secondary-400 mt-0.5">{{ option.descripcion }}</p>
                    </div>
                  </template>
                </Dropdown>
                <Button
                  v-tooltip.top="'Mover arriba'"
                  icon="pi pi-angle-up"
                  text rounded size="small" severity="secondary"
                  :disabled="sIdx === 0"
                  @click="sectionsStore.moveSectionUp(page, zone.ubicacion, sIdx)"
                />
                <Button
                  v-tooltip.top="'Mover abajo'"
                  icon="pi pi-angle-down"
                  text rounded size="small" severity="secondary"
                  :disabled="sIdx === zoneSections(zone.ubicacion).length - 1"
                  @click="sectionsStore.moveSectionDown(page, zone.ubicacion, sIdx, zoneSections(zone.ubicacion).length)"
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
                          @click.stop="sectionsStore.clearColumn(page, zone.ubicacion, sIdx, cIdx)"
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
                        @click.stop="sectionsStore.clearColumn(page, zone.ubicacion, sIdx, cIdx)"
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
      <slot name="aside" />

      <!-- Predefined Blocks -->
      <div v-if="showPredefinedBlocks" class="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div class="px-4 py-3 border-b border-gray-100">
          <h3 class="text-sm font-semibold text-secondary">Bloques predefinidos</h3>
          <p class="text-xs text-secondary-400 mt-0.5">Arrastra al área de contenido</p>
        </div>
        <div class="p-2 space-y-1">
          <div
            v-for="block in availableBlocks"
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
          :key="layout.key"
          class="flex flex-col items-center gap-3 p-5 border-2 rounded-xl transition-all text-center hover:border-primary hover:bg-primary-50 border-gray-200"
          @click="confirmAddSection(layout.colBs)"
        >
          <div class="flex gap-1.5 w-full h-8">
            <div
              v-for="(bs, i) in layout.colBs"
              :key="i"
              class="bg-gray-200 rounded-md"
              :style="{ flexGrow: bs, flexBasis: 0 }"
            ></div>
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
          <p class="text-xs text-secondary-400 mt-1">
            {{ ['listas', 'producto'].includes(blockConfigCode) ? 'Dejar vacío para no mostrar título' : 'Dejar vacío para usar el título por defecto' }}
          </p>
        </div>

        <!-- Subtitle. El carrusel no dibuja encabezado, así que ahí el campo
             prometería un texto que nunca sale. -->
        <div v-if="blockConfigCode !== 'carrusel'">
          <label class="block text-sm font-medium text-secondary mb-1.5">Subtítulo</label>
          <InputText
            v-model="blockConfigForm.subtitulo"
            class="w-full"
            placeholder="Texto bajo el título"
          />
          <p class="text-xs text-secondary-400 mt-1">
            Dejar vacío para usar el subtítulo por defecto de la tienda.
          </p>
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

        <!-- Origen (solo bloque `categorias`): primer nivel o hijas de una madre -->
        <div v-if="blockConfigCode === 'categorias'">
          <label class="block text-sm font-medium text-secondary mb-1.5">Qué mostrar</label>
          <Dropdown
            v-model="blockConfigForm.padre"
            :options="blockCategoryParentOptions"
            option-label="name"
            option-value="id"
            :loading="blockConfigItemsLoading"
            class="w-full"
            filter
            @change="onBlockCategoryParentChange"
          />
          <p class="text-xs text-secondary-400 mt-1">
            Elige una categoría con subcategorías para armar un bloque aparte, por ejemplo "Compra por ambiente".
          </p>
        </div>

        <!-- Limit -->
        <div v-if="!getPredefinedBlock(blockConfigCode)?.sinLimite">
          <label class="block text-sm font-medium text-secondary mb-1.5">
            {{ getPredefinedBlock(blockConfigCode)?.limiteLabel || 'Cantidad de items a mostrar' }}
          </label>
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

        <!-- Cuántas listas (solo bloque `listas`) -->
        <div v-if="blockConfigCode === 'listas'">
          <label class="block text-sm font-medium text-secondary mb-1.5">Cantidad de listas</label>
          <InputNumber
            v-model="blockConfigForm.limite_listas"
            :min="0"
            :max="20"
            placeholder="0"
            class="w-full"
            showButtons
          />
          <p class="text-xs text-secondary-400 mt-1">
            0 = todas. Se ignora si abajo eliges listas específicas.
          </p>
        </div>

        <!-- Producto (bloque `producto`): uno solo, con buscador -->
        <div v-if="getPredefinedBlock(blockConfigCode)?.productoUnico">
          <label class="block text-sm font-medium text-secondary mb-1.5">Producto</label>
          <AutoComplete
            v-model="blockProductQuery"
            :suggestions="blockProductResults"
            option-label="name"
            placeholder="Buscar producto por nombre..."
            class="w-full"
            input-class="w-full"
            dropdown
            force-selection
            :disabled="blockConfigItemsLoading"
            @complete="searchBlockProducts"
            @item-select="onBlockProductSelect"
            @clear="blockConfigForm.items = []"
          >
            <template #option="{ option }">
              <div class="flex items-center gap-2">
                <img
                  v-if="option.images?.[0]"
                  :src="option.images[0].thumbnail || option.images[0].url"
                  class="w-8 h-8 object-cover rounded"
                />
                <span class="text-sm">{{ option.name }}</span>
              </div>
            </template>
          </AutoComplete>
          <p class="text-xs text-secondary-400 mt-1">
            Si el producto se despublica o se queda sin datos, el bloque no se muestra.
          </p>
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
  </div>
</template>

<script setup lang="ts">
/**
 * Editor de secciones y bloques: el lienzo de zonas, el panel de bloques
 * predefinidos/componentes HTML y los diálogos para configurarlos.
 *
 * Lo usan la Plantilla (TemplateBuilderView, una pestaña por página de la
 * tienda) y las páginas de bloques (PageEditView). Opera sobre el layout que
 * `useTemplateSectionsStore` tiene bajo la clave `page`; leerlo y guardarlo es
 * cosa de quien lo monta.
 */
import { ref, computed, onMounted } from 'vue'
import { useTemplateSectionsStore } from '@/stores/template-sections.store'
import { useComponentsStore } from '@/stores/components.store'
import { useConfirm } from 'primevue/useconfirm'
import {
  COLUMN_LAYOUTS,
  ZONE_LABELS,
  PREDEFINED_BLOCKS,
  SECTION_WIDTH_OPTIONS,
} from '@/types/template-section.types'
import type { SectionColumn, BlockConfig, ZoneKey } from '@/types/template-section.types'
import type { Category, Product } from '@/types/product.types'
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
import AutoComplete from 'primevue/autocomplete'
import ColorPicker from 'primevue/colorpicker'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import ProgressSpinner from 'primevue/progressspinner'
import Dropdown from 'primevue/dropdown'

const props = withDefaults(defineProps<{
  /** Clave del layout en el store (1-6 = páginas de la plantilla). */
  page: number
  /** Zonas editables, en orden. Con más de una se rotula cada una. */
  zones: ZoneKey[]
  /** Ofrecer el panel de bloques predefinidos. */
  showPredefinedBlocks?: boolean
  /** Texto de una zona vacía. Sin él, una invitación genérica. */
  emptyMessage?: (ubicacion: ZoneKey) => string
  /** Códigos de bloques predefinidos que no se ofrecen aquí (no tienen renderer
   *  en el destino). */
  excludeBlocks?: string[]
}>(), {
  showPredefinedBlocks: true,
  emptyMessage: undefined,
  excludeBlocks: () => [],
})

const sectionsStore = useTemplateSectionsStore()
const componentsStore = useComponentsStore()
const confirm = useConfirm()

const availableBlocks = computed(() =>
  PREDEFINED_BLOCKS.filter(b => !props.excludeBlocks.includes(b.codigo)),
)

const zoneList = computed(() => props.zones.map(z => ({ ubicacion: z })))

function zoneEmptyMessage(ubicacion: ZoneKey): string {
  return props.emptyMessage?.(ubicacion) ?? 'Arrastra bloques desde el panel o agrega una nueva sección.'
}

// ── Sections helpers ──────────────────────────────────────────────────────────

function zoneSections(ubicacion: ZoneKey): SectionColumn[][] {
  return sectionsStore.getSections(props.page, ubicacion)
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

function handleDrop(ubicacion: ZoneKey, sIdx: number, cIdx: number) {
  if (!draggedBlock.value) return
  const codigo = draggedBlock.value
  sectionsStore.assignBlock(props.page, ubicacion, sIdx, cIdx, codigo)
  draggedBlock.value = null
  dragOverKey.value = null
  // Un bloque de producto sin producto elegido no se pinta en la tienda: se abre
  // la configuración de una vez para que no quede una columna vacía sin aviso.
  if (getPredefinedBlock(codigo)?.productoUnico) {
    const col = zoneSections(ubicacion)[sIdx]?.[cIdx]
    if (col) openBlockConfig(ubicacion, sIdx, cIdx, col)
  }
}

function colSlotClass(col: SectionColumn, ubicacion: ZoneKey, sIdx: number, cIdx: number): string {
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
const pendingUbicacion = ref<ZoneKey>('header')

function openAddSection(ubicacion: ZoneKey) {
  pendingUbicacion.value = ubicacion
  addSectionVisible.value = true
}

function confirmAddSection(colBs: number[]) {
  sectionsStore.addSection(props.page, pendingUbicacion.value, colBs)
  addSectionVisible.value = false
}

// ── Remove section confirm ────────────────────────────────────────────────────

function confirmRemove(ubicacion: ZoneKey, zoneIdx: number) {
  confirm.require({
    message: '¿Eliminar esta sección? Se perderá la configuración de sus columnas.',
    header: 'Eliminar sección',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: () => sectionsStore.removeSection(props.page, ubicacion, zoneIdx),
  })
}

// ── Component Selector (HTML components only) ─────────────────────────────────

const selectorVisible = ref(false)
const selectorSearch = ref('')
const pendingCol = ref<{ ubicacion: ZoneKey; sIdx: number; cIdx: number } | null>(null)

const filteredComponents = computed(() => {
  const q = selectorSearch.value.toLowerCase().trim()
  return htmlComponents.value.filter(c => !q || c.name.toLowerCase().includes(q))
})

function handleColumnClick(ubicacion: ZoneKey, sIdx: number, cIdx: number) {
  const sections = zoneSections(ubicacion)
  const col = sections[sIdx]?.[cIdx]
  if (col?.bloque_codigo) {
    openBlockConfig(ubicacion, sIdx, cIdx, col)
  } else {
    openSelector(ubicacion, sIdx, cIdx)
  }
}

function openSelector(ubicacion: ZoneKey, sIdx: number, cIdx: number) {
  pendingCol.value = { ubicacion, sIdx, cIdx }
  selectorSearch.value = ''
  selectorVisible.value = true
}

function applyComponent(componentId: number) {
  if (!pendingCol.value) return
  const { ubicacion, sIdx, cIdx } = pendingCol.value
  if (componentId === 0) {
    sectionsStore.clearColumn(props.page, ubicacion, sIdx, cIdx)
  } else {
    sectionsStore.assignComponent(props.page, ubicacion, sIdx, cIdx, componentId)
  }
  selectorVisible.value = false
  pendingCol.value = null
}

// ── Block Config Dialog ──────────────────────────────────────────────────────

const blockConfigVisible = ref(false)
const blockConfigTarget = ref<{ ubicacion: ZoneKey; sIdx: number; cIdx: number } | null>(null)
const blockConfigCode = ref('')
const blockConfigForm = ref<BlockConfig>({ titulo: '', subtitulo: '', bg_color: '', limite: 0, limite_listas: 0, items: [], padre: 0 })
const blockConfigItems = ref<{ id: number; name: string }[]>([])
const blockConfigItemsLoading = ref(false)
// Bloque `categorias`: árbol completo, para ofrecer como origen el primer nivel
// o las hijas de cualquier categoría que las tenga.
const blockCategoryTree = ref<Category[]>([])

function findBlockCategory(nodes: Category[], id: number): Category | null {
  for (const node of nodes) {
    if (node.id === id) return node
    const match = findBlockCategory(node.sub ?? [], id)
    if (match) return match
  }
  return null
}

const blockCategoryParentOptions = computed(() => {
  const options = [{ id: 0, name: 'Categorías principales' }]
  const walk = (nodes: Category[]) => {
    for (const node of nodes) {
      if (!node.sub?.length) continue
      options.push({ id: node.id, name: `Subcategorías de ${node.name}` })
      walk(node.sub)
    }
  }
  walk(blockCategoryTree.value)
  return options
})

function refreshBlockCategoryItems() {
  const padre = blockConfigForm.value.padre || 0
  const level = padre
    ? (findBlockCategory(blockCategoryTree.value, padre)?.sub ?? [])
    : blockCategoryTree.value
  blockConfigItems.value = level.map(c => ({ id: c.id, name: c.name }))
}

// Los `items` elegidos son de otro nivel: no aplican al nuevo origen.
function onBlockCategoryParentChange() {
  blockConfigForm.value.items = []
  refreshBlockCategoryItems()
}
// Picker del bloque `producto`: el AutoComplete guarda el objeto elegido (o el
// texto tipeado mientras se busca).
const blockProductQuery = ref<Product | string | null>(null)
const blockProductResults = ref<Product[]>([])

// Two-way hex binding for ColorPicker (expects hex without #)
const blockConfigBgHex = computed({
  get: () => (blockConfigForm.value.bg_color || '').replace('#', ''),
  set: (v: string) => { blockConfigForm.value.bg_color = v ? `#${v}` : '' },
})

function blockConfigSummary(col: SectionColumn): string {
  const parts: string[] = []
  if (col.config?.titulo) parts.push(`"${col.config.titulo}"`)
  if (col.config?.padre) parts.push('subcategorías')
  if (col.config?.limite) parts.push(`máx ${col.config.limite}`)
  if (col.config?.limite_listas) parts.push(`${col.config.limite_listas} listas`)
  if (getPredefinedBlock(col.bloque_codigo ?? '')?.productoUnico) {
    parts.push(col.config?.items?.length ? '1 producto' : 'Sin producto — click para elegir')
  } else if (col.config?.items?.length) {
    parts.push(`${col.config.items.length} seleccionados`)
  }
  if (col.config?.bg_color) parts.push(col.config.bg_color)
  return parts.length ? parts.join(' · ') : 'Bloque predefinido — click para configurar'
}

function openBlockConfig(ubicacion: ZoneKey, sIdx: number, cIdx: number, col: SectionColumn) {
  blockConfigTarget.value = { ubicacion, sIdx, cIdx }
  blockConfigCode.value = col.bloque_codigo!
  blockConfigForm.value = {
    titulo: col.config?.titulo ?? '',
    subtitulo: col.config?.subtitulo ?? '',
    bg_color: col.config?.bg_color ?? '',
    limite: col.config?.limite ?? 0,
    limite_listas: col.config?.limite_listas ?? 0,
    items: col.config?.items ? [...col.config.items] : [],
    padre: col.config?.padre ?? 0,
  }
  blockConfigVisible.value = true
  loadBlockConfigItems(col.bloque_codigo!)
}

async function loadBlockConfigItems(bloqueCodigo: string) {
  const blockDef = getPredefinedBlock(bloqueCodigo)
  blockProductQuery.value = null
  blockProductResults.value = []
  if (blockDef?.productoUnico) {
    await loadSelectedBlockProduct()
    return
  }
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
        blockCategoryTree.value = res.data ?? []
        // La madre guardada pudo borrarse o quedarse sin hijas: vuelve al primer nivel.
        if (!blockCategoryParentOptions.value.some(o => o.id === (blockConfigForm.value.padre || 0))) {
          blockConfigForm.value.padre = 0
          blockConfigForm.value.items = []
        }
        refreshBlockCategoryItems()
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

// Muestra en el buscador el producto ya guardado (la config solo tiene el id).
async function loadSelectedBlockProduct() {
  const id = Number(blockConfigForm.value.items?.[0])
  if (!id) return
  blockConfigItemsLoading.value = true
  try {
    const res = await productsApi.getProducts({ ids: [id], limit: 1 })
    blockProductQuery.value = res.data?.[0] ?? null
  } catch (e) {
    console.error('Error loading block product:', e)
  } finally {
    blockConfigItemsLoading.value = false
  }
}

async function searchBlockProducts(event: { query: string }) {
  try {
    const res = await productsApi.getProducts({ search: event.query || undefined, limit: 10 })
    blockProductResults.value = res.data || []
  } catch {
    blockProductResults.value = []
  }
}

function onBlockProductSelect(event: { value: Product }) {
  blockConfigForm.value.items = event.value?.id ? [Number(event.value.id)] : []
}

function saveBlockConfig() {
  if (!blockConfigTarget.value) return
  const { ubicacion, sIdx, cIdx } = blockConfigTarget.value
  const config: BlockConfig = {}
  if (blockConfigForm.value.titulo) config.titulo = blockConfigForm.value.titulo
  if (blockConfigForm.value.subtitulo) config.subtitulo = blockConfigForm.value.subtitulo
  if (blockConfigForm.value.bg_color) config.bg_color = blockConfigForm.value.bg_color
  if (blockConfigForm.value.limite && blockConfigForm.value.limite > 0) config.limite = blockConfigForm.value.limite
  if (blockConfigCode.value === 'listas' && blockConfigForm.value.limite_listas && blockConfigForm.value.limite_listas > 0) {
    config.limite_listas = blockConfigForm.value.limite_listas
  }
  if (blockConfigCode.value === 'categorias' && blockConfigForm.value.padre) config.padre = blockConfigForm.value.padre
  if (blockConfigForm.value.items?.length) config.items = blockConfigForm.value.items
  sectionsStore.updateBlockConfig(props.page, ubicacion, sIdx, cIdx, Object.keys(config).length ? config : undefined as any)
  blockConfigVisible.value = false
}

onMounted(async () => {
  componentsLoading.value = true
  try {
    await componentsStore.fetchComponents({ limit: 200 })
  } finally {
    componentsLoading.value = false
  }
})
</script>
