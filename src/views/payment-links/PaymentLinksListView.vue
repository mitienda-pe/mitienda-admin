<script setup lang="ts">
/**
 * Links de pago — cobros compartibles por WhatsApp que terminan en una venta
 * real (inventario, comprobante, ERP).
 *
 * Reemplaza al módulo del panel legacy, que cobraba contra una tabla paralela
 * sin generar venta. Por eso el listado muestra "Ventas": es la columna que en
 * el legacy no podía existir.
 */
import { computed, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Calendar from 'primevue/calendar'
import Textarea from 'primevue/textarea'
import Tag from 'primevue/tag'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import { paymentLinksApi } from '@/api/payment-links.api'
import { useFormatters } from '@/composables/useFormatters'
import type { PaymentLink, PaymentLinkBloqueo } from '@/types/payment-link.types'

const toast = useToast()
const confirm = useConfirm()
const { formatCurrency } = useFormatters()

const links = ref<PaymentLink[]>([])
const loading = ref(false)
const total = ref(0)

// ── Listado ─────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    const response = await paymentLinksApi.list({ page: 1, limit: 50 })
    links.value = response.data
    total.value = response.pagination?.total ?? response.data.length
    afectacionPorDefecto.value = response.afectacionSugerida
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'No se pudo cargar',
      detail: e?.response?.data?.mensaje || 'Intenta de nuevo en un momento.',
      life: 5000,
    })
  } finally {
    loading.value = false
  }
}

onMounted(load)

/**
 * Lo que se muestra es `bloqueo` (estado efectivo AHORA), no `estado`: entre dos
 * corridas del cron de expiración un link vencido sigue guardado como `activo`,
 * y el legacy mostraba justamente esa mentira en su listado.
 */
function estadoTag(link: PaymentLink): { label: string; severity: string } {
  const mapa: Record<string, { label: string; severity: string }> = {
    vencido: { label: 'Vencido', severity: 'warn' },
    agotado: { label: 'Agotado', severity: 'secondary' },
    pausado: { label: 'Pausado', severity: 'secondary' },
    anulado: { label: 'Anulado', severity: 'danger' },
    aun_no_vigente: { label: 'Programado', severity: 'info' },
    no_disponible: { label: 'No disponible', severity: 'secondary' },
  }
  const bloqueo = link.bloqueo as Exclude<PaymentLinkBloqueo, null>
  return bloqueo ? mapa[bloqueo] : { label: 'Activo', severity: 'success' }
}

function usosLabel(link: PaymentLink): string {
  return link.max_usos === null ? `${link.usos} · sin límite` : `${link.usos} / ${link.max_usos}`
}

function fecha(valor: string | null): string {
  if (!valor) return '—'
  return new Date(valor.replace(' ', 'T')).toLocaleDateString('es-PE')
}

// ── Compartir ───────────────────────────────────────────────────────────────
const shareLink = ref<PaymentLink | null>(null)
const shareVisible = ref(false)

function abrirCompartir(link: PaymentLink) {
  shareLink.value = link
  shareVisible.value = true
}

const mensajeWhatsapp = computed(() => {
  const link = shareLink.value
  if (!link) return ''
  const saludo = link.mensaje ? `${link.mensaje}\n\n` : ''
  return `${saludo}Puedes pagar aquí: ${link.url}`
})

const urlWhatsapp = computed(() => {
  const telefono = (shareLink.value?.cliente?.telefono || '').replace(/\D/g, '')
  const texto = encodeURIComponent(mensajeWhatsapp.value)
  // Sin teléfono, wa.me abre el selector de contactos — que es justo lo que
  // quiere el comerciante cuando el link no tiene un cliente asignado.
  return telefono ? `https://wa.me/${telefono}?text=${texto}` : `https://wa.me/?text=${texto}`
})

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto)
    toast.add({ severity: 'success', summary: 'Copiado', life: 2000 })
  } catch {
    toast.add({
      severity: 'warn',
      summary: 'No se pudo copiar',
      detail: 'Selecciona el texto y cópialo a mano.',
      life: 4000,
    })
  }
}

