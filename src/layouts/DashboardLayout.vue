<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Banner de Impersonación -->
    <ImpersonationBanner
      :show="adminStore.isImpersonating"
      :store-name="adminStore.impersonatedStore?.name"
      :loading="exitingImpersonation"
      @exit="handleExitImpersonation"
    />

    <!-- Header -->
    <header
      class="bg-white shadow-sm border-b border-gray-200 sticky z-40"
      :class="adminStore.isImpersonating ? 'top-[52px]' : 'top-0'"
    >
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
          <!-- Sidebar para SuperAdmin SIN impersonación -->
          <ul v-if="isSuperAdminWithoutImpersonation" class="space-y-1">
            <li>
              <router-link
                to="/admin/stores"
                class="flex items-center gap-3 px-4 py-3 rounded-lg text-purple-600 hover:bg-purple-50 hover:text-purple-700 transition-colors font-medium"
                active-class="bg-purple-50 text-purple-700"
              >
                <i class="pi pi-shield"></i>
                <span>Gestión de Tiendas</span>
              </router-link>
            </li>

            <li>
              <router-link
                to="/admin/s3-migration"
                class="flex items-center gap-3 px-4 py-3 rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors font-medium"
                active-class="bg-blue-50 text-blue-700"
              >
                <i class="pi pi-cloud-upload"></i>
                <span>Migración S3 → Cloudflare</span>
              </router-link>
            </li>

            <li>
              <router-link
                to="/debug/superadmin"
                class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                active-class="bg-gray-50 text-gray-900 font-medium"
              >
                <i class="pi pi-wrench"></i>
                <span>Debug</span>
              </router-link>
            </li>

            <li class="pt-4">
              <div class="px-4 py-2 text-xs text-gray-500 uppercase font-semibold">
                Modo Super-Admin
              </div>
              <div class="px-4 py-2 text-sm text-gray-600">
                Selecciona una tienda para acceder a sus opciones
              </div>
            </li>
          </ul>

          <!-- Sidebar normal para StoreAdmin o SuperAdmin impersonando -->
          <ul v-else class="space-y-1">
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

            <!-- Grupo Ventas -->
            <li>
              <button
                @click="salesExpanded = !salesExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isSalesActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-chart-line"></i>
                  <span>Ventas</span>
                </div>
                <i :class="salesExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="salesExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in salesMenuItems" :key="item.to">
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

            <!-- Grupo Marketing -->
            <li>
              <button
                @click="marketingExpanded = !marketingExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isMarketingActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-megaphone"></i>
                  <span>Marketing</span>
                </div>
                <i :class="marketingExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="marketingExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in marketingMenuItems" :key="item.to">
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

            <!-- Grupo Facturación -->
            <li>
              <button
                @click="billingExpanded = !billingExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isBillingActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-receipt"></i>
                  <span>Facturación</span>
                </div>
                <i :class="billingExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="billingExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in billingMenuItems" :key="item.to">
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

            <!-- Grupo: API -->
            <li>
              <button
                @click="apiExpanded = !apiExpanded"
                class="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isApiActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-cog"></i>
                  <span>API</span>
                </div>
                <i :class="apiExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="apiExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in apiMenuItems" :key="item.to">
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

            <!-- Grupo: NetSuite -->
            <li>
              <button
                @click="configExpanded = !configExpanded"
                class="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isConfigActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-cloud"></i>
                  <span>NetSuite</span>
                </div>
                <i :class="configExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="configExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in configMenuItems" :key="item.to">
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

            <!-- Volver a Administración (solo si está impersonando) -->
            <li v-if="adminStore.isImpersonating">
              <div class="border-t border-gray-200 my-4"></div>
              <button
                @click="handleExitImpersonation"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-purple-600 hover:bg-purple-50 hover:text-purple-700 transition-colors font-medium"
              >
                <i class="pi pi-arrow-left"></i>
                <span>Volver a Admin</span>
              </button>
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

            <!-- Grupo Ventas -->
            <li>
              <button
                @click="salesExpanded = !salesExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isSalesActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-chart-line"></i>
                  <span>Ventas</span>
                </div>
                <i :class="salesExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="salesExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in salesMenuItems" :key="item.to">
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

            <!-- Grupo Marketing -->
            <li>
              <button
                @click="marketingExpanded = !marketingExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isMarketingActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-megaphone"></i>
                  <span>Marketing</span>
                </div>
                <i :class="marketingExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="marketingExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in marketingMenuItems" :key="item.to">
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

            <!-- Grupo Facturación -->
            <li>
              <button
                @click="billingExpanded = !billingExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isBillingActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-receipt"></i>
                  <span>Facturación</span>
                </div>
                <i :class="billingExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="billingExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in billingMenuItems" :key="item.to">
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

            <!-- Grupo API -->
            <li>
              <button
                @click="apiExpanded = !apiExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isApiActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-cog"></i>
                  <span>API</span>
                </div>
                <i :class="apiExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="apiExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in apiMenuItems" :key="item.to">
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

            <!-- Grupo NetSuite -->
            <li>
              <button
                @click="configExpanded = !configExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isConfigActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-cloud"></i>
                  <span>NetSuite</span>
                </div>
                <i :class="configExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="configExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in configMenuItems" :key="item.to">
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
import { useAdminStore } from '@/stores/admin.store'
import Button from 'primevue/button'
import Sidebar from 'primevue/sidebar'
import Menu from 'primevue/menu'
import ImpersonationBanner from '@/components/admin/ImpersonationBanner.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const adminStore = useAdminStore()

