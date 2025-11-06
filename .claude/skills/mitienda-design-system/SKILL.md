# MiTienda Design System Guidelines

Este skill contiene las directrices de diseño y branding para el backoffice de MiTienda. Úsalo cuando trabajes en vistas, componentes o funcionalidades UI.

## 🎨 Paleta de Colores

### Colores Principales
- **Primary (Turquesa MiTienda)**: `#00b2a6`
  - Uso: Botones principales, links, acciones primarias
  - Variantes: `primary-50` a `primary-900` (definidas en tailwind.config.js)

- **Secondary (Gris oscuro)**: `#333333`
  - Uso: Textos, backgrounds secundarios
  - Variantes: `secondary-50` a `secondary-900`

### Colores Semánticos
- **Success**: `green-*` (estados positivos, activos)
- **Warning**: `yellow-*` (advertencias, atención)
- **Danger**: `red-*` (errores, eliminación, estados críticos)
- **Info**: `blue-*` (información, neutrales)

### ❌ NO USAR
- `indigo-*` (inconsistente con el branding)
- `blue-*` para links (usar `text-primary` en su lugar)
- Colores hardcodeados en hex

## 🧱 Componentes Base

### AppButton
**Ubicación**: `src/components/ui/AppButton.vue`

**Variantes**:
- `primary`: Acciones principales (crear, guardar, enviar)
- `secondary`: Acciones secundarias
- `danger`: Eliminación, acciones destructivas
- `outlined`: Botones con borde
- `text`: Links que se ven como botones

**Tamaños**:
- `small`: Botones compactos
- `normal`: Tamaño estándar (default)
- `large`: Botones destacados

**Ejemplos de uso**:
```vue
<!-- Crear nuevo item -->
<AppButton
  label="Nueva Categoría"
  icon="pi-plus"
  variant="primary"
  @click="handleCreate"
/>

<!-- Acción secundaria -->
<AppButton
  label="Cancelar"
  variant="outlined"
  @click="handleCancel"
/>

<!-- Eliminar -->
<AppButton
  label="Eliminar"
  icon="pi-trash"
  variant="danger"
  @click="handleDelete"
/>

<!-- Link como botón -->
<AppButton
  label="Ver detalles"
  variant="text"
  @click="handleView"
/>
```

### AppInput
**Ubicación**: `src/components/ui/AppInput.vue`

**Props principales**:
- `label`: Etiqueta del input
- `placeholder`: Texto de ayuda
- `error`: Mensaje de error o boolean
- `helpText`: Texto de ayuda debajo del input
- `required`: Muestra asterisco rojo

**Ejemplos de uso**:
```vue
<!-- Input básico -->
<AppInput
  v-model="form.name"
  label="Nombre"
  placeholder="Ingrese el nombre"
  required
/>

<!-- Input con error -->
<AppInput
  v-model="form.email"
  label="Correo electrónico"
  type="email"
  :error="errors.email"
/>

<!-- Input con ayuda -->
<AppInput
  v-model="form.slug"
  label="Slug"
  helpText="Se genera automáticamente si se deja vacío"
/>
```

### AppBadge
**Ubicación**: `src/components/ui/AppBadge.vue`

**Variantes**:
- `success`: Estados activos, exitosos
- `warning`: Advertencias
- `danger`: Errores, inactivos
- `info`: Información neutral
- `neutral`: Estado por defecto

**Ejemplos de uso**:
```vue
<!-- Estado activo -->
<AppBadge
  label="Activo"
  variant="success"
  icon="pi-check"
/>

<!-- Estado inactivo -->
<AppBadge
  label="Inactivo"
  variant="neutral"
/>

<!-- Con slot -->
<AppBadge variant="info">
  <i class="pi pi-info-circle"></i>
  Custom content
</AppBadge>
```

### AppEmptyState
**Ubicación**: `src/components/ui/AppEmptyState.vue`

Para mostrar estados vacíos de forma consistente.

**Ejemplos de uso**:
```vue
<!-- Estado vacío con acción -->
<AppEmptyState
  icon="pi-inbox"
  title="No hay productos"
  description="Comienza agregando tu primer producto"
  actionLabel="Crear producto"
  actionIcon="pi-plus"
  @action="handleCreate"
/>

<!-- Estado vacío sin resultados de búsqueda -->
<AppEmptyState
  icon="pi-search"
  title="No se encontraron resultados"
  description="Intenta con otros términos de búsqueda"
/>

<!-- Con contenido custom -->
<AppEmptyState
  title="Lista vacía"
>
  <template #default>
    <p>Contenido personalizado</p>
  </template>
  <template #actions>
    <AppButton label="Acción 1" />
    <AppButton label="Acción 2" variant="outlined" />
  </template>
</AppEmptyState>
```

### AppErrorState
**Ubicación**: `src/components/ui/AppErrorState.vue`

Para mostrar errores de forma consistente.

**Ejemplos de uso**:
```vue
<!-- Error con retry -->
<AppErrorState
  title="Error al cargar datos"
  :message="errorMessage"
  @retry="fetchData"
/>

<!-- Error sin retry -->
<AppErrorState
  :message="errorMessage"
  :showRetry="false"
/>

<!-- Error con acciones custom -->
<AppErrorState
  :message="errorMessage"
>
  <template #actions>
    <AppButton label="Ir al inicio" @click="goHome" />
  </template>
</AppErrorState>
```

