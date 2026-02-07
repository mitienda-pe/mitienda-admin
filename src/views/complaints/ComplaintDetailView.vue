<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useComplaintsStore } from '@/stores/complaints.store'
import { useFormatters } from '@/composables/useFormatters'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const complaintsStore = useComplaintsStore()
const { formatDate, formatCurrency } = useFormatters()
const toast = useToast()

const complaintId = Number(route.params.id)
const responseText = ref('')
const isSubmitting = ref(false)

onMounted(() => {
  complaintsStore.fetchComplaint(complaintId)
})

const complaint = computed(() => complaintsStore.currentComplaint)

const goBack = () => {
  router.push('/complaints')
}

const handleSubmitResponse = async () => {
  if (!responseText.value.trim()) return

  try {
    isSubmitting.value = true
    await complaintsStore.respondToComplaint(complaintId, responseText.value.trim())
    toast.add({
      severity: 'success',
      summary: 'Respuesta registrada',
      detail: 'La acción adoptada ha sido guardada exitosamente',
      life: 3000,
    })
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo guardar la respuesta',
      life: 3000,
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button icon="pi pi-arrow-left" text rounded @click="goBack" />
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            {{ complaint?.code || 'Reclamación' }}
          </h1>
          <p v-if="complaint?.correlativo" class="text-gray-500 mt-1">
            Hoja de reclamación: {{ complaint.correlativo }}
          </p>
        </div>
      </div>
      <div v-if="complaint" class="flex gap-2">
        <Tag
          :value="complaint.complaint_type || ''"
          :severity="complaint.complaint_type_id === 1 ? 'warning' : 'info'"
        />
        <Tag
          :value="complaint.status === 'attended' ? 'Atendido' : 'Pendiente'"
          :severity="complaint.status === 'attended' ? 'success' : 'warning'"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="complaintsStore.isLoading" class="flex justify-center items-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Error -->
    <div
      v-else-if="complaintsStore.error"
      class="bg-red-50 border border-red-200 rounded-lg p-6 text-center"
    >
      <i class="pi pi-exclamation-circle text-4xl text-red-500 mb-2"></i>
      <p class="text-red-700">{{ complaintsStore.error }}</p>
      <Button label="Volver" icon="pi pi-arrow-left" class="mt-4" @click="goBack" />
    </div>

    <!-- Not Found -->
    <div
      v-else-if="!complaint"
      class="bg-white border border-gray-200 rounded-lg p-12 text-center"
    >
      <i class="pi pi-book text-6xl text-gray-300 mb-4"></i>
      <h3 class="text-xl font-semibold text-gray-900 mb-2">Reclamación no encontrada</h3>
      <Button label="Volver" icon="pi pi-arrow-left" @click="goBack" />
    </div>

    <!-- Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Column -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Detalle del Reclamo -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-file-edit text-primary"></i>
              Detalle del {{ complaint.complaint_type }}
            </div>
          </template>
          <template #content>
            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p class="text-sm text-gray-500">Tipo de bien</p>
                  <p class="font-semibold text-gray-900">{{ complaint.good_type }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500">Monto reclamado</p>
                  <p class="font-semibold text-gray-900">
                    {{ complaint.claimed_amount ? formatCurrency(complaint.claimed_amount) : '—' }}
                  </p>
                </div>
              </div>

              <div>
                <p class="text-sm text-gray-500">Descripción del bien</p>
                <p class="text-gray-900 mt-1">{{ complaint.good_description || '—' }}</p>
              </div>

              <div>
                <p class="text-sm text-gray-500">Detalle de la reclamación</p>
                <p class="text-gray-900 mt-1 whitespace-pre-line">
                  {{ complaint.complaint_detail }}
                </p>
              </div>

              <div v-if="complaint.order_detail">
                <p class="text-sm text-gray-500">Detalle del pedido</p>
                <p class="text-gray-900 mt-1 whitespace-pre-line">
                  {{ complaint.order_detail }}
                </p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Respuesta -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-reply text-primary"></i>
              Acciones Adoptadas por la Tienda
            </div>
          </template>
          <template #content>
            <!-- Already responded -->
            <div v-if="complaint.response">
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <p class="text-gray-900 whitespace-pre-line">{{ complaint.response }}</p>
                <p v-if="complaint.response_date" class="text-sm text-gray-500 mt-3">
                  Respondido el {{ formatDate(complaint.response_date) }}
                </p>
              </div>
            </div>

            <!-- Pending response form -->
            <div v-else>
              <Textarea
                v-model="responseText"
                rows="4"
                class="w-full"
                placeholder="Escriba las acciones adoptadas por la tienda..."
              />
              <div class="flex justify-end mt-3">
                <Button
                  label="Guardar respuesta"
                  icon="pi pi-check"
                  :loading="isSubmitting"
                  :disabled="!responseText.trim()"
                  @click="handleSubmitResponse"
                />
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Sidebar -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Datos del reclamante -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-user text-primary"></i>
              Datos del Reclamante
            </div>
          </template>
          <template #content>
            <div class="space-y-3">
              <div>
                <p class="text-sm text-gray-500">Nombre</p>
                <p class="font-semibold text-gray-900">{{ complaint.name }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Documento</p>
                <p class="font-semibold text-gray-900">
                  {{ complaint.document_type }}: {{ complaint.document_number }}
                </p>
              </div>
              <div v-if="complaint.legal_representative">
                <p class="text-sm text-gray-500">Padre o Madre</p>
                <p class="font-semibold text-gray-900">{{ complaint.legal_representative }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Domicilio</p>
                <p class="font-semibold text-gray-900">{{ complaint.address }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Email</p>
                <p class="font-semibold text-gray-900">{{ complaint.email }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Teléfono</p>
                <p class="font-semibold text-gray-900">{{ complaint.phone }}</p>
              </div>
            </div>
          </template>
        </Card>

        <!-- Info del registro -->
        <Card>
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-info-circle text-primary"></i>
              Información
            </div>
          </template>
          <template #content>
            <div class="space-y-3">
              <div>
                <p class="text-sm text-gray-500">Fecha de registro</p>
                <p class="font-semibold text-gray-900">{{ formatDate(complaint.date) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Código</p>
                <p class="font-mono font-semibold text-gray-900">{{ complaint.code }}</p>
              </div>
              <div v-if="complaint.correlativo">
                <p class="text-sm text-gray-500">Hoja de reclamación</p>
                <p class="font-mono font-semibold text-gray-900">{{ complaint.correlativo }}</p>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
  </div>
</template>
