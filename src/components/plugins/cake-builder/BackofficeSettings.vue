<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'

/**
 * Ajustes del armador de tortas que el comerciante puede tocar: precios,
 * nombres, qué está activo, bases por forma, complementos y dedicatoria.
 *
 * No se agregan opciones nuevas desde aquí: cada tamaño, base o color necesita
 * sus imágenes en R2, y eso lo carga el equipo de MiTienda. Tampoco se toca la
 * paleta, las capas ni la geometría (el API las tiene bloqueadas).
 */
interface Option {
  code: string
  label?: string
  active?: boolean
  [key: string]: unknown
}

interface Size extends Option {
  shape: string
  detail?: string
  portions?: string
  price: number
}

interface Addon extends Option {
  price?: number
  prices?: Record<string, number>
}

interface Base {
  code: string
  label?: string
  files: Record<string, string>
  activeIn?: string[]
  [key: string]: unknown
}

interface EditableConfig {
  title?: string
  sizes: Size[]
  flavors: Option[]
  fillings: Option[]
  bases: Base[]
  addons: Addon[]
  dedication: { enabled?: boolean; required?: boolean; maxLength?: number; placeholder?: string }
}

interface Props {
  config: (Partial<EditableConfig> & { shapes?: Record<string, { label?: string }> }) | null
  configSchema?: Record<string, unknown> | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'update', config: EditableConfig): void }>()

