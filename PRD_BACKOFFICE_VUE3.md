# PRD: Backoffice MiTienda en Vue 3

## 1. Resumen Ejecutivo

### 1.1 Objetivo del Proyecto
Desarrollar un backoffice moderno en Vue 3 + TypeScript que reemplace progresivamente el backoffice legacy (PHP 5.6 + CI3) de MiTienda.pe, consumiendo la nueva API REST (PHP 8 + CI4). Este backoffice replicará inicialmente las funcionalidades disponibles en la aplicación móvil Flutter y servirá como base para la migración incremental de módulos adicionales.

### 1.2 Contexto
- **Sistema Legacy**: MiTienda.pe es un sistema monolítico multitenant en PHP 5.6 + Codeigniter 3
- **Nueva API**: Se ha desarrollado una API REST moderna en PHP 8 + Codeigniter 4
- **App Móvil**: Existe una aplicación Flutter que ya consume esta API
- **Estrategia**: Migración incremental y separación frontend/backend

### 1.3 Alcance Inicial (MVP)
El backoffice replicará las funcionalidades actuales de la app móvil:
- Autenticación y gestión de sesiones
- Dashboard con métricas de ventas
- Gestión de productos (CRUD, filtros, búsqueda, paginación)
- Gestión de pedidos (visualización, filtros, búsqueda, estados)
- Gestión de clientes (visualización, búsqueda, filtros)
- Catálogo (categorías y marcas)

---

## 2. Objetivos y Metas

### 2.1 Objetivos de Negocio
1. **Modernización tecnológica**: Migrar de PHP 5.6 a tecnologías modernas (Vue 3, PHP 8)
2. **Separación de responsabilidades**: Desacoplar frontend del backend
3. **Mejor experiencia de usuario**: Interfaz moderna, rápida y responsive
4. **Escalabilidad**: Base sólida para futuras funcionalidades
5. **Mantenibilidad**: Código estructurado, tipado y documentado

### 2.2 Objetivos Técnicos
1. Single Page Application (SPA) con Vue 3 + TypeScript
2. Diseño responsive (mobile-first)
3. Gestión de estado con Pinia
4. Autenticación JWT (Bearer token)
5. Sistema de rutas con Vue Router
6. Componentes reutilizables y modulares
7. Integración completa con API REST CI4

### 2.3 Métricas de Éxito
- Paridad funcional con app móvil en 100%
- Tiempo de carga inicial < 3 segundos
- Compatibilidad con navegadores modernos (Chrome, Firefox, Safari, Edge)
- Sistema de autenticación seguro y funcional
- Tests unitarios con cobertura > 70%

---

## 3. Contexto Técnico Actual

### 3.1 API REST (MiTienda API CI4)

**Base URL**: `https://api.mitienda.pe/api/v1`
**Source code**: `/Users/carlosvidal/www/mitienda/mitienda-api-ci4`

#### Endpoints Disponibles

##### Autenticación
- `POST /auth/login` - Login con email/password
- `POST /auth/refresh` - Renovar token
- `POST /auth/logout` - Cerrar sesión
- `GET /auth/test` - Test de conectividad

##### Usuario
- `GET /user/profile` - Perfil del usuario autenticado
- `GET /user/stores` - Tiendas del usuario
- `POST /user/store/select` - Seleccionar tienda activa

##### Dashboard
- `GET /util/dashboard-metrics?period={today|week|month}` - Métricas del dashboard
  - Ventas del período
  - Ticket promedio
  - Productos publicados
  - Productos agotados
  - Comparativas con período anterior

##### Productos
- `GET /products` - Listar productos (paginado)
  - Query params: `page`, `limit`, `search`, `category_id`, `brand_id`, `published`, `stock_status`
- `GET /products/{id}` - Detalle de producto
- `POST /products` - Crear producto
- `PUT /products/{id}` - Actualizar producto
- `DELETE /products/{id}` - Eliminar producto
- `GET /products/stats` - Estadísticas de productos

##### Pedidos
- `GET /orders` - Listar pedidos (paginado)
  - Query params: `page`, `limit`, `search`, `status`, `date_from`, `date_to`
- `GET /orders/{id}` - Detalle de pedido
- `POST /orders` - Crear pedido
- `PUT /orders/{id}` - Actualizar pedido

