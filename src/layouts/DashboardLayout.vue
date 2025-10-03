<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div class="px-4 py-3 flex items-center justify-between">
        <!-- Logo y menú móvil -->
        <div class="flex items-center gap-4">
          <Button
            icon="pi pi-bars"
            class="lg:hidden"
            text
            @click="sidebarVisible = true"
          />
          <h1 class="text-xl font-bold text-primary">MiTienda</h1>
        </div>

        <!-- Tienda actual y usuario -->
        <div class="flex items-center gap-4">
          <!-- Tienda seleccionada -->
          <div v-if="authStore.selectedStore" class="hidden md:flex items-center gap-2">
            <i class="pi pi-shop text-secondary-400"></i>
            <span class="text-sm font-medium">{{ authStore.selectedStore.name }}</span>
          </div>

          <!-- Usuario -->
          <Button
            :label="authStore.user?.name"
            icon="pi pi-user"
            text
            @click="toggleUserMenu"
          />
          <Menu ref="userMenu" :model="userMenuItems" popup />
        </div>
      </div>
    </header>

    <div class="flex">
      <!-- Sidebar Desktop -->
      <aside class="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-60px)]">
        <nav class="p-4">
          <ul class="space-y-1">
            <li v-for="item in menuItems" :key="item.to">
              <router-link
                :to="item.to"
                class="flex items-center gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                active-class="bg-primary-50 text-primary font-medium"
              >
                <i :class="item.icon"></i>
                <span>{{ item.label }}</span>
              </router-link>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- Sidebar Mobile -->
      <Sidebar v-model:visible="sidebarVisible" class="w-80">
        <template #header>
          <div class="flex items-center gap-2">
            <h2 class="text-xl font-bold text-primary">Menú</h2>
          </div>
        </template>

        <nav>
          <ul class="space-y-1">
            <li v-for="item in menuItems" :key="item.to">
              <router-link
                :to="item.to"
                class="flex items-center gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                active-class="bg-primary-50 text-primary font-medium"
                @click="sidebarVisible = false"
              >
                <i :class="item.icon"></i>
                <span>{{ item.label }}</span>
              </router-link>
            </li>
          </ul>
        </nav>
      </Sidebar>

      <!-- Main Content -->
      <main class="flex-1 p-4 lg:p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import Button from 'primevue/button'
import Sidebar from 'primevue/sidebar'
import Menu from 'primevue/menu'

const router = useRouter()
const authStore = useAuthStore()

const sidebarVisible = ref(false)
const userMenu = ref()

const menuItems = [
  { label: 'Dashboard', icon: 'pi pi-home', to: '/dashboard' },
  { label: 'Productos', icon: 'pi pi-box', to: '/products' },
  { label: 'Pedidos', icon: 'pi pi-shopping-cart', to: '/orders' },
  { label: 'Clientes', icon: 'pi pi-users', to: '/customers' }
]

const userMenuItems = ref([
  {
    label: 'Mi Perfil',
    icon: 'pi pi-user',
    command: () => {
      // TODO: Implementar vista de perfil
    }
  },
  {
    label: 'Cambiar Tienda',
    icon: 'pi pi-shop',
    command: () => {
      router.push('/store-selection')
    },
    visible: authStore.hasMultipleStores
  },
  {
    separator: true
  },
  {
    label: 'Cerrar Sesión',
    icon: 'pi pi-sign-out',
    command: async () => {
      await authStore.logout()
      router.push('/login')
    }
  }
])

const toggleUserMenu = (event: Event) => {
  userMenu.value.toggle(event)
}
</script>
