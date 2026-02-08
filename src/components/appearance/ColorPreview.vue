<script setup lang="ts">
import type { StoreColorConfig } from '@/types/appearance.types'

interface Props {
  colors: StoreColorConfig
}

defineProps<Props>()
</script>

<template>
  <div class="rounded-lg border border-gray-200 overflow-hidden shadow-sm bg-white">
    <div class="text-xs text-gray-400 text-center py-1.5 bg-gray-50 border-b border-gray-200">
      Vista Previa
    </div>

    <div class="w-full" style="font-family: 'Inter', sans-serif">
      <!-- Header -->
      <div
        class="px-4 py-3 flex items-center justify-between"
        :style="{ backgroundColor: colors.header.background }"
      >
        <div class="flex items-center gap-2">
          <div
            class="w-5 h-5 rounded-full"
            :style="{ backgroundColor: colors.header.accent }"
          />
          <span
            class="text-sm font-semibold"
            :style="{ color: colors.header.text }"
          >Mi Tienda</span>
        </div>
        <div class="flex items-center gap-1">
          <i
            class="pi pi-search text-xs"
            :style="{ color: colors.header.accent }"
          />
          <i
            class="pi pi-shopping-cart text-xs ml-1"
            :style="{ color: colors.header.accent }"
          />
        </div>
      </div>

      <!-- Navbar -->
      <div
        class="px-4 py-2 flex items-center gap-3"
        :style="{ backgroundColor: colors.navbar.background }"
      >
        <span
          class="text-xs font-medium border-b"
          :style="{
            color: colors.navbar.activeLink,
            borderColor: colors.navbar.activeLink
          }"
        >Inicio</span>
        <span
          class="text-xs"
          :style="{ color: colors.navbar.links }"
        >Catálogo</span>
        <span
          class="text-xs"
          :style="{ color: colors.navbar.links }"
        >Ofertas</span>
        <span
          class="text-xs"
          :style="{ color: colors.navbar.links }"
        >Contacto</span>
      </div>

      <!-- Body -->
      <div
        class="px-4 py-4"
        :style="{ backgroundColor: colors.body.background }"
      >
        <h3
          class="text-sm font-bold mb-1"
          :style="{ color: colors.body.titles }"
        >
          Productos Destacados
        </h3>
        <p
          class="text-xs mb-3"
          :style="{ color: colors.body.text }"
        >
          Descubre nuestra selección especial.
          <span
            class="underline cursor-pointer"
            :style="{ color: colors.body.links }"
          >Ver todo</span>
        </p>

        <!-- Product cards -->
        <div class="grid grid-cols-2 gap-2 mb-3">
          <div class="bg-white rounded border border-gray-200 overflow-hidden">
            <div class="bg-gray-100 h-16 flex items-center justify-center">
              <i class="pi pi-image text-gray-300 text-lg" />
            </div>
            <div class="p-2">
              <div
                class="text-xs font-medium truncate"
                :style="{ color: colors.body.titles }"
              >Producto 1</div>
              <div
                class="text-xs mt-0.5"
                :style="{ color: colors.body.text }"
              >S/ 49.90</div>
              <button
                class="w-full mt-1.5 text-xs py-1 rounded"
                :style="{
                  backgroundColor: colors.body.buttonBg,
                  color: colors.body.buttonText
                }"
              >Comprar</button>
            </div>
          </div>
          <div class="bg-white rounded border border-gray-200 overflow-hidden">
            <div class="bg-gray-100 h-16 flex items-center justify-center">
              <i class="pi pi-image text-gray-300 text-lg" />
            </div>
            <div class="p-2">
              <div
                class="text-xs font-medium truncate"
                :style="{ color: colors.body.titles }"
              >Producto 2</div>
              <div
                class="text-xs mt-0.5"
                :style="{ color: colors.body.text }"
              >S/ 79.90</div>
              <button
                class="w-full mt-1.5 text-xs py-1 rounded"
                :style="{
                  backgroundColor: colors.body.buttonBg,
                  color: colors.body.buttonText
                }"
              >Comprar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div
        class="px-4 py-3"
        :style="{ backgroundColor: colors.footer.background }"
      >
        <div
          class="text-xs font-semibold mb-1"
          :style="{ color: colors.footer.titles }"
        >Mi Tienda</div>
        <div
          class="text-xs mb-1"
          :style="{ color: colors.footer.text }"
        >Tu tienda de confianza</div>
        <div class="flex gap-2">
          <span
            class="text-xs underline"
            :style="{ color: colors.footer.links }"
          >Términos</span>
          <span
            class="text-xs underline"
            :style="{ color: colors.footer.links }"
          >Privacidad</span>
        </div>
      </div>
    </div>
  </div>
</template>
