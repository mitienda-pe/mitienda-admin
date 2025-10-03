# 🚀 Guía de Inicio Rápido - MiTienda Backoffice

## ✅ Fase 1 Completada: Setup y Autenticación

¡El proyecto base está listo! Se ha completado la **Fase 1: Setup y Autenticación** según el PRD.

### Lo que se ha implementado:

#### ✅ Configuración del Proyecto
- [x] Proyecto Vue 3 + TypeScript con Vite
- [x] PrimeVue como UI framework
- [x] TailwindCSS para estilos
- [x] Pinia para gestión de estado
- [x] Vue Router para navegación
- [x] Axios con interceptores para HTTP

#### ✅ Sistema de Autenticación
- [x] Vista de Login funcional
- [x] Vista de Selección de Tienda
- [x] Store de autenticación con Pinia
- [x] Renovación automática de tokens JWT
- [x] Route guards para protección de rutas
- [x] Manejo de sesiones con localStorage

#### ✅ Arquitectura
- [x] Estructura de carpetas según PRD
- [x] Sistema de tipos TypeScript completo
- [x] Layouts (AuthLayout y DashboardLayout)
- [x] Cliente API configurado
- [x] Interceptores de Axios para tokens

## 📋 Pasos para Ejecutar el Proyecto

### 1. Configurar Variables de Entorno

Edita el archivo `.env.development` y agrega tus credenciales:

```bash
nano .env.development
```

Contenido del archivo:
```env
VITE_API_BASE_URL=https://api.mitienda.pe/api/v1
VITE_TEST_EMAIL=tu_email@ejemplo.com
VITE_TEST_PASSWORD=tu_password
```

### 2. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

### 3. Probar el Login

1. Navega a `http://localhost:3000`
2. Serás redirigido automáticamente a `/login`
3. Si configuraste credenciales en `.env`, estarán pre-cargadas
4. Haz clic en "Iniciar Sesión"
5. Si tienes múltiples tiendas, selecciona una
6. Serás redirigido al Dashboard

## 🔐 Flujo de Autenticación

```
1. Login (email/password)
   ↓
2. API devuelve tokens
   ↓
3. Se guardan tokens en localStorage
   ↓
4. Se obtienen tiendas del usuario
   ↓
5. Selección de tienda (si tiene múltiples)
   ↓
6. Dashboard
```

## 🎯 Rutas Disponibles

| Ruta | Descripción | Requiere Auth | Requiere Tienda |
|------|-------------|---------------|-----------------|
| `/login` | Página de login | ❌ | ❌ |
| `/store-selection` | Selección de tienda | ✅ | ❌ |
| `/dashboard` | Dashboard principal | ✅ | ✅ |
| `/products` | Productos (placeholder) | ✅ | ✅ |
| `/orders` | Pedidos (placeholder) | ✅ | ✅ |
| `/customers` | Clientes (placeholder) | ✅ | ✅ |

## 📁 Archivos Clave Creados

### API
- `src/api/axios.ts` - Cliente Axios con interceptores
- `src/api/auth.api.ts` - API de autenticación

### Stores
- `src/stores/auth.store.ts` - Store de autenticación con Pinia

### Tipos
- `src/types/api.types.ts` - Tipos de API
- `src/types/auth.types.ts` - Tipos de autenticación
- `src/types/product.types.ts` - Tipos de productos
- `src/types/order.types.ts` - Tipos de pedidos
- `src/types/customer.types.ts` - Tipos de clientes
- `src/types/dashboard.types.ts` - Tipos de dashboard

### Layouts
- `src/layouts/AuthLayout.vue` - Layout para páginas de autenticación
- `src/layouts/DashboardLayout.vue` - Layout del backoffice

### Vistas
- `src/views/auth/LoginView.vue` - Página de login
- `src/views/auth/StoreSelectionView.vue` - Selección de tienda
- `src/views/dashboard/DashboardView.vue` - Dashboard principal

### Router
- `src/router/index.ts` - Configuración de rutas con guards

## 🔧 Scripts Útiles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo

# Build
npm run build        # Build para producción
npm run preview      # Preview del build

# Calidad de código
npm run lint         # Ejecutar ESLint
npm run format       # Formatear con Prettier

# Testing (cuando se implementen)
npm run test         # Ejecutar tests
npm run test:ui      # Tests con UI
npm run test:coverage # Coverage
```

## 🔄 Renovación Automática de Tokens

El sistema maneja automáticamente la renovación de tokens:

1. Cuando una petición recibe 401 (Unauthorized)
2. El interceptor intenta renovar el token con el refresh_token
3. Si tiene éxito, reintenta la petición original
4. Si falla, cierra sesión y redirige a login

Ver implementación en: `src/api/axios.ts`

## 🚧 Próximas Fases

### Fase 2: Dashboard (Semana 3)
- [ ] Implementar métricas de ventas
- [ ] Scorecards con indicadores
- [ ] Selector de período
- [ ] Lista de pedidos recientes

### Fase 3: Productos (Semana 4-5)
- [ ] Lista de productos con scroll infinito
- [ ] Búsqueda en tiempo real
- [ ] Filtros (categoría, marca, stock)
- [ ] Vista de detalle de producto

### Fase 4: Pedidos (Semana 6)
- [ ] Lista de pedidos
- [ ] Búsqueda y filtros
- [ ] Vista de detalle
- [ ] Estados visuales

### Fase 5: Clientes (Semana 7)
- [ ] Lista de clientes
- [ ] Búsqueda
- [ ] Vista de detalle
- [ ] Historial de pedidos

## 🐛 Troubleshooting

### El build falla
```bash
npm run build
```
Si hay errores de TypeScript, revisa los tipos en `src/types/`

### Las credenciales no se cargan automáticamente
Verifica que el archivo `.env.development` esté correctamente configurado y que las variables empiecen con `VITE_`

### Error de CORS
Asegúrate de que la API en `https://api.mitienda.pe/api/v1` tenga CORS habilitado

### Token expirado
El sistema debería renovar automáticamente. Si no funciona, revisa la consola del navegador y el código en `src/api/axios.ts`

## 📚 Documentación

- [README.md](./README.md) - Documentación completa del proyecto
- [PRD_BACKOFFICE_VUE3.md](./PRD_BACKOFFICE_VUE3.md) - Product Requirements Document

## ✨ Características Implementadas

### Seguridad
- ✅ Tokens JWT (access + refresh)
- ✅ Renovación automática de tokens
- ✅ Route guards
- ✅ Logout automático en caso de error

### UX
- ✅ Diseño responsive
- ✅ Loading states
- ✅ Manejo de errores
- ✅ Toasts para notificaciones
- ✅ Sidebar responsive (mobile + desktop)

### Arquitectura
- ✅ Composition API de Vue 3
- ✅ TypeScript estricto
- ✅ Separación de responsabilidades
- ✅ Código modular y reutilizable

## 🎉 ¡Listo para empezar!

El proyecto está completamente funcional para la autenticación. Puedes:

1. **Configurar tus credenciales** en `.env.development`
2. **Ejecutar** `npm run dev`
3. **Navegar** a `http://localhost:3000`
4. **Iniciar sesión** y explorar

---

**Desarrollado con ❤️ para MiTienda.pe**
