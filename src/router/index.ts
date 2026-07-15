import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { brand } from '@/config/branding'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    requiresStore?: boolean
    requiresSuperAdmin?: boolean
    mode?: string
  }
}

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
        meta: { requiresAuth: false, title: 'Iniciar sesión' }
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
        meta: { requiresAuth: true, requiresStore: false, title: 'Seleccionar tienda' }
      }
    ]
  },
  {
    path: '/auth/magic',
    // No layout wrapper — MagicLoginView is full-page and handles its own UI
    component: () => import('@/views/auth/MagicLoginView.vue'),
    name: 'MagicLogin',
    meta: { requiresAuth: false, title: 'Acceso con enlace' }
  },
  {
    path: '/forgot-password',
    component: AuthLayout,
    meta: { requiresAuth: false },
    children: [
      {
        path: '',
        name: 'ForgotPassword',
        component: () => import('@/views/auth/ForgotPasswordView.vue'),
        meta: { requiresAuth: false, title: 'Recuperar contraseña' }
      }
    ]
  },
  {
    path: '/reset-password',
    component: AuthLayout,
    meta: { requiresAuth: false },
    children: [
      {
        path: '',
        name: 'ResetPassword',
        component: () => import('@/views/auth/ResetPasswordView.vue'),
        meta: { requiresAuth: false, title: 'Restablecer contraseña' }
      }
    ]
  },
  {
    path: '/my-stores',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: false },
    children: [
      {
        path: '',
        name: 'MyStores',
        meta: { title: 'Mis tiendas' },
        component: () => import('@/views/store/MyStoresView.vue')
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
        meta: { title: 'Dashboard' },
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
        meta: { title: 'Productos' },
        component: () => import('@/views/products/ProductsListView.vue')
      },
      {
        path: 'create',
        name: 'ProductCreate',
        meta: { title: 'Nuevo producto' },
        component: () => import('@/views/products/ProductCreateView.vue')
      },
      {
        path: 'prices',
        name: 'ProductPrices',
        meta: { title: 'Precios' },
        component: () => import('@/views/products/ProductPricesView.vue')
      },
      {
        path: 'stock',
        name: 'ProductStock',
        meta: { title: 'Stock' },
        component: () => import('@/views/products/ProductStockView.vue')
      },
      {
        path: 'order',
        name: 'ProductOrder',
        meta: { title: 'Orden de productos' },
        component: () => import('@/views/products/ProductOrderView.vue')
      },
      {
        path: 'bulk-import',
        name: 'ProductBulkImport',
        meta: { title: 'Importación masiva' },
        component: () => import('@/views/products/ProductBulkImportView.vue')
      },
      {
        path: ':id',
        name: 'ProductDetail',
        meta: { title: 'Detalle de producto' },
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
        meta: { title: 'Pedidos' },
        component: () => import('@/views/orders/OrdersListView.vue')
      },
      {
        path: ':id',
        name: 'OrderDetail',
        meta: { title: 'Detalle de pedido' },
        component: () => import('@/views/orders/OrderDetailView.vue')
      }
    ]
  },
  {
    path: '/dispatch',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: '',
        name: 'Dispatch',
        meta: { title: 'Despacho' },
        component: () => import('@/views/dispatch/DispatchListView.vue')
      },
      {
        path: ':id',
        name: 'DispatchDetail',
        meta: { title: 'Detalle de despacho' },
        component: () => import('@/views/dispatch/DispatchDetailView.vue')
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
        meta: { title: 'Clientes' },
        component: () => import('@/views/customers/CustomersListView.vue')
      },
      {
        path: 'create',
        name: 'CustomerCreate',
        meta: { title: 'Nuevo cliente' },
        component: () => import('@/views/customers/CustomerFormView.vue')
      },
      {
        path: ':id',
        name: 'CustomerDetail',
        meta: { title: 'Detalle de cliente' },
        component: () => import('@/views/customers/CustomerDetailView.vue')
      },
      {
        path: ':id/edit',
        name: 'CustomerEdit',
        meta: { title: 'Editar cliente' },
        component: () => import('@/views/customers/CustomerFormView.vue')
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
        meta: { title: 'Opiniones' },
        component: () => import('@/views/reviews/ReviewsListView.vue')
      }
    ]
  },
  {
    path: '/complaints',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: '',
        name: 'Complaints',
        meta: { title: 'Reclamaciones' },
        component: () => import('@/views/complaints/ComplaintsListView.vue')
      },
      {
        path: ':id',
        name: 'ComplaintDetail',
        meta: { title: 'Detalle de reclamación' },
        component: () => import('@/views/complaints/ComplaintDetailView.vue')
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
        meta: { title: 'Reporte de pedidos' },
        component: () => import('@/views/reports/OrdersReportView.vue')
      },
      {
        path: 'product-sales',
        name: 'ProductSalesReport',
        meta: { title: 'Ventas por producto' },
        component: () => import('@/views/reports/ProductSalesReportView.vue')
      },
      {
        path: 'product-catalog',
        name: 'ProductCatalogReport',
        meta: { title: 'Catálogo de productos' },
        component: () => import('@/views/reports/ProductCatalogReportView.vue')
      },
      {
        path: 'promotions',
        name: 'PromotionsReport',
        meta: { title: 'Reporte de promociones' },
        component: () => import('@/views/reports/PromotionsReportView.vue')
      },
      {
        path: 'payment-rejections',
        name: 'PaymentRejectionsReport',
        meta: { title: 'Rechazos de pago' },
        component: () => import('@/views/reports/PaymentRejectionsReportView.vue')
      },
      {
        path: 'rounding',
        name: 'RoundingReport',
        meta: { title: 'Redondeo POS' },
        component: () => import('@/views/reports/RoundingReportView.vue')
      },
      {
        path: 'web-analytics',
        name: 'WebAnalytics',
        meta: { title: 'Analítica web' },
        component: () => import('@/views/reports/WebAnalyticsView.vue')
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
        meta: { title: 'Categorías' },
        component: () => import('@/views/catalog/CategoriesListView.vue')
      },
      {
        path: 'categories/new',
        name: 'category-create',
        meta: { title: 'Nueva categoría' },
        component: () => import('@/views/catalog/CategoryFormView.vue')
      },
      {
        path: 'categories/:id/edit',
        name: 'category-edit',
        meta: { title: 'Editar categoría' },
        component: () => import('@/views/catalog/CategoryFormView.vue')
      },
      {
        path: 'brands',
        name: 'brands-list',
        meta: { title: 'Marcas' },
        component: () => import('@/views/catalog/BrandsListView.vue')
      },
      {
        path: 'brands/new',
        name: 'brand-create',
        meta: { title: 'Nueva marca' },
        component: () => import('@/views/catalog/BrandFormView.vue')
      },
      {
        path: 'brands/:id/edit',
        name: 'brand-edit',
        meta: { title: 'Editar marca' },
        component: () => import('@/views/catalog/BrandFormView.vue')
      },
      {
        path: 'product-tags',
        name: 'ProductTags',
        meta: { title: 'Etiquetas' },
        component: () => import('@/views/catalog/ProductTagsListView.vue')
      },
      {
        path: 'product-tags/:id',
        name: 'ProductTagForm',
        meta: { title: 'Etiqueta de producto' },
        component: () => import('@/views/catalog/ProductTagFormView.vue')
      },
      {
        path: 'gammas',
        name: 'gammas-list',
        meta: { title: 'Gammas' },
        component: () => import('@/views/catalog/GammasListView.vue')
      },
      {
        path: 'gammas/new',
        name: 'gamma-create',
        meta: { title: 'Nueva gamma' },
        component: () => import('@/views/catalog/GammaFormView.vue')
      },
      {
        path: 'gammas/:id/edit',
        name: 'gamma-edit',
        meta: { title: 'Editar gamma' },
        component: () => import('@/views/catalog/GammaFormView.vue')
      },
      {
        path: 'product-lists',
        name: 'product-lists',
        meta: { title: 'Listas de productos' },
        component: () => import('@/views/catalog/ProductListsView.vue')
      },
      {
        path: 'product-lists/new',
        name: 'product-list-create',
        meta: { title: 'Nueva lista' },
        component: () => import('@/views/catalog/ProductListFormView.vue')
      },
      {
        path: 'product-lists/:id/edit',
        name: 'product-list-edit',
        meta: { title: 'Editar lista' },
        component: () => import('@/views/catalog/ProductListFormView.vue')
      },
      {
        path: 'config',
        name: 'catalog-config',
        meta: { title: 'Configuración de catálogo' },
        component: () => import('@/views/catalog/CatalogConfigView.vue')
      },
      {
        path: 'attributes',
        name: 'attributes-list',
        meta: { title: 'Atributos' },
        component: () => import('@/views/catalog/AttributesListView.vue')
      },
      {
        path: 'attributes/:id',
        name: 'attribute-detail',
        meta: { title: 'Detalle de atributo' },
        component: () => import('@/views/catalog/AttributeDetailView.vue')
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
        meta: { title: 'Páginas' },
        component: () => import('@/views/pages/PagesListView.vue')
      },
      {
        path: 'new',
        name: 'page-create',
        meta: { title: 'Nueva página' },
        component: () => import('@/views/pages/PageCreateView.vue')
      },
      {
        path: ':id/edit',
        name: 'page-edit',
        meta: { title: 'Editar página' },
        component: () => import('@/views/pages/PageEditView.vue')
      },
      {
        path: ':id/preview',
        name: 'page-preview',
        meta: { title: 'Vista previa de página' },
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
        meta: { title: 'Blog' },
        component: () => import('@/views/blog/BlogPostsListView.vue')
      },
      {
        path: 'new',
        name: 'blog-post-create',
        meta: { title: 'Nuevo artículo' },
        component: () => import('@/views/blog/BlogPostCreateView.vue')
      },
      {
        path: ':id/edit',
        name: 'blog-post-edit',
        meta: { title: 'Editar artículo' },
        component: () => import('@/views/blog/BlogPostEditView.vue')
      },
      {
        path: ':id/preview',
        name: 'blog-post-preview',
        meta: { title: 'Vista previa de artículo' },
        component: () => import('@/views/blog/BlogPostPreviewView.vue')
      },
      {
        path: 'categories',
        name: 'blog-categories',
        meta: { title: 'Categorías del blog' },
        component: () => import('@/views/blog/BlogCategoriesView.vue')
      },
      {
        path: 'authors',
        name: 'blog-authors',
        meta: { title: 'Autores del blog' },
        component: () => import('@/views/blog/BlogAuthorsView.vue')
      }
    ]
  },
  {
    path: '/content',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: 'carousel',
        name: 'content-carousel',
        meta: { title: 'Carrusel' },
        component: () => import('@/views/content/CarouselView.vue')
      },
      {
        path: 'images',
        name: 'image-gallery',
        meta: { title: 'Imágenes' },
        component: () => import('@/views/content/ImageGalleryView.vue')
      },
      {
        path: 'messages',
        name: 'content-messages',
        meta: { title: 'Mensajes' },
        component: () => import('@/views/content/MessagesView.vue')
      },
      {
        path: 'components',
        name: 'content-components',
        meta: { title: 'Bloques de plantilla' },
        component: () => import('@/views/content/ComponentsListView.vue')
      },
      {
        path: 'components/:id/edit',
        name: 'component-edit',
        meta: { title: 'Editar bloque' },
        component: () => import('@/views/content/ComponentEditView.vue')
      },
      {
        path: 'template',
        name: 'content-template',
        meta: { title: 'Plantilla' },
        component: () => import('@/views/content/TemplateBuilderView.vue')
      }
    ]
  },
  {
    path: '/appearance',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: 'config',
        name: 'appearance-config',
        meta: { title: 'Configuración de apariencia' },
        component: () => import('@/views/appearance/AppearanceConfigView.vue')
      },
      {
        path: 'colors',
        name: 'appearance-colors',
        meta: { title: 'Colores' },
        component: () => import('@/views/appearance/ColorsView.vue')
      },
      {
        path: 'colors/presets',
        name: 'appearance-colors-presets',
        meta: { title: 'Presets de colores' },
        component: () => import('@/views/appearance/ColorsPresetsView.vue')
      },
      {
        path: 'typography',
        name: 'appearance-typography',
        meta: { title: 'Tipografía' },
        component: () => import('@/views/appearance/TypographyView.vue')
      },
      {
        path: 'typography/presets',
        name: 'appearance-typography-presets',
        meta: { title: 'Presets de tipografía' },
        component: () => import('@/views/appearance/FontPresetsView.vue')
      },
      {
        path: 'product-card',
        name: 'appearance-product-card',
        meta: { title: 'Viñeta de producto' },
        component: () => import('@/views/appearance/ProductCardView.vue')
      },
      {
        path: 'menu',
        name: 'appearance-menu',
        meta: { title: 'Menú' },
        component: () => import('@/views/appearance/MenuView.vue')
      },
      {
        path: 'css',
        name: 'appearance-css',
        meta: { title: 'CSS personalizado' },
        component: () => import('@/views/appearance/AppearanceCssView.vue')
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
        meta: { title: 'Legal' },
        component: () => import('@/views/legal/LegalPagesListView.vue')
      },
      {
        path: ':slug/edit',
        name: 'legal-page-edit',
        meta: { title: 'Editar página legal' },
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
        meta: { title: 'Barras de anuncios' },
        component: () => import('@/views/marketing/AnnouncementBarsListView.vue')
      },
      {
        path: 'announcement-bars/:id',
        name: 'AnnouncementBarForm',
        meta: { title: 'Editar barra de anuncios' },
        component: () => import('@/views/marketing/AnnouncementBarFormView.vue')
      },
      {
        path: 'promotions',
        name: 'Promotions',
        meta: { title: 'Promociones' },
        component: () => import('@/views/marketing/PromotionsListView.vue')
      },
      {
        path: 'promotions/:id',
        name: 'PromotionDetail',
        meta: { title: 'Detalle de promoción' },
        component: () => import('@/views/marketing/PromotionDetailView.vue')
      },
      {
        path: 'promotions/:id/configure',
        name: 'ConfigureBonification',
        meta: { title: 'Configurar bonificación' },
        component: () => import('@/views/marketing/ConfigureBonificationView.vue')
      },
      {
        path: 'promotions/:id/configure-discount',
        name: 'ConfigureDiscountedPrice',
        meta: { title: 'Configurar precio rebajado' },
        component: () => import('@/views/marketing/ConfigureDiscountedPriceView.vue')
      },
      {
        path: 'promotions-v2',
        name: 'PromotionsV2',
        meta: { mode: 'promotion', title: 'Promociones avanzadas' },
        component: () => import('@/views/marketing/promotions-v2/PromotionsV2ListView.vue')
      },
      {
        path: 'promotions-v2/new',
        name: 'PromotionV2Create',
        meta: { mode: 'promotion', title: 'Nueva promoción' },
        component: () => import('@/views/marketing/promotions-v2/PromotionV2CreateView.vue')
      },
      {
        path: 'promotions-v2/:id',
        name: 'PromotionV2Detail',
        meta: { mode: 'promotion', title: 'Detalle de promoción avanzada' },
        component: () => import('@/views/marketing/promotions-v2/PromotionV2DetailView.vue')
      },
      // /marketing/coupons: subset de V2 con activation_type=coupon, gateado a mod_cupones (Small+).
      // Reusa los mismos componentes V2; el modo se setea desde route.meta.
      {
        path: 'coupons',
        name: 'CouponsList',
        meta: { mode: 'coupon', title: 'Cupones' },
        component: () => import('@/views/marketing/promotions-v2/PromotionsV2ListView.vue')
      },
      {
        path: 'coupons/new',
        name: 'CouponCreate',
        meta: { mode: 'coupon', title: 'Nuevo cupón' },
        component: () => import('@/views/marketing/promotions-v2/PromotionV2CreateView.vue')
      },
      {
        path: 'coupons/:id',
        name: 'CouponDetail',
        meta: { mode: 'coupon', title: 'Detalle de cupón' },
        component: () => import('@/views/marketing/promotions-v2/PromotionV2DetailView.vue')
      },
      {
        path: 'abandoned-carts',
        name: 'AbandonedCarts',
        meta: { title: 'Carritos abandonados' },
        component: () => import('@/views/abandoned-carts/AbandonedCartsListView.vue')
      },
      {
        path: 'cart-recovery',
        name: 'CartRecoveryConfig',
        meta: { title: 'Recuperación de carritos' },
        component: () => import('@/views/marketing/CartRecoveryConfigView.vue')
      },
      {
        path: 'referrals',
        name: 'Referrals',
        meta: { title: 'Referidos' },
        component: () => import('@/views/marketing/referrals/ReferralsView.vue')
      },
      {
        path: 'upsales',
        name: 'marketing-upsales',
        meta: { title: 'Upsales' },
        component: () => import('@/views/marketing/upsales/UpsalesView.vue')
      },
      {
        path: 'upsales/new',
        name: 'marketing-upsale-create',
        meta: { title: 'Nuevo upsale' },
        component: () => import('@/views/marketing/upsales/UpsaleFormView.vue')
      },
      {
        path: 'upsales/:id/edit',
        name: 'marketing-upsale-edit',
        meta: { title: 'Editar upsale' },
        component: () => import('@/views/marketing/upsales/UpsaleFormView.vue')
      },
      {
        path: 'combos',
        name: 'marketing-combos',
        meta: { title: 'Combos' },
        component: () => import('@/views/marketing/combos/CombosView.vue')
      },
      {
        path: 'combos/new',
        name: 'marketing-combo-create',
        meta: { title: 'Nuevo combo' },
        component: () => import('@/views/marketing/combos/ComboFormView.vue')
      },
      {
        path: 'combos/:id/edit',
        name: 'marketing-combo-edit',
        meta: { title: 'Editar combo' },
        component: () => import('@/views/marketing/combos/ComboFormView.vue')
      },
      {
        path: 'loyalty',
        name: 'marketing-loyalty',
        meta: { title: 'Fidelización' },
        component: () => import('@/views/marketing/loyalty/LoyaltyView.vue')
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
        meta: { title: 'Proveedores de facturación' },
        component: () => import('@/views/billing/ProvidersListView.vue')
      },
      {
        path: 'providers/:id',
        name: 'BillingProviderConfig',
        meta: { title: 'Configurar proveedor de facturación' },
        component: () => import('@/views/billing/ProviderConfigView.vue')
      },
      {
        path: 'series',
        name: 'BillingBranchSeries',
        meta: { title: 'Series por sucursal' },
        component: () => import('@/views/billing/BranchSeriesView.vue')
      },
      {
        path: 'documents',
        name: 'BillingDocuments',
        meta: { title: 'Documentos de facturación' },
        component: () => import('@/views/billing/DocumentsListView.vue')
      },
      {
        path: 'documents/:id',
        name: 'BillingDocumentDetail',
        meta: { title: 'Detalle de documento' },
        component: () => import('@/views/billing/DocumentDetailView.vue')
      },
      {
        path: 'manual/emit',
        name: 'BillingManualEmit',
        meta: { title: 'Emisión manual' },
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
        meta: { title: 'Formas de pago' },
        component: () => import('@/views/payment-gateways/ProvidersListView.vue')
      },
      {
        path: ':code',
        name: 'PaymentGatewayConfig',
        meta: { title: 'Configurar forma de pago' },
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
        meta: { title: 'Tarifas de envío' },
        component: () => import('@/views/shipping/ShippingRatesView.vue')
      },
      {
        path: 'zones',
        name: 'shipping-zones',
        meta: { title: 'Zonas de reparto' },
        component: () => import('@/views/shipping/ShippingZonesListView.vue')
      },
      {
        path: 'zones/new',
        name: 'shipping-zone-create',
        meta: { title: 'Nueva zona de reparto' },
        component: () => import('@/views/shipping/ShippingZoneCreateView.vue')
      },
      {
        path: 'zones/:id',
        name: 'shipping-zone-detail',
        meta: { title: 'Detalle de zona de reparto' },
        component: () => import('@/views/shipping/ShippingZoneDetailView.vue')
      },
      {
        path: 'branch-zones',
        name: 'branch-zones',
        meta: { title: 'Sucursal que despacha por zona' },
        component: () => import('@/views/shipping/BranchZonesView.vue')
      },
      {
        path: 'couriers',
        name: 'courier-providers',
        meta: { title: 'Proveedores de envío' },
        component: () => import('@/views/shipping/CourierProvidersListView.vue')
      },
      {
        path: 'couriers/:code',
        name: 'courier-provider-config',
        meta: { title: 'Configurar courier' },
        component: () => import('@/views/shipping/CourierProviderConfigView.vue')
      },
      {
        path: 'config',
        name: 'shipping-config',
        meta: { title: 'Configuración de envíos' },
        component: () => import('@/views/shipping/ShippingConfigView.vue')
      },
      {
        path: 'courier-routing',
        name: 'courier-routing',
        meta: { title: 'Reglas de courier' },
        component: () => import('@/views/shipping/CourierRoutingView.vue')
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
        meta: { title: 'Información de la tienda' },
        component: () => import('@/views/store/StoreInfoView.vue')
      },
      {
        path: 'addresses',
        name: 'store-addresses',
        meta: { title: 'Direcciones' },
        component: () => import('@/views/store/StoreAddressesView.vue')
      },
      {
        path: 'addresses/new',
        name: 'store-address-create',
        meta: { title: 'Nueva dirección' },
        component: () => import('@/views/store/StoreAddressFormView.vue')
      },
      {
        path: 'addresses/:id/edit',
        name: 'store-address-edit',
        meta: { title: 'Editar dirección' },
        component: () => import('@/views/store/StoreAddressFormView.vue')
      },
      {
        path: 'config',
        name: 'store-config',
        meta: { title: 'Configuración de la tienda' },
        component: () => import('@/views/store/StoreConfigView.vue')
      },
      {
        path: 'branch-stock',
        name: 'store-branch-stock',
        meta: { title: 'Stock por sucursal' },
        component: () => import('@/views/stock/BranchStockView.vue')
      },
      {
        path: 'seo',
        name: 'store-seo',
        meta: { title: 'SEO' },
        component: () => import('@/views/store/StoreSeoView.vue')
      },
      {
        path: 'google',
        name: 'store-google',
        meta: { title: 'Google' },
        component: () => import('@/views/store/StoreGoogleView.vue')
      },
      {
        path: 'facebook',
        name: 'store-facebook',
        meta: { title: 'Facebook' },
        component: () => import('@/views/store/StoreFacebookView.vue')
      },
      {
        path: 'tiktok',
        name: 'store-tiktok',
        meta: { title: 'TikTok' },
        component: () => import('@/views/store/StoreTiktokView.vue')
      },
      {
        path: 'doppler',
        name: 'store-doppler',
        meta: { title: 'Doppler' },
        component: () => import('@/views/store/StoreDopplerView.vue')
      },
      {
        path: 'domain',
        name: 'store-domain',
        meta: { title: 'Dominio propio' },
        component: () => import('@/views/store/StoreDomainView.vue')
      },
      {
        path: 'users',
        name: 'store-users',
        meta: { title: 'Usuarios' },
        component: () => import('@/views/store/users/UsersListView.vue')
      },
      {
        path: 'users/invite',
        name: 'store-user-invite',
        meta: { title: 'Invitar usuario' },
        component: () => import('@/views/store/users/UserInviteView.vue')
      },
      {
        path: 'users/:id/edit',
        name: 'store-user-edit',
        meta: { title: 'Editar usuario' },
        component: () => import('@/views/store/users/UserInviteView.vue')
      },
      {
        path: 'subscription',
        name: 'store-subscription',
        meta: { title: 'Suscripción' },
        component: () => import('@/views/store/SubscriptionView.vue')
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
        meta: { title: 'Mi perfil' },
        component: () => import('@/views/profile/ProfileView.vue')
      },
      {
        path: 'oauth/callback',
        name: 'OAuthCallback',
        meta: { title: 'Conectando cuenta' },
        component: () => import('@/views/profile/OAuthCallbackView.vue')
      }
    ]
  },
  {
    path: '/notifications',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: '',
        name: 'Notifications',
        meta: { title: 'Notificaciones' },
        component: () => import('@/views/notifications/NotificationsView.vue')
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
        meta: { title: 'Credenciales API' },
        component: () => import('@/views/api/CredentialsView.vue')
      },
      {
        path: 'webhooks',
        name: 'ApiWebhooks',
        meta: { title: 'Webhooks (legacy)' },
        component: () => import('@/views/api/WebhooksView.vue')
      }
    ]
  },
  {
    path: '/integrations',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: 'dashboard',
        name: 'IntegrationsDashboard',
        meta: { title: 'Monitor de integraciones' },
        component: () => import('@/views/integrations/IntegrationsDashboardView.vue')
      },
      {
        path: 'providers',
        name: 'IntegrationProviders',
        meta: { title: 'Proveedores de integraciones' },
        component: () => import('@/views/integrations/IntegrationProvidersView.vue')
      },
      {
        path: 'providers/:code',
        name: 'IntegrationProviderConfig',
        meta: { title: 'Configurar integración' },
        component: () => import('@/views/integrations/IntegrationProviderConfigView.vue')
      },
      {
        path: 'webhooks',
        name: 'IntegrationWebhooks',
        meta: { title: 'Webhooks de integraciones' },
        component: () => import('@/views/integrations/WebhookSubscriptionsView.vue')
      },
      {
        path: 'queue',
        name: 'QueueManagement',
        meta: { title: 'Cola de trabajos' },
        component: () => import('@/views/configuracion/NetsuiteQueueView.vue')
      },
      {
        path: 'fulfillment',
        name: 'FulfillmentWms',
        meta: { title: 'Fulfillment' },
        component: () => import('@/views/integrations/FulfillmentWmsView.vue')
      },
      {
        path: 'whatsapp',
        name: 'WhatsAppConfig',
        meta: { title: 'WhatsApp' },
        component: () => import('@/views/integrations/WhatsAppConfigView.vue')
      }
    ]
  },
  // Shortcut: /fulfillment redirects to /integrations/fulfillment
  {
    path: '/fulfillment',
    redirect: '/integrations/fulfillment'
  },
  {
    path: '/plugins',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: '',
        name: 'PluginList',
        meta: { title: 'Plugins' },
        component: () => import('@/views/plugins/PluginListView.vue')
      },
      {
        path: ':slug',
        name: 'PluginConfig',
        meta: { title: 'Configurar plugin' },
        component: () => import('@/views/plugins/PluginConfigView.vue')
      }
    ]
  },
  {
    path: '/pos',
    component: DashboardLayout,
    meta: { requiresAuth: true, requiresStore: true },
    children: [
      {
        path: '',
        redirect: '/pos/cajeros'
      },
      {
        path: 'cajeros',
        name: 'PosCajeros',
        meta: { title: 'Cajeros POS' },
        component: () => import('@/views/pos/PosCajerosView.vue')
      },
      {
        path: 'cajeros/nuevo',
        name: 'PosCajeroCreate',
        meta: { title: 'Nuevo cajero POS' },
        component: () => import('@/views/pos/PosCajeroFormView.vue')
      },
      {
        path: 'cajeros/:id',
        name: 'PosCajeroEdit',
        meta: { title: 'Editar cajero POS' },
        component: () => import('@/views/pos/PosCajeroFormView.vue')
      },
      {
        path: 'sucursales',
        name: 'PosSucursales',
        meta: { title: 'Sucursales POS' },
        component: () => import('@/views/pos/PosSucursalesView.vue')
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
        meta: { title: 'NetSuite' },
        component: () => import('@/views/configuracion/NetsuiteConfigView.vue')
      },
      {
        path: 'netsuite/inventario',
        name: 'NetsuiteInventoryMap',
        meta: { title: 'Inventario NetSuite' },
        component: () => import('@/views/configuracion/NetsuiteInventoryMapView.vue')
      },
      {
        path: 'netsuite/stock',
        name: 'NetsuiteStock',
        meta: { title: 'Stock NetSuite' },
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
        meta: { title: 'Administración de tiendas' },
        component: () => import('@/views/admin/StoresListView.vue')
      },
      {
        path: 's3-migration',
        name: 'AdminS3Migration',
        meta: { title: 'Migración S3' },
        component: () => import('@/views/admin/S3MigrationView.vue')
      }
    ]
  },
  {
    path: '/debug/superadmin',
    name: 'SuperAdminDebug',
    component: () => import('@/views/debug/SuperAdminDebug.vue'),
    meta: { requiresAuth: true, requiresSuperAdmin: true, title: 'Debug superadmin' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    meta: { title: 'Página no encontrada' },
    component: () => import('@/views/NotFoundView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  },
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
    next('/dashboard')
    return
  }

  // Si la ruta requiere tienda seleccionada
  if (requiresStore && !requiresSuperAdmin) {
    // Permitir acceso si está impersonando (tiene selectedStore por impersonación)
    // O si tiene selectedStore normal
    if (!authStore.selectedStore && !isImpersonating) {
      // Superadmin sin tienda seleccionada → listado completo (para impersonar)
      const fallback = authStore.isSuperAdmin ? '/admin/stores' : '/my-stores'
      if (to.path !== '/store-selection' && to.path !== fallback) {
        next(fallback)
        return
      }
    }
  }

  // Plan module access check. Aplica también durante impersonación:
  // un superadmin actuando como merchant no debe poder crear datos
  // que el merchant luego no puede administrar (caso típico: promo V2
  // en una tienda Small que sólo tiene mod_cupones).
  // Sólo se omite cuando el superadmin navega su propia consola sin
  // estar impersonando una tienda.
  if (requiresStore && authStore.selectedStore && (!authStore.isSuperAdmin || isImpersonating)) {
    const { usePlanStore } = await import('@/stores/plan.store')
    const planStore = usePlanStore()
    if (!planStore.planInfo) {
      planStore.restorePlan()
      // If still no data after restore (no localStorage cache), fetch from API
      if (!planStore.planInfo) {
        await planStore.fetchPlan()
      }
    }

    // Redirect legacy V1 marketing/promotions root → V2 (preserva sub-rutas con :id
    // para no romper edición de promociones legacy aún no migradas). Eliminar tras
    // que todas las tiendas estén migradas con `php spark promotions:migrate-legacy`.
    if (to.path === '/marketing/promotions') {
      if (planStore.isModuleEnabled('mod_promociones_v2')) {
        return next('/marketing/promotions-v2')
      }
      if (planStore.isModuleEnabled('mod_cupones')) {
        return next('/marketing/coupons')
      }
    }

    if (!planStore.isRouteAccessible(to.path)) {
      const blockedModule = planStore.getModuleForRoute(to.path)
      if (blockedModule) planStore.showUpgradeModal(blockedModule)
      return next(false)
    }
  }

  // Si está en store-selection pero ya tiene tienda seleccionada
  if (to.path === '/store-selection' && authStore.selectedStore) {
    next('/dashboard')
    return
  }

  next()
})

