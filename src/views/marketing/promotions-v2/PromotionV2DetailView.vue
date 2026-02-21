<template>
  <div class="promotion-v2-detail-view">
    <!-- Loading -->
    <div v-if="store.isLoading && !promotion" class="flex justify-center py-12">
      <i class="pi pi-spinner pi-spin text-4xl text-primary"></i>
    </div>

    <!-- Error -->
    <div v-else-if="store.error && !promotion" class="rounded-lg bg-red-50 p-6 text-center">
      <i class="pi pi-exclamation-triangle mb-2 text-3xl text-red-400"></i>
      <p class="text-sm text-red-600">{{ store.error }}</p>
      <button class="mt-3 text-sm font-medium text-primary hover:underline" @click="loadPromotion">
        Reintentar
      </button>
    </div>

    <!-- Content -->
    <template v-else-if="promotion">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button
            class="rounded-md p-1 text-gray-400 hover:text-gray-600"
            @click="router.push('/marketing/promotions-v2')"
          >
            <i class="pi pi-arrow-left text-lg"></i>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ promotion.name }}</h1>
            <p v-if="promotion.description" class="mt-1 text-sm text-gray-500">
              {{ promotion.description }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span
            class="inline-flex rounded-full px-3 py-1 text-sm font-semibold"
            :class="statusClasses(promotion.status)"
          >
            {{ statusLabel(promotion.status) }}
          </span>
          <button
            class="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            @click="openEditDialog()"
          >
            <i class="pi pi-pencil mr-1"></i> Editar
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Activations -->
          <RuleSection
            title="Activaciones"
            description="Cómo se activa la promoción"
            icon="pi pi-bolt"
            :rules="promotion.activations || []"
            :type-labels="ACTIVATION_TYPE_LABELS"
            :valid-types="ACTIVATION_TYPES"
            id-field="activation_id"
            @add="data => store.addRule(promotion!.promotions_v2_id, 'activations', data)"
            @update="(id, data) => store.editRule(promotion!.promotions_v2_id, 'activations', id, data)"
            @delete="id => store.removeRule(promotion!.promotions_v2_id, 'activations', id)"
          />

          <!-- Conditions -->
          <RuleSection
            title="Condiciones"
            description="Qué debe cumplirse para aplicar"
            icon="pi pi-filter"
            :rules="promotion.conditions || []"
            :type-labels="CONDITION_TYPE_LABELS"
            :valid-types="CONDITION_TYPES"
            id-field="condition_id"
            @add="data => store.addRule(promotion!.promotions_v2_id, 'conditions', data)"
            @update="(id, data) => store.editRule(promotion!.promotions_v2_id, 'conditions', id, data)"
            @delete="id => store.removeRule(promotion!.promotions_v2_id, 'conditions', id)"
          />

          <!-- Effects -->
          <RuleSection
            title="Efectos"
            description="Qué descuento o beneficio se aplica"
            icon="pi pi-gift"
            :rules="promotion.effects || []"
            :type-labels="EFFECT_TYPE_LABELS"
            :valid-types="EFFECT_TYPES"
            id-field="effect_id"
            @add="data => store.addRule(promotion!.promotions_v2_id, 'effects', data)"
            @update="(id, data) => store.editRule(promotion!.promotions_v2_id, 'effects', id, data)"
            @delete="id => store.removeRule(promotion!.promotions_v2_id, 'effects', id)"
          />

          <!-- Constraints -->
          <RuleSection
            title="Restricciones"
            description="Límites de uso de la promoción"
            icon="pi pi-lock"
            :rules="promotion.constraints || []"
            :type-labels="CONSTRAINT_TYPE_LABELS"
            :valid-types="CONSTRAINT_TYPES"
            id-field="constraint_id"
            @add="data => store.addRule(promotion!.promotions_v2_id, 'constraints', data)"
            @update="(id, data) => store.editRule(promotion!.promotions_v2_id, 'constraints', id, data)"
            @delete="id => store.removeRule(promotion!.promotions_v2_id, 'constraints', id)"
          />

          <!-- Coupons -->
          <CouponsSection
            :coupons="promotion.coupons || []"
            :promotion-id="promotion.promotions_v2_id"
          />
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Status Card -->
          <div class="rounded-lg bg-white p-5 shadow">
            <h3 class="mb-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">Estado</h3>
            <div class="space-y-3">
              <button
                v-for="st in availableStatuses"
                :key="st.value"
                class="flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors"
                :class="promotion.status === st.value
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-gray-600 hover:bg-gray-100'"
                @click="handleStatusChange(st.value)"
              >
                <i :class="st.icon" class="mr-2"></i>
                {{ st.label }}
              </button>
            </div>
          </div>

          <!-- Info Card -->
          <div class="rounded-lg bg-white p-5 shadow">
            <h3 class="mb-4 text-sm font-semibold text-gray-900 uppercase tracking-wider">Detalles</h3>
            <dl class="space-y-3 text-sm">
              <div>
                <dt class="text-gray-500">Prioridad</dt>
                <dd class="font-medium text-gray-900">{{ promotion.priority }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">Acumulable</dt>
                <dd class="font-medium text-gray-900">{{ promotion.stackable ? 'Sí' : 'No' }}</dd>
              </div>
              <div v-if="promotion.exclusive_group">
                <dt class="text-gray-500">Grupo exclusivo</dt>
                <dd class="font-medium text-gray-900">{{ promotion.exclusive_group }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">Inicio</dt>
                <dd class="font-medium text-gray-900">{{ formatDate(promotion.starts_at) }}</dd>
              </div>
              <div>
                <dt class="text-gray-500">Fin</dt>
                <dd class="font-medium text-gray-900">
                  {{ promotion.ends_at ? formatDate(promotion.ends_at) : 'Sin fecha fin' }}
                </dd>
              </div>
              <div>
                <dt class="text-gray-500">Creada</dt>
                <dd class="font-medium text-gray-900">{{ formatDate(promotion.created_at) }}</dd>
              </div>
            </dl>
          </div>

          <!-- Danger Zone -->
          <div class="rounded-lg border border-red-200 bg-red-50 p-5">
            <h3 class="mb-2 text-sm font-semibold text-red-800">Zona peligrosa</h3>
            <p class="mb-3 text-xs text-red-600">Eliminar esta promoción y todas sus reglas asociadas.</p>
            <button
              class="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              @click="confirmDelete"
            >
              <i class="pi pi-trash mr-1"></i> Eliminar promoción
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Edit Dialog -->
    <Dialog
      v-model:visible="showEditDialog"
      :modal="true"
      header="Editar Promoción"
      :style="{ width: '500px' }"
    >
      <div class="space-y-4" v-if="editForm">
        <div>
          <label class="block text-sm font-medium text-secondary-700">Nombre</label>
          <input
            v-model="editForm.name"
            type="text"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-secondary-700">Descripción</label>
          <textarea
            v-model="editForm.description"
            rows="3"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          ></textarea>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-secondary-700">Prioridad</label>
            <input
              v-model.number="editForm.priority"
              type="number"
              min="0"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary-700">Grupo exclusivo</label>
            <input
              v-model="editForm.exclusive_group"
              type="text"
              placeholder="Opcional"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>
        </div>
        <div>
          <label class="flex items-center">
            <input
              v-model="editForm.stackable"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span class="ml-2 text-sm text-gray-700">Acumulable con otras promociones</span>
          </label>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-secondary-700">Fecha inicio</label>
            <input
              v-model="editForm.starts_at"
              type="datetime-local"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-secondary-700">Fecha fin</label>
            <input
              v-model="editForm.ends_at"
              type="datetime-local"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <button
          class="mr-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          @click="showEditDialog = false"
        >
          Cancelar
        </button>
        <button
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          @click="handleEdit"
        >
          Guardar
        </button>
      </template>
    </Dialog>

    <!-- Delete Confirmation -->
    <Dialog
      v-model:visible="showDeleteDialog"
      :modal="true"
      header="Confirmar eliminación"
      :style="{ width: '400px' }"
    >
      <p class="text-sm text-gray-600">
        ¿Estás seguro de que deseas eliminar <strong>{{ promotion?.name }}</strong>?
        Se eliminarán todas las reglas, cupones y datos asociados.
      </p>
      <template #footer>
        <button
          class="mr-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          @click="showDeleteDialog = false"
        >
          Cancelar
        </button>
        <button
          class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          @click="handleDelete"
        >
          Eliminar
        </button>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Dialog from 'primevue/dialog'
import { usePromotionV2Store } from '@/stores/promotion-v2.store'
import { useFormatters } from '@/composables/useFormatters'
import RuleSection from '@/components/promotions-v2/RuleSection.vue'
import CouponsSection from '@/components/promotions-v2/CouponsSection.vue'
import {
  STATUS_LABELS,
  ACTIVATION_TYPE_LABELS,
  CONDITION_TYPE_LABELS,
  EFFECT_TYPE_LABELS,
  CONSTRAINT_TYPE_LABELS,
} from '@/types/promotion-v2.types'
import type { PromotionV2Status, UpdatePromotionV2Data } from '@/types/promotion-v2.types'

interface EditFormData {
  name: string
  description: string
  priority: number
  stackable: boolean
  exclusive_group: string
  starts_at: string
  ends_at: string
}

const ACTIVATION_TYPES = Object.keys(ACTIVATION_TYPE_LABELS)
const CONDITION_TYPES = Object.keys(CONDITION_TYPE_LABELS)
const EFFECT_TYPES = Object.keys(EFFECT_TYPE_LABELS)
const CONSTRAINT_TYPES = Object.keys(CONSTRAINT_TYPE_LABELS)

const router = useRouter()
const route = useRoute()
const store = usePromotionV2Store()
const { formatDate } = useFormatters()

const promotion = computed(() => store.currentPromotion)

const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const editForm = ref<EditFormData>({
  name: '',
  description: '',
  priority: 0,
  stackable: false,
  exclusive_group: '',
  starts_at: '',
  ends_at: '',
})

const availableStatuses = [
  { value: 'draft' as const, label: 'Borrador', icon: 'pi pi-file' },
  { value: 'scheduled' as const, label: 'Programada', icon: 'pi pi-calendar' },
  { value: 'active' as const, label: 'Activa', icon: 'pi pi-check-circle' },
  { value: 'paused' as const, label: 'Pausada', icon: 'pi pi-pause' },
  { value: 'expired' as const, label: 'Expirada', icon: 'pi pi-times-circle' },
]

function statusLabel(status: PromotionV2Status) {
  return STATUS_LABELS[status] || status
}

function statusClasses(status: PromotionV2Status) {
  const map: Record<PromotionV2Status, string> = {
    draft: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
    paused: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-red-100 text-red-700',
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

async function handleStatusChange(status: PromotionV2Status) {
  if (!promotion.value || promotion.value.status === status) return
  await store.changeStatus(promotion.value.promotions_v2_id, status)
}

function openEditDialog() {
  if (!promotion.value) return
  editForm.value = {
    name: promotion.value.name,
    description: promotion.value.description || '',
    priority: promotion.value.priority,
    stackable: !!promotion.value.stackable,
    exclusive_group: promotion.value.exclusive_group || '',
    starts_at: promotion.value.starts_at?.replace(' ', 'T')?.slice(0, 16) || '',
    ends_at: promotion.value.ends_at?.replace(' ', 'T')?.slice(0, 16) || '',
  }
  showEditDialog.value = true
}

async function handleEdit() {
  if (!promotion.value) return
  const data: UpdatePromotionV2Data = {
    name: editForm.value.name,
    description: editForm.value.description || undefined,
    priority: editForm.value.priority,
    stackable: editForm.value.stackable ? 1 : 0,
    exclusive_group: editForm.value.exclusive_group || undefined,
    starts_at: editForm.value.starts_at?.replace('T', ' ') || undefined,
    ends_at: editForm.value.ends_at?.replace('T', ' ') || undefined,
  }
  await store.modifyPromotion(promotion.value.promotions_v2_id, data)
  showEditDialog.value = false
}

function confirmDelete() {
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!promotion.value) return
  await store.removePromotion(promotion.value.promotions_v2_id)
  router.push('/marketing/promotions-v2')
}

async function loadPromotion() {
  const id = Number(route.params.id)
  if (id) {
    await store.fetchPromotion(id)
  }
}

onMounted(() => {
  loadPromotion()
})
</script>
