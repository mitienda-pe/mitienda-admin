<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-secondary">Marcas</h1>
        <p class="text-sm text-secondary-500 mt-1">
          {{ catalogStore.brands.length }} marcas registradas
        </p>
      </div>
      <Button
        label="Nueva Marca"
        icon="pi pi-plus"
        @click="$router.push({ name: 'brand-create' })"
      />
    </div>

    <!-- Búsqueda -->
    <div class="mb-6">
      <SearchBar
        v-model="searchQuery"
        placeholder="Buscar marcas..."
      />
    </div>

    <!-- Loading -->
    <div v-if="catalogStore.isLoading" class="flex justify-center py-20">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <Message v-else-if="catalogStore.error" severity="error" :closable="false">
      {{ catalogStore.error }}
    </Message>

    <!-- Lista de Marcas -->
    <div v-else-if="filteredBrands.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <Card v-for="brand in filteredBrands" :key="brand.id" class="hover:shadow-lg transition-shadow">
        <template #content>
          <div class="space-y-3">
            <!-- Nombre -->
            <div class="flex items-start justify-between">
              <div>
                <h3 class="text-lg font-semibold text-secondary">{{ brand.name }}</h3>
                <p class="text-sm text-secondary-400">{{ brand.slug }}</p>
              </div>
              <div class="flex gap-1">
                <Button
                  icon="pi pi-link"
                  text
                  rounded
                  size="small"
                  severity="secondary"
                  @click="openLinkDialog(brand)"
                  v-tooltip.top="'Vincular productos'"
                />
                <Button
                  icon="pi pi-pencil"
                  text
                  rounded
                  size="small"
                  severity="secondary"
                  @click="$router.push({ name: 'brand-edit', params: { id: brand.id } })"
                  v-tooltip.top="'Editar'"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  size="small"
                  severity="danger"
                  @click="confirmDelete(brand)"
                  v-tooltip.top="'Eliminar'"
                />
              </div>
            </div>
            <!-- Contador de productos -->
            <div class="flex items-center gap-2 pt-2 border-t border-gray-100">
              <i class="pi pi-box text-secondary-400"></i>
              <span class="text-sm text-secondary-500">
                {{ brand.product_count || 0 }} producto{{ (brand.product_count || 0) !== 1 ? 's' : '' }}
              </span>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white rounded-lg shadow p-12 text-center">
      <i class="pi pi-inbox text-6xl text-secondary-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-secondary mb-2">No hay marcas</h3>
      <p class="text-secondary-500 mb-4">
        {{ searchQuery ? 'No se encontraron marcas con ese criterio' : 'Comienza creando tu primera marca' }}
      </p>
      <Button
        v-if="!searchQuery"
        label="Nueva Marca"
        icon="pi pi-plus"
        @click="$router.push({ name: 'brand-create' })"
      />
    </div>

    <!-- Dialog Confirmar Eliminación -->
    <Dialog
      v-model:visible="showDeleteDialog"
      header="Confirmar Eliminación"
      :modal="true"
      :style="{ width: '440px' }"
    >
      <p>¿Estás seguro de eliminar la marca <strong>{{ brandToDelete?.name }}</strong>?</p>

      <!-- Sin productos: borrado directo -->
      <p v-if="!deleteProductCount" class="text-sm text-secondary-500 mt-2">
        Esta acción no se puede deshacer.
      </p>

      <!-- Con productos: exigir qué hacer con ellos para no dejarlos huérfanos -->
      <div v-else class="mt-4 space-y-3">
        <Message severity="warn" :closable="false">
          Esta marca tiene <strong>{{ deleteProductCount }}</strong>
          producto{{ deleteProductCount !== 1 ? 's' : '' }} asociado{{ deleteProductCount !== 1 ? 's' : '' }}.
          ¿Qué hacer con {{ deleteProductCount !== 1 ? 'ellos' : 'él' }} antes de borrar?
        </Message>

        <div class="flex items-center gap-2">
          <RadioButton v-model="reassignChoice" input-id="reassign-none" value="none" />
          <label for="reassign-none" class="text-sm cursor-pointer">Dejar sin marca</label>
        </div>

        <div class="flex items-center gap-2">
          <RadioButton v-model="reassignChoice" input-id="reassign-other" value="reassign" />
          <label for="reassign-other" class="text-sm cursor-pointer">Reasignar a otra marca</label>
        </div>

        <Dropdown
          v-if="reassignChoice === 'reassign'"
          v-model="reassignTargetId"
          :options="otherBrands"
          option-label="name"
          option-value="id"
          placeholder="Selecciona una marca"
          class="w-full"
          filter
        />
      </div>

      <template #footer>
        <Button label="Cancelar" text @click="showDeleteDialog = false" />
        <Button
          label="Eliminar"
          severity="danger"
          :loading="isDeleting"
          :disabled="deleteConfirmDisabled"
          @click="deleteBrand"
        />
      </template>
    </Dialog>

    <!-- Dialog Vincular Productos -->
    <ProductLinkDialog
      v-model:visible="showLinkDialog"
      entity-type="brand"
      :entity-id="brandToLink?.id || 0"
      :entity-name="brandToLink?.name || ''"
      @updated="onProductsUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCatalogStore } from '@/stores/catalog.store'
