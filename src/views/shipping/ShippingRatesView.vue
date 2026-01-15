<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Tarifas de Envío</h1>
        <p class="text-gray-600 mt-1">Configura los costos de envío por ubicación</p>
      </div>
    </div>

    <!-- Loading countries -->
    <div v-if="store.isLoading && countries.length === 0" class="flex items-center justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- No countries configured -->
    <Card v-else-if="countries.length === 0" class="bg-yellow-50 border border-yellow-200">
      <template #content>
        <div class="flex gap-4 items-center">
          <i class="pi pi-exclamation-triangle text-yellow-600 text-2xl"></i>
          <div>
            <h3 class="font-semibold text-yellow-900">No hay países configurados</h3>
            <p class="text-sm text-yellow-800 mt-1">
              Tu tienda no tiene países habilitados para envío. Contacta al administrador para configurar los países disponibles.
            </p>
          </div>
        </div>
      </template>
    </Card>

    <!-- Tabs de países -->
    <TabView v-else v-model:activeIndex="activeTabIndex" @tab-change="onTabChange">
      <TabPanel v-for="country in countries" :key="country.code">
        <template #header>
          <div class="flex items-center gap-2">
            <span>{{ country.flag }}</span>
            <span>{{ country.name }}</span>
          </div>
        </template>

        <!-- Contenido del tab -->
        <div class="space-y-4">
          <!-- Toolbar -->
          <div class="flex items-center justify-between">
            <Button
              label="Agregar ubicación"
              icon="pi pi-plus"
              @click="openAddDialog"
            />
            <IconField>
              <InputIcon class="pi pi-search" />
              <InputText v-model="searchQuery" placeholder="Buscar ubicación..." class="w-64" />
            </IconField>
          </div>

          <!-- Loading -->
          <div v-if="store.isLoading" class="flex items-center justify-center py-12">
            <ProgressSpinner />
          </div>

          <!-- TreeTable -->
          <TreeTable
            v-else
            :value="filteredRates"
            :expandedKeys="expandedKeys"
            @node-expand="onNodeExpand"
            @node-collapse="onNodeCollapse"
            class="w-full"
            :resizableColumns="true"
          >
            <Column field="name" header="Ubicación" :expander="true" style="min-width: 300px">
              <template #body="{ node }">
                <div class="flex items-center gap-2">
                  <span :class="{ 'font-semibold': node.data.level === 1, 'text-gray-600': !node.data.hasRate }">
                    {{ node.data.name }}
                  </span>
                  <Tag v-if="!node.data.hasRate" value="Sin tarifa" severity="secondary" class="text-xs" />
                </div>
              </template>
            </Column>

            <Column field="price" header="Precio" style="width: 120px">
              <template #body="{ node }">
                <span v-if="node.data.hasRate" class="font-medium">
                  {{ formatPrice(node.data.price, country.code) }}
                </span>
                <span v-else class="text-gray-400">—</span>
              </template>
            </Column>

            <Column field="deliveryTime" header="Tiempo" style="width: 120px">
              <template #body="{ node }">
                <span v-if="node.data.hasRate">
                  {{ formatTime(node.data.deliveryTime, node.data.deliveryTimeUnit) }}
                </span>
                <span v-else class="text-gray-400">—</span>
              </template>
            </Column>

            <Column field="enabled" header="Estado" style="width: 100px">
              <template #body="{ node }">
                <Tag
                  v-if="node.data.hasRate"
                  :value="node.data.enabled ? 'Activo' : 'Inactivo'"
                  :severity="node.data.enabled ? 'success' : 'secondary'"
                />
                <span v-else class="text-gray-400">—</span>
              </template>
            </Column>

            <Column header="Acciones" style="width: 150px">
              <template #body="{ node }">
                <div class="flex items-center gap-1">
                  <Button
                    v-if="node.data.hasRate"
                    icon="pi pi-pencil"
                    severity="info"
                    text
                    rounded
                    size="small"
                    v-tooltip.top="'Editar'"
                    @click="openEditDialog(node)"
                  />
                  <Button
                    v-if="node.data.hasRate"
                    :icon="node.data.enabled ? 'pi pi-eye-slash' : 'pi pi-eye'"
                    :severity="node.data.enabled ? 'secondary' : 'success'"
                    text
                    rounded
                    size="small"
                    v-tooltip.top="node.data.enabled ? 'Desactivar' : 'Activar'"
                    @click="toggleRate(node)"
                  />
                  <Button
                    v-if="node.data.hasRate"
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    size="small"
                    v-tooltip.top="'Eliminar'"
                    @click="confirmDelete(node)"
                  />
                  <Button
                    v-if="!node.data.hasRate"
                    icon="pi pi-plus"
                    severity="success"
                    text
                    rounded
                    size="small"
                    v-tooltip.top="'Agregar tarifa'"
                    @click="openAddDialogForLocation(node)"
                  />
                </div>
              </template>
            </Column>
          </TreeTable>

          <!-- Empty state -->
          <div
            v-if="!store.isLoading && filteredRates.length === 0"
            class="text-center py-12 bg-gray-50 rounded-lg"
          >
            <i class="pi pi-map-marker text-4xl text-gray-300 mb-4"></i>
            <p class="text-gray-500">No hay tarifas configuradas para {{ country.name }}</p>
            <Button
              label="Agregar primera tarifa"
              icon="pi pi-plus"
              class="mt-4"
              @click="openAddDialog"
            />
          </div>
        </div>
      </TabPanel>
    </TabView>

    <!-- Info box -->
    <Card class="bg-blue-50 border border-blue-200">
      <template #content>
        <div class="flex gap-4">
          <i class="pi pi-info-circle text-blue-600 text-2xl"></i>
          <div>
            <h3 class="font-semibold text-blue-900 mb-2">Cómo funciona</h3>
            <ul class="text-sm text-blue-800 space-y-1">
              <li>* Las tarifas en niveles superiores (ej. departamento) aplican a todas las ubicaciones hijas sin tarifa propia</li>
              <li>* Puedes configurar tarifas a nivel de departamento, provincia o distrito</li>
              <li>* El tiempo de entrega puede especificarse en días u horas</li>
            </ul>
          </div>
        </div>
      </template>
    </Card>

    <!-- Dialog Editar Tarifa -->
    <Dialog
      v-model:visible="editDialogVisible"
      :header="editingNode?.data.hasRate ? 'Editar Tarifa' : 'Nueva Tarifa'"
      :modal="true"
      :style="{ width: '450px' }"
    >
      <div v-if="editingNode" class="space-y-4">
        <div class="p-3 bg-gray-100 rounded-lg">
          <p class="text-sm text-gray-600">Ubicación</p>
          <p class="font-medium">{{ editingNode.data.fullName || editingNode.data.name }}</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Precio de envío <span class="text-red-500">*</span>
          </label>
          <InputGroup>
            <InputGroupAddon>{{ currentCountry?.currencySymbol }}</InputGroupAddon>
            <InputNumber
              v-model="editForm.price"
              :min="0"
              :minFractionDigits="2"
              :maxFractionDigits="2"
              placeholder="0.00"
              class="w-full"
            />
          </InputGroup>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Tiempo de entrega <span class="text-red-500">*</span>
          </label>
          <div class="flex gap-2">
            <InputNumber
              v-model="editForm.deliveryTime"
              :min="1"
              placeholder="0"
              class="w-24"
            />
            <SelectButton
              v-model="editForm.deliveryTimeUnit"
              :options="timeUnitOptions"
              optionLabel="label"
              optionValue="value"
            />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Checkbox v-model="editForm.enabled" inputId="enabled" :binary="true" />
          <label for="enabled" class="cursor-pointer">Habilitado</label>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="editDialogVisible = false" />
        <Button
          label="Guardar"
          icon="pi pi-check"
          :loading="store.isSaving"
          @click="saveRate"
        />
      </template>
    </Dialog>

    <!-- Dialog Agregar Ubicación -->
    <Dialog
      v-model:visible="addDialogVisible"
      header="Agregar Ubicación"
      :modal="true"
      :style="{ width: '500px' }"
    >
      <div class="space-y-4">
        <!-- Selector de ubicación en cascada -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {{ currentCountry?.levels[0] || 'Departamento' }} <span class="text-red-500">*</span>
          </label>
          <Dropdown
            v-model="addForm.level1"
            :options="level1Options"
            optionLabel="name"
            optionValue="code"
            placeholder="Seleccionar..."
            class="w-full"
            :loading="store.isLoadingLocations"
            @change="onLevel1Change"
          />
        </div>

        <div v-if="addForm.level1 && level2Options.length > 0">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {{ currentCountry?.levels[1] || 'Provincia' }} (opcional)
          </label>
          <Dropdown
            v-model="addForm.level2"
            :options="level2Options"
            optionLabel="name"
            optionValue="code"
            placeholder="Seleccionar..."
            class="w-full"
            showClear
            :loading="store.isLoadingLocations"
            @change="onLevel2Change"
          />
        </div>

        <div v-if="addForm.level2 && level3Options.length > 0">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            {{ currentCountry?.levels[2] || 'Distrito' }} (opcional)
          </label>
          <Dropdown
            v-model="addForm.level3"
            :options="level3Options"
            optionLabel="name"
            optionValue="code"
            placeholder="Seleccionar..."
            class="w-full"
            showClear
            :loading="store.isLoadingLocations"
          />
        </div>

        <Divider />

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Precio de envío <span class="text-red-500">*</span>
          </label>
          <InputGroup>
            <InputGroupAddon>{{ currentCountry?.currencySymbol }}</InputGroupAddon>
            <InputNumber
              v-model="addForm.price"
              :min="0"
              :minFractionDigits="2"
              :maxFractionDigits="2"
              placeholder="0.00"
              class="w-full"
            />
          </InputGroup>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Tiempo de entrega <span class="text-red-500">*</span>
          </label>
          <div class="flex gap-2">
            <InputNumber
              v-model="addForm.deliveryTime"
              :min="1"
              placeholder="0"
              class="w-24"
            />
            <SelectButton
              v-model="addForm.deliveryTimeUnit"
              :options="timeUnitOptions"
              optionLabel="label"
              optionValue="value"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="addDialogVisible = false" />
        <Button
          label="Agregar"
          icon="pi pi-check"
          :loading="store.isSaving"
          :disabled="!canSaveAdd"
          @click="addRate"
        />
      </template>
    </Dialog>

    <!-- Confirm Delete Dialog -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useShippingStore } from '@/stores/shipping.store'
