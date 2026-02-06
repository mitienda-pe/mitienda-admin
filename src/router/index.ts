import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

// Layouts
import AuthLayout from '@/layouts/AuthLayout.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'

// Auth Views
import LoginView from '@/views/auth/LoginView.vue'
import StoreSelectionView from '@/views/auth/StoreSelectionView.vue'

// Dashboard Views
import DashboardView from '@/views/dashboard/DashboardView.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'Login',
        component: LoginView,
        meta: { requiresAuth: false }
      }
    ]
  },
  {
    path: '/store-selection',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'StoreSelection',
        component: StoreSelectionView,
        meta: { requiresAuth: true, requiresStore: false }
      }
    ]
  },
  {
    path: '/dashboard',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: DashboardView
      }
    ]
  },
  {
    path: '/products',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: '',
        name: 'Products',
        component: () => import('@/views/products/ProductsListView.vue')
      },
      {
        path: ':id',
        name: 'ProductDetail',
        component: () => import('@/views/products/ProductDetailView.vue')
      }
    ]
  },
  {
    path: '/orders',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: '',
        name: 'Orders',
        component: () => import('@/views/orders/OrdersListView.vue')
      },
      {
        path: ':id',
        name: 'OrderDetail',
        component: () => import('@/views/orders/OrderDetailView.vue')
      }
    ]
  },
  {
    path: '/customers',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: '',
        name: 'Customers',
        component: () => import('@/views/customers/CustomersListView.vue')
      },
      {
        path: ':id',
        name: 'CustomerDetail',
        component: () => import('@/views/customers/CustomerDetailView.vue')
      }
    ]
  },
  {
    path: '/reviews',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: '',
        name: 'Reviews',
        component: () => import('@/views/reviews/ReviewsListView.vue')
      }
    ]
  },
  {
    path: '/reports',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: 'orders',
        name: 'OrdersReport',
        component: () => import('@/views/reports/OrdersReportView.vue')
      },
      {
        path: 'product-sales',
        name: 'ProductSalesReport',
        component: () => import('@/views/reports/ProductSalesReportView.vue')
      },
      {
        path: 'product-catalog',
        name: 'ProductCatalogReport',
        component: () => import('@/views/reports/ProductCatalogReportView.vue')
      },
      {
        path: 'promotions',
        name: 'PromotionsReport',
        component: () => import('@/views/reports/PromotionsReportView.vue')
      }
    ]
  },
  {
    path: '/catalog',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: 'categories',
        name: 'categories-list',
        component: () => import('@/views/catalog/CategoriesListView.vue')
      },
      {
        path: 'categories/new',
        name: 'category-create',
        component: () => import('@/views/catalog/CategoryFormView.vue')
      },
      {
        path: 'categories/:id/edit',
        name: 'category-edit',
        component: () => import('@/views/catalog/CategoryFormView.vue')
      },
      {
        path: 'brands',
        name: 'brands-list',
        component: () => import('@/views/catalog/BrandsListView.vue')
      },
      {
        path: 'brands/new',
        name: 'brand-create',
        component: () => import('@/views/catalog/BrandFormView.vue')
      },
      {
        path: 'brands/:id/edit',
        name: 'brand-edit',
        component: () => import('@/views/catalog/BrandFormView.vue')
      },
      {
        path: 'product-tags',
        name: 'ProductTags',
        component: () => import('@/views/catalog/ProductTagsListView.vue')
      },
      {
        path: 'product-tags/:id',
        name: 'ProductTagForm',
        component: () => import('@/views/catalog/ProductTagFormView.vue')
      },
      {
        path: 'gammas',
        name: 'gammas-list',
        component: () => import('@/views/catalog/GammasListView.vue')
      },
      {
        path: 'gammas/new',
        name: 'gamma-create',
        component: () => import('@/views/catalog/GammaFormView.vue')
      },
      {
        path: 'gammas/:id/edit',
        name: 'gamma-edit',
        component: () => import('@/views/catalog/GammaFormView.vue')
      },
      {
        path: 'product-lists',
        name: 'product-lists',
        component: () => import('@/views/catalog/ProductListsView.vue')
      },
      {
        path: 'product-lists/new',
        name: 'product-list-create',
        component: () => import('@/views/catalog/ProductListFormView.vue')
      },
      {
        path: 'product-lists/:id/edit',
        name: 'product-list-edit',
        component: () => import('@/views/catalog/ProductListFormView.vue')
      }
    ]
  },
  {
    path: '/pages',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: '',
        name: 'pages-list',
        component: () => import('@/views/pages/PagesListView.vue')
      },
      {
        path: 'new',
        name: 'page-create',
        component: () => import('@/views/pages/PageCreateView.vue')
      },
      {
        path: ':id/edit',
        name: 'page-edit',
        component: () => import('@/views/pages/PageEditView.vue')
      },
      {
        path: ':id/preview',
        name: 'page-preview',
        component: () => import('@/views/pages/PagePreviewView.vue')
      }
    ]
  },
  {
    path: '/blog',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: '',
        name: 'blog-posts-list',
        component: () => import('@/views/blog/BlogPostsListView.vue')
      },
      {
        path: 'new',
        name: 'blog-post-create',
        component: () => import('@/views/blog/BlogPostCreateView.vue')
      },
      {
        path: ':id/edit',
        name: 'blog-post-edit',
        component: () => import('@/views/blog/BlogPostEditView.vue')
      },
      {
        path: ':id/preview',
        name: 'blog-post-preview',
        component: () => import('@/views/blog/BlogPostPreviewView.vue')
      },
      {
        path: 'categories',
        name: 'blog-categories',
        component: () => import('@/views/blog/BlogCategoriesView.vue')
      }
    ]
  },
  {
    path: '/content',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: 'images',
        name: 'image-gallery',
        component: () => import('@/views/content/ImageGalleryView.vue')
      }
    ]
  },
  {
    path: '/legal',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: '',
        name: 'legal-pages',
        component: () => import('@/views/legal/LegalPagesListView.vue')
      },
      {
        path: ':slug/edit',
        name: 'legal-page-edit',
        component: () => import('@/views/legal/LegalPageEditView.vue')
      }
    ]
  },
  {
    path: '/marketing',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: 'announcement-bars',
        name: 'AnnouncementBars',
        component: () => import('@/views/marketing/AnnouncementBarsListView.vue')
      },
      {
        path: 'announcement-bars/:id',
        name: 'AnnouncementBarForm',
        component: () => import('@/views/marketing/AnnouncementBarFormView.vue')
      },
      {
        path: 'promotions',
        name: 'Promotions',
        component: () => import('@/views/marketing/PromotionsListView.vue')
      },
      {
        path: 'promotions/:id',
        name: 'PromotionDetail',
        component: () => import('@/views/marketing/PromotionDetailView.vue')
      },
      {
        path: 'promotions/:id/configure',
        name: 'ConfigureBonification',
        component: () => import('@/views/marketing/ConfigureBonificationView.vue')
      },
      {
        path: 'promotions/:id/configure-discount',
        name: 'ConfigureDiscountedPrice',
        component: () => import('@/views/marketing/ConfigureDiscountedPriceView.vue')
      },
      {
        path: 'abandoned-carts',
        name: 'AbandonedCarts',
        component: () => import('@/views/abandoned-carts/AbandonedCartsListView.vue')
      },
      {
        path: 'referrals',
        name: 'Referrals',
        component: () => import('@/views/marketing/referrals/ReferralsView.vue')
      },
      {
        path: 'upsales',
        name: 'marketing-upsales',
        component: () => import('@/views/marketing/upsales/UpsalesView.vue')
      },
      {
        path: 'upsales/new',
        name: 'marketing-upsale-create',
        component: () => import('@/views/marketing/upsales/UpsaleFormView.vue')
      },
      {
        path: 'upsales/:id/edit',
        name: 'marketing-upsale-edit',
        component: () => import('@/views/marketing/upsales/UpsaleFormView.vue')
      },
      {
        path: 'combos',
        name: 'marketing-combos',
        component: () => import('@/views/marketing/combos/CombosView.vue')
      },
      {
        path: 'combos/new',
        name: 'marketing-combo-create',
        component: () => import('@/views/marketing/combos/ComboFormView.vue')
      },
      {
        path: 'combos/:id/edit',
        name: 'marketing-combo-edit',
        component: () => import('@/views/marketing/combos/ComboFormView.vue')
      }
    ]
  },
  {
    path: '/billing',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: 'providers',
        name: 'BillingProviders',
        component: () => import('@/views/billing/ProvidersListView.vue')
      },
      {
        path: 'providers/:id',
        name: 'BillingProviderConfig',
        component: () => import('@/views/billing/ProviderConfigView.vue')
      },
      {
        path: 'documents',
        name: 'BillingDocuments',
        component: () => import('@/views/billing/DocumentsListView.vue')
      },
      {
        path: 'documents/:id',
        name: 'BillingDocumentDetail',
        component: () => import('@/views/billing/DocumentDetailView.vue')
      },
      {
        path: 'manual/emit',
        name: 'BillingManualEmit',
        component: () => import('@/views/billing/ManualEmitView.vue')
      }
    ]
  },
  {
    path: '/payment-gateways',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: '',
        name: 'PaymentGateways',
        component: () => import('@/views/payment-gateways/ProvidersListView.vue')
      },
      {
        path: ':code',
        name: 'PaymentGatewayConfig',
        component: () => import('@/views/payment-gateways/ProviderConfigView.vue')
      }
    ]
  },
  {
    path: '/shipping',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: 'rates',
        name: 'ShippingRates',
        component: () => import('@/views/shipping/ShippingRatesView.vue')
      },
      {
        path: 'zones',
        name: 'shipping-zones',
        component: () => import('@/views/shipping/ShippingZonesListView.vue')
      },
      {
        path: 'zones/new',
        name: 'shipping-zone-create',
        component: () => import('@/views/shipping/ShippingZoneCreateView.vue')
      },
      {
        path: 'zones/:id',
        name: 'shipping-zone-detail',
        component: () => import('@/views/shipping/ShippingZoneDetailView.vue')
      },
      {
        path: 'couriers',
        name: 'courier-providers',
        component: () => import('@/views/shipping/CourierProvidersListView.vue')
      },
      {
        path: 'couriers/:code',
        name: 'courier-provider-config',
        component: () => import('@/views/shipping/CourierProviderConfigView.vue')
      }
    ]
  },
  {
    path: '/store',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: 'info',
        name: 'store-info',
        component: () => import('@/views/store/StoreInfoView.vue')
      },
      {
        path: 'addresses',
        name: 'store-addresses',
        component: () => import('@/views/store/StoreAddressesView.vue')
      },
      {
        path: 'addresses/new',
        name: 'store-address-create',
        component: () => import('@/views/store/StoreAddressFormView.vue')
      },
      {
        path: 'addresses/:id/edit',
        name: 'store-address-edit',
        component: () => import('@/views/store/StoreAddressFormView.vue')
      }
    ]
  },
  {
    path: '/profile',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Profile',
        component: () => import('@/views/profile/ProfileView.vue')
      },
      {
        path: 'oauth/callback',
        name: 'OAuthCallback',
        component: () => import('@/views/profile/OAuthCallbackView.vue')
      }
    ]
  },
  {
    path: '/api',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: 'credentials',
        name: 'ApiCredentials',
        component: () => import('@/views/api/CredentialsView.vue')
      },
      {
        path: 'webhooks',
        name: 'ApiWebhooks',
        component: () => import('@/views/api/WebhooksView.vue')
      }
    ]
  },
  {
    path: '/configuracion',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: 'netsuite',
        name: 'NetsuiteConfig',
        component: () => import('@/views/configuracion/NetsuiteConfigView.vue')
      },
      {
        path: 'netsuite/inventario',
        name: 'NetsuiteInventoryMap',
        component: () => import('@/views/configuracion/NetsuiteInventoryMapView.vue')
      },
      {
        path: 'netsuite/cola',
        name: 'NetsuiteQueue',
        component: () => import('@/views/configuracion/NetsuiteQueueView.vue')
      },
      {
        path: 'netsuite/stock',
        name: 'NetsuiteStock',
        component: () => import('@/views/configuracion/NetsuiteStockView.vue')
      }
    ]
  },
  {
    path: '/admin',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresSuperAdmin: true },
    children: [
      {
        path: 'stores',
        name: 'AdminStores',
        component: () => import('@/views/admin/StoresListView.vue')
      },
      {
        path: 's3-migration',
        name: 'AdminS3Migration',
        component: () => import('@/views/admin/S3MigrationView.vue')
      }
    ]
  },
  {
    path: '/debug/superadmin',
    name: 'SuperAdminDebug',
    component: () => import('@/views/debug/SuperAdminDebug.vue'),
    meta: { requiresAuth: true, requiresSuperAdmin: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation Guard
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Restaurar sesión si existe
  if (!authStore.isAuthenticated) {
    authStore.restoreSession()
  }

  // Restaurar admin store también (para verificar impersonación)
  const { useAdminStore } = await import('@/stores/admin.store')
  const adminStore = useAdminStore()
  adminStore.restoreSession()

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)
  const requiresStore = to.matched.some(record => record.meta.requiresStore === true)
  const requiresSuperAdmin = to.matched.some(record => record.meta.requiresSuperAdmin === true)
  const isImpersonating = adminStore.isImpersonating

  // Si la ruta requiere autenticación y no está autenticado
  if (requiresAuth && !authStore.isAuthenticated) {
    if (to.path !== '/login') {
      next('/login')
      return
    }
  }

  // Si ya está autenticado e intenta ir al login
  if (to.path === '/login' && authStore.isAuthenticated) {
    // Si es superadmin sin tienda, ir a admin/stores
    if (authStore.isSuperAdmin && !authStore.selectedStore && !isImpersonating) {
      next('/admin/stores')
      return
    }
    next('/dashboard')
    return
  }

  // Si la ruta requiere superadmin
  if (requiresSuperAdmin && !authStore.isSuperAdmin) {
    console.warn('Acceso denegado: Se requiere ser superadministrador')
    next('/dashboard')
    return
  }

  // Si la ruta requiere tienda seleccionada
  if (requiresStore && !requiresSuperAdmin) {
    // Permitir acceso si está impersonando (tiene selectedStore por impersonación)
    // O si tiene selectedStore normal
    if (!authStore.selectedStore && !isImpersonating) {
      if (to.path !== '/store-selection') {
        next('/store-selection')
        return
      }
    }
  }

  // Si está en store-selection pero ya tiene tienda seleccionada
  if (to.path === '/store-selection' && authStore.selectedStore) {
    next('/dashboard')
    return
  }

  next()
})

export default router
