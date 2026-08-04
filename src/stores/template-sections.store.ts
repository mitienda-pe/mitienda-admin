import { defineStore } from 'pinia'
import { ref } from 'vue'
import { templateSectionsApi } from '@/api/template-sections.api'
import type { PageSection, SectionColumn, BlockConfig, HomeModo } from '@/types/template-section.types'

const HOME_PAGE = 1

function emptyColumn(posicion: number, colBotstrap: number): SectionColumn {
  return { posicion, colBotstrap, componente_id: 0 }
}

export const useTemplateSectionsStore = defineStore('template-sections', () => {
  // pageId → flat array of sections (header + footer mixed, same as API format)
  const pagesData = ref<Map<number, PageSection[]>>(new Map())
  const loadedPages = ref<Set<number>>(new Set())
  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref<string | null>(null)
  // Modo del Home (página 1). Ver HOME_MODES en los tipos.
  const homeModo = ref<HomeModo>('auto')

  // ── Load ───────────────────────────────────────────────────────────────────

  async function loadPage(page: number) {
    if (loadedPages.value.has(page)) return

    try {
      isLoading.value = true
      error.value = null
      const { sections, modo } = await templateSectionsApi.getPage(page)
      pagesData.value.set(page, sections)
      loadedPages.value.add(page)
      if (page === HOME_PAGE) homeModo.value = modo
    } catch (err: any) {
      // Solo el 404 significa "todavía no hay plantilla" y permite arrancar en
      // blanco. Cualquier otro error deja la página SIN cargar y con `error`
      // puesto: si se aceptara como lienzo vacío, un fallo transitorio seguido
      // de "Guardar" sobrescribiría la plantilla real con un array vacío.
      if (err.response?.status === 404) {
        pagesData.value.set(page, [])
        loadedPages.value.add(page)
      } else {
        error.value = err.response?.data?.message || 'Error al cargar la plantilla'
      }
    } finally {
      isLoading.value = false
    }
  }

  // ── Save ───────────────────────────────────────────────────────────────────

  async function savePage(page: number): Promise<boolean> {
    // Nunca guardar sobre una página que no se pudo leer (ver loadPage).
    if (!loadedPages.value.has(page)) {
      error.value = 'No se pudo cargar la plantilla. Recarga la página antes de guardar.'
      return false
    }

    try {
      isSaving.value = true
      error.value = null
      const sections = pagesData.value.get(page) ?? []
      const modo = page === HOME_PAGE ? homeModo.value : undefined
      return await templateSectionsApi.savePage(page, sections, modo)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al guardar'
      return false
    } finally {
      isSaving.value = false
    }
  }

  function setHomeModo(modo: HomeModo) {
    homeModo.value = modo
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  function getSections(page: number, ubicacion: 'header' | 'footer'): SectionColumn[][] {
    const all = pagesData.value.get(page) ?? []
    return all.filter(s => s.ubicacion === ubicacion).map(s => s.columnas)
  }

  // ── Section mutations ──────────────────────────────────────────────────────

  // colBsList = ancho bootstrap (base 12) de cada columna; su longitud define el
  // número de columnas y soporta proporciones asimétricas (ej. [8, 4] = 2:1).
  function addSection(page: number, ubicacion: 'header' | 'footer', colBsList: number[]) {
    const columnas: SectionColumn[] = colBsList.map((colBs, i) =>
      emptyColumn(i + 1, colBs),
    )
    const all = [...(pagesData.value.get(page) ?? [])]
    all.push({ ubicacion, columnas })
    pagesData.value.set(page, all)
  }

  function removeSection(page: number, ubicacion: 'header' | 'footer', zoneIdx: number) {
    const all = pagesData.value.get(page) ?? []
    let count = 0
    const newAll = all.filter(s => {
      if (s.ubicacion !== ubicacion) return true
      return count++ !== zoneIdx
    })
    pagesData.value.set(page, newAll)
  }

  function moveSectionUp(page: number, ubicacion: 'header' | 'footer', zoneIdx: number) {
    if (zoneIdx <= 0) return
    _swapInZone(page, ubicacion, zoneIdx, zoneIdx - 1)
  }

  function moveSectionDown(page: number, ubicacion: 'header' | 'footer', zoneIdx: number, total: number) {
    if (zoneIdx >= total - 1) return
    _swapInZone(page, ubicacion, zoneIdx, zoneIdx + 1)
  }

  function _swapInZone(page: number, ubicacion: 'header' | 'footer', fromZone: number, toZone: number) {
    const all = [...(pagesData.value.get(page) ?? [])]
    // Collect global indices for this zone
    const zoneGlobalIdx: number[] = []
    all.forEach((s, i) => { if (s.ubicacion === ubicacion) zoneGlobalIdx.push(i) })

    const a = zoneGlobalIdx[fromZone]
    const b = zoneGlobalIdx[toZone]
    if (a === undefined || b === undefined) return
    ;[all[a], all[b]] = [all[b], all[a]]
    pagesData.value.set(page, all)
  }

  function _updateColumn(
    page: number,
    ubicacion: 'header' | 'footer',
    zoneIdx: number,
    colIdx: number,
    patch: Partial<SectionColumn>,
  ) {
    const all = pagesData.value.get(page) ?? []
    let count = 0
    const newAll = all.map(s => {
      if (s.ubicacion !== ubicacion) return s
      if (count++ !== zoneIdx) return s
      return {
        ...s,
        columnas: s.columnas.map((c, i) => (i === colIdx ? { ...c, ...patch } : c)),
      }
    })
    pagesData.value.set(page, newAll)
  }

  function assignComponent(
    page: number,
    ubicacion: 'header' | 'footer',
    zoneIdx: number,
    colIdx: number,
    componentId: number,
  ) {
    _updateColumn(page, ubicacion, zoneIdx, colIdx, {
      componente_id: componentId,
      bloque_codigo: undefined,
    })
  }

  function assignBlock(
    page: number,
    ubicacion: 'header' | 'footer',
    zoneIdx: number,
    colIdx: number,
    bloqueCodigo: string,
  ) {
    _updateColumn(page, ubicacion, zoneIdx, colIdx, {
      bloque_codigo: bloqueCodigo,
      componente_id: 0,
    })
  }

  function updateBlockConfig(
    page: number,
    ubicacion: 'header' | 'footer',
    zoneIdx: number,
    colIdx: number,
    config: BlockConfig,
  ) {
    _updateColumn(page, ubicacion, zoneIdx, colIdx, { config })
  }

  function clearColumn(
    page: number,
    ubicacion: 'header' | 'footer',
    zoneIdx: number,
    colIdx: number,
  ) {
    _updateColumn(page, ubicacion, zoneIdx, colIdx, {
      componente_id: 0,
      bloque_codigo: undefined,
    })
  }

  return {
    isLoading,
    isSaving,
    error,
    homeModo,
    loadedPages,
    setHomeModo,
    loadPage,
    savePage,
    getSections,
    addSection,
    removeSection,
    moveSectionUp,
    moveSectionDown,
    assignComponent,
    assignBlock,
    updateBlockConfig,
    clearColumn,
  }
})
