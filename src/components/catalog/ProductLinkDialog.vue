<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :header="`Vincular productos a ${entityTypeLabel}: ${entityName}`"
    :modal="true"
    :style="{ width: '900px', maxWidth: '95vw' }"
    :closable="!isSaving"
  >
    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Content -->
    <div v-else class="grid grid-cols-2 gap-4">
      <!-- Left Column: Unlinked Products -->
      <div class="border rounded-lg overflow-hidden">
        <div class="bg-gray-50 px-4 py-3 border-b">
          <h3 class="font-semibold text-secondary">Productos disponibles</h3>
          <p class="text-xs text-secondary-400 mt-1">{{ unlinkedProducts.length }} productos sin vincular</p>
        </div>

        <!-- Search -->
        <div class="p-3 border-b">
          <InputText
            v-model="searchUnlinked"
            placeholder="Buscar productos..."
            class="w-full"
            size="small"
          />
        </div>

        <!-- List -->
        <div class="h-80 overflow-y-auto">
          <div v-if="filteredUnlinked.length === 0" class="p-4 text-center text-secondary-400">
            <i class="pi pi-inbox text-2xl mb-2"></i>
            <p class="text-sm">{{ searchUnlinked ? 'Sin resultados' : 'No hay productos disponibles' }}</p>
          </div>
          <div v-else class="divide-y">
            <label
              v-for="product in filteredUnlinked"
              :key="product.id"
              class="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
            >
              <Checkbox
                v-model="selectedUnlinked"
                :value="product.id"
                :inputId="`unlinked-${product.id}`"
              />
              <div class="flex-1 min-w-0">
                <p class="font-medium text-secondary text-sm truncate">{{ product.name }}</p>
                <p class="text-xs text-secondary-400">SKU: {{ product.sku || '-' }}</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-4 py-3 border-t flex items-center justify-between">
          <span class="text-sm text-secondary-500">
            {{ selectedUnlinked.length }} seleccionados
          </span>
          <Button
            label="Agregar"
            icon="pi pi-arrow-right"
            iconPos="right"
            size="small"
            :disabled="selectedUnlinked.length === 0 || isSaving"
            :loading="isSaving"
            @click="linkSelected"
          />
        </div>
      </div>

      <!-- Right Column: Linked Products -->
      <div class="border rounded-lg overflow-hidden">
        <div class="bg-primary/5 px-4 py-3 border-b">
          <h3 class="font-semibold text-primary">Productos vinculados</h3>
          <p class="text-xs text-primary/70 mt-1">{{ linkedProducts.length }} productos en esta {{ entityTypeLabel }}</p>
        </div>

        <!-- Search -->
        <div class="p-3 border-b">
          <InputText
            v-model="searchLinked"
            placeholder="Buscar vinculados..."
            class="w-full"
            size="small"
          />
        </div>

        <!-- List -->
        <div class="h-80 overflow-y-auto">
          <div v-if="filteredLinked.length === 0" class="p-4 text-center text-secondary-400">
            <i class="pi pi-inbox text-2xl mb-2"></i>
            <p class="text-sm">{{ searchLinked ? 'Sin resultados' : 'No hay productos vinculados' }}</p>
          </div>
          <div v-else class="divide-y">
            <label
              v-for="product in filteredLinked"
              :key="product.id"
              class="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
            >
              <Checkbox
                v-model="selectedLinked"
                :value="product.id"
                :inputId="`linked-${product.id}`"
              />
              <div class="flex-1 min-w-0">
                <p class="font-medium text-secondary text-sm truncate">{{ product.name }}</p>
                <p class="text-xs text-secondary-400">SKU: {{ product.sku || '-' }}</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 px-4 py-3 border-t flex items-center justify-between">
          <Button
            label="Quitar"
            icon="pi pi-arrow-left"
            severity="secondary"
            size="small"
            :disabled="selectedLinked.length === 0 || isSaving"
            :loading="isSaving"
            @click="unlinkSelected"
          />
          <span class="text-sm text-secondary-500">
            {{ selectedLinked.length }} seleccionados
          </span>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        label="Cerrar"
        severity="secondary"
        @click="$emit('update:visible', false)"
        :disabled="isSaving"
      />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import ProgressSpinner from 'primevue/progressspinner'
