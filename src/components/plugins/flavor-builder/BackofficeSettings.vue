<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'

/**
 * Ajustes del armador de sabores (helados, cremoladas). Lo principal es la
 * disponibilidad del día: qué sabores y toppings hay en el local. Un sabor
 * apagado desaparece del storefront y el checkout lo rechaza.
 *
 * También: nombres, precio de cada topping y, por producto, cuántos sabores
 * admite. No se agregan sabores ni productos desde aquí (van con imagen y los
 * carga el equipo de MiTienda).
 */
interface Item {
  code: string
  label?: string
  image?: string
  price?: number
  available?: boolean
  [key: string]: unknown
}

interface ProductRow {
  list: string
  minFlavors?: number
  maxFlavors?: number
  toppings?: boolean
  maxPerOrder?: number | null
  heading?: string
  hint?: string
  [key: string]: unknown
}

interface EditableConfig {
  flavorLists: Record<string, { label?: string; items: Item[] }>
  toppings: Item[]
  products: Record<string, ProductRow>
}

interface Props {
  config: Partial<EditableConfig> | null
  configSchema?: Record<string, unknown> | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'update', config: EditableConfig): void }>()

function pickEditable(): EditableConfig {
  const c = props.config ?? {}
  return JSON.parse(JSON.stringify({
    flavorLists: c.flavorLists ?? {},
    toppings: c.toppings ?? [],
    products: c.products ?? {},
  }))
}

const form = ref<EditableConfig>(pickEditable())
const original = ref(JSON.stringify(form.value))

watch(
  () => props.config,
  () => {
    form.value = pickEditable()
    original.value = JSON.stringify(form.value)
  },
)

const isDirty = computed(() => JSON.stringify(form.value) !== original.value)
const lists = computed(() => Object.entries(form.value.flavorLists))
const products = computed(() => Object.entries(form.value.products))

const errors = computed(() => {
  const out: string[] = []
  for (const [id, p] of products.value) {
    const min = Number(p.minFlavors ?? 1)
    const max = Number(p.maxFlavors ?? min)
    if (!(min >= 1) || !(max >= min)) out.push(`Producto ${id}: el máximo de sabores debe ser 1 o más y no menor al mínimo.`)
  }
  for (const t of form.value.toppings) {
    if (!(Number(t.price ?? 0) >= 0)) out.push(`El topping «${t.label ?? t.code}» tiene un precio inválido.`)
  }
  return out
})

function isOn(item: Item) {
  return item.available !== false
}

function setAll(items: Item[], value: boolean) {
  for (const item of items) item.available = value
}

function countOn(items: Item[]) {
  return items.filter(isOn).length
}

function submit() {
  if (errors.value.length) return
  emit('update', JSON.parse(JSON.stringify(form.value)))
}

const input = 'w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none'
const th = 'px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500'
</script>