import {
  formatDeliveryTime,
  formatPrice as formatPriceHelper
} from '@/types/shipping.types'
import type { CountryCode, RateTreeNode, DeliveryTimeUnit, Location } from '@/types/shipping.types'

// PrimeVue Components
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import TreeTable from 'primevue/treetable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import InputGroup from 'primevue/inputgroup'
import InputGroupAddon from 'primevue/inputgroupaddon'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Dropdown from 'primevue/dropdown'
import SelectButton from 'primevue/selectbutton'
import Checkbox from 'primevue/checkbox'
import Tag from 'primevue/tag'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import Divider from 'primevue/divider'
import ProgressSpinner from 'primevue/progressspinner'
import ConfirmDialog from 'primevue/confirmdialog'

const toast = useToast()
const confirm = useConfirm()
const store = useShippingStore()

// State
const activeTabIndex = ref(0)
const searchQuery = ref('')
const expandedKeys = ref<Record<string, boolean>>({})

// Edit dialog
const editDialogVisible = ref(false)
const editingNode = ref<RateTreeNode | null>(null)
const editForm = ref({
  price: 0,
  deliveryTime: 1,
  deliveryTimeUnit: 'days' as DeliveryTimeUnit,
  enabled: true
})

// Add dialog
const addDialogVisible = ref(false)
const addForm = ref({
  level1: null as string | null,
  level2: null as string | null,
  level3: null as string | null,
  price: 0,
  deliveryTime: 1,
  deliveryTimeUnit: 'days' as DeliveryTimeUnit
})
const level1Options = ref<Location[]>([])
const level2Options = ref<Location[]>([])
const level3Options = ref<Location[]>([])