// Clean up orphaned PrimeVue overlay masks on navigation
// This prevents the sidebar from becoming unclickable after closing a Dialog/Sidebar
router.afterEach((to) => {
  // Título por vista: GA4 agrupa por "Page title", sin esto todo cae bajo el título genérico
  const title = [...to.matched].reverse().find((record) => record.meta.title)?.meta.title
  document.title = title ? `${title} | ${brand.title}` : brand.title

  document.querySelectorAll('.p-dialog-mask, .p-sidebar-mask').forEach((mask) => {
    mask.remove()
  })
  // Also restore body scroll in case a modal left it locked
  document.body.classList.remove('p-overflow-hidden')
  document.body.style.removeProperty('overflow')
})

// Handle chunk loading errors after new deployments
// When assets are re-hashed, old chunks return 404 (served as HTML by SPA fallback)
router.onError((error, to) => {
  const isChunkError =
    error.message?.includes('Failed to fetch dynamically imported module') ||
    error.message?.includes('Importing a module script failed') ||
    error.message?.includes('MIME type') ||
    error.name === 'ChunkLoadError'

  if (isChunkError) {
    // Reload once to get new assets; use sessionStorage to prevent infinite loops
    const reloadKey = 'chunk-reload:' + to.fullPath
    if (!sessionStorage.getItem(reloadKey)) {
      sessionStorage.setItem(reloadKey, '1')
      window.location.assign(to.fullPath)
    }
  }
})

export default router
