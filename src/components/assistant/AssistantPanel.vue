<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue'
import { marked } from 'marked'
import { sanitizeHtml } from '@/utils/sanitize'
import { useAssistant } from '@/composables/useAssistant'

const {
  messages,
  isLoading,
  progressLabel,
  lastError,
  hasConversation,
  send,
  reset,
  pendingChanges,
  resolvingChange,
  loadPendingChanges,
  approveChange,
  rejectChange,
} = useAssistant()

// Puede haber quedado algo esperando de una conversación anterior.
onMounted(loadPendingChanges)

const draft = ref('')
const scroller = ref<HTMLElement | null>(null)

/**
 * Preguntas de arranque.
 *
 * Un chat vacío no comunica qué sabe hacer. Estas tres cubren las tres
 * herramientas que existen hoy, así que además de invitar, enseñan el alcance.
 */
const SUGERENCIAS = [
  '¿Cuánto vendí este mes?',
  '¿Qué productos se me están agotando?',
  '¿Cómo configuro las zonas de envío?',
]

function render(content: string): string {
  return sanitizeHtml(marked.parse(content, { async: false }) as string)
}

async function scrollAlFinal() {
  await nextTick()
  if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
}

async function submit() {
  const texto = draft.value
  draft.value = ''
  await scrollAlFinal()
  await send(texto)
}

function usarSugerencia(texto: string) {
  draft.value = texto
  submit()
}

// El texto crece sin que cambie la cantidad de mensajes: se sigue el largo del
// último para que el scroll acompañe mientras se escribe.
watch(
  () => messages.value[messages.value.length - 1]?.content.length,
  scrollAlFinal
)
watch(() => messages.value.length, scrollAlFinal)
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Conversación -->
    <div ref="scroller" class="flex-1 overflow-y-auto px-1 py-2 space-y-4">
      <!-- Vacío: qué se puede preguntar -->
      <div v-if="!hasConversation" class="py-6">
        <p class="text-sm text-gray-600 mb-4">
          Pregúntame por tus ventas, tu stock o cómo usar el panel. Solo veo los datos
          de la tienda que tienes seleccionada.
        </p>
        <div class="flex flex-col gap-2">
          <button
            v-for="s in SUGERENCIAS"
            :key="s"
            class="text-left text-sm px-3 py-2 rounded-lg border border-gray-200
                   text-gray-700 hover:border-primary hover:text-primary transition-colors"
            @click="usarSugerencia(s)"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <div v-for="m in messages" :key="m.id" class="flex" :class="m.role === 'user' ? 'justify-end' : 'justify-start'">
        <div
          class="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm"
          :class="m.role === 'user'
            ? 'bg-primary text-white rounded-br-md'
            : 'bg-gray-100 text-gray-800 rounded-bl-md'"
        >
          <div
            v-if="m.role === 'assistant'"
            class="assistant-markdown"
            v-html="render(m.content)"
          />
          <span v-else>{{ m.content }}</span>

          <!-- Cursor mientras se escribe, solo si todavía no hay texto visible -->
          <span
            v-if="m.streaming && !m.content"
            class="inline-block w-2 h-4 align-middle bg-gray-400 animate-pulse rounded-sm"
          />
        </div>
      </div>

      <!-- Qué está haciendo -->
      <div v-if="progressLabel" class="flex justify-start">
        <div class="bg-gray-50 border border-gray-200 rounded-2xl rounded-bl-md px-4 py-2 text-xs text-gray-500 flex items-center gap-2">
          <i class="pi pi-spin pi-spinner text-xs"></i>
          {{ progressLabel }}
        </div>
      </div>

      <div v-if="lastError" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        {{ lastError }}
      </div>
    </div>

    <!--
      Lo que el asistente dejó preparado.
      Vive fuera de la conversación a propósito: aprobar es una decisión del
      comerciante, no un turno más del chat, y tiene que verse aunque el hilo haya
      seguido de largo.
    -->
    <div v-if="pendingChanges.length" class="border-t border-amber-200 bg-amber-50 -mx-1 px-3 py-3 mt-2">
      <p class="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
        <i class="pi pi-exclamation-circle text-xs"></i>
        Esperando tu aprobación
      </p>
      <div
        v-for="c in pendingChanges"
        :key="c.cambio_id"
        class="bg-white border border-amber-200 rounded-lg px-3 py-2 mb-2 last:mb-0"
      >
        <p class="text-sm text-gray-800 mb-2">{{ c.resumen }}</p>
        <div class="flex gap-2">
          <button
            class="text-xs px-3 py-1 rounded-md bg-primary text-white hover:opacity-90
                   disabled:opacity-40 transition-opacity"
            :disabled="resolvingChange === c.cambio_id"
            @click="approveChange(c.cambio_id)"
          >
            <i v-if="resolvingChange === c.cambio_id" class="pi pi-spin pi-spinner text-[10px] mr-1"></i>
            Aplicar
          </button>
          <button
            class="text-xs px-3 py-1 rounded-md border border-gray-300 text-gray-600
                   hover:bg-gray-50 disabled:opacity-40 transition-colors"
            :disabled="resolvingChange === c.cambio_id"
            @click="rejectChange(c.cambio_id)"
          >
            Descartar
          </button>
        </div>
      </div>
    </div>

    <!-- Entrada -->
    <div class="border-t border-gray-200 pt-3 mt-2">
      <form class="flex items-end gap-2" @submit.prevent="submit">
        <textarea
          v-model="draft"
          rows="1"
          placeholder="Escribe tu pregunta…"
          class="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm
                 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
          :disabled="isLoading"
          @keydown.enter.exact.prevent="submit"
        />
        <button
          type="submit"
          class="shrink-0 w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center
                 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          :disabled="isLoading || !draft.trim()"
          title="Enviar"
        >
          <i class="pi" :class="isLoading ? 'pi-spin pi-spinner' : 'pi-send'"></i>
        </button>
      </form>

      <div class="flex items-center justify-between mt-2">
        <p class="text-[11px] text-gray-400">
          El asistente puede equivocarse. Verifica los datos importantes.
        </p>
        <button
          v-if="hasConversation"
          class="text-[11px] text-gray-400 hover:text-primary transition-colors"
          @click="reset"
        >
          Nueva conversación
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* El markdown del asistente: listas y negritas legibles dentro de la burbuja. */
.assistant-markdown :deep(p) { margin: 0 0 0.5rem; }
.assistant-markdown :deep(p:last-child) { margin-bottom: 0; }
.assistant-markdown :deep(ul),
.assistant-markdown :deep(ol) { margin: 0.25rem 0 0.5rem; padding-left: 1.1rem; }
.assistant-markdown :deep(li) { margin-bottom: 0.15rem; }
.assistant-markdown :deep(strong) { font-weight: 600; }
.assistant-markdown :deep(a) { color: var(--primary-color, #00b2a6); text-decoration: underline; }
.assistant-markdown :deep(code) {
  background: rgba(0, 0, 0, 0.06);
  padding: 0.05rem 0.25rem;
  border-radius: 3px;
  font-size: 0.9em;
}
</style>
