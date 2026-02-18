import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'

interface LlmRequest {
  systemPrompt: string
  userPrompt: string
  context?: string
  buttonId?: string
  temperature?: number
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

  async function generate(
    request: LlmRequest,
    onChunk?: (accumulated: string) => void
  ): Promise<string> {
    loading.value = true
    error.value = null
    let completeText = ''

    try {
      const userContent = request.context
        ? `${request.userPrompt}\n\nContexto:\n${request.context}`
        : request.userPrompt

      const payload = {
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: userContent }
        ],
        temperature: request.temperature ?? 0.7,
        stream: true,
        tenantId,
        userId: userId.value,
        buttonId: request.buttonId || 'btn-69962669-e3fc2337'
      }

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

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue

          try {
            const json = JSON.parse(data)
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
          } catch {
            // skip non-JSON lines
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

  return { generate, loading, error }
}