import { useToast } from 'primevue/usetoast'
import Card from 'primevue/card'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import RadioButton from 'primevue/radiobutton'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import SearchBar from '@/components/common/SearchBar.vue'
import ProductLinkDialog from '@/components/catalog/ProductLinkDialog.vue'
import type { Brand } from '@/types/product.types'

const catalogStore = useCatalogStore()
const toast = useToast()

const searchQuery = ref('')
const showDeleteDialog = ref(false)
const brandToDelete = ref<Brand | null>(null)
const isDeleting = ref(false)

// Reasignación de productos al borrar una marca en uso (evita FKs huérfanos)
const reassignChoice = ref<'none' | 'reassign'>('none')
const reassignTargetId = ref<number | null>(null)

const deleteProductCount = computed(() => brandToDelete.value?.product_count || 0)

// Otras marcas (excluye la que se borra) como destino de reasignación
const otherBrands = computed(() =>
  catalogStore.brands.filter(b => b.id !== brandToDelete.value?.id)
)

// Bloquea el botón si eligió reasignar pero no seleccionó marca destino
const deleteConfirmDisabled = computed(() =>
  deleteProductCount.value > 0 &&
  reassignChoice.value === 'reassign' &&
  !reassignTargetId.value
)

// Link products dialog
const showLinkDialog = ref(false)
const brandToLink = ref<Brand | null>(null)

const filteredBrands = computed(() => {
  if (!searchQuery.value) return catalogStore.brands

  const query = searchQuery.value.toLowerCase()
  return catalogStore.brands.filter(brand =>
    brand.name.toLowerCase().includes(query) ||
    brand.slug?.toLowerCase().includes(query)
  )
})

const confirmDelete = (brand: Brand) => {
  brandToDelete.value = brand
  reassignChoice.value = 'none'
  reassignTargetId.value = null
  showDeleteDialog.value = true
}

const openLinkDialog = (brand: Brand) => {
  brandToLink.value = brand
  showLinkDialog.value = true
}

const onProductsUpdated = () => {
  // Refresh brands to update product counts
  catalogStore.fetchBrands()
}

const deleteBrand = async () => {
  if (!brandToDelete.value) return

  try {
    isDeleting.value = true

    // Si la marca tiene productos, indicar qué hacer con ellos:
    // 0 = dejar sin marca, o el id de otra marca. Sin productos → undefined.
    let reassignTo: number | undefined
    if (deleteProductCount.value > 0) {
      reassignTo = reassignChoice.value === 'reassign'
        ? (reassignTargetId.value ?? undefined)
        : 0
    }

    await catalogStore.deleteBrand(brandToDelete.value.id, reassignTo)

    toast.add({
      severity: 'success',
      summary: 'Eliminado',
      detail: 'La marca ha sido eliminada correctamente',
      life: 3000
    })

    showDeleteDialog.value = false
    brandToDelete.value = null
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.response?.data?.message || 'Error al eliminar la marca',
      life: 5000
    })
  } finally {
    isDeleting.value = false
  }
}

onMounted(async () => {
  if (catalogStore.brands.length === 0) {
    await catalogStore.fetchBrands()
  }
})
</script>