const exitingImpersonation = ref(false)

const sidebarVisible = ref(false)
const userMenu = ref()

// Estados de expansión de los menús con refs
const salesExpandedRef = ref(false)
const catalogExpandedRef = ref(false)
const marketingExpandedRef = ref(false)
const billingExpandedRef = ref(false)
const apiExpandedRef = ref(false)
const configExpandedRef = ref(false)

// Computar dinámicamente qué menú debe estar expandido según la ruta
const salesExpanded = computed({
  get: () => salesExpandedRef.value || route.path.startsWith('/orders') || route.path.includes('abandoned-carts') || route.path.startsWith('/reports'),
  set: (val) => { salesExpandedRef.value = val }
})

const catalogExpanded = computed({
  get: () => catalogExpandedRef.value || route.path.startsWith('/products') || route.path.startsWith('/catalog'),
  set: (val) => { catalogExpandedRef.value = val }
})

const marketingExpanded = computed({
  get: () => marketingExpandedRef.value || route.path.startsWith('/marketing'),
  set: (val) => { marketingExpandedRef.value = val }
})

const billingExpanded = computed({
  get: () => billingExpandedRef.value || route.path.startsWith('/billing'),
  set: (val) => { billingExpandedRef.value = val }
})

const apiExpanded = computed({
  get: () => apiExpandedRef.value || route.path.startsWith('/api'),
  set: (val) => { apiExpandedRef.value = val }
})

const configExpanded = computed({
  get: () => configExpandedRef.value || route.path.startsWith('/configuracion'),
  set: (val) => { configExpandedRef.value = val }
})

// Items simples del menú
const simpleMenuItems = [
  { label: 'Dashboard', icon: 'pi pi-home', to: '/dashboard' },
  { label: 'Clientes', icon: 'pi pi-users', to: '/customers' }
]

// Items del grupo Ventas
const salesMenuItems = [
  { label: 'Pedidos', icon: 'pi pi-shopping-cart', to: '/orders' },
  { label: 'Carritos Abandonados', icon: 'pi pi-shopping-bag', to: '/marketing/abandoned-carts' },
  { label: 'Reportes', icon: 'pi pi-chart-bar', to: '/reports/orders' }
]

// Items del grupo Catálogo
const catalogMenuItems = [
  { label: 'Productos', icon: 'pi pi-box', to: '/products' },
  { label: 'Categorías', icon: 'pi pi-folder', to: '/catalog/categories' },
  { label: 'Marcas', icon: 'pi pi-tag', to: '/catalog/brands' },
  { label: 'Etiquetas', icon: 'pi pi-bookmark', to: '/catalog/product-tags' }
]

// Items del grupo Marketing
const marketingMenuItems = [
  { label: 'Promociones', icon: 'pi pi-percentage', to: '/marketing/promotions' },
  { label: 'Barras de Anuncios', icon: 'pi pi-megaphone', to: '/marketing/announcement-bars' }
]

// Items del grupo Facturación
const billingMenuItems = [
  { label: 'Proveedores', icon: 'pi pi-building', to: '/billing/providers' },
  { label: 'Documentos', icon: 'pi pi-file', to: '/billing/documents' }
]

// Items del grupo API
const apiMenuItems = [
  { label: 'Credenciales', icon: 'pi pi-key', to: '/api/credentials' },
  { label: 'Webhooks', icon: 'pi pi-link', to: '/api/webhooks' }
]

// Items del grupo NetSuite
const configMenuItems = [
  { label: 'Configuración', icon: 'pi pi-cog', to: '/configuracion/netsuite' },
  { label: 'Cola de Sincronización', icon: 'pi pi-list', to: '/configuracion/netsuite/cola' }
]

// Detectar si estamos en alguna ruta de ventas
const isSalesActive = computed(() => {
  return route.path.startsWith('/orders') || route.path.includes('abandoned-carts') || route.path.startsWith('/reports')
})

// Detectar si estamos en alguna ruta del catálogo
const isCatalogActive = computed(() => {
  return route.path.startsWith('/products') || route.path.startsWith('/catalog')
})

// Detectar si estamos en alguna ruta de marketing
const isMarketingActive = computed(() => {
  return route.path.startsWith('/marketing')
})

// Detectar si estamos en alguna ruta de facturación
const isBillingActive = computed(() => {
  return route.path.startsWith('/billing')
})

// Detectar si estamos en alguna ruta de API
const isApiActive = computed(() => {
  return route.path.startsWith('/api')
})

// Detectar si estamos en alguna ruta de configuración
const isConfigActive = computed(() => {
  return route.path.startsWith('/configuracion')
})

// Detectar si es superadmin SIN estar impersonando (para mostrar sidebar especial)
const isSuperAdminWithoutImpersonation = computed(() => {
  return authStore.isSuperAdmin && !adminStore.isImpersonating
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

async function handleExitImpersonation() {
  exitingImpersonation.value = true

  const success = await adminStore.exitImpersonation()

  if (success) {
    // Recargar la página para limpiar el estado
    window.location.href = '/admin/stores'
  } else {
    exitingImpersonation.value = false
  }
}
</script>
