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
          <img src="@/assets/images/logo-mitienda.svg" alt="MiTienda" class="h-8" />
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
            <!-- Items simples -->
            <li v-for="item in simpleMenuItems" :key="item.to">
              <router-link
                :to="item.to"
                class="flex items-center gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                active-class="bg-primary-50 text-primary font-medium"
              >
                <i :class="item.icon"></i>
                <span>{{ item.label }}</span>
              </router-link>
            </li>

            <!-- Grupo Catálogo -->
            <li>
              <button
                @click="catalogExpanded = !catalogExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isCatalogActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-book"></i>
                  <span>Catálogo</span>
                </div>
                <i :class="catalogExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="catalogExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in catalogMenuItems" :key="item.to">
                  <router-link
                    :to="item.to"
                    class="flex items-center gap-3 px-4 py-2 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors text-sm"
                    active-class="bg-primary-50 text-primary font-medium"
                  >
                    <i :class="item.icon"></i>
                    <span>{{ item.label }}</span>
                  </router-link>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- Sidebar Mobile -->
      <Sidebar v-model:visible="sidebarVisible" class="w-80">
        <template #header>
          <div class="flex items-center gap-2">
            <img src="@/assets/images/logo-mitienda.svg" alt="MiTienda" class="h-8" />
          </div>
        </template>

        <nav>
          <ul class="space-y-1">
            <!-- Items simples -->
            <li v-for="item in simpleMenuItems" :key="item.to">
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

            <!-- Grupo Catálogo -->
            <li>
              <button
                @click="catalogExpanded = !catalogExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isCatalogActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-book"></i>
                  <span>Catálogo</span>
                </div>
                <i :class="catalogExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="catalogExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in catalogMenuItems" :key="item.to">
                  <router-link
                    :to="item.to"
                    class="flex items-center gap-3 px-4 py-2 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors text-sm"
                    active-class="bg-primary-50 text-primary font-medium"
                    @click="sidebarVisible = false"
                  >
                    <i :class="item.icon"></i>
                    <span>{{ item.label }}</span>
                  </router-link>
                </li>
              </ul>
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
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import Button from 'primevue/button'
import Sidebar from 'primevue/sidebar'
import Menu from 'primevue/menu'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const sidebarVisible = ref(false)
const userMenu = ref()
const catalogExpanded = ref(true)

// Items simples del menú
const simpleMenuItems = [
  { label: 'Dashboard', icon: 'pi pi-home', to: '/dashboard' },
  { label: 'Pedidos', icon: 'pi pi-shopping-cart', to: '/orders' },
  { label: 'Clientes', icon: 'pi pi-users', to: '/customers' }
]

// Items del grupo Catálogo
const catalogMenuItems = [
  { label: 'Productos', icon: 'pi pi-box', to: '/products' },
  { label: 'Categorías', icon: 'pi pi-folder', to: '/catalog/categories' },
  { label: 'Marcas', icon: 'pi pi-tag', to: '/catalog/brands' }
]

// Detectar si estamos en alguna ruta del catálogo
const isCatalogActive = computed(() => {
  return route.path.startsWith('/products') || route.path.startsWith('/catalog')
})

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
