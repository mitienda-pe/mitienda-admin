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
        :disabled="!isPageLoaded"
        @click="handleSave"
      />
    </div>

    <!-- La plantilla no se pudo leer: guardar ahora la sobrescribiría con un
         layout vacío, así que se bloquea hasta recargar. -->
    <Message v-if="loadFailed" severity="error" :closable="false" class="mb-6">
      No pudimos cargar tu plantilla. Recarga la página antes de editar; si guardas ahora
      podrías borrar lo que tienes configurado.
    </Message>

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
    <TemplateSectionsEditor
      v-else
      :page="activePage"
      :zones="activeZones"
      :show-predefined-blocks="showPredefinedBlocks"
      :empty-message="emptyZoneMessage"
    >
      <template #before>
        <!-- Selector de modo (solo Home) -->
        <div v-if="isHome" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button
            v-for="mode in HOME_MODES"
            :key="mode.value"
            type="button"
            class="text-left p-4 rounded-xl border-2 transition-all"
            :class="
              homeModo === mode.value
                ? 'border-primary bg-primary-50/40 shadow-sm'
                : 'border-gray-200 bg-white hover:border-primary/40'
            "
            @click="selectHomeModo(mode.value)"
          >
            <div class="flex items-center gap-2.5 mb-1.5">
              <span
                class="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                :class="homeModo === mode.value ? 'bg-primary text-white' : 'bg-gray-100 text-secondary-400'"
              >
                <i :class="mode.icon" class="text-sm"></i>
              </span>
              <span class="text-sm font-semibold text-secondary">{{ mode.label }}</span>
              <i v-if="homeModo === mode.value" class="pi pi-check-circle text-primary ml-auto"></i>
            </div>
            <p class="text-xs text-secondary-500 leading-relaxed">{{ mode.descripcion }}</p>
          </button>
        </div>
      </template>

      <template #aside>
        <!-- Esquema del home: reemplaza al lienzo en blanco como explicación -->
        <HomeModePreview
          v-if="isHome"
          :modo="homeModo"
          :header-count="zoneSections('header').length"
          :footer-count="zoneSections('footer').length"
          :store-url="storeUrl"
        />
      </template>
    </TemplateSectionsEditor>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTemplateSectionsStore } from '@/stores/template-sections.store'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { PAGE_DEFINITIONS, HOME_MODES } from '@/types/template-section.types'
import type { SectionColumn, HomeModo, ZoneKey } from '@/types/template-section.types'
import { useAuthStore } from '@/stores/auth.store'
import HomeModePreview from '@/components/content/HomeModePreview.vue'
import TemplateSectionsEditor from '@/components/content/TemplateSectionsEditor.vue'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'

const sectionsStore = useTemplateSectionsStore()
const authStore = useAuthStore()
const toast = useToast()
const confirm = useConfirm()

// ── Page state ────────────────────────────────────────────────────────────────

const HOME_PAGE = 1

const activePage = ref(PAGE_DEFINITIONS[0].id)
const activePageDef = computed(() => PAGE_DEFINITIONS.find(p => p.id === activePage.value))
const isHome = computed(() => activePage.value === HOME_PAGE)

// En modo automático el Home solo acepta bloques HTML, así que la zona `footer`
// (debajo del catálogo) tiene sentido; en modo a medida el storefront lee
// únicamente `header`, por lo que ofrecer dos zonas confundiría.
const activeZones = computed(() => {
  const zones = activePageDef.value?.zones ?? ['header']
  const usable = isHome.value && homeModo.value === 'plantilla' ? ['header'] : zones
  return usable as ZoneKey[]
})

const isPageLoaded = computed(() => sectionsStore.loadedPages.has(activePage.value))
// Exige el `error` del store, no solo "no cargada": antes del primer fetch la
// página tampoco está cargada y el aviso aparecería en falso.
const loadFailed = computed(() => !!sectionsStore.error && !isPageLoaded.value)

const storeUrl = computed(() => authStore.selectedStore?.url || undefined)

async function selectPage(pageId: number) {
  activePage.value = pageId
  await sectionsStore.loadPage(pageId)
}

// ── Modo del Home ─────────────────────────────────────────────────────────────

const homeModo = computed<HomeModo>(() => sectionsStore.homeModo)

// Los bloques predefinidos solo se ofrecen donde el storefront los va a pintar:
// en el Home automático los aporta el propio layout, no la plantilla.
const showPredefinedBlocks = computed(() => !isHome.value || homeModo.value === 'plantilla')

function selectHomeModo(modo: HomeModo) {
  if (modo === homeModo.value) return

  // Al salir de "a medida" los bloques predefinidos dejan de pintarse: el layout
  // automático ya aporta carrusel y catálogo. No se borran del JSON, así que
  // volver a "a medida" los recupera tal cual.
  const perderaBloques =
    modo !== 'plantilla' &&
    zoneSections('header').some(cols => cols.some(col => !!col.bloque_codigo))

  if (perderaBloques) {
    const destino = HOME_MODES.find(m => m.value === modo)?.label ?? modo
    confirm.require({
      message: `En "${destino}" el home se arma solo, así que tus bloques predefinidos se ignorarán. No se borran: vuelven a aplicarse si regresas a "Home a medida".`,
      header: `Cambiar a ${destino}`,
      icon: 'pi pi-info-circle',
      acceptLabel: 'Cambiar',
      rejectLabel: 'Cancelar',
      accept: () => sectionsStore.setHomeModo(modo),
    })
    return
  }

  sectionsStore.setHomeModo(modo)
}

function emptyZoneMessage(ubicacion: ZoneKey): string {
  if (isHome.value && homeModo.value !== 'plantilla') {
    const arriba = homeModo.value === 'catalogo'
      ? 'Tu home ya muestra el carrusel y tu catálogo de productos. Agrega una sección si quieres poner contenido propio justo debajo del carrusel.'
      : 'Tu home ya muestra el carrusel y tu catálogo. Agrega una sección si quieres poner contenido propio justo debajo del carrusel.'
    return ubicacion === 'header'
      ? arriba
      : 'Agrega una sección si quieres poner contenido propio debajo del catálogo.'
  }
  if (ubicacion === 'pre_descripcion' || ubicacion === 'descripcion') {
    const donde = ubicacion === 'pre_descripcion' ? 'encima de' : 'debajo de'
    return `Lo que agregues aquí aparece ${donde} la descripción de todos tus productos. Ideal para textos de marca, garantía o envíos que hoy repites en cada ficha.`
  }
  return 'Arrastra bloques desde el panel o agrega una nueva sección.'
}

function zoneSections(ubicacion: ZoneKey): SectionColumn[][] {
  return sectionsStore.getSections(activePage.value, ubicacion)
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
  await sectionsStore.loadPage(activePage.value)
})
</script>
