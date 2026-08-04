<template>
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
      <div>
        <h3 class="text-sm font-semibold text-secondary">Así se arma tu home</h3>
        <p class="text-xs text-secondary-400 mt-0.5">{{ subtitulo }}</p>
      </div>
      <a
        v-if="storeUrl"
        :href="storeUrl"
        target="_blank"
        rel="noopener"
        class="text-xs font-medium text-primary hover:underline whitespace-nowrap shrink-0"
      >
        Ver mi home <i class="pi pi-external-link text-xs"></i>
      </a>
    </div>

    <div class="p-4 space-y-1.5">
      <template v-if="modo !== 'plantilla'">
        <!-- Carrusel: siempre primero -->
        <div class="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
          <span class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-200 text-secondary-400 shrink-0">
            <i class="pi pi-images text-xs"></i>
          </span>
          <span class="text-xs text-secondary-500">Carrusel</span>
          <span class="text-xs text-secondary-300 ml-auto">automático</span>
        </div>

        <div :class="slotClass(headerCount)">
          <span class="inline-flex items-center justify-center w-6 h-6 rounded-md shrink-0" :class="slotIconClass(headerCount)">
            <i class="pi pi-code text-xs"></i>
          </span>
          <span class="text-xs font-medium">{{ slotLabel(headerCount, 'arriba') }}</span>
        </div>

        <!-- Resto del catálogo automático -->
        <div
          v-for="bloque in restoCatalogo"
          :key="bloque.codigo"
          class="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100"
        >
          <span class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-200 text-secondary-400 shrink-0">
            <i :class="bloque.icon" class="text-xs"></i>
          </span>
          <span class="text-xs text-secondary-500">{{ bloque.label }}</span>
          <span class="text-xs text-secondary-300 ml-auto">automático</span>
        </div>

        <div :class="slotClass(footerCount)">
          <span class="inline-flex items-center justify-center w-6 h-6 rounded-md shrink-0" :class="slotIconClass(footerCount)">
            <i class="pi pi-code text-xs"></i>
          </span>
          <span class="text-xs font-medium">{{ slotLabel(footerCount, 'abajo') }}</span>
        </div>

        <p class="text-xs text-secondary-400 pt-2 leading-relaxed">
          {{
            modo === 'catalogo'
              ? 'Si no tienes banners publicados, el home arranca directo en la grilla de productos.'
              : 'Los bloques automáticos solo aparecen si tienen contenido: sin banners publicados no se muestra el carrusel, sin marcas no se muestra la galería de marcas.'
          }}
        </p>
      </template>

      <template v-else>
        <div
          v-if="headerCount"
          class="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-primary-50/50 border border-primary/30 text-primary"
        >
          <span class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 shrink-0">
            <i class="pi pi-th-large text-xs"></i>
          </span>
          <span class="text-xs font-medium">
            {{ headerCount }} {{ headerCount === 1 ? 'sección' : 'secciones' }} que definiste
          </span>
        </div>
        <div
          v-else
          class="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700"
        >
          <span class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-100 shrink-0">
            <i class="pi pi-exclamation-triangle text-xs"></i>
          </span>
          <span class="text-xs font-medium">Todavía no agregaste ningún bloque</span>
        </div>

        <p class="text-xs text-secondary-400 pt-2 leading-relaxed">
          En este modo el carrusel y el catálogo no se agregan solos: si los quieres, arrástralos
          desde el panel de bloques predefinidos.
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { HOME_AUTO_BLOCKS } from '@/types/template-section.types'
import type { HomeModo } from '@/types/template-section.types'

const props = defineProps<{
  modo: HomeModo
  /** Secciones que el comerciante tiene en cada zona del Home. */
  headerCount: number
  footerCount: number
  storeUrl?: string
}>()

const subtitulo = computed(() => {
  if (props.modo === 'catalogo') return 'Carrusel y catálogo. Tus bloques se intercalan.'
  if (props.modo === 'auto') return 'El carrusel y el catálogo se arman solos. Tus bloques se intercalan.'
  return 'Solo se muestra lo que agregues en el editor.'
})

// El carrusel se dibuja aparte porque los bloques HTML del comerciante van
// justo después de él, igual que compone el storefront.
const restoCatalogo = computed(() =>
  (HOME_AUTO_BLOCKS[props.modo === 'catalogo' ? 'catalogo' : 'auto'] ?? []).slice(1),
)

function slotClass(count: number): string {
  const base = 'flex items-center gap-2.5 px-3 py-2 rounded-lg border border-dashed'
  return count
    ? `${base} bg-primary-50/50 border-primary/40 text-primary`
    : `${base} bg-white border-gray-200 text-secondary-300`
}

function slotIconClass(count: number): string {
  return count ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-secondary-300'
}

function slotLabel(count: number, posicion: string): string {
  if (!count) return `Tus bloques HTML (${posicion}) — ninguno todavía`
  return `${count} ${count === 1 ? 'sección tuya' : 'secciones tuyas'} (${posicion})`
}
</script>