// Options
const timeUnitOptions = [
  { label: 'Horas', value: 'hours' },
  { label: 'Días', value: 'days' }
]

// Computed
const countries = computed(() => store.enabledCountries)
const currentCountry = computed(() => countries.value[activeTabIndex.value])

const filteredRates = computed(() => {
  const rates = store.currentRates
  if (!searchQuery.value) return rates

  const query = searchQuery.value.toLowerCase()
  return filterTreeNodes(rates, query)
})

const canSaveAdd = computed(() => {
  return addForm.value.level1 && addForm.value.price > 0 && addForm.value.deliveryTime > 0
})

// Methods
function filterTreeNodes(nodes: RateTreeNode[], query: string): RateTreeNode[] {
  return nodes.reduce((acc: RateTreeNode[], node) => {
    const matches = node.data.name.toLowerCase().includes(query)
    const filteredChildren = node.children ? filterTreeNodes(node.children, query) : []

    if (matches || filteredChildren.length > 0) {
      acc.push({
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : node.children
      })
    }
    return acc
  }, [])
}

function formatPrice(price: number | undefined, countryCode: CountryCode): string {
  if (price === undefined) return '—'
  return formatPriceHelper(price, countryCode)
}

function formatTime(time: number | undefined, unit: DeliveryTimeUnit | undefined): string {
  if (time === undefined || unit === undefined) return '—'
  return formatDeliveryTime(time, unit)
}

