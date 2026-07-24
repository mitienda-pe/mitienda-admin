import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

type ChatRole = 'system' | 'user' | 'assistant'

interface ChatMessage {
  role: ChatRole
  content: string
}

interface LlmRequest {
  systemPrompt: string
  userPrompt: string
  context?: string
  buttonId?: string
  temperature?: number
}

interface LlmMessagesRequest {
  messages: ChatMessage[]
  buttonId?: string
  temperature?: number
  /** Eleva el tope de tokens de salida (default del proxy: 2000). */
  maxTokens?: number
}

export function useLlmProxy() {
  const authStore = useAuthStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  const proxyEndpoint = computed(() =>
    import.meta.env.DEV
      ? '/llm-proxy'
      : 'https://llmproxy.mitienda.host/index.php/api/llm-proxy'
  )

  const tenantId = 'ten-67d88d1d-111ae225'
  const userId = computed(() => String(authStore.selectedStore?.id || ''))

  /**
   * Envía un payload al proxy y acumula la respuesta SSE. Loop compartido por
   * `generate` (single-turn) y `generateFromMessages` (multi-turno).
   */
  async function streamRequest(
    payload: Record<string, unknown>,
    onChunk?: (accumulated: string) => void
  ): Promise<string> {
    loading.value = true
    error.value = null
    let completeText = ''

    try {
      const response = await fetch(proxyEndpoint.value, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      // Tipo del último frame `event:` del SSE. El proxy emite los errores del
      // proveedor como `event: error\ndata: {"error":...}`.
      let currentEvent = ''

      /**
       * Procesa una línea SSE ya completa. Devuelve true si es `[DONE]` (fin de
       * stream). Lanza si el proveedor reportó un error o si un frame `data:`
       * llegó ilegible: antes ambos casos se descartaban en silencio, dejando
       * HTML truncado/corrupto que se guardaba como si estuviera completo.
       */
      const processLine = (rawLine: string): boolean => {
        const line = rawLine.replace(/\r$/, '')
        if (!line.trim()) {
          currentEvent = '' // línea en blanco = separador de evento SSE
          return false
        }
        if (line.startsWith(':')) return false // comentario / keep-alive
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim()
          return false
        }
        if (!line.startsWith('data:')) return false

        // Quita el prefijo `data:` y el único espacio opcional que permite el
        // spec. NO usar trim(): el contenido puede empezar/terminar en espacio.
        const data = line.slice(5).replace(/^ /, '')
        if (!data || data === '[DONE]') return data === '[DONE]'

        let json: any
        try {
          json = JSON.parse(data)
        } catch {
          throw new Error(
            'La respuesta de la IA llegó corrupta (frame ilegible). Intenta de nuevo.'
          )
        }

        if (currentEvent === 'error' || json?.error) {
          const msg =
            typeof json?.error === 'string'
              ? json.error
              : json?.error?.message || 'El proveedor de IA devolvió un error'
          throw new Error(msg)
        }

        const content =
          json.choices?.[0]?.delta?.content ??
          json.delta?.text ??
          json.text ??
          json.content ??
          ''
        if (content) {
          completeText += content
          onChunk?.(completeText)
        }
        return false
      }

      let finished = false
      while (!finished) {
        const { done, value } = await reader.read()
        if (done) {
          // Vacía la última línea si el stream cerró sin `\n` de cierre.
          if (buffer) processLine(buffer)
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (processLine(line)) {
            finished = true
            break
          }
        }
      }

      return completeText
    } catch (e: any) {
      error.value = e.message || 'Error al generar texto'
      throw e
    } finally {
      loading.value = false
    }
  }

  /** Single-turn: un par system + user (usado por AiFieldGenerator). */
  async function generate(
    request: LlmRequest,
    onChunk?: (accumulated: string) => void
  ): Promise<string> {
    const userContent = request.context
      ? `${request.userPrompt}\n\nContexto:\n${request.context}`
      : request.userPrompt

    return streamRequest(
      {
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: request.temperature ?? 0.7,
        stream: true,
        tenantId,
        userId: userId.value,
        buttonId: request.buttonId || 'btn-69962669-e3fc2337'
      },
      onChunk
    )
  }

  /**
   * Multi-turno: envía el historial completo de la conversación. Útil para
   * iterar sobre un resultado (p. ej. el Asistente de HTML con IA).
   */
  async function generateFromMessages(
    request: LlmMessagesRequest,
    onChunk?: (accumulated: string) => void
  ): Promise<string> {
    const payload: Record<string, unknown> = {
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      stream: true,
      tenantId,
      userId: userId.value,
      buttonId: request.buttonId || 'btn-69962669-e3fc2337'
    }
    if (request.maxTokens) {
      payload.max_tokens = request.maxTokens
    }
    return streamRequest(payload, onChunk)
  }

  return { generate, generateFromMessages, loading, error }
}
