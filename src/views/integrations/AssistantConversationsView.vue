<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { AppButton, AppEmptyState, AppErrorState } from '@/components/ui'
import InputText from 'primevue/inputtext'
import Paginator from 'primevue/paginator'
import {
  assistantConversationsApi,
  type AssistantTurn,
  type AssistantSummary,
} from '@/api/assistant-conversations.api'

const router = useRouter()

const summary = ref<AssistantSummary | null>(null)
const turns = ref<AssistantTurn[]>([])
const total = ref(0)
const retencionDias = ref(30)
const loading = ref(true)
const error = ref(false)

const search = ref('')
const sesion = ref('')
const page = ref(1)
const PER_PAGE = 20

/**
 * La pregunta que le importa al comerciante no es cuántas conversaciones hubo,
 * sino cuántas terminaron sin que el asistente encontrara nada: eso es gente que
 * preguntó y se fue con las manos vacías.
 */
const sinRespuestaPct = computed(() => {
  if (!summary.value?.turnos) return 0
  return Math.round((summary.value.sin_productos / summary.value.turnos) * 100)
})

const enConversacion = computed(() => sesion.value !== '')

async function load() {
  loading.value = true
  error.value = false

  try {
    const [resumen, pagina] = await Promise.all([
      sesion.value ? Promise.resolve(summary.value) : assistantConversationsApi.summary(),
      assistantConversationsApi.list({
        pagina: page.value,
        limite: PER_PAGE,
        buscar: search.value || undefined,
        sesion: sesion.value || undefined,
      }),
    ])

    summary.value = resumen
    turns.value = pagina.turns
    total.value = pagina.total
    retencionDias.value = pagina.retencionDias
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function verConversacion(sessionId: string) {
  sesion.value = sessionId
  search.value = ''
  page.value = 1
  load()
}

function volverAlListado() {
  sesion.value = ''
  page.value = 1
  load()
}

let buscarTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (buscarTimer) clearTimeout(buscarTimer)
  // Escribir no debería disparar una consulta por tecla.
  buscarTimer = setTimeout(() => {
    page.value = 1
    load()
  }, 400)
})

function onPage(e: { page: number }) {
  page.value = e.page + 1
  load()
}

