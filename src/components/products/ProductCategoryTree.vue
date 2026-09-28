<script setup lang="ts">
/**
 * Árbol de categorías del producto con checkboxes INDEPENDIENTES.
 *
 * No usa selectionMode="checkbox" de PrimeVue: ese modo propaga la selección
 * (marcar el padre marca todas las hijas y marcar todas las hijas marca el
 * padre), y cada nodo marcado se guarda como un vínculo propio en
 * `tiendascategoriasproductos`. Así era imposible dejar un producto en el padre
 * y en UNA sola hija, y se creaban vínculos al padre que la tienda no pidió.
 */
import { computed, ref, watch } from 'vue'
import Tree from 'primevue/tree'
import Checkbox from 'primevue/checkbox'
import type { TreeNode } from 'primevue/treenode'

interface CategoryNode {
  id: number | string
  name: string
  sub?: CategoryNode[]
}

const props = defineProps<{
  categories: CategoryNode[]
}>()

const model = defineModel<number[]>({ default: () => [] })

const toTreeNodes = (cats: CategoryNode[]): TreeNode[] =>
  cats.map(c => ({
    key: String(c.id),
    label: c.name,
    ...(c.sub?.length ? { children: toTreeNodes(c.sub) } : {}),
  }))

const nodes = computed(() => toTreeNodes(props.categories))

const expandedKeys = ref<Record<string, boolean>>({})

watch(nodes, list => {
  const keys: Record<string, boolean> = {}
  const walk = (items: TreeNode[]) => {
    for (const n of items) {
      if (n.key) keys[n.key] = true
      if (n.children) walk(n.children)
    }
  }
  walk(list)
  expandedKeys.value = keys
}, { immediate: true })

const selected = computed(() => new Set((model.value || []).map(String)))

const isChecked = (key?: string) => !!key && selected.value.has(key)

const toggle = (key: string | undefined, checked: boolean) => {
  if (!key) return
  const ids = (model.value || []).filter(id => String(id) !== key)
  if (checked) ids.push(Number(key))
  model.value = ids
}

// Cuántas subcategorías marcadas hay debajo de un nodo: orienta sin marcar
// el padre por su cuenta.
const checkedDescendants = (node: TreeNode): number =>
  (node.children || []).reduce(
    (sum: number, child: TreeNode) => sum + (isChecked(child.key) ? 1 : 0) + checkedDescendants(child),
    0,
  )
</script>

<template>
  <Tree
    v-model:expandedKeys="expandedKeys"
    :value="nodes"
    class="p-0 border-none"
  >
    <template #default="{ node }">
      <label class="flex items-center gap-2 cursor-pointer select-none">
        <Checkbox
          :model-value="isChecked(node.key)"
          :binary="true"
          @update:model-value="(v: boolean) => toggle(node.key, v)"
        />
        <span>{{ node.label }}</span>
        <span
          v-if="!isChecked(node.key) && checkedDescendants(node) > 0"
          class="text-xs text-gray-500"
        >
          ({{ checkedDescendants(node) }} en subcategorías)
        </span>
      </label>
    </template>
  </Tree>
</template>
