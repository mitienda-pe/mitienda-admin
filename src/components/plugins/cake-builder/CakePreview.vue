<script setup lang="ts">
import { computed } from 'vue'
import type { CakeRender } from './types'

/**
 * Vista previa de la torta a partir del snapshot guardado en la orden
 * (`plugin_data.values.snapshot.render`). Misma geometría que el componente
 * del storefront (components/plugins/cake-builder/CakePreview.vue): la foto
 * se posiciona en % del ancho y la perspectiva en `cqw`.
 */

const props = defineProps<{ render: CakeRender }>()

const photo = computed(() => props.render.photo ?? null)
</script>

<template>
  <div
    class="relative w-full overflow-hidden select-none [container-type:inline-size]"
    :style="{ aspectRatio: String(render.stackAspect ?? 1) }"
  >
    <img
      v-for="layer in render.layers ?? []"
      :key="layer.url"
      :src="layer.url"
      :style="{ zIndex: layer.z }"
      class="absolute inset-0 h-full w-full object-contain"
      alt=""
    >
    <div
      v-if="photo"
      class="absolute bottom-0"
      :style="{
        zIndex: photo.z,
        left: `${photo.left}%`,
        top: `${photo.top}cqw`,
        width: `${photo.width}%`,
        perspective: `${photo.perspective}cqw`,
      }"
    >
      <div
        class="w-full overflow-hidden [transform-style:preserve-3d]"
        :style="{
          marginTop: `${photo.faceTop ?? 0}%`,
          marginLeft: `${photo.faceLeft ?? 0}%`,
          aspectRatio: String(photo.aspect),
          transform: `rotateX(${photo.rotateX}deg)`,
          borderRadius: photo.round ? '50%' : '0',
        }"
      >
        <img :src="photo.url" alt="Foto del cliente" class="block h-full w-full object-cover">
      </div>
    </div>
  </div>
</template>