function formatear(fecha: string): string {
  const d = new Date(fecha.replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? fecha : d.toLocaleString('es-PE')
}

/** Nombres de herramienta legibles: el comerciante no conoce los internos. */
const NOMBRE_HERRAMIENTA: Record<string, string> = {
  buscar_productos: 'Buscó en tu catálogo',
  estado_pedido: 'Consultó un pedido',
  consultar_politica: 'Leyó tus políticas',
}

function etiquetaHerramienta(h: string): string {
  return NOMBRE_HERRAMIENTA[h] ?? h
}

onMounted(load)
</script>

<template>
  <div class="p-6 max-w-5xl mx-auto">
    <div class="mb-4">
      <AppButton variant="text" @click="router.push('/integrations/providers/shopping_chat')">
        <i class="pi pi-arrow-left mr-2" />
        Volver al Asistente IA
      </AppButton>
    </div>

    <div class="flex items-start justify-between gap-4 mb-2">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Conversaciones del asistente</h1>
        <p class="text-sm text-gray-500 mt-1">
          Lo que tu asistente les respondió a quienes visitaron tu tienda.
          Se guardan {{ retencionDias }} días.
        </p>
      </div>
    </div>

    <AppErrorState v-if="error" message="No se pudieron cargar las conversaciones." @retry="load" />

    <template v-else>
      <!-- Resumen: tres números, y el tercero es el que importa -->
      <div v-if="summary && !enConversacion" class="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-2xl font-bold text-gray-800">{{ summary.conversaciones }}</p>
          <p class="text-xs text-gray-500 mt-1">Conversaciones</p>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <p class="text-2xl font-bold text-gray-800">{{ summary.turnos }}</p>
          <p class="text-xs text-gray-500 mt-1">Preguntas respondidas</p>
        </div>
        <div
          class="rounded-lg shadow p-4"
          :class="sinRespuestaPct >= 40 ? 'bg-amber-50 border border-amber-200' : 'bg-white'"
        >
          <p class="text-2xl font-bold" :class="sinRespuestaPct >= 40 ? 'text-amber-700' : 'text-gray-800'">
            {{ sinRespuestaPct }}%
          </p>
          <p class="text-xs mt-1" :class="sinRespuestaPct >= 40 ? 'text-amber-700' : 'text-gray-500'">
            Sin encontrar productos
          </p>
        </div>
      </div>

      <!--
        Una proporción alta no significa que el asistente funcione mal: puede que
        le estén preguntando por cosas que la tienda no vende. Se dice, sin
        alarmar, porque la acción a tomar es mirar las preguntas.
      -->
      <div
        v-if="summary && sinRespuestaPct >= 40 && !enConversacion"
        class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-2"
      >
        <i class="pi pi-info-circle text-amber-600 mt-0.5" />
        <p class="text-sm text-amber-800">
          Cuatro de cada diez preguntas terminaron sin mostrar productos. Puede que estén
          buscando algo que no vendes, o que los nombres de tus productos no coincidan con
          cómo los buscan. Vale la pena leer esas conversaciones.
        </p>
      </div>

      <!-- Buscador / vuelta al listado -->
      <div class="flex items-center gap-3 mb-4">
        <AppButton v-if="enConversacion" variant="secondary" size="small" @click="volverAlListado">
          <i class="pi pi-list mr-1" />
          Ver todas
        </AppButton>
        <span v-if="enConversacion" class="text-sm text-gray-500">
          Conversación completa, en orden
        </span>
        <span v-else class="p-input-icon-left flex-1 max-w-md">
          <i class="pi pi-search" />
          <InputText
            v-model="search"
            placeholder="Buscar en las conversaciones…"
            class="w-full"
          />
        </span>
      </div>

      <div v-if="loading" class="flex justify-center py-16">
        <i class="pi pi-spinner pi-spin text-3xl text-primary" />
      </div>

      <AppEmptyState
        v-else-if="turns.length === 0 && !search"
        icon="pi pi-comments"
        title="Todavía no hay conversaciones"
        message="Cuando alguien le escriba a tu asistente, vas a poder leer acá qué le respondió."
      />

      <AppEmptyState
        v-else-if="turns.length === 0"
        icon="pi pi-search"
        title="Sin resultados"
        :message="`No se encontró «${search}» en las conversaciones guardadas.`"
      />

      <div v-else class="space-y-3">
        <div
          v-for="t in turns"
          :key="t.id"
          class="bg-white rounded-lg shadow p-4"
        >
          <div class="flex items-start justify-between gap-4 mb-3">
            <p class="text-sm font-medium text-gray-800 flex-1">
              <i class="pi pi-user text-xs text-gray-400 mr-1.5" />{{ t.mensaje }}
            </p>
            <span class="text-xs text-gray-400 whitespace-nowrap">{{ formatear(t.created_at) }}</span>
          </div>

          <p class="text-sm text-gray-600 whitespace-pre-line mb-3">{{ t.respuesta }}</p>

          <div class="flex items-center flex-wrap gap-2 text-xs">
            <span
              v-for="h in t.herramientas"
              :key="h"
              class="px-2 py-0.5 rounded bg-gray-100 text-gray-600"
            >
              {{ etiquetaHerramienta(h) }}
            </span>
            <span
              v-if="t.productos_mostrados > 0"
              class="px-2 py-0.5 rounded bg-primary/10 text-primary"
            >
              {{ t.productos_mostrados }} producto{{ t.productos_mostrados === 1 ? '' : 's' }} mostrado{{ t.productos_mostrados === 1 ? '' : 's' }}
            </span>
            <span
              v-else
              class="px-2 py-0.5 rounded bg-amber-50 text-amber-700"
            >
              No encontró productos
            </span>

            <button
              v-if="!enConversacion"
              class="ml-auto text-gray-400 hover:text-primary transition-colors"
              @click="verConversacion(t.session_id)"
            >
              Ver la conversación completa
            </button>
          </div>
        </div>

        <Paginator
          v-if="!enConversacion && total > PER_PAGE"
          :rows="PER_PAGE"
          :totalRecords="total"
          :first="(page - 1) * PER_PAGE"
          @page="onPage"
        />
      </div>
    </template>
  </div>
</template>
