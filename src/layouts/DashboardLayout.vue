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
            aria-label="Abrir menú de navegación"
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
      <aside class="hidden lg:block w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-60px)]" role="navigation" aria-label="Navegación principal">
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

            <!-- Grupo Tu Tienda -->
            <li>
              <button
                @click="storeExpanded = !storeExpanded"
                :aria-expanded="storeExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isStoreActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-shop"></i>
                  <span>Tu Tienda</span>
                </div>
                <i :class="storeExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="storeExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in storeMenuItems" :key="item.to">
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

            <!-- Grupo Ventas -->
            <li>
              <button
                @click="salesExpanded = !salesExpanded"
                :aria-expanded="salesExpanded"
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

            <!-- Grupo Reportes -->
            <li>
              <button
                @click="reportsExpanded = !reportsExpanded"
                :aria-expanded="reportsExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isReportsActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-chart-bar"></i>
                  <span>Reportes</span>
                </div>
                <i :class="reportsExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="reportsExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in reportsMenuItems" :key="item.to">
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
                :aria-expanded="catalogExpanded"
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
                :aria-expanded="marketingExpanded"
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

            <!-- Grupo Contenido -->
            <li>
              <button
                @click="contentExpanded = !contentExpanded"
                :aria-expanded="contentExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isContentActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-file-edit"></i>
                  <span>Contenido</span>
                </div>
                <i :class="contentExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="contentExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in contentMenuItems" :key="item.to">
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

            <!-- Grupo Apariencia -->
            <li>
              <button
                @click="appearanceExpanded = !appearanceExpanded"
                :aria-expanded="appearanceExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isAppearanceActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-palette"></i>
                  <span>Apariencia</span>
                </div>
                <i :class="appearanceExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="appearanceExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in appearanceMenuItems" :key="item.to">
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
                :aria-expanded="billingExpanded"
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

            <!-- Grupo Configuración -->
            <li>
              <button
                @click="paymentGatewaysExpanded = !paymentGatewaysExpanded"
                :aria-expanded="paymentGatewaysExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isPaymentGatewaysActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-cog"></i>
                  <span>Configuración</span>
                </div>
                <i :class="paymentGatewaysExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="paymentGatewaysExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in paymentGatewaysMenuItems" :key="item.to">
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

            <!-- Grupo Reparto -->
            <li>
              <button
                @click="shippingExpanded = !shippingExpanded"
                :aria-expanded="shippingExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isShippingActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-truck"></i>
                  <span>Reparto</span>
                </div>
                <i :class="shippingExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="shippingExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in shippingMenuItems" :key="item.to">
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
                :aria-expanded="apiExpanded"
                class="w-full flex items-center justify-between px-4 py-3 rounded-lg hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isApiActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-code"></i>
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
                :aria-expanded="configExpanded"
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

            <!-- Grupo Tu Tienda -->
            <li>
              <button
                @click="storeExpanded = !storeExpanded"
                :aria-expanded="storeExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isStoreActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-shop"></i>
                  <span>Tu Tienda</span>
                </div>
                <i :class="storeExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="storeExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in storeMenuItems" :key="item.to">
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

            <!-- Grupo Ventas -->
            <li>
              <button
                @click="salesExpanded = !salesExpanded"
                :aria-expanded="salesExpanded"
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

            <!-- Grupo Reportes -->
            <li>
              <button
                @click="reportsExpanded = !reportsExpanded"
                :aria-expanded="reportsExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isReportsActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-chart-bar"></i>
                  <span>Reportes</span>
                </div>
                <i :class="reportsExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="reportsExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in reportsMenuItems" :key="item.to">
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
                :aria-expanded="catalogExpanded"
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
                :aria-expanded="marketingExpanded"
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

            <!-- Grupo Contenido -->
            <li>
              <button
                @click="contentExpanded = !contentExpanded"
                :aria-expanded="contentExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isContentActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-file-edit"></i>
                  <span>Contenido</span>
                </div>
                <i :class="contentExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="contentExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in contentMenuItems" :key="item.to">
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

            <!-- Grupo Apariencia (móvil) -->
            <li>
              <button
                @click="appearanceExpanded = !appearanceExpanded"
                :aria-expanded="appearanceExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isAppearanceActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-palette"></i>
                  <span>Apariencia</span>
                </div>
                <i :class="appearanceExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="appearanceExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in appearanceMenuItems" :key="item.to">
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
                :aria-expanded="billingExpanded"
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

            <!-- Grupo Configuración (móvil) -->
            <li>
              <button
                @click="paymentGatewaysExpanded = !paymentGatewaysExpanded"
                :aria-expanded="paymentGatewaysExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isPaymentGatewaysActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-cog"></i>
                  <span>Configuración</span>
                </div>
                <i :class="paymentGatewaysExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="paymentGatewaysExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in paymentGatewaysMenuItems" :key="item.to">
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

            <!-- Grupo Reparto (móvil) -->
            <li>
              <button
                @click="shippingExpanded = !shippingExpanded"
                :aria-expanded="shippingExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isShippingActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-truck"></i>
                  <span>Reparto</span>
                </div>
                <i :class="shippingExpanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-xs"></i>
              </button>

              <!-- Submenú -->
              <ul v-show="shippingExpanded" class="ml-4 mt-1 space-y-1">
                <li v-for="item in shippingMenuItems" :key="item.to">
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
                :aria-expanded="apiExpanded"
                class="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-secondary-600 hover:bg-primary-50 hover:text-primary transition-colors"
                :class="{ 'bg-primary-50 text-primary font-medium': isApiActive }"
              >
                <div class="flex items-center gap-3">
                  <i class="pi pi-code"></i>
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
                :aria-expanded="configExpanded"
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
const reportsExpandedRef = ref(false)
const catalogExpandedRef = ref(false)
const marketingExpandedRef = ref(false)
const billingExpandedRef = ref(false)
const paymentGatewaysExpandedRef = ref(false)
const apiExpandedRef = ref(false)
const configExpandedRef = ref(false)
const contentExpandedRef = ref(false)
const appearanceExpandedRef = ref(false)
const shippingExpandedRef = ref(false)
const storeExpandedRef = ref(false)