import { categoryApi } from '@/api/category.api'
import { brandApi } from '@/api/brand.api'
import { gammaApi } from '@/api/gamma.api'

interface ProductItem {
  id: number
  sku: string
  name: string
  published: boolean
}

interface Props {
  visible: boolean
  entityType: 'category' | 'brand' | 'gamma'
  entityId: number
  entityName: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'updated'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const toast = useToast()

const entityTypeLabel = computed(() => {
  switch (props.entityType) {
    case 'category': return 'categoría'
    case 'brand': return 'marca'
    case 'gamma': return 'gamma'
    default: return props.entityType
  }
})

const getApi = () => {
  switch (props.entityType) {
    case 'category': return categoryApi
    case 'brand': return brandApi
    case 'gamma': return gammaApi
  }
}

const isLoading = ref(false)
const isSaving = ref(false)
const linkedProducts = ref<ProductItem[]>([])
const unlinkedProducts = ref<ProductItem[]>([])
const selectedLinked = ref<number[]>([])
const selectedUnlinked = ref<number[]>([])
const searchLinked = ref('')
const searchUnlinked = ref('')

// Filtered lists
const filteredLinked = computed(() => {
  if (!searchLinked.value) return linkedProducts.value
  const query = searchLinked.value.toLowerCase()
  return linkedProducts.value.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.sku?.toLowerCase().includes(query)
  )
})

const filteredUnlinked = computed(() => {
  if (!searchUnlinked.value) return unlinkedProducts.value
  const query = searchUnlinked.value.toLowerCase()
  return unlinkedProducts.value.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.sku?.toLowerCase().includes(query)
  )
})

// Load products when dialog opens
watch(() => props.visible, async (isVisible) => {
  if (isVisible && props.entityId) {
    await loadProducts()
  } else {
    // Reset state when closed
    linkedProducts.value = []
    unlinkedProducts.value = []
    selectedLinked.value = []
    selectedUnlinked.value = []
    searchLinked.value = ''
    searchUnlinked.value = ''
  }
}, { immediate: true })

async function loadProducts() {
  try {
    isLoading.value = true

    const api = getApi()
    const response = await api.getProducts(props.entityId)

    if (response.success && response.data) {
      linkedProducts.value = response.data.linked || []
      unlinkedProducts.value = response.data.unlinked || []
    }
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al cargar productos',
      life: 5000
    })
  } finally {
    isLoading.value = false
  }
}

async function linkSelected() {
  if (selectedUnlinked.value.length === 0) return

  try {
    isSaving.value = true

    const api = getApi()
    await api.linkProducts(props.entityId, selectedUnlinked.value)

    toast.add({
      severity: 'success',
      summary: 'Vinculados',
      detail: `${selectedUnlinked.value.length} producto(s) vinculados correctamente`,
      life: 3000
    })

    selectedUnlinked.value = []
    await loadProducts()
    emit('updated')
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al vincular productos',
      life: 5000
    })
  } finally {
    isSaving.value = false
  }
}

async function unlinkSelected() {
  if (selectedLinked.value.length === 0) return

  try {
    isSaving.value = true

    const api = getApi()
    await api.unlinkProducts(props.entityId, selectedLinked.value)

    toast.add({
      severity: 'success',
      summary: 'Desvinculados',
      detail: `${selectedLinked.value.length} producto(s) desvinculados correctamente`,
      life: 3000
    })

    selectedLinked.value = []
    await loadProducts()
    emit('updated')
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Error al desvincular productos',
      life: 5000
    })
  } finally {
    isSaving.value = false
  }
}
</script>
