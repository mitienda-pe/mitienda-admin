<script setup lang="ts">
import { computed } from 'vue'
import { useReadOnly } from '@/composables/useReadOnly'

interface Props {
  /** Módulo a consultar. Por defecto, el que gobierna la ruta actual. */
  module?: string
  /** No mostrar el aviso; útil cuando ya hay uno arriba en la misma pantalla. */
  hideNotice?: boolean
  /** Forzar el modo lectura sin consultar permisos (pedido cerrado, etc.). */
  force?: boolean
}

const props = defineProps<Props>()

const { readOnly } = useReadOnly(props.module)

const isReadOnly = computed(() => props.force || readOnly.value)
</script>

<template>
  <!--
    Envuelve una zona EDITABLE y la vuelve inerte cuando el usuario es de solo
    lectura.

    `inert` es el atributo nativo que apaga toda la interacción de un subárbol:
    clicks, foco, teclado y drag & drop. Esa es la razón de usarlo en vez de
    deshabilitar control por control — las pantallas no tienen solo botones de
    guardar, tienen X para borrar líneas, zonas de arrastre, uploads y decenas
    de inputs, y enumerarlos se desactualiza con cada cambio.

    Envolvé solo las zonas de edición, NO la vista entera: dentro de una tabla
    hay enlaces al detalle y filtros que un usuario de solo lectura sí debe
    poder usar.
  -->
  <div
    v-if="isReadOnly && !hideNotice"
    class="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3"
  >
    <i class="pi pi-eye mt-0.5 text-amber-600"></i>
    <div class="text-sm text-amber-800">
      <p class="font-medium">Solo lectura</p>
      <p>
        Tu usuario puede consultar esta sección pero no modificarla. Pídele
        acceso de edición al dueño de la tienda.
      </p>
    </div>
  </div>

  <div :inert="isReadOnly || undefined" :class="isReadOnly ? 'opacity-60' : undefined">
    <slot />
  </div>
</template>