// ── Crear ───────────────────────────────────────────────────────────────────
const createVisible = ref(false)
const creating = ref(false)
const busqueda = ref('')
const resultados = ref<any[]>([])
const buscando = ref(false)
const seleccionados = ref<Array<{ product_id: number; nombre: string; precio: number; cantidad: number }>>([])
// Conceptos libres: cobro sin producto de catálogo detrás ("Consulta médica").
// El monto que escribe el comerciante es final, con IGV incluido.
const conceptos = ref<Array<{ concepto: string; monto: number | null; cantidad: number; afectacion: number }>>([])

/**
 * Afectación de IGV del concepto. Se pide explícita porque asumirla sale caro:
 * una universidad cobrando matrícula declararía IGV sobre un servicio educativo
 * inafecto. El backend hereda la afectación con la que la tienda ya factura
 * cuando no se manda, pero acá se muestra para que el comerciante la vea y la
 * pueda cambiar.
 */
const afectacionPorDefecto = ref(1)

const opcionesAfectacion = [
  { label: 'Gravado (con IGV)', value: 1 },
  { label: 'Exonerado', value: 2 },
  { label: 'Inafecto', value: 3 },
]
const modoCobro = ref<'catalogo' | 'concepto'>('catalogo')
const form = ref({
  mensaje: '',
  observacion: '',
  vence: null as Date | null,
  maxUsos: 1 as number | null,
  telefono: '',
  nombres: '',
})

let searchTimer: ReturnType<typeof setTimeout> | null = null

function abrirCrear() {
  busqueda.value = ''
  resultados.value = []
  seleccionados.value = []
  conceptos.value = []
  modoCobro.value = 'catalogo'
  form.value = { mensaje: '', observacion: '', vence: null, maxUsos: 1, telefono: '', nombres: '' }
  createVisible.value = true
}

function onBuscar() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    if (busqueda.value.trim().length < 2) {
      resultados.value = []
      return
    }
    buscando.value = true
    try {
      resultados.value = await paymentLinksApi.searchProducts(busqueda.value.trim())
    } catch {
      resultados.value = []
    } finally {
      buscando.value = false
    }
  }, 300)
}

function agregar(producto: any) {
  const id = Number(producto.id ?? producto.producto_id)
  if (!id || seleccionados.value.some((s) => s.product_id === id)) return
  seleccionados.value.push({
    product_id: id,
    nombre: producto.name ?? producto.producto_titulo ?? `Producto ${id}`,
    precio: Number(producto.price ?? producto.producto_precio ?? 0),
    cantidad: 1,
  })
}

function quitar(productId: number) {
  seleccionados.value = seleccionados.value.filter((s) => s.product_id !== productId)
}

function agregarConcepto() {
  // Arranca con lo que la tienda ya usa: el primer concepto hereda el default
  // del backend y los siguientes copian lo que el comerciante acaba de elegir.
  const ultima = conceptos.value.at(-1)?.afectacion ?? afectacionPorDefecto.value
  conceptos.value.push({ concepto: '', monto: null, cantidad: 1, afectacion: ultima })
}

function quitarConcepto(i: number) {
  conceptos.value.splice(i, 1)
}

/** Solo cuentan los conceptos completos: el backend rechaza los vacíos o en cero. */
const conceptosValidos = computed(() =>
  conceptos.value.filter((c) => c.concepto.trim() !== '' && (c.monto ?? 0) > 0),
)

const totalEstimado = computed(
  () =>
    seleccionados.value.reduce((sum, s) => sum + s.precio * s.cantidad, 0) +
    conceptosValidos.value.reduce((sum, c) => sum + (c.monto ?? 0) * c.cantidad, 0),
)

const puedeCrear = computed(
  () => seleccionados.value.length > 0 || conceptosValidos.value.length > 0,
)