function onTabChange(event: { index: number }) {
  store.setCurrentCountry(countries.value[event.index].code)
  store.fetchRates()
  expandedKeys.value = {}
}

function onNodeExpand(node: { key: string }) {
  expandedKeys.value[node.key] = true
}

function onNodeCollapse(node: { key: string }) {
  expandedKeys.value[node.key] = false
}

// Edit dialog
function openEditDialog(node: RateTreeNode) {
  editingNode.value = node
  editForm.value = {
    price: node.data.price || 0,
    deliveryTime: node.data.deliveryTime || 1,
    deliveryTimeUnit: node.data.deliveryTimeUnit || 'days',
    enabled: node.data.enabled ?? true
  }
  editDialogVisible.value = true
}

function openAddDialogForLocation(node: RateTreeNode) {
  editingNode.value = node
  editForm.value = {
    price: 0,
    deliveryTime: 1,
    deliveryTimeUnit: 'days',
    enabled: true
  }
  editDialogVisible.value = true
}

async function saveRate() {
  if (!editingNode.value) return

  const node = editingNode.value
  const isNew = !node.data.hasRate

  if (editForm.value.price <= 0) {
    toast.add({ severity: 'warn', summary: 'Precio requerido', life: 3000 })
    return
  }

  if (editForm.value.deliveryTime <= 0) {
    toast.add({ severity: 'warn', summary: 'Tiempo de entrega requerido', life: 3000 })
    return
  }

  let result
  if (isNew) {
    result = await store.createRate({
      locationId: node.data.locationId,
      locationCode: node.data.code,
      countryCode: currentCountry.value.code,
      price: editForm.value.price,
      deliveryTime: editForm.value.deliveryTime,
      deliveryTimeUnit: editForm.value.deliveryTimeUnit,
      enabled: editForm.value.enabled
    })
  } else {
    result = await store.updateRate(node.data.id!, {
      price: editForm.value.price,
      deliveryTime: editForm.value.deliveryTime,
      deliveryTimeUnit: editForm.value.deliveryTimeUnit,
      enabled: editForm.value.enabled
    })
  }

  if (result.success) {
    toast.add({
      severity: 'success',
      summary: isNew ? 'Tarifa creada' : 'Tarifa actualizada',
      life: 3000
    })
    editDialogVisible.value = false
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: result.error,
      life: 3000
    })
  }
}

