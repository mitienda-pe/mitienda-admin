<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'

/**
 * Ajustes de la calculadora de pisos por caja: cuántos m² cubre cada caja y
 * cuántas piezas trae, por producto, y las opciones de merma.
 *
 * Si la asignación está en prueba (`previewDomains`), la calculadora solo se ve
 * en esos dominios; se avisa arriba. Quitar la prueba es tarea de MiTienda.
 */
interface ProductRow {
  coverage: number
  pieces?: number
  tile?: string
  name?: string
  [key: string]: unknown
}

interface EditableConfig {
  products: Record<string, ProductRow>
  wasteOptions: number[]
}

interface Props {
  config: (Partial<EditableConfig> & { previewDomains?: string[] }) | null
  configSchema?: Record<string, unknown> | null
}

const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'update', config: EditableConfig): void }>()

function pickEditable(): EditableConfig {
  const c = props.config ?? {}
  return JSON.parse(JSON.stringify({
    products: c.products ?? {},
    wasteOptions: c.wasteOptions?.length ? c.wasteOptions : [0, 5, 10],
  }))
}

const form = ref<EditableConfig>(pickEditable())
const original = ref(JSON.stringify(form.value))
const wasteText = ref(form.value.wasteOptions.join(', '))

watch(
  () => props.config,
  () => {
    form.value = pickEditable()
    original.value = JSON.stringify(form.value)
    wasteText.value = form.value.wasteOptions.join(', ')
  },
)

watch(wasteText, (text) => {
  form.value.wasteOptions = text
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 50)
})

const preview = computed(() => props.config?.previewDomains ?? [])
const products = computed(() => Object.entries(form.value.products))
const isDirty = computed(() => JSON.stringify(form.value) !== original.value)

const errors = computed(() => {
  const out: string[] = []
  for (const [id, p] of products.value) {
    if (!(Number(p.coverage) > 0)) out.push(`Producto ${id}: los m² por caja deben ser mayores a 0.`)
  }
  if (!form.value.wasteOptions.length) out.push('Deja al menos una opción de merma (por ejemplo 0).')
  return out
})

function submit() {
  if (errors.value.length) return
  emit('update', JSON.parse(JSON.stringify(form.value)))
}

const input = 'w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-primary focus:outline-none'
const th = 'px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500'
</script>

<template>
  <form class="space-y-6" @submit.prevent="submit">
    <p v-if="preview.length" class="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      En prueba: la calculadora solo se ve en {{ preview.join(', ') }}. En tu dominio los productos se venden como siempre
      hasta que se apruebe.
    </p>

    <label class="block max-w-sm">
      <span class="mb-1 block text-sm font-medium text-gray-700">Opciones de merma (%)</span>
      <input v-model="wasteText" type="text" :class="input" placeholder="0, 5, 10">
      <span class="mt-1 block text-xs text-gray-500">Separadas por coma. El cliente elige una.</span>
    </label>

    <section>
      <h3 class="text-base font-semibold text-gray-900">Productos por caja</h3>
      <p class="mb-3 text-sm text-gray-500">
        El precio del producto debe ser el de la caja completa: la calculadora propone cuántas cajas comprar.
      </p>
      <div class="overflow-x-auto rounded border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th :class="th">Producto</th>
              <th :class="th">m² por caja</th>
              <th :class="th">Piezas por caja</th>
              <th :class="th">Baldosa</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="[id, p] in products" :key="id">
              <td class="px-2 py-2 text-sm">
                <span class="text-gray-900">{{ p.name || `Producto ${id}` }}</span>
                <span class="block text-xs text-gray-400">#{{ id }}</span>
              </td>
              <td class="w-32 px-2 py-2"><input v-model.number="p.coverage" type="number" min="0.01" step="0.01" :class="input" :aria-label="`m² por caja de ${id}`"></td>
              <td class="w-32 px-2 py-2"><input v-model.number="p.pieces" type="number" min="1" step="1" :class="input" :aria-label="`Piezas por caja de ${id}`"></td>
              <td class="px-2 py-2"><input v-model="p.tile" type="text" :class="input" placeholder="50 × 50 cm" :aria-label="`Tamaño de baldosa de ${id}`"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <ul v-if="errors.length" class="space-y-1 text-sm text-red-600">
      <li v-for="msg in errors" :key="msg">{{ msg }}</li>
    </ul>

    <div class="flex justify-end">
      <AppButton type="submit" :disabled="!isDirty || errors.length > 0">Guardar cambios</AppButton>
    </div>
  </form>
</template>
