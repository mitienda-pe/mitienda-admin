<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { courierRoutingApi, type CourierRoutingRule, type CreateRulePayload } from '@/api/courier-routing.api'
import { shippingServiceTypesApi } from '@/api/shipping.api'
import type { ShippingServiceType } from '@/types/shipping.types'
import apiClient from '@/api/axios'

import DataTable from 'primevue/datatable'
import PColumn from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import Tag from 'primevue/tag'
import Card from 'primevue/card'
import ProgressSpinner from 'primevue/progressspinner'
import ConfirmDialog from 'primevue/confirmdialog'

const toast = useToast()
const confirm = useConfirm()

// State
const rules = ref<CourierRoutingRule[]>([])
const serviceTypes = ref<ShippingServiceType[]>([])
const couriers = ref<Array<{ courier_id: number; courier_nombre: string; courier_nombrecorto: string }>>([])
const zones = ref<Array<{ tiendazona_id: number; tiendazona_nombre: string }>>([])
const isLoading = ref(false)
const isSaving = ref(false)

// Dialog
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingRuleId = ref<number | null>(null)
const form = ref<CreateRulePayload>({
  service_type_id: 0,
  courier_id: 0,
  tiendazona_id: null,
  ubigeo_id: null,
  rule_prioridad: 0,
})

// Scope options for "Aplicar a"
type ScopeType = 'all' | 'zone' | 'district'
const scopeType = ref<ScopeType>('all')
const scopeOptions = [
  { label: 'Todos los destinos', value: 'all' },
  { label: 'Zona específica', value: 'zone' },
]

// Filtered couriers based on selected service type
const filteredCouriers = computed(() => {
  if (!form.value.service_type_id) return couriers.value
  // In a full implementation, filter by courier_service_types
  // For now, show all configured couriers
  return couriers.value
})

// Scope label for display
function getScopeLabel(rule: CourierRoutingRule): string {
  if (rule.ubigeo_nombre) return rule.ubigeo_nombre
  if (rule.zona_nombre) return rule.zona_nombre
  return 'Todos los destinos'
}

function getScopeSeverity(rule: CourierRoutingRule): string {
  if (rule.ubigeo_id) return 'info'
  if (rule.tiendazona_id) return 'warning'
  return 'secondary'
}

// Load data
async function loadData() {
  isLoading.value = true
  try {
    const [rulesRes, typesRes, couriersRes, zonesRes] = await Promise.all([
      courierRoutingApi.getRules(),
      shippingServiceTypesApi.getAll(),
      apiClient.get('/courier-providers'),
      apiClient.get('/shipping-zones'),
    ])

    if (rulesRes.success) rules.value = rulesRes.data ?? []
    if (typesRes.success) serviceTypes.value = typesRes.data ?? []

    // Parse couriers — show all active couriers (configured or not)
    const couriersData = couriersRes.data?.data || couriersRes.data || []
    couriers.value = (Array.isArray(couriersData) ? couriersData : [])
      .map((c: any) => ({
        courier_id: Number(c.id || c.courier_id),
        courier_nombre: (c.name || c.courier_nombre) + (c.configured ? '' : ' (no configurado)'),
        courier_nombrecorto: c.code || c.courier_nombrecorto,
        configured: !!c.configured,
      }))

    // Parse zones
    const zonesData = zonesRes.data?.data || zonesRes.data || []
    zones.value = (Array.isArray(zonesData) ? zonesData : []).map((z: any) => ({
      tiendazona_id: Number(z.tiendazona_id),
      tiendazona_nombre: z.tiendazona_nombre,
    }))
  } catch (e) {
    console.error('Error loading data:', e)
    toast.add({ severity: 'error', summary: 'Error cargando datos', life: 3000 })
  } finally {
    isLoading.value = false
  }
}

// Open create dialog
function openCreateDialog() {
  isEditing.value = false
  editingRuleId.value = null
  scopeType.value = 'all'
  form.value = {
    service_type_id: serviceTypes.value[0]?.service_type_id || 0,
    courier_id: couriers.value[0]?.courier_id || 0,
    tiendazona_id: null,
    ubigeo_id: null,
    rule_prioridad: 0,
  }
  dialogVisible.value = true
}