// Add dialog
async function openAddDialog() {
  addForm.value = {
    level1: null,
    level2: null,
    level3: null,
    price: 0,
    deliveryTime: 1,
    deliveryTimeUnit: 'days'
  }
  level2Options.value = []
  level3Options.value = []

  // Load level 1 options
  level1Options.value = await store.fetchLocations(currentCountry.value.code)
  addDialogVisible.value = true
}

async function onLevel1Change() {
  addForm.value.level2 = null
  addForm.value.level3 = null
  level3Options.value = []

  if (addForm.value.level1) {
    level2Options.value = await store.fetchLocations(currentCountry.value.code, addForm.value.level1)
  } else {
    level2Options.value = []
  }
}

async function onLevel2Change() {
  addForm.value.level3 = null

  if (addForm.value.level2) {
    level3Options.value = await store.fetchLocations(currentCountry.value.code, addForm.value.level2)
  } else {
    level3Options.value = []
  }
}

async function addRate() {
  // Determine which level code to use
  const locationCode = addForm.value.level3 || addForm.value.level2 || addForm.value.level1
  if (!locationCode) return

  // Find the location to get its ID
  let location: Location | undefined
  if (addForm.value.level3) {
    location = level3Options.value.find(l => l.code === addForm.value.level3)
  } else if (addForm.value.level2) {
    location = level2Options.value.find(l => l.code === addForm.value.level2)
  } else {
    location = level1Options.value.find(l => l.code === addForm.value.level1)
  }

  if (!location) {
    toast.add({ severity: 'error', summary: 'Ubicación no encontrada', life: 3000 })
    return
  }

  const result = await store.createRate({
    locationId: location.id,
    locationCode: location.code,
    countryCode: currentCountry.value.code,
    price: addForm.value.price,
    deliveryTime: addForm.value.deliveryTime,
    deliveryTimeUnit: addForm.value.deliveryTimeUnit,
    enabled: true
  })

  if (result.success) {
    toast.add({ severity: 'success', summary: 'Tarifa agregada', life: 3000 })
    addDialogVisible.value = false
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: result.error, life: 3000 })
  }
}

// Toggle
async function toggleRate(node: RateTreeNode) {
  if (!node.data.id) return

  const result = await store.toggleRate(node.data.id, !node.data.enabled)
  if (result.success) {
    toast.add({
      severity: 'success',
      summary: node.data.enabled ? 'Tarifa desactivada' : 'Tarifa activada',
      life: 3000
    })
  }
}

// Delete
function confirmDelete(node: RateTreeNode) {
  confirm.require({
    message: `¿Eliminar la tarifa de "${node.data.name}"?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      if (!node.data.id) return
      const result = await store.deleteRate(node.data.id)
      if (result.success) {
        toast.add({ severity: 'success', summary: 'Tarifa eliminada', life: 3000 })
      } else {
        toast.add({ severity: 'error', summary: 'Error', detail: result.error, life: 3000 })
      }
    }
  })
}

// Lifecycle
onMounted(async () => {
  // Fetch enabled countries first
  await store.fetchEnabledCountries()
  // Then fetch rates for the current country
  if (store.hasEnabledCountries) {
    store.fetchRates()
  }
})

// Watch for country changes
watch(activeTabIndex, () => {
  expandedKeys.value = {}
})
</script>

<style scoped>
/* Fix TreeTable toggler positioning */
:deep(.p-treetable-tbody > tr > td:first-child) {
  display: flex !important;
  align-items: center;
  gap: 0.5rem;
}

:deep(.p-treetable-toggler) {
  flex-shrink: 0;
  order: -1;
}

:deep(.p-treetable-tbody > tr > td:first-child > div) {
  flex: 1;
}
</style>
