<script setup lang="ts">
import { computed } from 'vue'
import InputSwitch from 'primevue/inputswitch'
import { AppButton } from '@/components/ui'
import {
  DESKTOP_COLUMN_OPTIONS,
  MOBILE_COLUMN_OPTIONS,
  LOGO_POSITION_OPTIONS,
  CART_ICON_OPTIONS,
  PRODUCT_ORDER_OPTIONS,
  PRICING_MODE_OPTIONS,
} from '@/types/appearance.types'
import type { CatalogPreferences } from '@/types/appearance.types'

interface Props {
  preferences: CatalogPreferences
  isSaving: boolean
  hasChanges: boolean
  showCartIcon?: boolean
  showProductOrder?: boolean
  showHideOutOfStock?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCartIcon: true,
  showProductOrder: true,
  showHideOutOfStock: true,
})

const emit = defineEmits<{
  'update:field': [field: keyof CatalogPreferences, value: number]
  save: []
}>()

const hideOutOfStockBool = computed({
  get: () => props.preferences.hide_out_of_stock === 1,
  set: (val: boolean) => emit('update:field', 'hide_out_of_stock', val ? 1 : 0),
})
</script>

<template>
  <div class="space-y-6">
    <!-- Desktop Columns -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Columnas en escritorio
      </label>
      <p class="text-xs text-gray-400 mb-3">
        Cantidad de productos por fila en pantallas grandes
      </p>
      <div class="grid grid-cols-3 gap-3">
        <button
          v-for="option in DESKTOP_COLUMN_OPTIONS"
          :key="option.value"
          type="button"
          class="relative p-4 border-2 rounded-lg text-center transition-all cursor-pointer"
          :class="
            preferences.desktop_columns === option.value
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-gray-200 bg-white hover:border-gray-300'
          "
          @click="emit('update:field', 'desktop_columns', option.value)"
        >
          <!-- Visual grid representation -->
          <div class="flex gap-1 justify-center mb-2">
            <div
              v-for="n in option.value"
              :key="n"
              class="h-8 rounded-sm"
              :class="
                preferences.desktop_columns === option.value
                  ? 'bg-primary/30'
                  : 'bg-gray-200'
              "
              :style="{ width: `${Math.floor(60 / option.value)}px` }"
            />
          </div>
          <span
            class="text-sm font-medium"
            :class="
              preferences.desktop_columns === option.value
                ? 'text-primary'
                : 'text-gray-600'
            "
          >
            {{ option.label }}
          </span>
          <i
            v-if="preferences.desktop_columns === option.value"
            class="pi pi-check-circle absolute top-2 right-2 text-primary text-sm"
          />
        </button>
      </div>
    </div>

    <!-- Divider -->
    <hr class="border-gray-100" />

    <!-- Mobile Columns -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Columnas en móvil
      </label>
      <p class="text-xs text-gray-400 mb-3">
        Cantidad de productos por fila en celulares
      </p>
      <div class="grid grid-cols-2 gap-3 max-w-sm">
        <button
          v-for="option in MOBILE_COLUMN_OPTIONS"
          :key="option.value"
          type="button"
          class="relative p-4 border-2 rounded-lg text-center transition-all cursor-pointer"
          :class="
            preferences.mobile_columns === option.value
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-gray-200 bg-white hover:border-gray-300'
          "
          @click="emit('update:field', 'mobile_columns', option.value)"
        >
          <!-- Visual grid with phone-like representation -->
          <div class="flex gap-1 justify-center mb-2">
            <div
              v-for="n in option.value"
              :key="n"
              class="h-10 rounded-sm"
              :class="
                preferences.mobile_columns === option.value
                  ? 'bg-primary/30'
                  : 'bg-gray-200'
              "
              :style="{ width: option.value === 1 ? '48px' : '28px' }"
            />
          </div>
          <span
            class="text-sm font-medium"
            :class="
              preferences.mobile_columns === option.value
                ? 'text-primary'
                : 'text-gray-600'
            "
          >
            {{ option.label }}
          </span>
          <i
            v-if="preferences.mobile_columns === option.value"
            class="pi pi-check-circle absolute top-2 right-2 text-primary text-sm"
          />
        </button>
      </div>
    </div>

    <!-- Divider -->
    <hr class="border-gray-100" />

    <!-- Logo Position -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Posición del logo
      </label>
      <p class="text-xs text-gray-400 mb-3">
        Define la ubicación del logo en el encabezado de tu tienda
      </p>
      <div class="grid grid-cols-2 gap-3 max-w-sm">
        <button
          v-for="option in LOGO_POSITION_OPTIONS"
          :key="option.value"
          type="button"
          class="relative p-4 border-2 rounded-lg text-center transition-all cursor-pointer"
          :class="
            preferences.logo_position === option.value
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-gray-200 bg-white hover:border-gray-300'
          "
          @click="emit('update:field', 'logo_position', option.value)"
        >
          <i
            :class="option.icon"
            class="text-2xl mb-2 block"
            :style="{
              color:
                preferences.logo_position === option.value ? '#00b2a6' : '#6B7280',
            }"
          />
          <div
            class="text-sm font-medium"
            :class="
              preferences.logo_position === option.value
                ? 'text-primary'
                : 'text-gray-600'
            "
          >
            {{ option.label }}
          </div>
          <i
            v-if="preferences.logo_position === option.value"
            class="pi pi-check-circle absolute top-2 right-2 text-primary text-sm"
          />
        </button>
      </div>
    </div>

    <!-- Divider -->
    <hr v-if="props.showCartIcon" class="border-gray-100" />

    <!-- Cart Icon -->
    <div v-if="props.showCartIcon">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Icono del carrito
      </label>
      <p class="text-xs text-gray-400 mb-3">
        Elige el estilo de icono para el carrito de compras
      </p>
      <div class="grid grid-cols-3 gap-3 max-w-md">
        <button
          v-for="option in CART_ICON_OPTIONS"
          :key="option.value"
          type="button"
          class="relative p-4 border-2 rounded-lg text-center transition-all cursor-pointer"
          :class="
            preferences.cart_icon === option.value
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-gray-200 bg-white hover:border-gray-300'
          "
          @click="emit('update:field', 'cart_icon', option.value)"
        >
          <!-- Cart icon -->
          <i
            v-if="option.icon !== 'basket'"
            :class="option.icon"
            class="text-2xl mb-2 block"
            :style="{
              color:
                preferences.cart_icon === option.value ? '#00b2a6' : '#6B7280',
            }"
          />
          <!-- Basket SVG (Lucide shopping-basket) -->
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="w-7 h-7 mx-auto mb-2"
            :style="{
              color:
                preferences.cart_icon === option.value ? '#00b2a6' : '#6B7280',
            }"
          >
            <path d="m15 11-1 9" />
            <path d="m19 11-4-7" />
            <path d="M2 11h20" />
            <path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4" />
            <path d="M4.5 15.5h15" />
            <path d="m5 11 4-7" />
            <path d="m9 11 1 9" />
          </svg>
          <div
            class="text-sm font-medium"
            :class="
              preferences.cart_icon === option.value
                ? 'text-primary'
                : 'text-gray-600'
            "
          >
            {{ option.label }}
          </div>
          <i
            v-if="preferences.cart_icon === option.value"
            class="pi pi-check-circle absolute top-2 right-2 text-primary text-sm"
          />
        </button>
      </div>
    </div>

    <!-- Divider -->
    <hr v-if="props.showProductOrder" class="border-gray-100" />

    <!-- Product Order -->
    <div v-if="props.showProductOrder">
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Orden de los productos
      </label>
      <p class="text-xs text-gray-400 mb-3">
        Define el orden por defecto de los productos en tu catalogo
      </p>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <button
          v-for="option in PRODUCT_ORDER_OPTIONS"
          :key="option.value"
          type="button"
          class="relative p-4 border-2 rounded-lg text-center transition-all cursor-pointer"
          :class="
            preferences.product_order === option.value
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-gray-200 bg-white hover:border-gray-300'
          "
          @click="emit('update:field', 'product_order', option.value)"
        >
          <i
            :class="option.icon"
            class="text-xl mb-2 block"
            :style="{
              color:
                preferences.product_order === option.value ? '#00b2a6' : '#6B7280',
            }"
          />
          <div
            class="text-sm font-medium"
            :class="
              preferences.product_order === option.value
                ? 'text-primary'
                : 'text-gray-600'
            "
          >
            {{ option.label }}
          </div>
          <p class="text-xs text-gray-400 mt-1">{{ option.description }}</p>
          <i
            v-if="preferences.product_order === option.value"
            class="pi pi-check-circle absolute top-2 right-2 text-primary text-sm"
          />
        </button>
      </div>
    </div>

    <!-- Divider -->
    <hr v-if="props.showHideOutOfStock" class="border-gray-100" />

    <!-- Hide Out-of-Stock -->
    <div v-if="props.showHideOutOfStock">
      <div class="flex items-center justify-between">
        <div>
          <label class="block text-sm font-medium text-gray-700">
            Ocultar productos agotados
          </label>
          <p class="text-xs text-gray-400 mt-0.5">
            Los productos sin stock no se mostraran en el catalogo
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span
            class="text-xs font-medium px-2 py-0.5 rounded-full"
            :class="
              hideOutOfStockBool
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            "
          >
            {{ hideOutOfStockBool ? 'Ocultos' : 'Visibles' }}
          </span>
          <InputSwitch v-model="hideOutOfStockBool" />
        </div>
      </div>
    </div>

    <!-- Divider -->
    <hr class="border-gray-100" />

    <!-- Pricing Mode -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">
        Modo de precios
      </label>
      <p class="text-xs text-gray-400 mb-3">
        Define cual precio ingresas normalmente. El otro se calculara automaticamente.
      </p>
      <div class="grid grid-cols-2 gap-3 max-w-md">
        <button
          v-for="option in PRICING_MODE_OPTIONS"
          :key="option.value"
          type="button"
          class="relative p-4 border-2 rounded-lg text-center transition-all cursor-pointer"
          :class="
            preferences.pricing_mode === option.value
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-gray-200 bg-white hover:border-gray-300'
          "
          @click="emit('update:field', 'pricing_mode', option.value)"
        >
          <i
            :class="option.icon"
            class="text-xl mb-2 block"
            :style="{
              color:
                preferences.pricing_mode === option.value ? '#00b2a6' : '#6B7280',
            }"
          />
          <div
            class="text-sm font-medium"
            :class="
              preferences.pricing_mode === option.value
                ? 'text-primary'
                : 'text-gray-600'
            "
          >
            {{ option.label }}
          </div>
          <p class="text-xs text-gray-400 mt-1">{{ option.description }}</p>
          <i
            v-if="preferences.pricing_mode === option.value"
            class="pi pi-check-circle absolute top-2 right-2 text-primary text-sm"
          />
        </button>
      </div>
    </div>

    <!-- Save button -->
    <div class="flex items-center gap-3 pt-2">
      <AppButton
        variant="primary"
        :loading="isSaving"
        :disabled="!hasChanges"
        @click="emit('save')"
      >
        <i class="pi pi-check mr-2" />
        Guardar preferencias
      </AppButton>
      <span v-if="hasChanges" class="text-xs text-amber-600">
        Tienes cambios sin guardar
      </span>
    </div>
  </div>
</template>