##### Clientes
- `GET /customers` - Listar clientes (paginado)
  - Query params: `page`, `limit`, `search`
- `GET /customers/{id}` - Detalle de cliente
- `POST /customers` - Crear cliente
- `PUT /customers/{id}` - Actualizar cliente
- `DELETE /customers/{id}` - Eliminar cliente

##### Catálogo
- `GET /categories` - Listar categorías
- `POST /categories` - Crear categoría
- `PUT /categories/{id}` - Actualizar categoría
- `DELETE /categories/{id}` - Eliminar categoría
- `GET /brands` - Listar marcas
- `POST /brands` - Crear marca
- `PUT /brands/{id}` - Actualizar marca
- `DELETE /brands/{id}` - Eliminar marca

#### Autenticación
Todos los endpoints (excepto `/auth/login`) requieren header:
```
Authorization: Bearer {access_token}
```

### 3.2 Funcionalidades de la App Móvil (Flutter)

#### Dashboard
- 4 métricas principales (scorecards):
  - Ventas (monto y cantidad de pedidos)
  - Ticket promedio
  - Productos publicados
  - Productos agotados
- Selector de período: Hoy, Esta Semana, Este Mes
- Indicadores de cambio (% vs período anterior)
- Lista de pedidos recientes (últimos 5)

#### Productos
- Lista con scroll infinito
- Cards con: imagen, nombre, SKU, marca, precio, stock
- Búsqueda en tiempo real
- Filtros:
  - Estado: Todos, Publicados, No publicados
  - Stock: Todos, En stock, Stock limitado, Agotados
  - Categoría (selección única)
  - Marca (selección única)
- Detalle de producto con toda la información
- Indicadores visuales de stock (colores)

#### Pedidos
- Lista con scroll infinito
- Cards con: número de orden, cliente, fecha, hora, monto, estado
- Búsqueda en tiempo real
- Filtros por estado
- Detalle completo del pedido
- Estados: Pendiente, Pagado, Enviado, Entregado, Cancelado
- Escaneo QR para ver pedido

#### Clientes
- Lista con scroll infinito
- Búsqueda en tiempo real
- Detalle de cliente con información completa
- Historial de pedidos del cliente

---

## 4. Arquitectura del Backoffice

### 4.1 Stack Tecnológico

#### Frontend
- **Framework**: Vue 3 (Composition API)
- **Lenguaje**: TypeScript
- **Build Tool**: Vite
- **Gestión de estado**: Pinia
- **Routing**: Vue Router
- **HTTP Client**: Axios
- **UI Framework**: Vuetify 3 o PrimeVue (recomendado: PrimeVue por su flexibilidad)
- **CSS**: TailwindCSS + CSS Modules
- **Validación**: Vuelidate o Yup
- **Date handling**: date-fns
- **Charts**: Chart.js + vue-chartjs

#### Testing
- **Unit Tests**: Vitest
- **E2E Tests**: Playwright
- **Linting**: ESLint + Prettier

#### DevOps
- **Version Control**: Git
- **CI/CD**: GitHub Actions o GitLab CI
- **Deployment**: Vercel / Netlify / servidor propio

### 4.2 Estructura del Proyecto

