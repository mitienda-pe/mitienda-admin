<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-secondary-800">Promociones de NetSuite</h1>
        <p class="text-secondary-600 mt-1">
          Qué promociones llegaron de NetSuite a tu tienda y a qué productos alcanzan.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Button
          label="Diagnosticar en NetSuite"
          icon="pi pi-search-plus"
          severity="secondary"
          outlined
          :loading="diagnosing"
          :disabled="syncing"
          @click="onDiagnose"
        />
        <Button
          label="Sincronizar promociones"
          icon="pi pi-cloud-download"
          severity="secondary"
          outlined
          :loading="syncing"
          :disabled="diagnosing || !categoryConfigured"
          @click="onSync"
        />
        <Button
          label="Actualizar"
          icon="pi pi-refresh"
          :loading="isLoading"
          @click="loadPromotions"
        />
      </div>
    </div>

    <!-- Sin segmento configurado: el sync no corre y hay que decirlo sin rodeos -->
    <Message v-if="loaded && !categoryConfigured" severity="error" :closable="false">
      <span class="font-semibold">Falta configurar el segmento del canal.</span>
      Sin <span class="font-mono">customer category</span> no se puede saber qué promociones de
      NetSuite le corresponden a la tienda virtual, y la sincronización se detiene sin traer nada.
      Configúrala en
      <router-link to="/configuracion/netsuite" class="text-primary hover:underline">
        Configuración de NetSuite
      </router-link>.
    </Message>

    <!-- Promociones sin productos: existen pero no descuentan nada -->
    <Message v-else-if="resumen.inertes > 0" severity="warn" :closable="false">
      <span class="font-semibold">{{ resumen.inertes }}</span>
      {{ resumen.inertes === 1 ? 'promoción sincronizada no alcanza' : 'promociones sincronizadas no alcanzan' }}
      a ningún producto. Existen en la tienda pero no descuentan nada, casi siempre porque sus
      artículos de NetSuite no están mapeados a productos de tu catálogo.
      <button class="underline font-medium ml-1" @click="filtrarInertes">Ver solo esas</button>
    </Message>

    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

    <Message v-if="syncMessage" :severity="syncSeverity" @close="syncMessage = ''">
      {{ syncMessage }}
    </Message>

    <!-- Resumen -->
    <Card>
      <template #content>
        <div class="flex items-center gap-6 text-sm flex-wrap">
          <div class="flex items-center gap-2">
            <i class="pi pi-tags text-primary"></i>
            <span class="text-secondary-600">Sincronizadas:</span>
            <span class="font-semibold">{{ resumen.total }}</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="pi pi-exclamation-triangle" :class="resumen.inertes > 0 ? 'text-orange-500' : 'text-secondary-400'"></i>
            <span class="text-secondary-600">Sin productos:</span>
            <span class="font-semibold" :class="resumen.inertes > 0 ? 'text-orange-600' : ''">
              {{ resumen.inertes }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            <i class="pi pi-users text-secondary-400"></i>
            <span class="text-secondary-600">Segmento del canal:</span>
            <span class="font-mono font-semibold">{{ config.customer_category_id ?? 'sin configurar' }}</span>
          </div>
          <div class="flex items-center gap-2">
            <i class="pi pi-dollar text-secondary-400"></i>
            <span class="text-secondary-600">Nivel de precio:</span>
            <span class="font-mono font-semibold">{{ config.price_level_id ?? '—' }}</span>
          </div>
          <div v-if="resumen.last_sync" class="flex items-center gap-2">
            <i class="pi pi-clock text-secondary-400"></i>
            <span class="text-secondary-600">Última sincronización:</span>
            <span class="font-semibold">{{ resumen.last_sync }}</span>
          </div>
        </div>
      </template>
    </Card>

    <!-- Filtros -->
    <Card>
      <template #content>
        <div class="flex items-center gap-4 flex-wrap">
          <div class="flex-1 min-w-[240px]">
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search" />
              <InputText
                v-model="searchQuery"
                placeholder="Buscar por código o nombre..."
                class="w-full"
                @keyup.enter="applyFilters"
              />
            </span>
          </div>
          <div class="flex items-center gap-2">
            <Checkbox v-model="soloVacias" input-id="solo-vacias" :binary="true" @change="applyFilters" />
            <label for="solo-vacias" class="text-sm text-secondary-700 cursor-pointer">
              Solo las que no alcanzan productos
            </label>
          </div>
          <Button label="Buscar" icon="pi pi-search" :loading="isLoading" @click="applyFilters" />
        </div>
      </template>
    </Card>

    <!-- Listado -->
    <Card>
      <template #content>
        <DataTable
          v-model:expanded-rows="expandedRows"
          :value="promotions"
          :loading="isLoading"
          data-key="promocion_id"
          striped-rows
          responsive-layout="scroll"
          class="p-datatable-sm"
          @row-expand="onRowExpand"
        >
          <template #empty>
            <div class="text-center py-8 text-secondary-500">
              <i class="pi pi-inbox text-4xl mb-4 block"></i>
              <p>No hay promociones sincronizadas desde NetSuite</p>
              <p class="text-sm mt-2">
                Usa <span class="font-medium">Diagnosticar en NetSuite</span> para ver qué hay del
                otro lado y por qué no está llegando.
              </p>
            </div>
          </template>

          <Column expander style="width: 3rem" />

          <Column field="codigo" header="Código" :sortable="true" style="min-width: 200px">
            <template #body="{ data }">
              <div class="flex flex-col">
                <span class="font-mono text-sm">{{ data.codigo }}</span>
                <span v-if="data.netsuite_id" class="text-xs text-secondary-400">
                  NetSuite #{{ data.netsuite_id }}
                </span>
              </div>
            </template>
          </Column>

          <Column field="tipo" header="Tipo" :sortable="true" style="min-width: 120px">
            <template #body="{ data }">
              <Tag
                :severity="data.tipo === 'bonificacion' ? 'info' : 'contrast'"
                :value="data.tipo === 'bonificacion' ? 'Bonificación' : 'Descuento'"
              />
            </template>
          </Column>

          <Column field="valor" header="Valor" :sortable="true" style="min-width: 100px" class="text-right">
            <template #body="{ data }">
              <span v-if="data.tipo === 'bonificacion'" class="text-secondary-400 italic">—</span>
              <span v-else class="font-semibold">{{ formatValor(data) }}</span>
            </template>
          </Column>

          <Column header="Vigencia" style="min-width: 190px">
            <template #body="{ data }">
              <div class="text-sm">
                <span>{{ formatDate(data.inicio) }} → {{ formatDate(data.fin) }}</span>
                <Tag v-if="!data.vigente" severity="secondary" value="No vigente" class="ml-2" />
              </div>
            </template>
          </Column>

          <Column header="Alcance" :sortable="false" style="min-width: 160px">
            <template #body="{ data }">
              <Tag v-if="data.inerte" severity="warning" value="Sin productos" />
              <span v-else class="text-sm">
                <span class="font-semibold">{{ data.productos_vinculados }}</span>
                {{ data.productos_vinculados === 1 ? 'producto' : 'productos' }}
                <span v-if="data.bonificaciones_vinculadas > 0" class="text-secondary-500">
                  + {{ data.bonificaciones_vinculadas }} de regalo
                </span>
              </span>
            </template>
          </Column>

          <template #expansion="{ data }">
            <div class="p-3 bg-secondary-50">
              <div v-if="loadingProducts === data.promocion_id" class="text-sm text-secondary-500 py-2">
                <i class="pi pi-spin pi-spinner mr-2"></i>Cargando productos...
              </div>

              <div v-else-if="!(productsByPromotion[data.promocion_id]?.length)" class="text-sm text-secondary-600 py-2">
                Esta promoción no quedó vinculada a ningún producto. Revisa que los artículos de la
                promoción en NetSuite estén mapeados en tu catálogo (columna
                <span class="font-mono">Item ID</span> de la vista de Stock).
              </div>

              <DataTable
                v-else
                :value="productsByPromotion[data.promocion_id]"
                class="p-datatable-sm"
                striped-rows
              >
                <Column field="sku" header="SKU" style="min-width: 110px">
                  <template #body="{ data: p }">
                    <span class="font-mono text-sm">{{ p.sku ?? '—' }}</span>
                  </template>
                </Column>
                <Column field="netsuite_item_id" header="Item ID" style="min-width: 90px">
                  <template #body="{ data: p }">
                    <span class="font-mono text-xs text-secondary-500">{{ p.netsuite_item_id ?? '—' }}</span>
                  </template>
                </Column>
                <Column field="titulo" header="Producto" style="min-width: 260px">
                  <template #body="{ data: p }">
                    <div class="flex items-center gap-2">
                      <span class="text-sm">{{ p.titulo }}</span>
                      <Tag v-if="!p.publicado" severity="secondary" value="No publicado" />
                      <Tag v-if="p.rol === 'bonificacion'" severity="info" value="Regalo" />
                    </div>
                  </template>
                </Column>
                <Column header="Precio" style="min-width: 100px" class="text-right">
                  <template #body="{ data: p }">
                    <span :class="p.precio_con_descuento !== null ? 'line-through text-secondary-400' : 'font-semibold'">
                      {{ formatMoney(p.precio) }}
                    </span>
                  </template>
                </Column>
                <Column header="Con promoción" style="min-width: 120px" class="text-right">
                  <template #body="{ data: p }">
                    <span v-if="p.precio_con_descuento === null" class="text-secondary-400 italic">—</span>
                    <span v-else class="font-semibold text-primary">{{ formatMoney(p.precio_con_descuento) }}</span>
                  </template>
                </Column>
              </DataTable>
            </div>
          </template>
        </DataTable>

        <div v-if="pagination.total > pagination.limit" class="mt-4">
          <Paginator
            :rows="pagination.limit"
            :total-records="pagination.total"
            :first="(pagination.page - 1) * pagination.limit"
            :rows-per-page-options="[25, 50, 100]"
            @page="onPageChange"
          />
        </div>
      </template>
    </Card>

    <!-- Diagnóstico contra NetSuite -->
    <Dialog
      v-model:visible="showDiagnosis"
      header="Diagnóstico contra NetSuite"
      :style="{ width: '58rem' }"
      :breakpoints="{ '1199px': '85vw', '575px': '95vw' }"
      modal
    >
      <div v-if="diagnosing" class="py-8 text-center text-secondary-500">
        <i class="pi pi-spin pi-spinner text-2xl mb-3 block"></i>
        Consultando promociones en NetSuite...
      </div>

      <div v-else-if="diagnosisError" class="py-4">
        <Message severity="error" :closable="false">{{ diagnosisError }}</Message>
      </div>

      <div v-else-if="diagnosis" class="space-y-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="p-3 rounded border border-secondary-200">
            <p class="text-xs text-secondary-500">Activas en NetSuite</p>
            <p class="text-xl font-bold">{{ diagnosis.resumen.netsuite_activas }}</p>
          </div>
          <div class="p-3 rounded border border-secondary-200">
            <p class="text-xs text-secondary-500">Aplican al canal</p>
            <p class="text-xl font-bold text-primary">{{ diagnosis.resumen.aplican }}</p>
          </div>
          <div class="p-3 rounded border border-secondary-200">
            <p class="text-xs text-secondary-500">De otro segmento</p>
            <p class="text-xl font-bold">{{ diagnosis.resumen.descartadas_por_segmento }}</p>
          </div>
          <div class="p-3 rounded border border-secondary-200">
            <p class="text-xs text-secondary-500">Artículos sin mapear</p>
            <p class="text-xl font-bold" :class="diagnosis.resumen.items_sin_mapear > 0 ? 'text-orange-600' : ''">
              {{ diagnosis.resumen.items_sin_mapear }}
            </p>
          </div>
        </div>

        <p class="text-sm text-secondary-600">
          La tienda virtual vende siempre al nivel de precio del canal
          (<span class="font-mono">{{ diagnosis.price_level_id ?? '—' }}</span>), así que solo entran
          las promociones del segmento
          <span class="font-mono">{{ diagnosis.customer_category_id ?? 'sin configurar' }}</span>.
          Las de otros segmentos son descuentos de convenio y no corresponden a la web.
        </p>

        <Accordion :active-index="0">
          <AccordionTab :header="`Aplican al canal (${diagnosis.aplican.length})`">
            <div v-if="!diagnosis.aplican.length" class="text-sm text-secondary-500 py-2">
              Ninguna promoción activa de NetSuite tiene la categoría del canal. Para que aparezcan
              aquí, deben etiquetarse en NetSuite con la customer category
              <span class="font-mono">{{ diagnosis.customer_category_id }}</span>.
            </div>
            <div v-for="p in diagnosis.aplican" :key="p.codigo" class="py-3 border-b border-secondary-100 last:border-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-mono text-sm font-semibold">{{ p.codigo }}</span>
                <Tag :value="p.tipo" severity="contrast" />
                <span v-if="p.tasa" class="text-sm text-secondary-600">{{ p.tasa }}%</span>
                <span class="text-xs text-secondary-400">{{ p.inicio }} → {{ p.fin }}</span>
              </div>
              <ul class="mt-2 ml-4 text-sm text-secondary-700 list-disc">
                <li v-for="prod in p.productos" :key="`${p.codigo}-${prod.producto_id}`">
                  <span class="font-mono text-xs">{{ prod.sku }}</span> — {{ prod.titulo }}
                  <span v-if="prod.rol === 'bonificacion'" class="text-secondary-500">(regalo)</span>
                </li>
              </ul>
              <div v-if="p.items_sin_mapear.length" class="mt-2 ml-4 text-sm text-orange-700">
                <i class="pi pi-exclamation-triangle mr-1"></i>
                {{ p.items_sin_mapear.length }}
                {{ p.items_sin_mapear.length === 1 ? 'artículo sin mapear' : 'artículos sin mapear' }}:
                <span class="font-mono text-xs">
                  {{ p.items_sin_mapear.map(i => i.netsuite_item_id).join(', ') }}
                </span>
              </div>
            </div>
          </AccordionTab>

          <AccordionTab :header="`Descartadas por segmento (${diagnosis.descartadas.length})`">
            <DataTable :value="diagnosis.descartadas" class="p-datatable-sm" striped-rows :rows="15" paginator>
              <Column field="codigo" header="Código" style="min-width: 160px">
                <template #body="{ data: d }">
                  <span class="font-mono text-sm">{{ d.codigo }}</span>
                </template>
              </Column>
              <Column field="tipo" header="Tipo" style="min-width: 100px" />
              <Column field="customercategory" header="Segmento" style="min-width: 100px">
                <template #body="{ data: d }">
                  <span class="font-mono text-sm">{{ d.customercategory ?? '—' }}</span>
                </template>
              </Column>
              <Column field="motivo" header="Motivo" style="min-width: 320px">
                <template #body="{ data: d }">
                  <span class="text-sm text-secondary-600">{{ d.motivo }}</span>
                </template>
              </Column>
            </DataTable>
          </AccordionTab>
        </Accordion>
      </div>

      <template #footer>
        <Button label="Cerrar" severity="secondary" outlined @click="showDiagnosis = false" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { netsuiteApi } from '@/api/netsuite.api'
import { useFormatters } from '@/composables/useFormatters'
import type {
  NetsuiteSyncedPromotion,
  NetsuitePromotionProduct,
  NetsuitePromotionDiagnosis
} from '@/types/netsuite.types'

import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Paginator from 'primevue/paginator'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'

const toast = useToast()
const { currencySymbol } = useFormatters()

const promotions = ref<NetsuiteSyncedPromotion[]>([])
const productsByPromotion = ref<Record<number, NetsuitePromotionProduct[]>>({})
const expandedRows = ref<NetsuiteSyncedPromotion[]>([])
const loadingProducts = ref<number | null>(null)

const isLoading = ref(false)
const loaded = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
const soloVacias = ref(false)

const config = ref<{ customer_category_id: string | null; price_level_id: string | null }>({
  customer_category_id: null,
  price_level_id: null
})
const resumen = ref({ total: 0, inertes: 0, last_sync: null as string | null })
const pagination = ref({ page: 1, limit: 50, total: 0, pages: 0 })

const syncing = ref(false)
const syncMessage = ref('')
const syncSeverity = ref<'success' | 'warn' | 'error'>('success')

const diagnosing = ref(false)
const showDiagnosis = ref(false)
const diagnosis = ref<NetsuitePromotionDiagnosis | null>(null)
const diagnosisError = ref<string | null>(null)

const categoryConfigured = computed(() => !!config.value.customer_category_id)

async function loadPromotions() {
  isLoading.value = true
  error.value = null

  try {
    const response = await netsuiteApi.getNetsuitePromotions({
      search: searchQuery.value || undefined,
      soloVacias: soloVacias.value || undefined,
      page: pagination.value.page,
      limit: pagination.value.limit
    })

    promotions.value = response.data || []
    config.value = response.config || config.value
    resumen.value = response.resumen || resumen.value
    pagination.value = response.pagination || pagination.value
    // Las filas expandidas apuntan a objetos que acaban de ser reemplazados
    expandedRows.value = []
    productsByPromotion.value = {}
  } catch (err: any) {
    console.error('Error loading NetSuite promotions:', err)
    error.value = err.response?.data?.messages?.error
      || err.response?.data?.message
      || err.message
      || 'Error consultando promociones'
    toast.add({ severity: 'error', summary: 'Error', detail: error.value, life: 5000 })
  } finally {
    isLoading.value = false
    loaded.value = true
  }
}

function applyFilters() {
  pagination.value.page = 1
  loadPromotions()
}

function filtrarInertes() {
  soloVacias.value = true
  applyFilters()
}

function onPageChange(event: { page: number; rows: number }) {
  pagination.value.page = event.page + 1
  pagination.value.limit = event.rows
  loadPromotions()
}

async function onRowExpand(event: { data: NetsuiteSyncedPromotion }) {
  const id = event.data.promocion_id
  if (productsByPromotion.value[id]) return

  loadingProducts.value = id
  try {
    const response = await netsuiteApi.getNetsuitePromotionProducts(id)
    productsByPromotion.value = { ...productsByPromotion.value, [id]: response.data || [] }
  } catch (err: any) {
    console.error('Error loading promotion products:', err)
    productsByPromotion.value = { ...productsByPromotion.value, [id]: [] }
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudieron cargar los productos de la promoción',
      life: 4000
    })
  } finally {
    loadingProducts.value = null
  }
}

