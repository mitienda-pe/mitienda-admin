<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Card from 'primevue/card'
import Textarea from 'primevue/textarea'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { AppButton, AppEmptyState } from '@/components/ui'
import { useFormatters } from '@/composables/useFormatters'
import { ordersApi } from '@/api/orders.api'
import type { OrderPaymentComment } from '@/types/order.types'

const props = defineProps<{
  orderId: number
}>()

const toast = useToast()
const { formatDateTime } = useFormatters()

const MAX_LENGTH = 1000

const comments = ref<OrderPaymentComment[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const error = ref<string | null>(null)
const newText = ref('')
const editingId = ref<number | null>(null)
const editingText = ref('')
const deletingId = ref<number | null>(null)

const newTextLength = computed(() => newText.value.length)
const editingTextLength = computed(() => editingText.value.length)

const canSubmitNew = computed(() => {
  const trimmed = newText.value.trim()
  return trimmed.length > 0 && trimmed.length <= MAX_LENGTH && !isSaving.value
})

const canSubmitEdit = computed(() => {
  const trimmed = editingText.value.trim()
  return trimmed.length > 0 && trimmed.length <= MAX_LENGTH && !isSaving.value
})

async function loadComments() {
  isLoading.value = true
  error.value = null
  try {
    const response = await ordersApi.listPaymentComments(props.orderId)
    if (response.success && response.data) {
      comments.value = response.data
    } else {
      comments.value = []
      error.value = 'No se pudieron cargar los comentarios.'
    }
  } catch (err: any) {
    comments.value = []
    error.value = err?.response?.data?.message || 'Error al cargar los comentarios.'
  } finally {
    isLoading.value = false
  }
}

async function submitNew() {
  if (!canSubmitNew.value) return
  isSaving.value = true
  try {
    const response = await ordersApi.createPaymentComment(props.orderId, newText.value.trim())
    if (response.success && response.data) {
      comments.value.push(response.data)
      newText.value = ''
      toast.add({ severity: 'success', summary: 'Comentario agregado', life: 2500 })
    } else {
      throw new Error('Respuesta inválida del servidor')
    }
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'No se pudo agregar el comentario',
      detail: err?.response?.data?.message || err?.message,
      life: 4000
    })
  } finally {
    isSaving.value = false
  }
}

function startEdit(comment: OrderPaymentComment) {
  editingId.value = comment.id
  editingText.value = comment.text
}

function cancelEdit() {
  editingId.value = null
  editingText.value = ''
}

async function submitEdit(commentId: number) {
  if (!canSubmitEdit.value) return
  isSaving.value = true
  try {
    const response = await ordersApi.updatePaymentComment(props.orderId, commentId, editingText.value.trim())
    if (response.success && response.data) {
      const index = comments.value.findIndex((c) => c.id === commentId)
      if (index !== -1) {
        comments.value[index] = response.data
      }
      cancelEdit()
      toast.add({ severity: 'success', summary: 'Comentario actualizado', life: 2500 })
    } else {
      throw new Error('Respuesta inválida del servidor')
    }
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'No se pudo actualizar',
      detail: err?.response?.data?.message || err?.message,
      life: 4000
    })
  } finally {
    isSaving.value = false
  }
}

async function removeComment(commentId: number) {
  if (!window.confirm('¿Eliminar este comentario? Esta acción no se puede deshacer.')) return
  deletingId.value = commentId
  try {
    const response = await ordersApi.deletePaymentComment(props.orderId, commentId)
    if (response.success) {
      comments.value = comments.value.filter((c) => c.id !== commentId)
      toast.add({ severity: 'success', summary: 'Comentario eliminado', life: 2500 })
    }
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'No se pudo eliminar',
      detail: err?.response?.data?.message || err?.message,
      life: 4000
    })
  } finally {
    deletingId.value = null
  }
}

function authorInitials(comment: OrderPaymentComment): string {
  const name = comment.author?.name?.trim()
  if (!name) return '?'
  const parts = name.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const second = parts[1]?.[0] ?? ''
  return (first + second).toUpperCase() || '?'
}

watch(
  () => props.orderId,
  (id) => {
    if (id) loadComments()
  }
)

onMounted(() => {
  if (props.orderId) loadComments()
})
</script>