function pickEditable(): EditableConfig {
  const c = props.config ?? {}
  return JSON.parse(JSON.stringify({
    title: c.title ?? '',
    sizes: c.sizes ?? [],
    flavors: c.flavors ?? [],
    fillings: c.fillings ?? [],
    bases: c.bases ?? [],
    addons: c.addons ?? [],
    dedication: c.dedication ?? { enabled: false },
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

const shapes = computed(() =>
  Object.entries(props.config?.shapes ?? {}).map(([code, s]) => ({ code, label: s.label ?? code })),
)
const activeSizes = computed(() => form.value.sizes.filter((s) => s.active !== false))

const isDirty = computed(() => JSON.stringify(form.value) !== original.value)

const errors = computed(() => {
  const out: string[] = []
  if (activeSizes.value.length === 0) out.push('Deja al menos un tamaño activo.')
  if (form.value.dedication.enabled && !(Number(form.value.dedication.maxLength) >= 1)) {
    out.push('El máximo de caracteres de la dedicatoria debe ser 1 o más.')
  }
  for (const size of activeSizes.value) {
    if (!(Number(size.price) > 0)) out.push(`El tamaño «${size.label ?? size.code}» necesita un precio mayor a 0.`)
  }
  return out
})

function isActive(item: { active?: boolean }) {
  return item.active !== false
}

function setActive(item: { active?: boolean }, value: boolean) {
  item.active = value
}

function baseActiveIn(base: Base, shape: string) {
  return (base.activeIn ?? []).includes(shape)
}

function toggleBase(base: Base, shape: string, value: boolean) {
  const set = new Set(base.activeIn ?? [])
  if (value) set.add(shape)
  else set.delete(shape)
  base.activeIn = [...set]
}

function addonPrice(addon: Addon, sizeCode: string): number | undefined {
  return addon.prices?.[sizeCode]
}

function setAddonPrice(addon: Addon, sizeCode: string, raw: string) {
  const prices = { ...(addon.prices ?? {}) }
  if (raw === '') delete prices[sizeCode]
  else prices[sizeCode] = Number(raw)
  addon.prices = prices
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
    <label class="block max-w-md">
      <span class="mb-1 block text-sm font-medium text-gray-700">Título del armador</span>
      <input v-model="form.title" type="text" :class="input">
    </label>

    <!-- TAMAÑOS -->
    <section>
      <h3 class="text-base font-semibold text-gray-900">Formas y tamaños</h3>
      <p class="mb-3 text-sm text-gray-500">El precio de la torta es el del tamaño (más el complemento, si elige uno).</p>
      <div class="overflow-x-auto rounded border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th :class="th">Activo</th>
              <th :class="th">Nombre</th>
              <th :class="th">Detalle</th>
              <th :class="th">Porciones</th>
              <th :class="th">Precio</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="size in form.sizes" :key="size.code">
              <td class="px-2 py-2">
                <input type="checkbox" :checked="isActive(size)" :aria-label="`Activar ${size.code}`" @change="setActive(size, ($event.target as HTMLInputElement).checked)">
              </td>
              <td class="px-2 py-2">
                <input v-model="size.label" type="text" :class="input">
                <span class="text-xs text-gray-400">{{ size.code }} · {{ shapes.find((s) => s.code === size.shape)?.label ?? size.shape }}</span>
              </td>
              <td class="px-2 py-2"><input v-model="size.detail" type="text" :class="input"></td>
              <td class="px-2 py-2"><input v-model="size.portions" type="text" :class="input"></td>
              <td class="w-32 px-2 py-2"><input v-model.number="size.price" type="number" min="0" step="0.01" :class="input"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- SABORES Y RELLENOS -->
    <section class="grid gap-6 md:grid-cols-2">
      <div v-for="group in [{ key: 'flavors', title: 'Sabores' }, { key: 'fillings', title: 'Rellenos' }] as const" :key="group.key">
        <h3 class="mb-3 text-base font-semibold text-gray-900">{{ group.title }}</h3>
        <ul class="space-y-2">
          <li v-for="item in form[group.key]" :key="item.code" class="flex items-center gap-3">
            <input type="checkbox" :checked="isActive(item)" :aria-label="`Activar ${item.code}`" @change="setActive(item, ($event.target as HTMLInputElement).checked)">
            <input v-model="item.label" type="text" :class="input">
          </li>
        </ul>
      </div>
    </section>

    <!-- BASES -->
    <section v-if="form.bases.length">
      <h3 class="text-base font-semibold text-gray-900">Bases</h3>
      <p class="mb-3 text-sm text-gray-500">
        Marca en qué forma hay stock de cada base. Si una forma tiene una sola, el cliente no elige y se usa esa.
      </p>
      <div class="overflow-x-auto rounded border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th :class="th">Base</th>
              <th v-for="shape in shapes" :key="shape.code" :class="th">{{ shape.label }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="base in form.bases" :key="base.code">
              <td class="px-2 py-2"><input v-model="base.label" type="text" :class="input"></td>
              <td v-for="shape in shapes" :key="shape.code" class="px-2 py-2">
                <input
                  v-if="base.files?.[shape.code]"
                  type="checkbox"
                  :checked="baseActiveIn(base, shape.code)"
                  :aria-label="`${base.code} en ${shape.label}`"
                  @change="toggleBase(base, shape.code, ($event.target as HTMLInputElement).checked)"
                >
                <span v-else class="text-xs text-gray-400" title="No hay imagen de esta base para esta forma">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- COMPLEMENTOS -->
    <section v-if="form.addons.length">
      <h3 class="text-base font-semibold text-gray-900">Complementos</h3>
      <p class="mb-3 text-sm text-gray-500">
        Se suman al precio de la torta. Si un tamaño no tiene precio propio, se usa el precio general.
      </p>
      <div class="overflow-x-auto rounded border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th :class="th">Activo</th>
              <th :class="th">Nombre</th>
              <th :class="th">Precio general</th>
              <th v-for="size in activeSizes" :key="size.code" :class="th">{{ size.label ?? size.code }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="addon in form.addons" :key="addon.code">
              <td class="px-2 py-2">
                <input type="checkbox" :checked="isActive(addon)" :aria-label="`Activar ${addon.code}`" @change="setActive(addon, ($event.target as HTMLInputElement).checked)">
              </td>
              <td class="px-2 py-2"><input v-model="addon.label" type="text" :class="input"></td>
              <td class="w-28 px-2 py-2"><input v-model.number="addon.price" type="number" min="0" step="0.01" :class="input"></td>
              <td v-for="size in activeSizes" :key="size.code" class="w-28 px-2 py-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  :value="addonPrice(addon, size.code)"
                  :class="input"
                  :aria-label="`Precio de ${addon.code} con ${size.code}`"
                  @input="setAddonPrice(addon, size.code, ($event.target as HTMLInputElement).value)"
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- DEDICATORIA -->
    <section class="max-w-md space-y-3">
      <h3 class="text-base font-semibold text-gray-900">Dedicatoria</h3>
      <label class="flex items-center gap-2 text-sm text-gray-700">
        <input v-model="form.dedication.enabled" type="checkbox">
        El cliente puede escribir una dedicatoria
      </label>
      <template v-if="form.dedication.enabled">
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input v-model="form.dedication.required" type="checkbox">
          Es obligatoria
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-gray-700">Máximo de caracteres</span>
          <input v-model.number="form.dedication.maxLength" type="number" min="1" max="200" :class="input">
        </label>
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-gray-700">Texto de ejemplo</span>
          <input v-model="form.dedication.placeholder" type="text" :class="input">
        </label>
      </template>
    </section>

    <ul v-if="errors.length" class="space-y-1 text-sm text-red-600">
      <li v-for="msg in errors" :key="msg">{{ msg }}</li>
    </ul>

    <div class="flex justify-end">
      <AppButton type="submit" :disabled="!isDirty || errors.length > 0">Guardar cambios</AppButton>
    </div>
  </form>
</template>