async function onSync() {
  syncing.value = true
  syncMessage.value = ''

  try {
    const response = await netsuiteApi.syncTiendaPromotions(false)
    const d = response.data || {}
    const vinculados = (d.activators_linked || 0) + (d.bonifications_linked || 0)

    if (response.success) {
      syncSeverity.value = vinculados === 0 ? 'warn' : 'success'
      syncMessage.value = `Sincronización terminada: ${d.promotions_created || 0} creadas, `
        + `${d.promotions_updated || 0} actualizadas, ${vinculados} productos vinculados.`
        + (vinculados === 0
          ? ' Ninguna promoción alcanzó productos: revisa el diagnóstico.'
          : '')
    } else {
      syncSeverity.value = 'error'
      syncMessage.value = d.errors?.[0] || 'La sincronización terminó con errores.'
    }

    await loadPromotions()
  } catch (err: any) {
    console.error('Error syncing promotions:', err)
    syncSeverity.value = 'error'
    syncMessage.value = err.response?.data?.messages?.error
      || err.response?.data?.messages?.message
      || err.message
      || 'Error sincronizando promociones'
  } finally {
    syncing.value = false
  }
}

async function onDiagnose() {
  diagnosing.value = true
  showDiagnosis.value = true
  diagnosisError.value = null
  diagnosis.value = null

  try {
    const response = await netsuiteApi.diagnoseNetsuitePromotions()
    diagnosis.value = response.data

    if (!response.data.success && response.data.errors?.length) {
      diagnosisError.value = response.data.errors[0]
    }
  } catch (err: any) {
    console.error('Error diagnosing promotions:', err)
    diagnosisError.value = err.response?.data?.messages?.error
      || err.response?.data?.messages?.message
      || err.message
      || 'Error consultando NetSuite'
  } finally {
    diagnosing.value = false
  }
}

function formatValor(p: NetsuiteSyncedPromotion): string {
  return p.tipo_descuento === 'porcentaje'
    ? `${p.valor}%`
    : `${currencySymbol.value} ${Number(p.valor).toFixed(2)}`
}

function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${currencySymbol.value} ${Number(value).toFixed(2)}`
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  return value.substring(0, 10)
}

onMounted(loadPromotions)
</script>
