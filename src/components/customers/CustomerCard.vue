<template>
  <div
    class="customer-card"
    :class="{ blocked: customer.blocked }"
    @click="$emit('click', customer)"
  >
    <div class="customer-card__header">
      <div class="customer-card__avatar">
        <i class="pi pi-user"></i>
      </div>
      <div class="customer-card__info">
        <h3 class="customer-card__name">{{ customer.name }}</h3>
        <p class="customer-card__email">{{ customer.email }}</p>
      </div>
      <div class="customer-card__badges">
        <Tag v-if="customer.verified" severity="success" value="Verificado" />
        <Tag v-if="customer.blocked" severity="danger" value="Bloqueado" />
      </div>
    </div>

    <div class="customer-card__details">
      <div v-if="customer.phone" class="customer-card__detail">
        <i class="pi pi-phone"></i>
        <span>{{ customer.phone }}</span>
      </div>
      <div v-if="customer.document_number" class="customer-card__detail">
        <i class="pi pi-id-card"></i>
        <span>{{ customer.document_number }}</span>
      </div>
      <div class="customer-card__detail">
        <i class="pi pi-calendar"></i>
        <span>Cliente desde {{ formatDate(customer.created_at) }}</span>
      </div>
    </div>

    <div v-if="customer.total_orders || customer.total_spent" class="customer-card__stats">
      <div v-if="customer.total_orders" class="customer-card__stat">
        <span class="customer-card__stat-label">Pedidos</span>
        <span class="customer-card__stat-value">{{ customer.total_orders }}</span>
      </div>
      <div v-if="customer.total_spent" class="customer-card__stat">
        <span class="customer-card__stat-label">Total gastado</span>
        <span class="customer-card__stat-value">S/ {{ formatMoney(customer.total_spent) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import Tag from 'primevue/tag'
import type { Customer } from '@/types/customer.types'

interface Props {
  customer: Customer
}

defineProps<Props>()

defineEmits<{
  click: [customer: Customer]
}>()

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function formatMoney(amount: number): string {
  return amount.toFixed(2)
}
</script>

<style scoped>
.customer-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border-color: #3b82f6;
  }

  &.blocked {
    opacity: 0.6;
    border-color: #ef4444;
  }

  &__header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  &__avatar {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: 1rem;
    font-weight: 600;
    color: #111827;
    margin: 0 0 0.25rem 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__email {
    font-size: 0.875rem;
    color: #6b7280;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__badges {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  &__details {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  &__detail {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #6b7280;

    i {
      color: #9ca3af;
      font-size: 0.875rem;
    }
  }

  &__stats {
    display: flex;
    gap: 1.5rem;
  }

  &__stat {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  &__stat-label {
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__stat-value {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
  }
}
</style>