async function crear() {
  if (!puedeCrear.value) return
  creating.value = true
  try {
    const link = await paymentLinksApi.create({
      items: seleccionados.value.map((s) => ({ product_id: s.product_id, quantity: s.cantidad })),
      conceptos: conceptosValidos.value.map((c) => ({
        concepto: c.concepto.trim(),
        monto: c.monto,
        cantidad: c.cantidad,
        afectacion: c.afectacion,
      })),
      // `YYYY-MM-DD` — el backend lo extiende hasta el final de ese día.
      valido_hasta: form.value.vence ? form.value.vence.toISOString().slice(0, 10) : undefined,
      max_usos: form.value.maxUsos ?? null,
      mensaje: form.value.mensaje || undefined,
      observacion: form.value.observacion || undefined,
      cliente:
        form.value.nombres || form.value.telefono
          ? { nombres: form.value.nombres || undefined, telefono: form.value.telefono || undefined }
          : undefined,
    })

    createVisible.value = false
    await load()
    // Se abre Compartir de una: crear un link sin compartirlo no sirve de nada.
    abrirCompartir(link)
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: 'No se pudo crear el link',
      detail: e?.response?.data?.mensaje || e?.response?.data?.messages?.mensaje || 'Revisa los datos.',
      life: 6000,
    })
  } finally {
    creating.value = false
  }
}

// ── Pausar / anular ─────────────────────────────────────────────────────────
async function togglePausa(link: PaymentLink) {
  const nuevo = link.estado === 'pausado' ? 'activo' : 'pausado'
  try {
    await paymentLinksApi.setEstado(link.id, nuevo)
    await load()
  } catch (e: any) {
    toast.add({
      severity: 'warn',
      summary: 'No se pudo cambiar el estado',
      detail: e?.response?.data?.mensaje || '',
      life: 5000,
    })
  }
}