```
mitienda-backoffice/
├── public/
│   └── assets/
│       └── images/
├── src/
│   ├── api/                    # Clientes API
│   │   ├── axios.ts           # Configuración Axios
│   │   ├── auth.api.ts
│   │   ├── products.api.ts
│   │   ├── orders.api.ts
│   │   ├── customers.api.ts
│   │   ├── dashboard.api.ts
│   │   └── catalog.api.ts
│   ├── assets/                 # Recursos estáticos
│   │   ├── images/
│   │   ├── fonts/
│   │   └── styles/
│   ├── components/             # Componentes reutilizables
│   │   ├── common/            # Botones, inputs, cards, etc.
│   │   ├── layout/            # Header, sidebar, footer
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── orders/
│   │   └── customers/
│   ├── composables/            # Composition functions
│   │   ├── useAuth.ts
│   │   ├── usePagination.ts
│   │   ├── useFilters.ts
│   │   └── useToast.ts
│   ├── layouts/                # Layouts principales
│   │   ├── AuthLayout.vue
│   │   └── DashboardLayout.vue
│   ├── plugins/                # Plugins de Vue
│   │   ├── vuetify.ts (o primevue.ts)
│   │   └── router.ts
│   ├── router/                 # Configuración de rutas
│   │   └── index.ts
│   ├── stores/                 # Pinia stores
│   │   ├── auth.store.ts
│   │   ├── products.store.ts
│   │   ├── orders.store.ts
│   │   ├── customers.store.ts
│   │   ├── dashboard.store.ts
│   │   └── catalog.store.ts
│   ├── types/                  # TypeScript types/interfaces
│   │   ├── auth.types.ts
│   │   ├── product.types.ts
│   │   ├── order.types.ts
│   │   ├── customer.types.ts
│   │   └── api.types.ts
│   ├── utils/                  # Utilidades
│   │   ├── constants.ts
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── helpers.ts
│   ├── views/                  # Vistas/Páginas
│   │   ├── auth/
│   │   │   ├── LoginView.vue
│   │   │   └── StoreSelectionView.vue
│   │   ├── dashboard/
│   │   │   └── DashboardView.vue
│   │   ├── products/
│   │   │   ├── ProductsListView.vue
│   │   │   └── ProductDetailView.vue
│   │   ├── orders/
│   │   │   ├── OrdersListView.vue
│   │   │   └── OrderDetailView.vue
│   │   └── customers/
│   │       ├── CustomersListView.vue
│   │       └── CustomerDetailView.vue
│   ├── App.vue
│   └── main.ts
├── tests/
│   ├── unit/
│   └── e2e/
├── .env.development
├── .env.production
├── .eslintrc.js
├── .prettierrc
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 4.3 Arquitectura de Datos

#### Flow de Autenticación
1. Usuario ingresa credenciales → `POST /auth/login`
2. API devuelve `access_token` y `refresh_token`
3. Se almacenan tokens en `localStorage`
4. Se obtiene perfil de usuario → `GET /user/profile`
5. Se obtienen tiendas → `GET /user/stores`
6. Usuario selecciona tienda (si tiene múltiples) → `POST /user/store/select`
7. Todas las peticiones subsecuentes incluyen `Authorization: Bearer {token}`
8. Si token expira (401), se renueva automáticamente → `POST /auth/refresh`

#### Gestión de Estado (Pinia)
```typescript
// auth.store.ts
interface AuthState {
  user: User | null
  stores: Store[]
  selectedStore: Store | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
}

// products.store.ts
interface ProductsState {
  products: Product[]
  currentProduct: Product | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  filters: {
    search: string
    categoryId: string | null
    brandId: string | null
    published: boolean | null
    stockStatus: 'all' | 'in_stock' | 'limited' | 'out_of_stock'
  }
}

