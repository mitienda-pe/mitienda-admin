<script setup lang="ts">
import { AppButton } from '@/components/ui'
import {
  DESKTOP_COLUMN_OPTIONS,
  MOBILE_COLUMN_OPTIONS,
  CART_ICON_OPTIONS,
} from '@/types/appearance.types'
import type { CatalogPreferences } from '@/types/appearance.types'

interface Props {
  preferences: CatalogPreferences
  isSaving: boolean
  hasChanges: boolean
  showCartIcon?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showCartIcon: true,
})

const emit = defineEmits<{
  'update:field': [field: keyof CatalogPreferences, value: number]
  save: []
}>()
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
