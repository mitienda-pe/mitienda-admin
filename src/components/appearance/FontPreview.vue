<script setup lang="ts">
import type { StoreTypographyConfig } from '@/types/appearance.types'

interface Props {
  typography: StoreTypographyConfig
}

defineProps<Props>()

function scaled(base: number, scale: number): string {
  return Math.round(base * scale) + 'px'
}
</script>

<template>
  <div class="rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white">
    <div class="text-xs text-gray-400 text-center py-1.5 bg-gray-50 border-b border-gray-200">
      Vista Previa — Tipografía
    </div>

    <div class="w-full">
      <!-- Header -->
      <div class="px-4 py-3 bg-gray-800 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-5 h-5 rounded-full bg-primary" />
          <span
            class="font-semibold text-white"
            :style="{
              fontFamily: `'${typography.header.headingFont}', sans-serif`,
              fontSize: scaled(14, typography.scale),
            }"
          >Mi Tienda</span>
        </div>
        <div class="flex items-center gap-1">
          <i class="pi pi-search text-xs text-gray-400" />
          <i class="pi pi-shopping-cart text-xs text-gray-400 ml-1" />
        </div>
      </div>

      <!-- Navbar -->
      <div class="px-4 py-2 bg-gray-700 flex items-center gap-3">
        <span
          class="text-xs font-medium text-white border-b border-white"
          :style="{
            fontFamily: `'${typography.navbar.bodyFont}', sans-serif`,
            fontSize: scaled(12, typography.scale),
          }"
        >Inicio</span>
        <span
          class="text-xs text-gray-300"
          :style="{
            fontFamily: `'${typography.navbar.bodyFont}', sans-serif`,
            fontSize: scaled(12, typography.scale),
          }"
        >Catálogo</span>
        <span
          class="text-xs text-gray-300"
          :style="{
            fontFamily: `'${typography.navbar.bodyFont}', sans-serif`,
            fontSize: scaled(12, typography.scale),
          }"
        >Ofertas</span>
      </div>

      <!-- Body -->
      <div class="px-4 py-4 bg-gray-50">
        <h3
          class="font-bold mb-1 text-gray-900"
          :style="{
            fontFamily: `'${typography.body.headingFont}', sans-serif`,
            fontSize: scaled(15, typography.scale),
          }"
        >Productos Destacados</h3>
        <p
          class="mb-3 text-gray-600"
          :style="{
            fontFamily: `'${typography.body.bodyFont}', sans-serif`,
            fontSize: scaled(12, typography.scale),
          }"
        >
          Descubre nuestra selección especial.
          <span class="underline text-primary">Ver todo</span>
        </p>

        <div class="grid grid-cols-2 gap-2 mb-3">
          <div class="bg-white rounded border border-gray-200 overflow-hidden">
            <div class="bg-gray-100 h-14 flex items-center justify-center">
              <i class="pi pi-image text-gray-300 text-lg" />
            </div>
            <div class="p-2">
              <div
                class="font-medium truncate text-gray-900"
                :style="{
                  fontFamily: `'${typography.body.headingFont}', sans-serif`,
                  fontSize: scaled(12, typography.scale),
                }"
              >Producto 1</div>
              <div
                class="mt-0.5 text-gray-600"
                :style="{
                  fontFamily: `'${typography.body.bodyFont}', sans-serif`,
                  fontSize: scaled(11, typography.scale),
                }"
              >S/ 49.90</div>
              <button
                class="w-full mt-1.5 py-1 rounded bg-primary text-white"
                :style="{
                  fontFamily: `'${typography.body.bodyFont}', sans-serif`,
                  fontSize: scaled(11, typography.scale),
                }"
              >Comprar</button>
            </div>
          </div>
          <div class="bg-white rounded border border-gray-200 overflow-hidden">
            <div class="bg-gray-100 h-14 flex items-center justify-center">
              <i class="pi pi-image text-gray-300 text-lg" />
            </div>
            <div class="p-2">
              <div
                class="font-medium truncate text-gray-900"
                :style="{
                  fontFamily: `'${typography.body.headingFont}', sans-serif`,
                  fontSize: scaled(12, typography.scale),
                }"
              >Producto 2</div>
              <div
                class="mt-0.5 text-gray-600"
                :style="{
                  fontFamily: `'${typography.body.bodyFont}', sans-serif`,
                  fontSize: scaled(11, typography.scale),
                }"
              >S/ 79.90</div>
              <button
                class="w-full mt-1.5 py-1 rounded bg-primary text-white"
                :style="{
                  fontFamily: `'${typography.body.bodyFont}', sans-serif`,
                  fontSize: scaled(11, typography.scale),
                }"
              >Comprar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-4 py-3 bg-gray-800">
        <div
          class="font-semibold mb-1 text-white"
          :style="{
            fontFamily: `'${typography.footer.headingFont}', sans-serif`,
            fontSize: scaled(13, typography.scale),
          }"
        >Mi Tienda</div>
        <div
          class="mb-1 text-gray-400"
          :style="{
            fontFamily: `'${typography.footer.bodyFont}', sans-serif`,
            fontSize: scaled(11, typography.scale),
          }"
        >Tu tienda de confianza</div>
        <div class="flex gap-2">
          <span
            class="underline text-gray-400"
            :style="{
              fontFamily: `'${typography.footer.bodyFont}', sans-serif`,
              fontSize: scaled(11, typography.scale),
            }"
          >Términos</span>
          <span
            class="underline text-gray-400"
            :style="{
              fontFamily: `'${typography.footer.bodyFont}', sans-serif`,
              fontSize: scaled(11, typography.scale),
            }"
          >Privacidad</span>
        </div>
      </div>
    </div>
  </div>
</template>
