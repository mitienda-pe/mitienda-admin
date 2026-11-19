<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import InputSwitch from 'primevue/inputswitch'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppErrorState from '@/components/ui/AppErrorState.vue'
import { useFormatters } from '@/composables/useFormatters'
import { labScreensApi, LAB_SCREEN_URL, type LabScreen } from '@/api/lab-screens.api'

/**
 * Pantalla de laboratorio: los pedidos pagados llegan con aviso sonoro a una
 * pantalla de quien los prepara (un tercero, sin usuario del panel). Aquí se
 * genera el código para vincularla, se ven las pantallas y se desconectan.
 *
 * La única opción del plugin (`notify_customer_on_dispatch`) se guarda en la
 * configuración genérica del plugin vía el evento `update`.
 */
const props = defineProps<{ config?: Record<string, any> | null; configSchema?: Record<string, any> | null }>()
const emit = defineEmits<{ (e: 'update', config: Record<string, any>): void }>()

const toast = useToast()
const { formatDateTime } = useFormatters()

const screens = ref<LabScreen[]>([])
const isLoading = ref(true)
const loadError = ref<string | null>(null)
const isCreating = ref(false)
const removingId = ref<number | null>(null)
const confirmRemoveId = ref<number | null>(null)
const newName = ref('Laboratorio')
const newCode = ref<{ code: string; vence: string | null } | null>(null)

const notifyOnDispatch = computed({
  get: () => !!props.config?.notify_customer_on_dispatch,
  set: (value: boolean) => emit('update', { ...(props.config ?? {}), notify_customer_on_dispatch: value }),
})

async function load() {
  isLoading.value = true
  loadError.value = null
  try {
    screens.value = await labScreensApi.list()
  } catch (e: any) {
    loadError.value = e?.response?.data?.message ?? 'No se pudieron cargar las pantallas'
  } finally {
    isLoading.value = false
  }
}

async function createScreen() {
  isCreating.value = true
  try {
    const screen = await labScreensApi.create(newName.value.trim() || 'Laboratorio')
    newCode.value = { code: screen.code ?? '', vence: screen.codigo_vence }
    await load()
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'No se pudo generar el código', detail: e?.response?.data?.message, life: 5000 })
  } finally {
    isCreating.value = false
  }
}

async function copyCode() {
  if (!newCode.value) return
  try {
    await navigator.clipboard.writeText(newCode.value.code)
    toast.add({ severity: 'success', summary: 'Código copiado', life: 2000 })
  } catch {
    toast.add({ severity: 'warn', summary: 'Copia el código a mano', life: 3000 })
  }
}

async function removeScreen(id: number) {
  removingId.value = id
  try {
    await labScreensApi.remove(id)
    confirmRemoveId.value = null
    if (screens.value.find((s) => s.id === id && !s.vinculada)) newCode.value = null
    await load()
    toast.add({ severity: 'success', summary: 'Pantalla desconectada', life: 3000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'No se pudo desconectar', detail: e?.response?.data?.message, life: 5000 })
  } finally {
    removingId.value = null
  }
}

onMounted(load)
</script>

<template>
  <div class="flex max-w-3xl flex-col gap-8">
    <p class="text-sm text-gray-600">
      Los pedidos pagados llegan con aviso sonoro a la pantalla del laboratorio, que confirma que los recibió,
      los prepara, imprime la etiqueta y los marca despachados. El estado se actualiza en
      <b>Despacho</b>. La pantalla no ve teléfono, correo ni montos del comprador.
    </p>

    <section class="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5">
      <div>
        <h2 class="text-lg font-semibold text-gray-900">Vincular una pantalla</h2>
        <p class="mt-1 text-sm text-gray-600">
          Genera un código y pásaselo al laboratorio. Lo escribe en
          <span class="font-medium text-gray-900">{{ LAB_SCREEN_URL.replace('https://', '') }}</span>
          desde la computadora o tablet donde va a trabajar. Vence en 30 minutos y sirve una sola vez.
        </p>
      </div>

      <div v-if="newCode" class="flex flex-col gap-2 rounded-lg bg-primary/10 p-4">
        <span class="text-xs font-semibold uppercase tracking-wide text-gray-600">Código de vinculación</span>
        <div class="flex flex-wrap items-center gap-3">
          <span class="font-mono text-3xl font-semibold tracking-widest text-gray-900">{{ newCode.code }}</span>
          <AppButton label="Copiar" variant="outlined" size="small" icon="pi pi-copy" @click="copyCode" />
        </div>
        <span v-if="newCode.vence" class="text-sm text-gray-600">Vence a las {{ formatDateTime(newCode.vence) }}.</span>
      </div>

      <div class="flex flex-wrap items-end gap-3">
        <label class="flex min-w-[14rem] flex-1 flex-col gap-1">
          <span class="text-sm font-medium text-gray-700">Nombre de la pantalla</span>
          <input
            id="lab-screen-name"
            v-model="newName"
            maxlength="100"
            class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Laboratorio"
          />
        </label>
        <AppButton label="Generar código" icon="pi pi-key" :loading="isCreating" @click="createScreen" />
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="text-lg font-semibold text-gray-900">Pantallas</h2>

      <div v-if="isLoading" class="text-sm text-gray-500">Cargando pantallas…</div>
      <AppErrorState v-else-if="loadError" :message="loadError" @retry="load" />
      <p v-else-if="!screens.length" class="rounded-lg border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500">
        Todavía no hay pantallas. Genera un código para vincular la primera.
      </p>

      <template v-else>
      <div v-for="s in screens" :key="s.id" class="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-medium text-gray-900">{{ s.nombre }}</span>
            <AppBadge v-if="s.vinculada" variant="success">Vinculada</AppBadge>
            <AppBadge v-else variant="warning">Esperando código</AppBadge>
            <AppBadge v-if="s.vinculada" :variant="s.push ? 'info' : 'neutral'">{{ s.push ? 'Avisos activos' : 'Sin avisos' }}</AppBadge>
          </div>
          <div class="mt-0.5 text-xs text-gray-500">
            <template v-if="s.vinculada">
              Vinculada {{ formatDateTime(s.vinculada_at) }} · último uso {{ s.ultimo_uso ? formatDateTime(s.ultimo_uso) : '—' }}
            </template>
            <template v-else>El código vence {{ formatDateTime(s.codigo_vence) }}</template>
          </div>
        </div>

        <template v-if="confirmRemoveId === s.id">
          <span class="text-sm text-gray-700">¿Desconectar? La pantalla deja de recibir pedidos.</span>
          <AppButton label="Cancelar" variant="text" size="small" @click="confirmRemoveId = null" />
          <AppButton label="Desconectar" variant="danger" size="small" :loading="removingId === s.id" @click="removeScreen(s.id)" />
        </template>
        <AppButton v-else :label="s.vinculada ? 'Desconectar' : 'Anular código'" variant="outlined" size="small" @click="confirmRemoveId = s.id" />
      </div>
      </template>
    </section>

    <section class="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-5">
      <h2 class="text-lg font-semibold text-gray-900">Aviso al comprador</h2>
      <label class="flex items-start gap-3">
        <InputSwitch v-model="notifyOnDispatch" input-id="lab-notify-dispatch" />
        <span class="text-sm text-gray-700">
          Enviar el correo de «En camino» al comprador cuando el laboratorio marca el pedido como despachado.
          <span class="block text-gray-500">Apagado, el estado cambia sin escribirle al comprador.</span>
        </span>
      </label>
    </section>
  </div>
</template>
