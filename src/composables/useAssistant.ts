import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useAdminStore } from '@/stores/admin.store'
import { getDocSlugForRoute } from '@/config/help-docs.config'
import { assistantChangesApi, type PendingChange } from '@/api/assistant-changes.api'

/**
 * El asistente del panel: conversación con el agente del comerciante.
 *
 * Habla con el backend RAG, que a su vez consulta la API de MiTienda **con el
 * token de esta sesión**. Por eso el asistente solo puede ver la tienda que está
 * seleccionada: el aislamiento no depende de lo que le pidamos al modelo, sino de
 * que sus herramientas no acepten otra tienda que la del token.
 */

const ASSISTANT_URL = (
  import.meta.env.VITE_ASSISTANT_URL || 'https://rag.tiendabox.co'
).replace(/\/+$/, '')

export interface AssistantMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  /** Se está escribiendo ahora mismo. */
  streaming?: boolean
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// Estado a nivel de módulo: la conversación sobrevive a cerrar y abrir el panel.
const messages = ref<AssistantMessage[]>([])
const isLoading = ref(false)
const progressLabel = ref<string | null>(null)
const sessionId = ref(generateId())
const lastError = ref<string | null>(null)
const pendingChanges = ref<PendingChange[]>([])
const resolvingChange = ref<number | null>(null)

export function useAssistant() {
  const route = useRoute()
  const authStore = useAuthStore()
  const adminStore = useAdminStore()

  /**
   * Quién ve el asistente.
   *
   * Arranca solo para el equipo —cuenta de superadmin, o impersonando una
   * tienda— mientras se mide con comerciantes de verdad. Ampliar es cambiar esta
   * condición; dejarlo detrás de una sola línea es lo que hace que apagarlo
   * también sea una sola línea.
   */
  const isAvailable = computed(() => authStore.isSuperAdmin || adminStore.isImpersonating)

  const hasConversation = computed(() => messages.value.length > 0)

  /**
   * En qué pantalla está el comerciante.
   *
   * El mismo mapa que usa el panel de ayuda para elegir el documento. Va como
   * contexto para que "¿por qué este no se sincronizó?" se entienda sin que haya
   * que explicar desde dónde se pregunta.
   */
  const currentScreen = computed(() => getDocSlugForRoute(route.path))

  /**
   * Qué dejó preparado el asistente y sigue esperando.
   *
   * Se consulta al abrir y después de cada respuesta: si el asistente acaba de
   * proponer algo, aparece sin que haya que recargar nada.
   */
  async function loadPendingChanges() {
    if (!isAvailable.value) return
    try {
      pendingChanges.value = await assistantChangesApi.list()
    } catch {
      // Que no se pueda leer la lista no debería romper la conversación.
      pendingChanges.value = []
    }
  }

  async function approveChange(cambioId: number) {
    resolvingChange.value = cambioId
    try {
      await assistantChangesApi.approve(cambioId)
      pendingChanges.value = pendingChanges.value.filter((c) => c.cambio_id !== cambioId)
    } catch (err: any) {
      lastError.value = err?.response?.data?.messages?.error || 'No se pudo aplicar el cambio.'
    } finally {
      resolvingChange.value = null
    }
  }

  async function rejectChange(cambioId: number) {
    resolvingChange.value = cambioId
    try {
      await assistantChangesApi.reject(cambioId)
      pendingChanges.value = pendingChanges.value.filter((c) => c.cambio_id !== cambioId)
    } catch {
      lastError.value = 'No se pudo descartar el cambio.'
    } finally {
      resolvingChange.value = null
    }
  }

  function reset() {
    messages.value = []
    sessionId.value = generateId()
    progressLabel.value = null
    lastError.value = null
  }

  async function send(text: string) {
    const message = text.trim()
    if (!message || isLoading.value) return

    const token = authStore.accessToken || localStorage.getItem('access_token')
    if (!token) {
      lastError.value = 'Tu sesión expiró. Vuelve a entrar al panel.'
      return
    }

    messages.value.push({ id: generateId(), role: 'user', content: message })
    isLoading.value = true
    lastError.value = null

    const replyId = generateId()
    messages.value.push({ id: replyId, role: 'assistant', content: '', streaming: true })

    const actual = () => messages.value.find((m) => m.id === replyId)

    try {
      const response = await fetch(`${ASSISTANT_URL}/merchant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message,
          session_id: sessionId.value,
          history: messages.value
            .filter((m) => !m.streaming)
            .slice(0, -1)
            .map((m) => ({ role: m.role, content: m.content })),
          screen: currentScreen.value,
        }),
      })

      if (response.status === 401) {
        messages.value = messages.value.filter((m) => m.id !== replyId)
        lastError.value = 'Tu sesión expiró. Vuelve a entrar al panel.'
        return
      }

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Los eventos van separados por una línea en blanco, y un fragmento de
        // red puede cortar a la mitad de uno: lo incompleto espera al siguiente.
        const bloques = buffer.split('\n\n')
        buffer = bloques.pop() ?? ''

        for (const bloque of bloques) {
          const linea = bloque.split('\n').find((l) => l.startsWith('data:'))
          if (!linea) continue

          let evento: any
          try {
            evento = JSON.parse(linea.slice(5).trim())
          } catch {
            continue
          }

          const msg = actual()
          if (!msg) continue

          switch (evento.type) {
            case 'progress':
              progressLabel.value = evento.label ?? null
              break
            case 'text_delta':
              progressLabel.value = null
              msg.content += evento.text ?? ''
              break
            case 'text_reset':
              // Escribió algo y después fue a consultar: era divagación.
              msg.content = ''
              break
            case 'done':
              if (evento.reply) msg.content = evento.reply
              msg.streaming = false
              break
            case 'error':
              msg.content = evento.message ?? 'No pude completar tu consulta.'
              msg.streaming = false
              break
          }
        }
      }

      const msg = actual()
      if (msg) msg.streaming = false

      // Puede haber quedado algo esperando aprobación.
      await loadPendingChanges()
    } catch (err) {
      console.error('[Asistente] Falló la consulta:', err)
      const msg = actual()
      if (msg && !msg.content) {
        messages.value = messages.value.filter((m) => m.id !== replyId)
        lastError.value = 'No pude conectarme al asistente. Intenta de nuevo.'
      } else if (msg) {
        msg.streaming = false
      }
    } finally {
      isLoading.value = false
      progressLabel.value = null
    }
  }

  return {
    messages,
    isLoading,
    progressLabel,
    lastError,
    isAvailable,
    hasConversation,
    currentScreen,
    send,
    reset,
    pendingChanges,
    resolvingChange,
    loadPendingChanges,
    approveChange,
    rejectChange,
  }
}