// Open edit dialog
function openEditDialog(rule: CourierRoutingRule) {
  isEditing.value = true
  editingRuleId.value = rule.rule_id
  scopeType.value = rule.ubigeo_id ? 'district' : (rule.tiendazona_id ? 'zone' : 'all')
  form.value = {
    service_type_id: Number(rule.service_type_id),
    courier_id: Number(rule.courier_id),
    tiendazona_id: rule.tiendazona_id ? Number(rule.tiendazona_id) : null,
    ubigeo_id: rule.ubigeo_id ? Number(rule.ubigeo_id) : null,
    rule_prioridad: Number(rule.rule_prioridad),
  }
  dialogVisible.value = true
}

// Save rule
async function saveRule() {
  if (!form.value.service_type_id || !form.value.courier_id) {
    toast.add({ severity: 'warn', summary: 'Selecciona tipo de servicio y courier', life: 3000 })
    return
  }

  // Clear scope fields based on selection
  const payload = { ...form.value }
  if (scopeType.value === 'all') {
    payload.tiendazona_id = null
    payload.ubigeo_id = null
  } else if (scopeType.value === 'zone') {
    payload.ubigeo_id = null
  }

  isSaving.value = true
  try {
    let result
    if (isEditing.value && editingRuleId.value) {
      result = await courierRoutingApi.updateRule(editingRuleId.value, payload)
    } else {
      result = await courierRoutingApi.createRule(payload)
    }

    if (result.success) {
      toast.add({ severity: 'success', summary: isEditing.value ? 'Regla actualizada' : 'Regla creada', life: 3000 })
      dialogVisible.value = false
      await loadData()
    } else {
      toast.add({ severity: 'error', summary: 'Error', detail: result.message, life: 5000 })
    }
  } catch {
    toast.add({ severity: 'error', summary: 'Error guardando regla', life: 3000 })
  } finally {
    isSaving.value = false
  }
}

// Delete rule
function confirmDelete(rule: CourierRoutingRule) {
  confirm.require({
    message: `¿Eliminar la regla de "${rule.service_type_nombre}" → ${rule.courier_nombre}?`,
    header: 'Confirmar eliminación',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      const result = await courierRoutingApi.deleteRule(rule.rule_id)
      if (result.success) {
        toast.add({ severity: 'success', summary: 'Regla eliminada', life: 3000 })
        await loadData()
      }
    }
  })
}

onMounted(loadData)
</script>

