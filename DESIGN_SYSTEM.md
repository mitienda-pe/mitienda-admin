# Design System - MiTienda Backoffice

Sistema de diseño consistente para el backoffice de MiTienda.

## 📋 Tabla de Contenidos

- [Introducción](#introducción)
- [Componentes Base](#componentes-base)
- [Guía de Migración](#guía-de-migración)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Skill de Claude](#skill-de-claude)

## Introducción

Este Design System resuelve las inconsistencias en el diseño del backoffice mediante:

1. **Componentes base reutilizables** en `src/components/ui/`
2. **Paleta de colores unificada** (primary/secondary en Tailwind config)
3. **Skill de Claude** con guidelines en `.claude/skills/mitienda-design-system.md`

### Problema que resuelve

Antes teníamos:
- Botones con colores `indigo-600`, `blue-600`, o sin color
- Links con `text-indigo-600` vs `text-primary` vs `text-blue-600`
- Labels con `text-gray-700` vs `text-secondary-700`
- Estados vacíos con estilos diferentes
- Inputs HTML vs PrimeVue InputText

## Componentes Base

Ubicación: `src/components/ui/`

### AppButton

Botón consistente basado en PrimeVue Button.

**Props:**
- `label` - Texto del botón
- `icon` - Icono PrimeIcons (ej: `pi-plus`)
- `variant` - `primary | secondary | danger | text | outlined` (default: `primary`)
- `size` - `small | normal | large` (default: `normal`)
- `loading` - Muestra spinner
- `disabled` - Deshabilita el botón
- `block` - Ancho completo

**Ejemplo:**
```vue
<script setup>
import { AppButton } from '@/components/ui'
</script>

<template>
  <AppButton
    label="Crear producto"
    icon="pi-plus"
    variant="primary"
    @click="handleCreate"
  />
</template>
```

### AppInput

Input consistente basado en PrimeVue InputText.

**Props:**
- `modelValue` - Valor del input (v-model)
- `label` - Etiqueta del input
- `placeholder` - Placeholder
- `type` - Tipo de input (default: `text`)
- `error` - Mensaje de error o boolean
- `helpText` - Texto de ayuda
- `required` - Muestra asterisco rojo

**Ejemplo:**
```vue
<script setup>
import { AppInput } from '@/components/ui'
import { ref } from 'vue'

const name = ref('')
const email = ref('')
const errors = ref({ email: '' })
</script>

<template>
  <AppInput
    v-model="name"
    label="Nombre"
    placeholder="Ingrese el nombre"
    required
  />

  <AppInput
    v-model="email"
    label="Email"
    type="email"
    :error="errors.email"
    helpText="Ingrese un email válido"
  />
</template>
```

### AppBadge

Badge/pill para estados y categorías.

**Props:**
- `label` - Texto del badge
- `variant` - `success | warning | danger | info | neutral` (default: `neutral`)
- `icon` - Icono PrimeIcons opcional
- `size` - `small | normal` (default: `normal`)
- `rounded` - Badge redondeado (default: `true`)

**Ejemplo:**
```vue
<script setup>
import { AppBadge } from '@/components/ui'
</script>

<template>
  <AppBadge
    label="Activo"
    variant="success"
    icon="pi-check"
  />

  <AppBadge
    label="Inactivo"
    variant="neutral"
  />
</template>
```

### AppEmptyState

Estado vacío consistente.

**Props:**
- `icon` - Icono PrimeIcons (default: `pi-inbox`)
- `title` - Título del estado vacío (requerido)
- `description` - Descripción opcional
- `actionLabel` - Texto del botón de acción
- `actionIcon` - Icono del botón

**Slots:**
- `default` - Contenido personalizado
- `actions` - Acciones personalizadas

**Ejemplo:**
```vue
<script setup>
import { AppEmptyState } from '@/components/ui'
</script>

<template>
  <AppEmptyState
    icon="pi-inbox"
    title="No hay productos"
    description="Comienza agregando tu primer producto"
    actionLabel="Crear producto"
    actionIcon="pi-plus"
    @action="handleCreate"
  />
</template>
```

### AppErrorState

Estado de error consistente.

**Props:**
- `title` - Título del error (default: `"Error"`)
- `message` - Mensaje de error (requerido)
- `icon` - Icono PrimeIcons (default: `pi-exclamation-circle`)
- `retryLabel` - Texto del botón retry (default: `"Reintentar"`)
- `showRetry` - Muestra botón de reintentar (default: `true`)

**Slots:**
- `default` - Contenido personalizado
- `actions` - Acciones personalizadas

**Ejemplo:**
```vue
<script setup>
import { AppErrorState } from '@/components/ui'
import { ref } from 'vue'

const error = ref('Error al cargar los datos')
</script>

<template>
  <AppErrorState
    title="Error al cargar productos"
    :message="error"
    @retry="fetchProducts"
  />
</template>
```

## Guía de Migración

### Paso 1: Importar componentes

```vue
<script setup lang="ts">
import { AppButton, AppInput, AppBadge, AppEmptyState, AppErrorState } from '@/components/ui'
</script>
```

### Paso 2: Reemplazar botones HTML

**Antes:**
```vue
<button
  class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
  @click="handleCreate"
>
  Crear nuevo
</button>
```

**Después:**
```vue
<AppButton
  label="Crear nuevo"
  icon="pi-plus"
  variant="primary"
  @click="handleCreate"
/>
```

### Paso 3: Reemplazar inputs HTML

**Antes:**
```vue
<label class="block text-sm font-medium text-gray-700">Email</label>
<input
  v-model="email"
  type="email"
  class="mt-1 block w-full rounded-md border-gray-300"
/>
```

**Después:**
```vue
<AppInput
  v-model="email"
  label="Email"
  type="email"
/>
```

### Paso 4: Reemplazar badges

**Antes:**
```vue
<span class="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
  Activo
</span>
```

**Después:**
```vue
<AppBadge label="Activo" variant="success" />
```

### Paso 5: Reemplazar estados vacíos

**Antes:**
```vue
<div class="bg-white rounded-lg shadow p-12 text-center">
  <i class="pi pi-inbox text-6xl text-gray-300 mb-4"></i>
  <h3 class="text-xl font-semibold text-gray-900 mb-2">No hay productos</h3>
  <button @click="handleCreate">Crear producto</button>
</div>
```

**Después:**
```vue
<AppEmptyState
  title="No hay productos"
  actionLabel="Crear producto"
  @action="handleCreate"
/>
```

### Paso 6: Reemplazar estados de error

**Antes:**
```vue
<div class="bg-red-50 border border-red-200 rounded-lg p-6">
  <i class="pi pi-exclamation-circle text-4xl text-red-500"></i>
  <p class="text-red-700">{{ error }}</p>
  <button @click="retry">Reintentar</button>
</div>
```

**Después:**
```vue
<AppErrorState
  :message="error"
  @retry="retry"
/>
```

### Paso 7: Actualizar colores

Reemplaza colores inconsistentes:

- `text-indigo-600` → `text-primary`
- `text-blue-600` → `text-primary`
- `text-gray-700` (en labels) → `text-secondary-700`
- `bg-indigo-600` (en botones) → usa `AppButton`

## Ejemplos de Uso

### Vista de lista completa

```vue
<script setup lang="ts">
import { AppButton, AppInput, AppEmptyState, AppErrorState } from '@/components/ui'
import { ref } from 'vue'

const searchQuery = ref('')
const loading = ref(false)
const error = ref('')
const items = ref([])

const handleCreate = () => {
  // Lógica para crear
}

const fetchItems = async () => {
  // Lógica para cargar
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-secondary">Productos</h1>
      <AppButton
        label="Crear producto"
        icon="pi-plus"
        variant="primary"
        @click="handleCreate"
      />
    </div>

    <!-- Búsqueda -->
    <AppInput
      v-model="searchQuery"
      placeholder="Buscar productos..."
    />

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center items-center p-12">
      <i class="pi pi-spinner pi-spin text-4xl text-primary"></i>
    </div>

    <!-- Error -->
    <AppErrorState
      v-else-if="error"
      :message="error"
      @retry="fetchItems"
    />

    <!-- Empty -->
    <AppEmptyState
      v-else-if="!items.length"
      title="No hay productos"
      description="Comienza agregando tu primer producto"
      actionLabel="Crear producto"
      actionIcon="pi-plus"
      @action="handleCreate"
    />

    <!-- Content -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Items aquí -->
    </div>
  </div>
</template>
```

### Formulario en Dialog

```vue
<script setup lang="ts">
import { AppButton, AppInput } from '@/components/ui'
import Dialog from 'primevue/dialog'
import { ref } from 'vue'

const showDialog = ref(false)
const form = ref({ name: '', description: '' })
const errors = ref({})
const loading = ref(false)

const handleSave = async () => {
  // Lógica de guardado
}
</script>

<template>
  <Dialog
    v-model:visible="showDialog"
    header="Crear producto"
    :style="{ width: '500px' }"
  >
    <div class="space-y-4">
      <AppInput
        v-model="form.name"
        label="Nombre"
        placeholder="Ingrese el nombre"
        required
        :error="errors.name"
      />

      <AppInput
        v-model="form.description"
        label="Descripción"
        placeholder="Ingrese la descripción"
        helpText="Máximo 200 caracteres"
        :error="errors.description"
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
</template>
```

## Skill de Claude

Para que Claude recuerde estas convenciones automáticamente, he creado un skill en:

```
.claude/skills/mitienda-design-system.md
```

Este skill contiene:
- Paleta de colores
- Guía de uso de cada componente
- Patrones comunes
- Anti-patrones a evitar
- Convenciones de clases Tailwind

Claude lo usará automáticamente cuando trabajes en vistas o componentes.

## Paleta de Colores

### Primary (Turquesa MiTienda)
- `primary-50` a `primary-900`
- Uso: Botones principales, links, acciones

### Secondary (Gris)
- `secondary-50` a `secondary-900`
- Uso: Textos, backgrounds

### Semánticos
- `green-*` - Success, activo
- `yellow-*` - Warning
- `red-*` - Danger, error
- `blue-*` - Info

## Convenciones de Tailwind

### Textos
- Labels: `text-secondary-700`
- Texto normal: `text-secondary` o `text-secondary-900`
- Texto secundario: `text-secondary-600`
- Help text: `text-secondary-500`

### Links
- Normal: `text-primary hover:underline`
- Navegación: `text-secondary-700 hover:text-primary`

### Espaciado
- Padding de cards: `p-6`
- Espaciado entre elementos: `space-y-4` o `gap-4`
- Margin bottom de labels: `mb-2`

### Bordes
- Cards: `rounded-lg shadow`
- Inputs: `rounded-md border-gray-300`

## FAQ

### ¿Puedo usar PrimeVue Button directamente?

No, usa `AppButton` para mantener consistencia. Si necesitas una variante nueva, agrégala a `AppButton.vue`.

### ¿Qué hago si necesito un componente que no existe?

1. Verifica si puedes usar los componentes existentes
2. Si no, crea uno nuevo en `src/components/ui/`
3. Sigue las convenciones de naming: `App[Nombre].vue`
4. Expórtalo en `src/components/ui/index.ts`
5. Documéntalo aquí y en el skill

### ¿Cómo migro una vista existente?

Puedes migrar gradualmente:
1. Importa los componentes UI
2. Reemplaza un tipo de elemento a la vez (ej: todos los botones)
3. Prueba que funcione
4. Continúa con el siguiente tipo

No es necesario migrar todo de una vez.

### ¿Qué pasa con componentes específicos como ProductCard?

Los componentes de dominio (ProductCard, OrderCard, etc.) pueden seguir existiendo. Solo asegúrate de que usen los componentes base internamente:

```vue
<!-- ProductCard.vue -->
<template>
  <Card>
    <template #content>
      <!-- contenido -->
      <AppBadge :label="status" :variant="statusVariant" />
      <AppButton label="Ver" variant="text" @click="handleView" />
    </template>
  </Card>
</template>
```

---

**Última actualización**: 2025-11-03
