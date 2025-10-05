# MiTienda - Backoffice Vue 3

Backoffice moderno desarrollado con Vue 3 + TypeScript que consume la API REST de MiTienda.

## 🚀 Stack Tecnológico

- **Framework**: Vue 3 (Composition API)
- **Lenguaje**: TypeScript
- **Build Tool**: Vite
- **Gestión de Estado**: Pinia
- **Routing**: Vue Router
- **HTTP Client**: Axios
- **UI Framework**: PrimeVue 3
- **CSS**: TailwindCSS
- **Testing**: Vitest

## 📋 Requisitos Previos

- Node.js >= 18.x
- npm >= 9.x
- API de MiTienda corriendo en: `https://api.mitienda.pe/api/v1`

## 🔧 Instalación

1. **Clonar el repositorio** (si aplica) o navegar a la carpeta del proyecto:
```bash
cd mitienda-administrador
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Configurar variables de entorno**:
```bash
cp .env.example .env.development
```

Edita el archivo `.env.development` y agrega tus credenciales de prueba:
```env
VITE_API_BASE_URL=https://api.mitienda.pe/api/v1
VITE_TEST_EMAIL=tu@email.com
VITE_TEST_PASSWORD=tu_password
```

4. **Iniciar el servidor de desarrollo**:
```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:3000`

## 📁 Estructura del Proyecto

```
src/
├── api/                    # Clientes API
│   ├── axios.ts           # Configuración Axios + interceptores
│   └── auth.api.ts        # API de autenticación
├── assets/                 # Recursos estáticos
│   └── styles/            # Estilos globales
├── components/             # Componentes reutilizables
│   ├── common/
│   ├── layout/
│   ├── dashboard/
│   ├── products/
│   ├── orders/
│   └── customers/
├── layouts/                # Layouts principales
│   ├── AuthLayout.vue     # Layout para login/auth
│   └── DashboardLayout.vue # Layout del dashboard
├── router/                 # Configuración de rutas
│   └── index.ts
├── stores/                 # Pinia stores
│   └── auth.store.ts      # Store de autenticación
├── types/                  # TypeScript types
│   ├── api.types.ts
│   ├── auth.types.ts
│   ├── product.types.ts
│   ├── order.types.ts
│   ├── customer.types.ts
│   └── dashboard.types.ts
├── views/                  # Vistas/Páginas
│   ├── auth/
│   ├── dashboard/
│   ├── products/
│   ├── orders/
│   └── customers/
├── App.vue
└── main.ts
```

## 🔐 Autenticación

El sistema de autenticación incluye:

1. **Login**: Autenticación con email y password
2. **Selección de Tienda**: Si el usuario tiene múltiples tiendas
3. **JWT Tokens**: Access token y refresh token
4. **Renovación automática**: Los tokens se renuevan automáticamente
5. **Route Guards**: Protección de rutas privadas

### Flujo de Autenticación

1. Usuario ingresa credenciales → `POST /auth/login`
2. Se guardan tokens en localStorage
3. Se obtienen las tiendas del usuario → `GET /user/stores`
4. Usuario selecciona tienda → `POST /user/store/select`
5. Redirección al dashboard

## 🛣️ Rutas Disponibles

- `/login` - Página de login
- `/store-selection` - Selección de tienda (si tiene múltiples)
- `/dashboard` - Dashboard principal
- `/products` - Lista de productos (placeholder)
- `/orders` - Lista de pedidos (placeholder)
- `/customers` - Lista de clientes (placeholder)

## 🧪 Testing

```bash
# Ejecutar tests
npm run test

# Tests con UI
npm run test:ui

# Coverage
npm run test:coverage
```

## 🏗️ Build

```bash
# Build para producción
npm run build

# Preview del build
npm run preview
```

## 📝 Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Build para producción
- `npm run preview` - Preview del build de producción
- `npm run lint` - Ejecuta ESLint
- `npm run format` - Formatea código con Prettier
- `npm run test` - Ejecuta tests con Vitest

## 🎨 Personalización de Colores

Los colores principales están definidos en `tailwind.config.js`:

```js
colors: {
  primary: '#FF6B00',    // Naranja de MiTienda
  secondary: '#333333'   // Gris oscuro
}
```

## 📚 Estado del Proyecto

### ✅ Fase 1: Setup y Autenticación (COMPLETADO)
- [x] Setup del proyecto (Vite + Vue 3 + TypeScript)
- [x] Configuración de herramientas (ESLint, Prettier, Vitest)
- [x] Instalación de dependencias (Pinia, Vue Router, Axios, PrimeVue)
- [x] Estructura de carpetas
- [x] Sistema de tipos TypeScript
- [x] Cliente Axios configurado con interceptores
- [x] Store de autenticación
- [x] Vista de login
- [x] Vista de selección de tienda
- [x] Route guards
- [x] Renovación automática de tokens

### 🔜 Próximas Fases

- **Fase 2**: Dashboard con métricas
- **Fase 3**: Módulo de Productos
- **Fase 4**: Módulo de Pedidos
- **Fase 5**: Módulo de Clientes
- **Fase 6**: Testing y refinamiento
- **Fase 7**: Deployment

## 📚 Documentación

- [PRD del Proyecto](./docs/PRD_BACKOFFICE_VUE3.md)
- [Guía de Deployment](./docs/DEPLOY_INSTRUCCIONES.md)
- [Implementación de Videos](./docs/VIDEO_UPLOAD_IMPLEMENTATION.md)
- [Feature de Videos - Resumen](./docs/RESUMEN_FEATURE_VIDEOS.md)
- [Ver todas las docs](./docs/)

## 🔗 Enlaces Útiles

- [Documentación Vue 3](https://vuejs.org/)
- [Documentación Pinia](https://pinia.vuejs.org/)
- [Documentación PrimeVue](https://primevue.org/)
- [Documentación Vite](https://vitejs.dev/)

## 📄 Licencia

Proyecto privado de MiTienda.pe

## 👨‍💻 Desarrollo

Para contribuir al proyecto, seguir las siguientes convenciones:

1. Usar TypeScript en todos los archivos
2. Seguir la guía de estilo de Vue 3
3. Escribir tests para nuevas funcionalidades
4. Usar Composition API
5. Documentar componentes complejos

---

**Desarrollado con ❤️ para MiTienda.pe**