// Computar dinámicamente qué menú debe estar expandido según la ruta
const salesExpanded = computed({
  get: () => salesExpandedRef.value || route.path.startsWith('/orders') || route.path.startsWith('/reviews') || route.path.startsWith('/complaints') || route.path.includes('abandoned-carts'),
  set: (val) => { salesExpandedRef.value = val }
})

const reportsExpanded = computed({
  get: () => reportsExpandedRef.value || route.path.startsWith('/reports'),
  set: (val) => { reportsExpandedRef.value = val }
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

const paymentGatewaysExpanded = computed({
  get: () => paymentGatewaysExpandedRef.value || route.path.startsWith('/payment-gateways'),
  set: (val) => { paymentGatewaysExpandedRef.value = val }
})

const apiExpanded = computed({
  get: () => apiExpandedRef.value || route.path.startsWith('/api'),
  set: (val) => { apiExpandedRef.value = val }
})

const configExpanded = computed({
  get: () => configExpandedRef.value || route.path.startsWith('/configuracion'),
  set: (val) => { configExpandedRef.value = val }
})

const contentExpanded = computed({
  get: () => contentExpandedRef.value || route.path.startsWith('/pages') || route.path.startsWith('/blog') || route.path.startsWith('/content') || route.path.startsWith('/legal'),
  set: (val) => { contentExpandedRef.value = val }
})

const appearanceExpanded = computed({
  get: () => appearanceExpandedRef.value || route.path.startsWith('/appearance'),
  set: (val) => { appearanceExpandedRef.value = val }
})

const shippingExpanded = computed({
  get: () => shippingExpandedRef.value || route.path.startsWith('/shipping'),
  set: (val) => { shippingExpandedRef.value = val }
})

const storeExpanded = computed({
  get: () => storeExpandedRef.value || route.path.startsWith('/store'),
  set: (val) => { storeExpandedRef.value = val }
})

// Items simples del menú
const simpleMenuItems = [
  { label: 'Dashboard', icon: 'pi pi-home', to: '/dashboard' },
  { label: 'Clientes', icon: 'pi pi-users', to: '/customers' }
]

// Items del grupo Tu Tienda
const storeMenuItems = [
  { label: 'Información', icon: 'pi pi-info-circle', to: '/store/info' },
  { label: 'Direcciones', icon: 'pi pi-map-marker', to: '/store/addresses' }
]

// Items del grupo Contenido
const contentMenuItems = [
  { label: 'Páginas', icon: 'pi pi-file-edit', to: '/pages' },
  { label: 'Blog', icon: 'pi pi-pencil', to: '/blog' },
  { label: 'Legal', icon: 'pi pi-shield', to: '/legal' },
  { label: 'Imágenes', icon: 'pi pi-images', to: '/content/images' }
]

// Items del grupo Apariencia
const appearanceMenuItems = [
  { label: 'Menú', icon: 'pi pi-bars', to: '/appearance/menu' }
]

// Items del grupo Ventas
const salesMenuItems = [
  { label: 'Pedidos', icon: 'pi pi-shopping-cart', to: '/orders' },
  { label: 'Opiniones', icon: 'pi pi-star', to: '/reviews' },
  { label: 'Reclamaciones', icon: 'pi pi-book', to: '/complaints' },
  { label: 'Carritos Abandonados', icon: 'pi pi-shopping-bag', to: '/marketing/abandoned-carts' }
]

// Items del grupo Reportes
const reportsMenuItems = [
  { label: 'Pedidos', icon: 'pi pi-shopping-cart', to: '/reports/orders' },
  { label: 'Ventas por Producto', icon: 'pi pi-box', to: '/reports/product-sales' },
  { label: 'Catálogo de Productos', icon: 'pi pi-list', to: '/reports/product-catalog' },
  { label: 'Promociones', icon: 'pi pi-percentage', to: '/reports/promotions' }
]

// Items del grupo Catálogo
const catalogMenuItems = [
  { label: 'Productos', icon: 'pi pi-box', to: '/products' },
  { label: 'Categorías', icon: 'pi pi-folder', to: '/catalog/categories' },
  { label: 'Marcas', icon: 'pi pi-tag', to: '/catalog/brands' },
  { label: 'Gammas', icon: 'pi pi-sitemap', to: '/catalog/gammas' },
  { label: 'Listas', icon: 'pi pi-list', to: '/catalog/product-lists' },
  { label: 'Etiquetas', icon: 'pi pi-bookmark', to: '/catalog/product-tags' }
]

// Items del grupo Marketing
const marketingMenuItems = [
  { label: 'Promociones', icon: 'pi pi-percentage', to: '/marketing/promotions' },
  { label: 'Upsales', icon: 'pi pi-arrow-up', to: '/marketing/upsales' },
  { label: 'Combos', icon: 'pi pi-box', to: '/marketing/combos' },
  { label: 'Barras de Anuncios', icon: 'pi pi-megaphone', to: '/marketing/announcement-bars' },
  { label: 'Referidos', icon: 'pi pi-users', to: '/marketing/referrals' }
]

// Items del grupo Facturación
const billingMenuItems = [
  { label: 'Proveedores', icon: 'pi pi-building', to: '/billing/providers' },
  { label: 'Documentos', icon: 'pi pi-file', to: '/billing/documents' }
]

// Items del grupo Reparto
const shippingMenuItems = [
  { label: 'Tarifas de Envío', icon: 'pi pi-money-bill', to: '/shipping/rates' },
  { label: 'Zonas de Reparto', icon: 'pi pi-map', to: '/shipping/zones' },
  { label: 'Proveedores', icon: 'pi pi-truck', to: '/shipping/couriers' }
]

// Items del grupo Formas de Pago
const paymentGatewaysMenuItems = [
  { label: 'Formas de Pago', icon: 'pi pi-credit-card', to: '/payment-gateways' }
]

// Items del grupo API
const apiMenuItems = [
  { label: 'Credenciales', icon: 'pi pi-key', to: '/api/credentials' },
  { label: 'Webhooks', icon: 'pi pi-link', to: '/api/webhooks' }
]

// Items del grupo NetSuite
const configMenuItems = [
  { label: 'Configuración', icon: 'pi pi-cog', to: '/configuracion/netsuite' },
  { label: 'Stock', icon: 'pi pi-box', to: '/configuracion/netsuite/stock' },
  { label: 'Cola de Sincronización', icon: 'pi pi-list', to: '/configuracion/netsuite/cola' }
]

// Detectar si estamos en alguna ruta de Tu Tienda
const isStoreActive = computed(() => {
  return route.path.startsWith('/store')
})

// Detectar si estamos en alguna ruta de reparto
const isShippingActive = computed(() => {
  return route.path.startsWith('/shipping')
})

// Detectar si estamos en alguna ruta de contenido
const isContentActive = computed(() => {
  return route.path.startsWith('/pages') || route.path.startsWith('/blog') || route.path.startsWith('/content') || route.path.startsWith('/legal')
})

// Detectar si estamos en alguna ruta de apariencia
const isAppearanceActive = computed(() => {
  return route.path.startsWith('/appearance')
})

// Detectar si estamos en alguna ruta de ventas
const isSalesActive = computed(() => {
  return route.path.startsWith('/orders') || route.path.startsWith('/reviews') || route.path.startsWith('/complaints') || route.path.includes('abandoned-carts')
})

// Detectar si estamos en alguna ruta de reportes
const isReportsActive = computed(() => {
  return route.path.startsWith('/reports')
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

// Detectar si estamos en alguna ruta de formas de pago
const isPaymentGatewaysActive = computed(() => {
  return route.path.startsWith('/payment-gateways')
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
      router.push('/profile')
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