<template>
  <div class="max-w-5xl mx-auto p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Reglas de Courier</h1>
        <p class="text-gray-600 mt-1">
          Configura qué courier se asigna automáticamente según el tipo de servicio y destino
        </p>
      </div>
      <Button
        label="Nueva regla"
        icon="pi pi-plus"
        @click="openCreateDialog"
        :disabled="couriers.length === 0"
      />
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- No couriers configured -->
    <Card v-else-if="couriers.length === 0" class="bg-yellow-50 border border-yellow-200">
      <template #content>
        <div class="flex gap-4 items-center">
          <i class="pi pi-exclamation-triangle text-yellow-600 text-2xl"></i>
          <div>
            <h3 class="font-semibold text-yellow-900">No hay couriers configurados</h3>
            <p class="text-sm text-yellow-800 mt-1">
              Primero configura al menos un proveedor de courier en
              <router-link to="/shipping/couriers" class="underline font-medium">Proveedores de Reparto</router-link>.
            </p>
          </div>
        </div>
      </template>
    </Card>

    <!-- Rules table -->
    <template v-else>
      <DataTable :value="rules" :rows="20" stripedRows class="w-full">
        <PColumn field="service_type_nombre" header="Tipo de Servicio" style="width: 180px">
          <template #body="{ data }">
            <span class="font-semibold">{{ data.service_type_nombre }}</span>
          </template>
        </PColumn>
        <PColumn header="Aplicar a" style="width: 200px">
          <template #body="{ data }">
            <Tag :value="getScopeLabel(data)" :severity="getScopeSeverity(data)" />
          </template>
        </PColumn>
        <PColumn field="courier_nombre" header="Courier" style="width: 160px">
          <template #body="{ data }">
            {{ data.courier_nombre }}
          </template>
        </PColumn>
        <PColumn field="rule_prioridad" header="Prioridad" style="width: 100px">
          <template #body="{ data }">
            {{ data.rule_prioridad }}
          </template>
        </PColumn>
        <PColumn field="rule_activo" header="Estado" style="width: 100px">
          <template #body="{ data }">
            <Tag
              :value="Number(data.rule_activo) === 1 ? 'Activo' : 'Inactivo'"
              :severity="Number(data.rule_activo) === 1 ? 'success' : 'secondary'"
            />
          </template>
        </PColumn>
        <PColumn header="Acciones" style="width: 120px">
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button icon="pi pi-pencil" severity="info" text rounded size="small" @click="openEditDialog(data)" />
              <Button icon="pi pi-trash" severity="danger" text rounded size="small" @click="confirmDelete(data)" />
            </div>
          </template>
        </PColumn>
      </DataTable>

      <!-- Empty state -->
      <div v-if="rules.length === 0" class="text-center py-12 bg-gray-50 rounded-lg">
        <i class="pi pi-directions text-4xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 mb-2">No hay reglas de courier configuradas</p>
        <p class="text-sm text-gray-400 mb-4">Los pedidos se crearán sin courier asignado (despacho manual)</p>
        <Button label="Crear primera regla" icon="pi pi-plus" @click="openCreateDialog" />
      </div>
    </template>

    <!-- Info box -->
    <Card class="bg-primary/5 border border-primary/20">
      <template #content>
        <div class="flex gap-4">
          <i class="pi pi-info-circle text-primary text-2xl"></i>
          <div>
            <h3 class="font-semibold text-secondary-700 mb-2">Cómo funciona</h3>
            <ul class="text-sm text-primary space-y-1">
              <li>* Las reglas determinan qué courier se asigna automáticamente al crear un pedido</li>
              <li>* Puedes definir reglas por tipo de servicio y zona geográfica</li>
              <li>* Si hay varias reglas para el mismo tipo, se usa la de menor prioridad (0 = más alta)</li>
              <li>* Destinos sin regla quedan sin courier (despacho manual)</li>
            </ul>
          </div>
        </div>
      </template>
    </Card>

    <!-- Create/Edit Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="isEditing ? 'Editar Regla' : 'Nueva Regla de Courier'"
      :modal="true"
      :style="{ width: '480px' }"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Tipo de servicio <span class="text-red-500">*</span>
          </label>
          <Dropdown
            v-model="form.service_type_id"
            :options="serviceTypes"
            optionLabel="service_type_nombre"
            optionValue="service_type_id"
            placeholder="Seleccionar..."
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Courier <span class="text-red-500">*</span>
          </label>
          <Dropdown
            v-model="form.courier_id"
            :options="filteredCouriers"
            optionLabel="courier_nombre"
            optionValue="courier_id"
            placeholder="Seleccionar..."
            class="w-full"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Aplicar a</label>
          <Dropdown
            v-model="scopeType"
            :options="scopeOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>

        <div v-if="scopeType === 'zone'">
          <label class="block text-sm font-medium text-gray-700 mb-2">Zona</label>
          <Dropdown
            v-model="form.tiendazona_id"
            :options="zones"
            optionLabel="tiendazona_nombre"
            optionValue="tiendazona_id"
            placeholder="Seleccionar zona..."
            class="w-full"
            showClear
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Prioridad
          </label>
          <InputNumber
            v-model="form.rule_prioridad"
            :min="0"
            :max="99"
            placeholder="0"
            class="w-32"
          />
          <p class="text-xs text-gray-500 mt-1">Menor número = mayor prioridad</p>
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" severity="secondary" text @click="dialogVisible = false" />
        <Button
          :label="isEditing ? 'Guardar' : 'Crear'"
          icon="pi pi-check"
          :loading="isSaving"
          @click="saveRule"
        />
      </template>
    </Dialog>

    <ConfirmDialog />
  </div>
</template>