function anular(link: PaymentLink) {
  confirm.require({
    message: `El enlace ${link.codigo} dejará de funcionar para quien ya lo tenga. Las ventas que generó se conservan.`,
    header: 'Anular enlace',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Anular',
    rejectLabel: 'Cancelar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      await paymentLinksApi.remove(link.id)
      await load()
    },
  })
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-secondary-800">Links de pago</h1>
        <p class="text-secondary-600 mt-1">
          Cobra por WhatsApp. Cada pago genera una venta en tu tienda y descuenta stock.
        </p>
      </div>
      <Button label="Nuevo link" icon="pi pi-plus" @click="abrirCrear" />
    </div>

    <Card>
      <template #content>
        <AppEmptyState
          v-if="!loading && !links.length"
          icon="pi-link"
          title="Todavía no tienes links de pago"
          description="Crea uno, compártelo por WhatsApp y cobra con tarjeta. La venta entra a tu tienda como cualquier otra."
          action-label="Crear el primero"
          action-icon="pi-plus"
          @action="abrirCrear"
        />

        <DataTable v-else :value="links" :loading="loading" stripedRows paginator :rows="10">
          <Column header="Código">
            <template #body="{ data }">
              <span class="font-mono font-medium">{{ data.codigo }}</span>
            </template>
          </Column>

          <Column header="Cobra">
            <template #body="{ data }">
              <span class="font-medium">{{ formatCurrency(data.totales.total) }}</span>
            </template>
          </Column>

          <Column header="Estado">
            <template #body="{ data }">
              <Tag :value="estadoTag(data).label" :severity="estadoTag(data).severity" />
            </template>
          </Column>

          <Column header="Ventas">
            <template #body="{ data }">
              <span :class="data.usos > 0 ? 'font-medium' : 'text-secondary-400'">
                {{ usosLabel(data) }}
              </span>
            </template>
          </Column>

          <Column header="Vence">
            <template #body="{ data }">
              <span class="text-sm text-secondary-600">{{ fecha(data.valido_hasta) }}</span>
            </template>
          </Column>

          <Column header="Creado">
            <template #body="{ data }">
              <span class="text-sm text-secondary-600">{{ fecha(data.created_at) }}</span>
            </template>
          </Column>

          <Column header="Acciones" style="width: 190px">
            <template #body="{ data }">
              <div class="flex gap-1">
                <Button
                  icon="pi pi-share-alt"
                  text
                  rounded
                  v-tooltip.top="'Compartir'"
                  @click="abrirCompartir(data)"
                />
                <Button
                  :icon="data.estado === 'pausado' ? 'pi pi-play' : 'pi pi-pause'"
                  text
                  rounded
                  :disabled="!['activo', 'pausado'].includes(data.estado)"
                  v-tooltip.top="data.estado === 'pausado' ? 'Reactivar' : 'Pausar'"
                  @click="togglePausa(data)"
                />
                <Button
                  icon="pi pi-trash"
                  text
                  rounded
                  severity="danger"
                  v-tooltip.top="'Anular'"
                  @click="anular(data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Compartir -->
    <Dialog
      v-model:visible="shareVisible"
      modal
      header="Compartir enlace de pago"
      :style="{ width: '32rem' }"
    >
      <div v-if="shareLink" class="space-y-4">
        <div>
          <p class="text-sm text-secondary-600 mb-1">Cobra</p>
          <p class="text-2xl font-semibold">{{ formatCurrency(shareLink.totales.total) }}</p>
        </div>

        <div>
          <label class="block text-sm text-secondary-600 mb-1">Enlace</label>
          <div class="flex gap-2">
            <InputText :model-value="shareLink.url" readonly class="flex-1 font-mono text-sm" />
            <Button icon="pi pi-copy" outlined @click="copiar(shareLink.url)" />
          </div>
        </div>

        <a
          :href="urlWhatsapp"
          target="_blank"
          rel="noopener"
          class="flex items-center justify-center gap-2 w-full rounded-lg bg-primary px-4 py-3 font-medium text-white"
        >
          <i class="pi pi-whatsapp" />
          Enviar por WhatsApp
        </a>

        <p class="text-xs text-secondary-500">
          Al pagar, la venta entra a tu tienda y descuenta el stock automáticamente.
        </p>
      </div>
    </Dialog>

    <!-- Crear -->
    <Dialog
      v-model:visible="createVisible"
      modal
      header="Nuevo link de pago"
      :style="{ width: '42rem' }"
    >
      <div class="space-y-4">
        <div class="flex gap-2 border-b border-secondary-200">
          <button
            type="button"
            class="px-3 py-2 text-sm font-medium border-b-2 -mb-px"
            :class="modoCobro === 'catalogo' ? 'border-primary text-primary' : 'border-transparent text-secondary-500'"
            @click="modoCobro = 'catalogo'"
          >
            Productos del catálogo
          </button>
          <button
            type="button"
            class="px-3 py-2 text-sm font-medium border-b-2 -mb-px"
            :class="modoCobro === 'concepto' ? 'border-primary text-primary' : 'border-transparent text-secondary-500'"
            @click="modoCobro = 'concepto'"
          >
            Concepto libre
          </button>
        </div>

        <!-- Conceptos libres: cobro sin producto detrás. Se pueden combinar con
             productos; por eso los seleccionados de cada pestaña se conservan. -->
        <div v-if="modoCobro === 'concepto'" class="space-y-2">
          <div
            v-for="(c, i) in conceptos"
            :key="i"
            class="flex items-start gap-2"
          >
            <InputText
              v-model="c.concepto"
              placeholder="Ej.: Consulta médica"
              class="flex-1"
              maxlength="250"
            />
            <InputNumber
              v-model="c.monto"
              :min="0"
              :minFractionDigits="2"
              placeholder="0.00"
              class="w-28"
              inputClass="text-right"
            />
            <InputNumber
              v-model="c.cantidad"
              :min="1"
              showButtons
              buttonLayout="horizontal"
              class="w-24 shrink-0"
              inputClass="w-12 text-center"
            />
            <Select
              v-model="c.afectacion"
              :options="opcionesAfectacion"
              optionLabel="label"
              optionValue="value"
              class="w-36 shrink-0"
            />
            <Button icon="pi pi-times" text rounded severity="danger" @click="quitarConcepto(i)" />
          </div>

          <Button label="Agregar concepto" icon="pi pi-plus" text @click="agregarConcepto" />

          <p class="text-xs text-secondary-500">
            El monto es el total que paga el cliente. Si el concepto es
            <strong>gravado</strong>, el IGV va incluido en ese monto; si es exonerado o
            inafecto, no lleva IGV. Aparece así en el comprobante.
          </p>
        </div>

        <div v-show="modoCobro === 'catalogo'">
          <label class="block text-sm font-medium text-secondary-700 mb-1">Productos</label>
          <InputText
            v-model="busqueda"
            placeholder="Busca por nombre o SKU…"
            class="w-full"
            @input="onBuscar"
          />

          <div v-if="buscando" class="text-sm text-secondary-500 mt-2">Buscando…</div>

          <ul v-else-if="resultados.length" class="mt-2 max-h-40 overflow-y-auto border rounded">
            <li
              v-for="p in resultados"
              :key="p.id ?? p.producto_id"
              class="flex justify-between items-center px-3 py-2 hover:bg-secondary-50 cursor-pointer"
              @click="agregar(p)"
            >
              <span class="text-sm">{{ p.name ?? p.producto_titulo }}</span>
              <span class="text-sm text-secondary-500">
                {{ formatCurrency(Number(p.price ?? p.producto_precio ?? 0)) }}
              </span>
            </li>
          </ul>
        </div>

        <div v-if="seleccionados.length" v-show="modoCobro === 'catalogo'" class="border rounded divide-y">
          <div
            v-for="item in seleccionados"
            :key="item.product_id"
            class="flex items-center gap-3 px-3 py-2"
          >
            <span class="min-w-0 flex-1 truncate text-sm" :title="item.nombre">{{ item.nombre }}</span>
            <InputNumber
              v-model="item.cantidad"
              :min="1"
              showButtons
              buttonLayout="horizontal"
              class="w-24 shrink-0"
              inputClass="w-12 text-center"
            />
            <span class="w-24 shrink-0 text-right text-sm">
              {{ formatCurrency(item.precio * item.cantidad) }}
            </span>
            <Button icon="pi pi-times" text rounded severity="danger" @click="quitar(item.product_id)" />
          </div>
        </div>

        <div v-if="puedeCrear" class="flex justify-between border-t pt-3 font-medium">
          <span>Total del link</span>
          <span>{{ formatCurrency(totalEstimado) }}</span>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Vence el</label>
            <Calendar v-model="form.vence" dateFormat="dd/mm/yy" showIcon class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Veces que se puede pagar</label>
            <InputNumber
              v-model="form.maxUsos"
              :min="1"
              showButtons
              buttonLayout="horizontal"
              class="w-24"
              inputClass="w-12 text-center"
            />
            <p class="text-xs text-secondary-500 mt-1">Vacío = sin límite</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Cliente (opcional)</label>
            <InputText v-model="form.nombres" placeholder="Nombre" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">WhatsApp (opcional)</label>
            <InputText v-model="form.telefono" placeholder="51999999999" class="w-full" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">
            Mensaje para el cliente (opcional)
          </label>
          <Textarea
            v-model="form.mensaje"
            rows="2"
            class="w-full"
            placeholder="Ej.: Saldo pendiente del pedido del 12/08"
          />
          <p class="text-xs text-secondary-500 mt-1">
            Se ve en la vista previa del enlace cuando lo compartes.
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-secondary-700 mb-1">Nota interna (opcional)</label>
          <InputText v-model="form.observacion" class="w-full" placeholder="Solo tú la ves" />
        </div>
      </div>

      <template #footer>
        <Button label="Cancelar" text @click="createVisible = false" />
        <Button
          label="Crear y compartir"
          icon="pi pi-check"
          :loading="creating"
          :disabled="!puedeCrear"
          @click="crear"
        />
      </template>
    </Dialog>
  </div>
</template>