// Similar para orders, customers, dashboard
```

---

## 5. Funcionalidades Detalladas

### 5.1 Módulo de Autenticación

#### 5.1.1 Login
**Vista**: `LoginView.vue`

**Funcionalidades**:
- Formulario con email y password
- Validación de campos
- Manejo de errores (credenciales inválidas, servidor caído)
- Loading state durante petición
- Redirección automática tras login exitoso
- Opción "Recordar sesión"

**API**: `POST /auth/login`

**Flujo**:
1. Usuario completa formulario
2. Validación frontend
3. Petición a API
4. Guardar tokens y datos de usuario
5. Redirigir a selección de tienda o dashboard

#### 5.1.2 Selección de Tienda
**Vista**: `StoreSelectionView.vue`

**Funcionalidades**:
- Lista de tiendas del usuario
- Cards con nombre, logo y URL de tienda
- Selección de tienda activa
- Guardar preferencia en localStorage

**API**: `POST /user/store/select`

#### 5.1.3 Renovación de Token
**Servicio**: Interceptor en Axios

**Funcionalidades**:
- Detectar respuesta 401
- Renovar token automáticamente
- Reintentar petición original
- Logout si renovación falla

---

### 5.2 Módulo de Dashboard

#### 5.2.1 Vista Principal
**Vista**: `DashboardView.vue`

**Componentes**:
- `MetricsCards.vue` - 4 scorecards principales
- `PeriodSelector.vue` - Selector de período
- `RecentOrders.vue` - Últimos 5 pedidos

**Funcionalidades**:
- Mostrar métricas del negocio
- Selector de período (Hoy, Esta Semana, Este Mes)
- Indicadores de cambio vs período anterior
- Refrescar datos (pull to refresh)
- Lista de pedidos recientes clickeable

**API**: `GET /util/dashboard-metrics?period={period}`

**Métricas**:
1. **Ventas**: Monto total + cantidad de pedidos
2. **Ticket Promedio**: Promedio de venta por pedido
3. **Productos Publicados**: Cantidad / total
4. **Productos Agotados**: Cantidad / total publicados

---

### 5.3 Módulo de Productos

#### 5.3.1 Lista de Productos
**Vista**: `ProductsListView.vue`

**Componentes**:
- `ProductCard.vue` - Card individual
- `ProductFilters.vue` - Panel de filtros
- `SearchBar.vue` - Barra de búsqueda

**Funcionalidades**:
- Lista con scroll infinito
- Búsqueda en tiempo real (debounced)
- Filtros múltiples:
  - Estado de publicación
  - Stock
  - Categoría
  - Marca
- Indicadores visuales (stock bajo, agotado)
- Click en card abre detalle
- Pull to refresh

**API**: `GET /products?page={page}&limit={limit}&search={query}&...`

#### 5.3.2 Detalle de Producto
**Vista**: `ProductDetailView.vue`

**Funcionalidades**:
- Galería de imágenes
- Información completa del producto
- Botón editar (futura funcionalidad)
- Historial de cambios (futura funcionalidad)

**API**: `GET /products/{id}`

---

### 5.4 Módulo de Pedidos

#### 5.4.1 Lista de Pedidos
**Vista**: `OrdersListView.vue`

**Componentes**:
- `OrderCard.vue` - Card individual
- `OrderFilters.vue` - Filtros por estado
- `SearchBar.vue` - Búsqueda

**Funcionalidades**:
- Lista con scroll infinito
- Búsqueda por número de orden o cliente
- Filtros por estado
- Filtros por rango de fechas
- Estados visuales (colores por estado)
- Click abre detalle

**API**: `GET /orders?page={page}&limit={limit}&search={query}&status={status}`

#### 5.4.2 Detalle de Pedido
**Vista**: `OrderDetailView.vue`

**Funcionalidades**:
- Información del pedido
- Datos del cliente
- Lista de productos
- Totales y subtotales
- Estado del pedido
- Timeline de estados (futura funcionalidad)
- Acciones: cambiar estado, imprimir (futuras)

**API**: `GET /orders/{id}`

---

### 5.5 Módulo de Clientes

#### 5.5.1 Lista de Clientes
**Vista**: `CustomersListView.vue`

**Componentes**:
- `CustomerCard.vue` - Card individual
- `SearchBar.vue` - Búsqueda

**Funcionalidades**:
- Lista con scroll infinito
- Búsqueda en tiempo real
- Click abre detalle

**API**: `GET /customers?page={page}&limit={limit}&search={query}`

#### 5.5.2 Detalle de Cliente
**Vista**: `CustomerDetailView.vue`

**Funcionalidades**:
- Información del cliente
- Estadísticas (total gastado, cantidad de pedidos)
- Historial de pedidos
- Botón editar (futura funcionalidad)

**API**: `GET /customers/{id}`

---

## 6. Diseño UI/UX

### 6.1 Principios de Diseño
1. **Mobile First**: Diseño responsive que prioriza dispositivos móviles
2. **Minimalista**: UI limpia, sin saturación visual
3. **Consistente**: Mismos patrones de diseño en todo el sistema
4. **Accesible**: Cumplir WCAG 2.1 nivel AA
5. **Rápido**: Feedback inmediato, loaders apropiados

### 6.2 Layout Principal
```
┌─────────────────────────────────────┐
│  Header (Logo, Tienda, Usuario)    │
├─────┬───────────────────────────────┤
│     │                               │
│ Nav │   Content Area               │
│     │                               │
│     │                               │
└─────┴───────────────────────────────┘
```

**Navegación**:
- Dashboard
- Productos
- Pedidos
- Clientes
- Configuración (futura)

### 6.3 Paleta de Colores
Basarse en la identidad de MiTienda:
- **Primario**: #FF6B00 (naranja)
- **Secundario**: #333333 (gris oscuro)
- **Éxito**: #4CAF50 (verde)
- **Advertencia**: #FF9800 (naranja oscuro)
- **Error**: #F44336 (rojo)
- **Info**: #2196F3 (azul)

### 6.4 Tipografía
- **Fuente**: Inter, Roboto o similar (sans-serif)
- **Tamaños**: Sistema escalable (rem)

### 6.5 Componentes Clave
- **Cards**: Elevación sutil, bordes redondeados
- **Botones**: Estados claros (hover, active, disabled)
- **Inputs**: Validación visual inline
- **Tables**: Responsive, con paginación
- **Modals**: Overlay con foco
- **Toasts**: Notificaciones no intrusivas

---

## 7. Seguridad

### 7.1 Autenticación y Autorización
- Tokens JWT en `localStorage`
- Renovación automática de tokens
- Logout automático en caso de token inválido
- Protección de rutas (route guards)

### 7.2 Protección contra Ataques
- **XSS**: Sanitización de inputs, Vue escapa por defecto
- **CSRF**: No aplica (API stateless)
- **SQL Injection**: Backend responsable
- **Rate Limiting**: Backend responsable

### 7.3 Datos Sensibles
- No almacenar passwords en frontend
- HTTPS obligatorio en producción
- Headers de seguridad (CSP, HSTS)

---

## 8. Performance

### 8.1 Optimizaciones
- **Code Splitting**: Lazy loading de rutas
- **Image Optimization**: WebP, lazy loading
- **Caching**: Service Workers (futuro)
- **Debouncing**: En búsquedas
- **Throttling**: En scroll events
- **Virtual Scrolling**: Para listas largas (futuro)

### 8.2 Métricas Objetivo
- **FCP** (First Contentful Paint): < 1.5s
- **LCP** (Largest Contentful Paint): < 2.5s
- **TTI** (Time to Interactive): < 3.0s
- **Bundle Size**: < 500KB (gzipped)

---

## 9. Testing

### 9.1 Unit Tests
- Stores de Pinia
- Composables
- Componentes puros (sin API calls)
- Utilidades y helpers

### 9.2 Integration Tests
- Flujos completos (login → dashboard)
- Interacciones entre stores
- API mocking

### 9.3 E2E Tests
- Happy paths principales
- Casos críticos de negocio

---

## 10. Plan de Implementación

### 10.1 Fase 1: Setup y Autenticación (Semana 1-2)
- [ ] Setup del proyecto (Vite + Vue 3 + TypeScript)
- [ ] Configuración de herramientas (ESLint, Prettier, Vitest)
- [ ] Instalación de dependencias (Pinia, Vue Router, Axios, UI Framework)
- [ ] Estructura de carpetas
- [ ] Sistema de tipos TypeScript
- [ ] Cliente Axios configurado
- [ ] Store de autenticación
- [ ] Vista de login
- [ ] Vista de selección de tienda
- [ ] Route guards
- [ ] Interceptor para renovación de tokens

### 10.2 Fase 2: Dashboard (Semana 3)
- [ ] Layout principal (header, sidebar)
- [ ] Dashboard store
- [ ] API cliente de dashboard
- [ ] Componentes de métricas (scorecards)
- [ ] Selector de período
- [ ] Lista de pedidos recientes
- [ ] Responsive design

### 10.3 Fase 3: Productos (Semana 4-5)
- [ ] Products store
- [ ] API cliente de productos
- [ ] Vista de lista de productos
- [ ] Scroll infinito
- [ ] Búsqueda
- [ ] Filtros (estado, stock, categoría, marca)
- [ ] Vista de detalle
- [ ] Componentes reutilizables

### 10.4 Fase 4: Pedidos (Semana 6)
- [ ] Orders store
- [ ] API cliente de pedidos
- [ ] Vista de lista de pedidos
- [ ] Búsqueda y filtros
- [ ] Vista de detalle
- [ ] Estados visuales

### 10.5 Fase 5: Clientes (Semana 7)
- [ ] Customers store
- [ ] API cliente de clientes
- [ ] Vista de lista de clientes
- [ ] Búsqueda
- [ ] Vista de detalle

### 10.6 Fase 6: Testing y Refinamiento (Semana 8)
- [ ] Unit tests (cobertura > 70%)
- [ ] E2E tests de flujos críticos
- [ ] Optimización de performance
- [ ] Auditoría de seguridad
- [ ] Documentación

### 10.7 Fase 7: Deployment (Semana 9)
- [ ] Setup de CI/CD
- [ ] Configuración de entornos (dev, staging, prod)
- [ ] Deploy a staging
- [ ] QA y UAT
- [ ] Deploy a producción
- [ ] Monitoreo post-release

---

## 11. Riesgos y Mitigación

### 11.1 Riesgos Técnicos
| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| API no estable | Alto | Media | Testing exhaustivo, manejo robusto de errores |
| Performance en listas largas | Medio | Alta | Virtual scrolling, paginación |
| Compatibilidad navegadores | Bajo | Baja | Usar polyfills, testing cross-browser |
| Problemas con tokens | Alto | Baja | Renovación automática, fallbacks |

### 11.2 Riesgos de Negocio
| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| Usuarios rechazan nueva UI | Alto | Media | UX testing, feedback temprano |
| Falta de paridad con legacy | Alto | Baja | Checklist de funcionalidades |
| Retrasos en desarrollo | Medio | Media | Desarrollo incremental, MVP claro |

---

## 12. Próximos Pasos Post-MVP

### 12.1 Funcionalidades Adicionales
1. **CRUD completo** de productos, pedidos, clientes
2. **Gestión de inventario** (control de stock)
3. **Reportes y analytics** avanzados
4. **Gestión de usuarios** y roles
5. **Configuración de tienda** (métodos de pago, envío)
6. **Integración con pasarelas** de pago
7. **Notificaciones en tiempo real** (WebSockets)
8. **Sistema de cupones** y descuentos
9. **Marketing y email** campaigns
10. **Multi-idioma** (i18n)

### 12.2 Migración de Módulos Legacy
Priorización:
1. Gestión de inventario
2. Configuración de tienda
3. Reportes
4. Usuarios y permisos
5. Marketing y campañas

---

## 13. Documentación

### 13.1 Documentación Técnica
- README del proyecto
- Guía de instalación
- Guía de contribución
- Documentación de API (consumo)
- Arquitectura y decisiones de diseño

### 13.2 Documentación de Usuario
- Manual de usuario
- FAQs
- Videos tutoriales (futuro)

---

## 14. Equipo y Responsabilidades

### 14.1 Roles Necesarios
- **Tech Lead / Arquitecto**: Decisiones técnicas, arquitectura
- **Frontend Developers** (2-3): Implementación
- **UX/UI Designer**: Diseño de interfaces
- **QA Engineer**: Testing
- **Product Owner**: Priorización, requirements

### 14.2 Comunicación
- **Dailies**: Stand-ups diarios
- **Sprints**: 2 semanas
- **Retrospectivas**: Cada sprint
- **Demo**: Al final de cada sprint

---

## 15. Criterios de Aceptación

### 15.1 Funcionales
- [ ] Login funcional con manejo de errores
- [ ] Selección de tienda funcional
- [ ] Dashboard muestra todas las métricas correctamente
- [ ] Productos: lista, búsqueda, filtros y detalle funcionan
- [ ] Pedidos: lista, búsqueda, filtros y detalle funcionan
- [ ] Clientes: lista, búsqueda y detalle funcionan
- [ ] Navegación entre módulos fluida
- [ ] Logout funcional

### 15.2 No Funcionales
- [ ] Responsive en mobile, tablet y desktop
- [ ] Tiempo de carga < 3s
- [ ] Sin errores en consola
- [ ] Cobertura de tests > 70%
- [ ] Código pasa linting sin errores
- [ ] Documentación completa
- [ ] Deploy automatizado funcionando

---

## 16. Referencias

### 16.1 Documentación de la API
- Ruta de endpoints: [Routes.php](app/Config/Routes.php)
- Controladores disponibles: `app/Controllers/V1/`

### 16.2 Repositorio de la App Móvil
- Ubicación: `/Users/carlosvidal/Developer/mitienda_app`
- Referencia para lógica de negocio y flujos

### 16.3 Tecnologías
- [Vue 3 Docs](https://vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Pinia](https://pinia.vuejs.org/)
- [Vite](https://vitejs.dev/)
- [PrimeVue](https://primevue.org/) o [Vuetify](https://vuetifyjs.com/)

---

## 17. Changelog

| Versión | Fecha | Descripción |
|---------|-------|-------------|
| 1.0 | 2025-10-01 | Versión inicial del PRD |

---

**Documento creado por**: Claude AI (Anthropic)
**Proyecto**: MiTienda.pe Backoffice
**Estado**: Draft v1.0