<template>
  <form class="space-y-8" @submit.prevent="submit">
    <p class="text-sm text-gray-600">
      Marca lo que hay hoy en el local. Lo que apagues deja de mostrarse en la tienda y no se puede pedir.
    </p>

    <!-- SABORES -->
    <section v-for="[key, list] in lists" :key="key">
      <div class="mb-3 flex flex-wrap items-center gap-3">
        <h3 class="text-base font-semibold text-gray-900">{{ list.label ?? key }}</h3>
        <span class="text-sm text-gray-500">{{ countOn(list.items) }} de {{ list.items.length }} disponibles</span>
        <span class="ml-auto flex gap-3 text-sm">
          <button type="button" class="text-primary hover:underline" @click="setAll(list.items, true)">Todos</button>
          <button type="button" class="text-primary hover:underline" @click="setAll(list.items, false)">Ninguno</button>
        </span>
      </div>
      <ul class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <li
          v-for="item in list.items"
          :key="item.code"
          class="flex items-center gap-3 rounded border px-3 py-2"
          :class="isOn(item) ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50'"
        >
          <img v-if="item.image" :src="item.image" alt="" class="h-10 w-10 shrink-0 rounded object-cover" :class="{ 'opacity-40 grayscale': !isOn(item) }">
          <input v-model="item.label" type="text" :class="input" :aria-label="`Nombre de ${item.code}`">
          <label class="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-gray-600">
            <input v-model="item.available" type="checkbox" class="h-4 w-4 accent-[#00b2a6]">
            Hay
          </label>
        </li>
      </ul>
    </section>

    <!-- TOPPINGS -->
    <section v-if="form.toppings.length">
      <div class="mb-3 flex flex-wrap items-center gap-3">
        <h3 class="text-base font-semibold text-gray-900">Toppings</h3>
        <span class="text-sm text-gray-500">{{ countOn(form.toppings) }} de {{ form.toppings.length }} disponibles</span>
        <span class="ml-auto flex gap-3 text-sm">
          <button type="button" class="text-primary hover:underline" @click="setAll(form.toppings, true)">Todos</button>
          <button type="button" class="text-primary hover:underline" @click="setAll(form.toppings, false)">Ninguno</button>
        </span>
      </div>
      <ul class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <li
          v-for="item in form.toppings"
          :key="item.code"
          class="flex items-center gap-3 rounded border px-3 py-2"
          :class="isOn(item) ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50'"
        >
          <img v-if="item.image" :src="item.image" alt="" class="h-10 w-10 shrink-0 rounded object-cover" :class="{ 'opacity-40 grayscale': !isOn(item) }">
          <input v-model="item.label" type="text" :class="input" :aria-label="`Nombre de ${item.code}`">
          <input v-model.number="item.price" type="number" min="0" step="0.10" class="w-20 shrink-0 rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none" :aria-label="`Precio de ${item.code}`">
          <label class="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-gray-600">
            <input v-model="item.available" type="checkbox" class="h-4 w-4 accent-[#00b2a6]">
            Hay
          </label>
        </li>
      </ul>
    </section>

    <!-- PRODUCTOS -->
    <section v-if="products.length">
      <h3 class="text-base font-semibold text-gray-900">Productos</h3>
      <p class="mb-3 text-sm text-gray-500">Cuántos sabores admite cada producto. El precio es el del catálogo más los toppings.</p>
      <div class="overflow-x-auto rounded border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th :class="th">Producto</th>
              <th :class="th">Lista</th>
              <th :class="th">Mín.</th>
              <th :class="th">Máx.</th>
              <th :class="th">Toppings</th>
              <th :class="th">Máx. por pedido</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="[id, p] in products" :key="id">
              <td class="px-2 py-2 text-sm">
                <span class="font-medium text-gray-900">{{ p.heading || `Producto ${id}` }}</span>
                <span class="block text-xs text-gray-400">#{{ id }}</span>
              </td>
              <td class="px-2 py-2 text-sm text-gray-600">{{ form.flavorLists[p.list]?.label ?? p.list }}</td>
              <td class="w-20 px-2 py-2"><input v-model.number="p.minFlavors" type="number" min="1" :class="input"></td>
              <td class="w-20 px-2 py-2"><input v-model.number="p.maxFlavors" type="number" min="1" :class="input"></td>
              <td class="px-2 py-2"><input v-model="p.toppings" type="checkbox" class="h-4 w-4 accent-[#00b2a6]" :aria-label="`Toppings en ${id}`"></td>
              <td class="w-24 px-2 py-2 text-sm text-gray-600">{{ p.maxPerOrder || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <ul v-if="errors.length" class="space-y-1 text-sm text-red-600">
      <li v-for="msg in errors" :key="msg">{{ msg }}</li>
    </ul>

    <div class="sticky bottom-0 flex justify-end bg-white/90 py-3 backdrop-blur">
      <AppButton type="submit" :disabled="!isDirty || errors.length > 0">Guardar cambios</AppButton>
    </div>
  </form>
</template>
