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
    path: '/catalog',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/catalog/CategoriesListView.vue')
      },
      {
        path: 'brands',
        name: 'Brands',
        component: () => import('@/views/catalog/BrandsListView.vue')
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
      }
    ]
  },
  {
    path: '/debug/superadmin',
    name: 'SuperAdminDebug',
    component: () => import('@/views/debug/SuperAdminDebug.vue'),
    meta: { requiresAuth: true }
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
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  // Restaurar sesión si existe
  if (!authStore.isAuthenticated) {
    authStore.restoreSession()
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)
  const requiresStore = to.matched.some(record => record.meta.requiresStore === true)
  const requiresSuperAdmin = to.matched.some(record => record.meta.requiresSuperAdmin === true)

  // Si la ruta requiere autenticación y no está autenticado
  if (requiresAuth && !authStore.isAuthenticated) {
    if (to.path !== '/login') {
      next('/login')
      return
    }
  }

  // Si ya está autenticado e intenta ir al login
  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
    return
  }

  // Si la ruta requiere superadmin
  if (requiresSuperAdmin && !authStore.isSuperAdmin) {
    console.warn('Acceso denegado: Se requiere ser superadministrador')
    next('/dashboard')
    return
  }

  // Si la ruta requiere tienda seleccionada (no aplica para rutas de admin)
  if (requiresStore && !requiresSuperAdmin && !authStore.selectedStore) {
    if (to.path !== '/store-selection') {
      next('/store-selection')
      return
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
