<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { label: 'Barras', icon: 'pi pi-minus', to: '/marketing/announcement-bars' },
  { label: 'Popups', icon: 'pi pi-window-maximize', to: '/marketing/announcement-popups' }
]

const isActive = (to: string) => route.path === to || route.path.startsWith(to + '/')
</script>

<template>
  <nav class="flex gap-1 border-b border-secondary-200">
    <RouterLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="flex items-center gap-2 px-4 py-2 -mb-px border-b-2 text-sm font-medium transition-colors"
      :class="isActive(tab.to)
        ? 'border-primary text-primary'
        : 'border-transparent text-secondary-500 hover:text-secondary-700'"
    >
      <i :class="tab.icon" class="text-xs"></i>
      {{ tab.label }}
    </RouterLink>
  </nav>
</template>