## 📝 Convenciones de Clases Tailwind

### Textos
- **Labels**: `text-secondary-700` (NO usar `text-gray-700`)
- **Textos normales**: `text-secondary` o `text-secondary-900`
- **Textos secundarios**: `text-secondary-600`
- **Help text**: `text-secondary-500`

### Links
- **Links normales**: `text-primary hover:underline`
- **Links en navegación**: `text-secondary-700 hover:text-primary`
- **Enlaces externos**: Agregar icono `pi-external-link`

**Ejemplo**:
```vue
<router-link to="/products" class="text-primary hover:underline">
  Ver todos
</router-link>
```

### Espaciado
- **Padding de cards**: `p-6`
- **Padding de modals**: `p-6` (header, content, footer)
- **Espaciado entre elementos**: `space-y-4` o `gap-4`
- **Margin bottom de labels**: `mb-2`

### Bordes y Sombras
- **Cards**: `rounded-lg shadow`
- **Inputs**: `rounded-md border-gray-300`
- **Estados hover**: `hover:shadow-lg transition-shadow`

## 🎯 Patrones Comunes

### Lista con filtros y crear
```vue
<div class="space-y-6">
  <!-- Header con título y acción -->
  <div class="flex justify-between items-center">
    <h1 class="text-2xl font-bold text-secondary">Título</h1>
    <AppButton
      label="Crear nuevo"
      icon="pi-plus"
      variant="primary"
      @click="handleCreate"
    />
  </div>

  <!-- Barra de búsqueda -->
  <AppInput
    v-model="searchQuery"
    placeholder="Buscar..."
    icon="pi-search"
  />

  <!-- Grid de items -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <!-- Cards aquí -->
  </div>
</div>
```

### Formulario en Dialog/Modal
```vue
<Dialog v-model:visible="showDialog" header="Título" :style="{ width: '500px' }">
  <div class="space-y-4">
    <AppInput
      v-model="form.name"
      label="Nombre"
      required
      :error="errors.name"
    />

    <AppInput
      v-model="form.description"
      label="Descripción"
      helpText="Texto de ayuda"
    />
  </div>

  <template #footer>
    <AppButton
      label="Cancelar"
      variant="outlined"
      @click="showDialog = false"
    />
    <AppButton
      label="Guardar"
      variant="primary"
      :loading="loading"
      @click="handleSave"
    />
  </template>
</Dialog>
```

### Estado de carga
```vue
<div v-if="loading" class="flex justify-center items-center p-12">
  <i class="pi pi-spinner pi-spin text-4xl text-primary"></i>
</div>

<div v-else-if="error">
  <AppErrorState
    :message="error"
    @retry="fetchData"
  />
</div>

<div v-else-if="!items.length">
  <AppEmptyState
    title="No hay items"
    actionLabel="Crear item"
    @action="handleCreate"
  />
</div>

<div v-else>
  <!-- Contenido aquí -->
</div>
```

## ⚙️ Importación de Componentes

Siempre importa desde el barrel export:

```vue
<script setup lang="ts">
import { AppButton, AppInput, AppBadge, AppEmptyState, AppErrorState } from '@/components/ui'
</script>
```

## 🚫 Anti-patrones

### ❌ NO HACER:
```vue
<!-- NO: HTML button con Tailwind -->
<button class="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-white rounded-md">
  Click me
</button>

<!-- NO: Colores inconsistentes -->
<span class="text-blue-600">Link</span>
<label class="text-gray-700">Label</label>

<!-- NO: Input HTML directo -->
<input type="text" class="border rounded px-3 py-2" />
```

### ✅ SÍ HACER:
```vue
<!-- SÍ: Usar componentes base -->
<AppButton label="Click me" variant="primary" />

<!-- SÍ: Colores consistentes -->
<router-link to="/" class="text-primary hover:underline">Link</router-link>
<label class="text-secondary-700">Label</label>

<!-- SÍ: Componente de input -->
<AppInput v-model="value" label="Label" />
```

## 📦 Resumen de Imports

Usa el archivo barrel para importar todos los componentes:

```typescript
// src/components/ui/index.ts
export { default as AppButton } from './AppButton.vue'
export { default as AppInput } from './AppInput.vue'
export { default as AppBadge } from './AppBadge.vue'
export { default as AppEmptyState } from './AppEmptyState.vue'
export { default as AppErrorState } from './AppErrorState.vue'
```

## 🔄 Migración Gradual

Al trabajar en una vista existente:
1. Identifica botones HTML y reemplaza con `AppButton`
2. Identifica inputs HTML y reemplaza con `AppInput`
3. Identifica badges inconsistentes y reemplaza con `AppBadge`
4. Identifica estados vacíos y reemplaza con `AppEmptyState`
5. Identifica mensajes de error y reemplaza con `AppErrorState`
6. Actualiza clases de color inconsistentes (`indigo-*`, `blue-*` → `primary`)

## 🎓 Recordatorios

- **Siempre usa componentes base** antes que HTML + Tailwind
- **Colores**: `primary` para acciones, `secondary` para textos
- **No inventes variantes** de color (nada de `indigo`, `sky`, `cyan`)
- **Consistencia > Creatividad** en el diseño del backoffice
- **Labels** siempre con `text-secondary-700`
- **Links** siempre con `text-primary`
- **Estados vacíos** con `AppEmptyState`
- **Errores** con `AppErrorState`

---

**Última actualización**: 2025-11-03