<template>
  <Card>
    <template #title>
      <div class="flex items-center gap-2">
        <i class="pi pi-comments text-primary" />
        <span>Comentarios del pago</span>
        <span
          v-if="comments.length > 0"
          class="ml-1 inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 rounded-full bg-primary/10 text-primary text-xs font-semibold"
        >
          {{ comments.length }}
        </span>
      </div>
    </template>
    <template #content>
      <p class="text-sm text-gray-500 mb-4">
        Anota referencias del pago (por ejemplo, el número de operación bancaria cuando el cliente paga por
        transferencia o depósito). Cada comentario queda registrado con autor y fecha; el autor puede
        editar o eliminar dentro de los 30 minutos posteriores.
      </p>

      <div
        v-if="isLoading"
        class="flex justify-center py-6"
      >
        <ProgressSpinner
          style="width: 40px; height: 40px"
          stroke-width="4"
        />
      </div>

      <div
        v-else-if="error"
        class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3"
      >
        {{ error }}
      </div>

      <div
        v-else-if="comments.length === 0"
        class="py-2"
      >
        <AppEmptyState
          icon="pi-comment"
          title="Sin comentarios todavía"
          description="Anota aquí cualquier referencia útil del pago, como el número de operación bancaria."
        />
      </div>

      <ul
        v-else
        class="space-y-3 mb-6"
      >
        <li
          v-for="comment in comments"
          :key="comment.id"
          class="border-l-4 border-primary/40 bg-gray-50 rounded-md pl-4 pr-3 py-3"
        >
          <div
            v-if="editingId === comment.id"
            class="space-y-2"
          >
            <Textarea
              v-model="editingText"
              auto-resize
              rows="3"
              :maxlength="MAX_LENGTH"
              class="w-full text-sm"
            />
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-500">{{ editingTextLength }}/{{ MAX_LENGTH }}</span>
              <div class="flex gap-2">
                <AppButton
                  label="Cancelar"
                  variant="text"
                  size="small"
                  @click="cancelEdit"
                />
                <AppButton
                  label="Guardar"
                  icon="pi pi-check"
                  size="small"
                  :loading="isSaving"
                  :disabled="!canSubmitEdit"
                  @click="submitEdit(comment.id)"
                />
              </div>
            </div>
          </div>

          <div v-else>
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3 min-w-0">
                <div
                  class="flex-shrink-0 w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-semibold"
                >
                  {{ authorInitials(comment) }}
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-gray-900 truncate">
                    {{ comment.author?.name || 'Usuario' }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{ formatDateTime(comment.created_at) }}
                    <span
                      v-if="comment.updated_at"
                      class="italic"
                    >· editado</span>
                  </p>
                </div>
              </div>
              <div
                v-if="comment.can_edit || comment.can_delete"
                class="flex gap-1 flex-shrink-0"
              >
                <AppButton
                  v-if="comment.can_edit"
                  icon="pi pi-pencil"
                  variant="text"
                  size="small"
                  aria-label="Editar comentario"
                  @click="startEdit(comment)"
                />
                <AppButton
                  v-if="comment.can_delete"
                  icon="pi pi-trash"
                  variant="text"
                  size="small"
                  aria-label="Eliminar comentario"
                  :loading="deletingId === comment.id"
                  @click="removeComment(comment.id)"
                />
              </div>
            </div>
            <p class="mt-2 text-sm text-gray-900 whitespace-pre-wrap break-words">
              {{ comment.text }}
            </p>
          </div>
        </li>
      </ul>

      <div class="border-t border-gray-200 pt-4">
        <label
          for="new-payment-comment"
          class="block text-sm font-medium text-gray-700 mb-2"
        >
          Agregar comentario
        </label>
        <Textarea
          id="new-payment-comment"
          v-model="newText"
          auto-resize
          rows="3"
          :maxlength="MAX_LENGTH"
          placeholder="Ej.: Operación BCP 0023145 – depósito confirmado por el cliente"
          class="w-full text-sm"
        />
        <div class="flex items-center justify-between mt-2">
          <span class="text-xs text-gray-500">{{ newTextLength }}/{{ MAX_LENGTH }}</span>
          <AppButton
            label="Agregar comentario"
            icon="pi pi-plus"
            :loading="isSaving"
            :disabled="!canSubmitNew"
            @click="submitNew"
          />
        </div>
      </div>
    </template>
  </Card>
</template>
