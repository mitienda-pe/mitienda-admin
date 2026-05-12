<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePosStore } from '@/stores/pos.store'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import InlineEditField from '@/components/common/InlineEditField.vue'
import type { PosSucursal, PosSucursalNetsuiteConfig } from '@/types/pos.types'

const router = useRouter()
const store = usePosStore()
const toast = useToast()

onMounted(async () => {
  await Promise.all([store.fetchSucursales(), store.fetchNetsuiteConfig()])
})

const netsuiteByBranch = computed<Record<number, PosSucursalNetsuiteConfig>>(() => {
  const map: Record<number, PosSucursalNetsuiteConfig> = {}
  const branches = store.netsuiteConfig?.branches ?? []
  for (const b of branches) {
    map[b.tiendadireccion_id] = b
  }
  return map
})

const defaultBoleta = computed(() => store.netsuiteConfig?.defaults?.boleta_netsuite_id ?? null)
const defaultFactura = computed(() => store.netsuiteConfig?.defaults?.factura_netsuite_id ?? null)
const defaultGenericCustomer = computed(
  () => store.netsuiteConfig?.defaults?.generic_customer_id ?? null
)

function nsValue(sucursalId: number, key: keyof PosSucursalNetsuiteConfig): string | null {
  const ns = netsuiteByBranch.value[sucursalId]
  if (!ns) return null
  const value = ns[key]
  return value === null || value === undefined ? null : String(value)
}

function makeSaveHandler(sucursalId: number, key: keyof PosSucursalNetsuiteConfig) {
  return async (rawValue: string) => {
    const value = rawValue.trim() === '' ? null : rawValue.trim()
    const ok = await store.updateNetsuiteMapping(sucursalId, { [key]: value })
    if (!ok) {
      throw new Error(store.error ?? 'No se pudo guardar')
    }
    toast.add({
      severity: 'success',
      summary: 'Guardado',
      detail: 'Configuración NetSuite actualizada',
      life: 2500
    })
  }
}

function direccionCompleta(s: PosSucursal): string {
  const parts = [s.tiendadireccion_direccion, s.tiendadireccion_dist, s.tiendadireccion_prov]
    .filter(Boolean)
  return parts.length ? parts.join(', ') : '—'
}
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Sucursales POS</h1>
        <p class="text-sm text-gray-500 mt-1">
          Vista de solo lectura con la configuración POS y NetSuite por sucursal.
        </p>
      </div>
      <Button
        label="Editar direcciones"
        icon="pi pi-external-link"
        outlined
        @click="router.push('/store/addresses')"
      />
    </div>

    <!-- Info banner -->
    <div class="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
      <i class="pi pi-info-circle text-primary mt-1" />
      <div class="text-sm text-gray-700">
        <p>
          Para crear, editar o eliminar sucursales (nombre, dirección, número de cajas), usa
          <router-link to="/store/addresses" class="text-primary hover:underline font-medium">
            Tu Tienda → Direcciones
          </router-link>.
        </p>
        <p class="mt-1 text-gray-500">
          Aquí solo puedes ajustar la configuración NetSuite por sucursal (location, series boleta/factura, generic customer).
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading && !store.sucursales.length" class="flex justify-center py-12">
      <i class="pi pi-spinner pi-spin text-4xl text-primary" />
    </div>

    <!-- Empty -->
    <div
      v-else-if="!store.sucursales.length"
      class="bg-white rounded-xl border border-gray-200 p-12 text-center"
    >
      <i class="pi pi-map-marker text-4xl text-gray-300 mb-3" />
      <h3 class="text-lg font-semibold text-gray-700">Sin sucursales</h3>
      <p class="text-sm text-gray-500 mt-1">
        Crea la primera sucursal en Tu Tienda → Direcciones.
      </p>
      <Button
        label="Ir a Direcciones"
        icon="pi pi-arrow-right"
        outlined
        class="mt-4"
        @click="router.push('/store/addresses')"
      />
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <DataTable :value="store.sucursales" :rows="50" stripedRows class="p-datatable-sm">
        <Column header="Sucursal" style="min-width: 200px">
          <template #body="{ data }">
            <div>
              <p class="font-medium text-gray-800">
                {{ data.tiendadireccion_nombresucursal || '—' }}
              </p>
              <p class="text-xs text-gray-400">
                {{ direccionCompleta(data) }}
              </p>
            </div>
          </template>
        </Column>

        <Column header="Cajas" style="min-width: 70px">
          <template #body="{ data }">
            <span class="text-sm text-gray-700">{{ data.tiendadireccion_numero_cajas }}</span>
          </template>
        </Column>

        <Column header="NetSuite Location" style="min-width: 180px">
          <template #body="{ data }">
            <InlineEditField
              :model-value="nsValue(data.tiendadireccion_id, 'tiendadireccion_netsuite_location_id')"
              placeholder="Sin location"
              :on-save="makeSaveHandler(data.tiendadireccion_id, 'tiendadireccion_netsuite_location_id')"
            />
          </template>
        </Column>

        <Column header="Serie Boleta" style="min-width: 180px">
          <template #body="{ data }">
            <InlineEditField
              :model-value="nsValue(data.tiendadireccion_id, 'serie_boleta_netsuite_id')"
              :placeholder="defaultBoleta ? `Default: ${defaultBoleta}` : 'Sin serie'"
              :on-save="makeSaveHandler(data.tiendadireccion_id, 'serie_boleta_netsuite_id')"
            />
          </template>
        </Column>

        <Column header="Serie Factura" style="min-width: 180px">
          <template #body="{ data }">
            <InlineEditField
              :model-value="nsValue(data.tiendadireccion_id, 'serie_factura_netsuite_id')"
              :placeholder="defaultFactura ? `Default: ${defaultFactura}` : 'Sin serie'"
              :on-save="makeSaveHandler(data.tiendadireccion_id, 'serie_factura_netsuite_id')"
            />
          </template>
        </Column>

        <Column header="Generic Customer" style="min-width: 180px">
          <template #body="{ data }">
            <InlineEditField
              :model-value="nsValue(data.tiendadireccion_id, 'generic_customer_id')"
              :placeholder="defaultGenericCustomer ? `Default: ${defaultGenericCustomer}` : 'Sin customer'"
              :on-save="makeSaveHandler(data.tiendadireccion_id, 'generic_customer_id')"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
