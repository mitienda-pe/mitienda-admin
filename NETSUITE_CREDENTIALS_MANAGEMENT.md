# Sistema de Gestión de Credenciales NetSuite

**Fecha**: 2025-11-04
**Estado**: ✅ BACKEND COMPLETADO - Frontend pendiente

---

## Resumen

Este módulo permite gestionar las credenciales de NetSuite por tienda desde el panel de administración, eliminando la necesidad de hardcodear credenciales en el código o archivo `.env`.

**Cambios principales:**
- ✅ Credenciales almacenadas en base de datos por tienda
- ✅ Mapeo de series de facturación a IDs de NetSuite
- ✅ Configuración de sincronización automática por tienda
- ✅ API REST completa para gestión de credenciales
- ⏳ Interfaz Vue 3 en mitienda-administrador (pendiente)

---

## Arquitectura

### Base de Datos

#### Tabla: `tiendascredenciales_erp`

Almacena las credenciales OAuth 1.0 de NetSuite por tienda:

```sql
CREATE TABLE `tiendascredenciales_erp` (
  `tiendacredencialerp_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `tienda_id` INT UNSIGNED NOT NULL,

  -- Credenciales NetSuite OAuth 1.0
  `tiendacredencialerp_account_id` VARCHAR(50),
  `tiendacredencialerp_consumer_key` VARCHAR(255),
  `tiendacredencialerp_consumer_secret` TEXT,
  `tiendacredencialerp_token_id` VARCHAR(255),
  `tiendacredencialerp_token_secret` TEXT,

  -- Configuración
  `tiendacredencialerp_subsidiary_id` VARCHAR(20),
  `tiendacredencialerp_location_id` VARCHAR(20),
  `tiendacredencialerp_ubicacion_serie_id` VARCHAR(20),

  -- Control
  `tiendacredencialerp_estado` TINYINT(1) DEFAULT 1,
  `tiendacredencialerp_autosync_enabled` TINYINT(1) DEFAULT 0,

  -- Auditoría
  `tiendacredencialerp_fecha_creacion` DATETIME,
  `tiendacredencialerp_fecha_actualizacion` DATETIME,
  `tiendacredencialerp_usuario_creacion` INT,
  `tiendacredencialerp_usuario_actualizacion` INT,

  FOREIGN KEY (`tienda_id`) REFERENCES `tiendas` (`tienda_id`) ON DELETE CASCADE
);
```

#### Tabla: `tiendaseries_erp_mapping`

Mapea series de facturación electrónica a IDs de NetSuite:

```sql
CREATE TABLE `tiendaseries_erp_mapping` (
  `tiendaserieerp_id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `tienda_id` INT UNSIGNED NOT NULL,
  `empfacturacionserie_id` INT UNSIGNED,

  -- Identificación
  `tiendaserieerp_codigo` VARCHAR(10) NOT NULL,  -- B001, F001, etc.
  `tiendaserieerp_tipo_documento` VARCHAR(20),   -- BOLETA, FACTURA

  -- Mapeo a NetSuite
  `tiendaserieerp_netsuite_id` VARCHAR(20),           -- ID de serie en NetSuite
  `tiendaserieerp_netsuite_doctype_id` VARCHAR(5),    -- 1=Boleta, 2=Factura

  -- Control
  `tiendaserieerp_estado` TINYINT(1) DEFAULT 1,

  -- Auditoría
  `tiendaserieerp_fecha_creacion` DATETIME,
  `tiendaserieerp_fecha_actualizacion` DATETIME,

  FOREIGN KEY (`tienda_id`) REFERENCES `tiendas` (`tienda_id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_tienda_serie` (`tienda_id`, `tiendaserieerp_codigo`)
);
```

---

## API Endpoints

### Base URL
```
http://tu-servidor/api/v1/netsuite-credentials
```

### Autenticación
Todos los endpoints requieren **Bearer Token** en el header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

### 1. Obtener Credenciales de una Tienda

**GET** `/tienda/{tiendaId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "tiendacredencialerp_id": 1,
    "tienda_id": 634,
    "tiendacredencialerp_account_id": "6460294_SB1",
    "tiendacredencialerp_consumer_key": "abc123...",
    "tiendacredencialerp_consumer_secret_masked": "***xyz9",
    "tiendacredencialerp_token_id": "def456...",
    "tiendacredencialerp_token_secret_masked": "***abc3",
    "tiendacredencialerp_subsidiary_id": "3",
    "tiendacredencialerp_location_id": "323",
    "tiendacredencialerp_ubicacion_serie_id": "323",
    "tiendacredencialerp_estado": 1,
    "tiendacredencialerp_autosync_enabled": 1,
    "tiendacredencialerp_fecha_creacion": "2025-11-04 10:00:00"
  }
}
```

**Nota:** Los secrets se enmascaran por seguridad (solo últimos 4 caracteres).

---

### 2. Crear/Actualizar Credenciales

**POST** `/`

**Body:**
```json
{
  "tienda_id": 634,
  "account_id": "6460294_SB1",
  "consumer_key": "abc123...",
  "consumer_secret": "secret123...",
  "token_id": "def456...",
  "token_secret": "tokensecret...",
  "subsidiary_id": "3",
  "location_id": "323",
  "ubicacion_serie_id": "323",
  "autosync_enabled": true,
  "estado": 1
}
```

**Response (Creación):**
```json
{
  "success": true,
  "message": "Credenciales NetSuite creadas correctamente",
  "id": 1
}
```

**Response (Actualización):**
```json
{
  "success": true,
  "message": "Credenciales NetSuite actualizadas correctamente",
  "id": 1
}
```

**Comportamiento:**
- Si ya existe una credencial para la tienda, se **actualiza**
- Si no existe, se **crea** una nueva
- Los secrets SOLO se actualizan si se envían en el request

---

### 3. Probar Conexión

**POST** `/{tiendaId}/test`

Valida que las credenciales configuradas funcionen correctamente.

**Response (Éxito):**
```json
{
  "success": true,
  "message": "Conexión exitosa con NetSuite",
  "account_id": "6460294_SB1"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Error al conectar con NetSuite. Verifique las credenciales."
}
```

---

### 4. Eliminar Credenciales

**DELETE** `/{id}`

**Response:**
```json
{
  "success": true,
  "message": "Credenciales eliminadas correctamente"
}
```

---

### 5. Obtener Series Mapeadas

**GET** `/{tiendaId}/series`

Obtiene todas las series de facturación mapeadas a NetSuite para una tienda.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "tiendaserieerp_id": 1,
      "tienda_id": 634,
      "tiendaserieerp_codigo": "B001",
      "tiendaserieerp_tipo_documento": "BOLETA",
      "tiendaserieerp_netsuite_id": "439",
      "tiendaserieerp_netsuite_doctype_id": "1",
      "tiendaserieerp_estado": 1
    },
    {
      "tiendaserieerp_id": 2,
      "tienda_id": 634,
      "tiendaserieerp_codigo": "F001",
      "tiendaserieerp_tipo_documento": "FACTURA",
      "tiendaserieerp_netsuite_id": null,
      "tiendaserieerp_netsuite_doctype_id": "2",
      "tiendaserieerp_estado": 1
    }
  ]
}
```

---

### 6. Crear/Actualizar Mapeo de Serie

**POST** `/{tiendaId}/series`

**Body:**
```json
{
  "codigo": "B001",
  "tipo_documento": "BOLETA",
  "netsuite_id": "439",
  "netsuite_doctype_id": "1",
  "empfacturacionserie_id": 123,
  "estado": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mapeo de serie guardado correctamente",
  "id": 1
}
```

**Comportamiento:**
- Si ya existe mapeo para esa serie + tienda, se **actualiza**
- Si no existe, se **crea** nuevo

---

### 7. Obtener Series Sin Mapear

**GET** `/{tiendaId}/series/unmapped`

Obtiene series que aún no tienen ID de NetSuite configurado.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "tiendaserieerp_id": 2,
      "tiendaserieerp_codigo": "F001",
      "tiendaserieerp_tipo_documento": "FACTURA",
      "tiendaserieerp_netsuite_id": null
    }
  ]
}
```

---

## Flujo de Trabajo

### Configuración Inicial

```
1. Usuario admin accede al módulo "Configuración → NetSuite"
   ↓
2. Selecciona tienda a configurar
   ↓
3. Ingresa credenciales NetSuite:
   - Account ID
   - Consumer Key
   - Consumer Secret
   - Token ID
   - Token Secret
   ↓
4. Configura parámetros:
   - Subsidiary ID
   - Location ID
   - Ubicación Serie ID
   - Sincronización automática (on/off)
   ↓
5. Click "Probar Conexión"
   ↓
6. Si exitoso → Guardar credenciales
   ↓
7. Mapear series de facturación:
   - Listar series existentes (del módulo de facturación electrónica)
   - Asignar ID de NetSuite a cada serie (B001 → 439, etc.)
   ↓
8. Guardar mapeos
```

### Sincronización de Órdenes

```
Cliente paga orden
   ↓
Sistema actualiza estado = 1 (PAGADO)
   ↓
NetsuiteAutoSync verifica configuración en BD:
   - ¿Credenciales activas para esta tienda?
   - ¿Autosync habilitado?
   ↓
Si ambos = true → Sincronizar automáticamente
   ↓
NetsuiteOrderSync carga:
   - Credenciales OAuth de BD
   - Location/Serie ID de BD
   - Mapeo de series de BD
   ↓
Crea invoice en NetSuite
```

---

## Estructura Vue 3 Frontend

### Ruta del Módulo
```
/Users/carlosvidal/www/mitienda/mitienda-administrador/src/views/configuracion/NetsuiteConfig.vue
```

### Estructura de Archivos

```
src/
├── views/
│   └── configuracion/
│       ├── NetsuiteConfig.vue          # Página principal
│       └── components/
│           ├── NetsuiteCredentials.vue # Formulario de credenciales
│           ├── NetsuiteSeriesMap.vue   # Mapeo de series
│           └── NetsuiteTest.vue        # Probar conexión
├── composables/
│   └── useNetsuite.ts                  # Lógica de negocio
├── services/
│   └── netsuiteApi.ts                  # Cliente API
└── stores/
    └── netsuite.ts                     # Pinia store (opcional)
```

---

### Componente Principal: `NetsuiteConfig.vue`

```vue
<template>
  <div class="netsuite-config">
    <h1>Configuración NetSuite</h1>

    <!-- Selector de tienda -->
    <el-select v-model="selectedTiendaId" placeholder="Seleccionar tienda">
      <el-option
        v-for="tienda in tiendas"
        :key="tienda.tienda_id"
        :label="tienda.tienda_nombre"
        :value="tienda.tienda_id"
      />
    </el-select>

    <!-- Tabs -->
    <el-tabs v-model="activeTab">
      <!-- Tab 1: Credenciales -->
      <el-tab-pane label="Credenciales" name="credentials">
        <NetsuiteCredentials
          :tienda-id="selectedTiendaId"
          @credentials-saved="handleCredentialsSaved"
        />
      </el-tab-pane>

      <!-- Tab 2: Mapeo de Series -->
      <el-tab-pane label="Series" name="series">
        <NetsuiteSeriesMap
          :tienda-id="selectedTiendaId"
        />
      </el-tab-pane>

      <!-- Tab 3: Probar Conexión -->
      <el-tab-pane label="Pruebas" name="test">
        <NetsuiteTest
          :tienda-id="selectedTiendaId"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import NetsuiteCredentials from './components/NetsuiteCredentials.vue'
import NetsuiteSeriesMap from './components/NetsuiteSeriesMap.vue'
import NetsuiteTest from './components/NetsuiteTest.vue'

const selectedTiendaId = ref<number | null>(null)
const activeTab = ref('credentials')

// Cargar tiendas del usuario
const tiendas = ref([
  // Esto vendría de un store o API
])

const handleCredentialsSaved = () => {
  ElMessage.success('Credenciales guardadas correctamente')
  // Opcional: cambiar al tab de series
  activeTab.value = 'series'
}
</script>
```

---

### Componente: `NetsuiteCredentials.vue`

```vue
<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="200px"
  >
    <!-- Account ID -->
    <el-form-item label="Account ID" prop="account_id">
      <el-input v-model="form.account_id" placeholder="6460294_SB1" />
      <el-text size="small" type="info">
        Formato: XXXXXXX_SB1 (sandbox) o XXXXXXX (producción)
      </el-text>
    </el-form-item>

    <!-- Consumer Key -->
    <el-form-item label="Consumer Key" prop="consumer_key">
      <el-input v-model="form.consumer_key" />
    </el-form-item>

    <!-- Consumer Secret -->
    <el-form-item label="Consumer Secret" prop="consumer_secret">
      <el-input
        v-model="form.consumer_secret"
        type="password"
        show-password
        :placeholder="isEdit ? 'Dejar vacío para mantener actual' : ''"
      />
      <el-text v-if="isEdit && existingSecretMask" size="small">
        Actual: {{ existingSecretMask }}
      </el-text>
    </el-form-item>

    <!-- Token ID -->
    <el-form-item label="Token ID" prop="token_id">
      <el-input v-model="form.token_id" />
    </el-form-item>

    <!-- Token Secret -->
    <el-form-item label="Token Secret" prop="token_secret">
      <el-input
        v-model="form.token_secret"
        type="password"
        show-password
        :placeholder="isEdit ? 'Dejar vacío para mantener actual' : ''"
      />
      <el-text v-if="isEdit && existingTokenMask" size="small">
        Actual: {{ existingTokenMask }}
      </el-text>
    </el-form-item>

    <el-divider />

    <!-- Subsidiary ID -->
    <el-form-item label="Subsidiary ID" prop="subsidiary_id">
      <el-input v-model="form.subsidiary_id" placeholder="3" />
      <el-text size="small">ID de la subsidiaria en NetSuite</el-text>
    </el-form-item>

    <!-- Location ID -->
    <el-form-item label="Location ID" prop="location_id">
      <el-input v-model="form.location_id" placeholder="323" />
      <el-text size="small">ID de ubicación por defecto</el-text>
    </el-form-item>

    <!-- Ubicación Serie ID -->
    <el-form-item label="Ubicación Serie ID" prop="ubicacion_serie_id">
      <el-input v-model="form.ubicacion_serie_id" placeholder="323" />
      <el-text size="small">Para campo custbody_pe_ubicacion_para_serie</el-text>
    </el-form-item>

    <el-divider />

    <!-- Auto-sync -->
    <el-form-item label="Sincronización Automática">
      <el-switch
        v-model="form.autosync_enabled"
        active-text="Habilitado"
        inactive-text="Deshabilitado"
      />
      <el-text size="small">
        Sincronizar automáticamente al cambiar orden a estado PAGADO
      </el-text>
    </el-form-item>

    <!-- Estado -->
    <el-form-item label="Estado">
      <el-switch
        v-model="form.estado"
        :active-value="1"
        :inactive-value="0"
        active-text="Activo"
        inactive-text="Inactivo"
      />
    </el-form-item>

    <!-- Botones -->
    <el-form-item>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        Guardar Credenciales
      </el-button>
      <el-button @click="handleTest" :loading="testLoading">
        Probar Conexión
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useNetsuite } from '@/composables/useNetsuite'

const props = defineProps<{
  tiendaId: number | null
}>()

const emit = defineEmits(['credentials-saved'])

const { getCredentials, saveCredentials, testConnection } = useNetsuite()

const formRef = ref()
const loading = ref(false)
const testLoading = ref(false)
const isEdit = ref(false)
const existingSecretMask = ref('')
const existingTokenMask = ref('')

const form = reactive({
  tienda_id: props.tiendaId,
  account_id: '',
  consumer_key: '',
  consumer_secret: '',
  token_id: '',
  token_secret: '',
  subsidiary_id: '3',
  location_id: '323',
  ubicacion_serie_id: '323',
  autosync_enabled: false,
  estado: 1
})

const rules = {
  account_id: [
    { required: true, message: 'Account ID es obligatorio' }
  ],
  consumer_key: [
    { required: true, message: 'Consumer Key es obligatorio' }
  ],
  token_id: [
    { required: true, message: 'Token ID es obligatorio' }
  ]
}

// Cargar credenciales existentes
watch(() => props.tiendaId, async (tiendaId) => {
  if (!tiendaId) return

  try {
    const credentials = await getCredentials(tiendaId)
    if (credentials) {
      isEdit.value = true
      Object.assign(form, {
        tienda_id: tiendaId,
        account_id: credentials.tiendacredencialerp_account_id,
        consumer_key: credentials.tiendacredencialerp_consumer_key,
        consumer_secret: '', // No cargar secrets
        token_id: credentials.tiendacredencialerp_token_id,
        token_secret: '',
        subsidiary_id: credentials.tiendacredencialerp_subsidiary_id,
        location_id: credentials.tiendacredencialerp_location_id,
        ubicacion_serie_id: credentials.tiendacredencialerp_ubicacion_serie_id,
        autosync_enabled: !!credentials.tiendacredencialerp_autosync_enabled,
        estado: credentials.tiendacredencialerp_estado
      })
      existingSecretMask.value = credentials.tiendacredencialerp_consumer_secret_masked
      existingTokenMask.value = credentials.tiendacredencialerp_token_secret_masked
    } else {
      isEdit.value = false
    }
  } catch (error) {
    // No hay credenciales, es creación nueva
    isEdit.value = false
  }
}, { immediate: true })

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    loading.value = true
    try {
      // Si es edición y los secrets están vacíos, no enviarlos
      const payload = { ...form }
      if (isEdit.value) {
        if (!payload.consumer_secret) delete payload.consumer_secret
        if (!payload.token_secret) delete payload.token_secret
      }

      await saveCredentials(payload)
      ElMessage.success('Credenciales guardadas correctamente')
      emit('credentials-saved')
    } catch (error: any) {
      ElMessage.error(error.message || 'Error al guardar credenciales')
    } finally {
      loading.value = false
    }
  })
}

const handleTest = async () => {
  if (!props.tiendaId) {
    ElMessage.warning('Seleccione una tienda')
    return
  }

  testLoading.value = true
  try {
    await testConnection(props.tiendaId)
    ElMessage.success('Conexión exitosa con NetSuite')
  } catch (error: any) {
    ElMessage.error(error.message || 'Error al conectar con NetSuite')
  } finally {
    testLoading.value = false
  }
}
</script>
```

---

### Componente: `NetsuiteSeriesMap.vue`

```vue
<template>
  <div>
    <el-alert
      title="Mapeo de Series"
      type="info"
      :closable="false"
      style="margin-bottom: 20px"
    >
      Asigne los IDs de NetSuite a las series de facturación electrónica configuradas.
    </el-alert>

    <el-table :data="series" style="width: 100%">
      <el-table-column prop="tiendaserieerp_codigo" label="Serie" width="100" />
      <el-table-column prop="tiendaserieerp_tipo_documento" label="Tipo" width="120" />
      <el-table-column label="NetSuite Serie ID" width="200">
        <template #default="{ row }">
          <el-input
            v-model="row.tiendaserieerp_netsuite_id"
            placeholder="Ej: 439"
            size="small"
          />
        </template>
      </el-table-column>
      <el-table-column label="NetSuite DocType ID" width="200">
        <template #default="{ row }">
          <el-select
            v-model="row.tiendaserieerp_netsuite_doctype_id"
            placeholder="Seleccionar"
            size="small"
          >
            <el-option label="1 - Boleta" value="1" />
            <el-option label="2 - Factura" value="2" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="Estado" width="120">
        <template #default="{ row }">
          <el-tag :type="row.tiendaserieerp_netsuite_id ? 'success' : 'warning'">
            {{ row.tiendaserieerp_netsuite_id ? 'Mapeado' : 'Sin mapear' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Acciones" width="150">
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            @click="handleSave(row)"
            :loading="row.saving"
          >
            Guardar
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useNetsuite } from '@/composables/useNetsuite'

const props = defineProps<{
  tiendaId: number | null
}>()

const { getSeries, saveSerie } = useNetsuite()
const series = ref<any[]>([])

watch(() => props.tiendaId, async (tiendaId) => {
  if (!tiendaId) return

  try {
    series.value = await getSeries(tiendaId)
    // Agregar flag de loading a cada fila
    series.value.forEach(s => s.saving = false)
  } catch (error) {
    ElMessage.error('Error al cargar series')
  }
}, { immediate: true })

const handleSave = async (row: any) => {
  if (!props.tiendaId) return

  row.saving = true
  try {
    await saveSerie(props.tiendaId, {
      codigo: row.tiendaserieerp_codigo,
      tipo_documento: row.tiendaserieerp_tipo_documento,
      netsuite_id: row.tiendaserieerp_netsuite_id,
      netsuite_doctype_id: row.tiendaserieerp_netsuite_doctype_id,
      empfacturacionserie_id: row.empfacturacionserie_id
    })
    ElMessage.success(`Serie ${row.tiendaserieerp_codigo} guardada`)
  } catch (error: any) {
    ElMessage.error(error.message || 'Error al guardar serie')
  } finally {
    row.saving = false
  }
}
</script>
```

---

### Composable: `useNetsuite.ts`

```typescript
import { netsuiteApi } from '@/services/netsuiteApi'

export function useNetsuite() {
  const getCredentials = async (tiendaId: number) => {
    const response = await netsuiteApi.get(`/tienda/${tiendaId}`)
    return response.data.data
  }

  const saveCredentials = async (data: any) => {
    const response = await netsuiteApi.post('/', data)
    return response.data
  }

  const testConnection = async (tiendaId: number) => {
    const response = await netsuiteApi.post(`/${tiendaId}/test`)
    return response.data
  }

  const getSeries = async (tiendaId: number) => {
    const response = await netsuiteApi.get(`/${tiendaId}/series`)
    return response.data.data
  }

  const saveSerie = async (tiendaId: number, data: any) => {
    const response = await netsuiteApi.post(`/${tiendaId}/series`, data)
    return response.data
  }

  return {
    getCredentials,
    saveCredentials,
    testConnection,
    getSeries,
    saveSerie
  }
}
```

---

### Service: `netsuiteApi.ts`

```typescript
import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL + '/api/v1/netsuite-credentials'

export const netsuiteApi = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para agregar token
netsuiteApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor para manejar errores
netsuiteApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect a login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

---

## Migración desde .env

### Paso 1: Ejecutar Migraciones

```bash
cd /Users/carlosvidal/www/mitienda/mitienda-api-ci4

# Ejecutar migraciones
php spark migrate
```

### Paso 2: Migrar Credenciales Existentes

Crear script para migrar credenciales de `.env` a base de datos:

```php
<?php
// dev-scripts/migrate_credentials_to_db.php

require_once __DIR__ . '/../vendor/autoload.php';

$app = \Config\Services::codeigniter();
$app->initialize();

$credencialModel = new \App\Models\TiendaCredencialErpModel();

// Tiendas con NetSuite habilitado (del .env)
$tiendasIds = explode(',', getenv('NETSUITE_ENABLED_STORES'));

foreach ($tiendasIds as $tiendaId) {
    $credencialModel->createWithAudit([
        'tienda_id' => $tiendaId,
        'tiendacredencialerp_account_id' => getenv('NS_ACCOUNT_ID'),
        'tiendacredencialerp_consumer_key' => getenv('NS_CONSUMER_KEY'),
        'tiendacredencialerp_consumer_secret' => getenv('NS_CONSUMER_SECRET'),
        'tiendacredencialerp_token_id' => getenv('NS_TOKEN_ID'),
        'tiendacredencialerp_token_secret' => getenv('NS_TOKEN_SECRET'),
        'tiendacredencialerp_location_id' => getenv('NS_LOCATION_ID'),
        'tiendacredencialerp_ubicacion_serie_id' => getenv('NS_UBICACION_PARA_SERIE_ID'),
        'tiendacredencialerp_autosync_enabled' => getenv('NETSUITE_AUTO_SYNC_ENABLED') === 'true' ? 1 : 0,
        'tiendacredencialerp_estado' => 1,
    ]);

    echo "✅ Credenciales migradas para tienda {$tiendaId}\n";
}

// Migrar series
$serieModel = new \App\Models\TiendaSerieErpMappingModel();

$seriesConfig = [
    'B001' => ['id' => getenv('NS_SERIE_B001_ID'), 'tipo' => 'BOLETA', 'doctype' => '1'],
    'BBL1' => ['id' => getenv('NS_SERIE_BBL1_ID'), 'tipo' => 'BOLETA', 'doctype' => '1'],
    'F001' => ['id' => getenv('NS_SERIE_F001_ID'), 'tipo' => 'FACTURA', 'doctype' => '2'],
];

foreach ($tiendasIds as $tiendaId) {
    foreach ($seriesConfig as $codigo => $config) {
        if (!empty($config['id'])) {
            $serieModel->upsertSerie($tiendaId, $codigo, [
                'tiendaserieerp_codigo' => $codigo,
                'tiendaserieerp_tipo_documento' => $config['tipo'],
                'tiendaserieerp_netsuite_id' => $config['id'],
                'tiendaserieerp_netsuite_doctype_id' => $config['doctype'],
                'tiendaserieerp_estado' => 1,
            ]);
            echo "✅ Serie {$codigo} mapeada para tienda {$tiendaId}\n";
        }
    }
}

echo "\n🎉 Migración completada!\n";
```

---

## Testing

### Test 1: Crear Credenciales vía API

```bash
curl -X POST http://localhost:8080/api/v1/netsuite-credentials \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tienda_id": 634,
    "account_id": "6460294_SB1",
    "consumer_key": "abc...",
    "consumer_secret": "secret...",
    "token_id": "token...",
    "token_secret": "tokensecret...",
    "location_id": "323",
    "ubicacion_serie_id": "323",
    "autosync_enabled": true
  }'
```

### Test 2: Obtener Credenciales

```bash
curl -X GET http://localhost:8080/api/v1/netsuite-credentials/tienda/634 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 3: Probar Conexión

```bash
curl -X POST http://localhost:8080/api/v1/netsuite-credentials/634/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test 4: Mapear Serie

```bash
curl -X POST http://localhost:8080/api/v1/netsuite-credentials/634/series \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": "B001",
    "tipo_documento": "BOLETA",
    "netsuite_id": "439",
    "netsuite_doctype_id": "1"
  }'
```

---

## Seguridad

### Protección de Secrets

1. **En API Response**: Los secrets se enmascaran (solo últimos 4 caracteres)
2. **En Frontend**: Nunca mostrar secrets completos
3. **En Base de Datos**: Considerar encriptar `consumer_secret` y `token_secret`

### Ejemplo de Encriptación (Opcional)

```php
// En el modelo, antes de guardar
use CodeIgniter\Encryption\Encryption;

$encryption = \Config\Services::encryption();

$data['tiendacredencialerp_consumer_secret'] = base64_encode(
    $encryption->encrypt($data['tiendacredencialerp_consumer_secret'])
);

// Al leer
$decrypted = $encryption->decrypt(
    base64_decode($credencial['tiendacredencialerp_consumer_secret'])
);
```

---

## Ventajas del Nuevo Sistema

### Antes (.env)
- ❌ Credenciales hardcodeadas en archivo
- ❌ Mismas credenciales para todas las tiendas
- ❌ Requiere acceso al servidor para cambiar
- ❌ No auditable
- ❌ Riesgo de exponer secrets en repositorio

### Ahora (Base de Datos)
- ✅ Credenciales por tienda
- ✅ Gestión desde panel admin
- ✅ Auditoría completa (quién, cuándo)
- ✅ Encriptación opcional
- ✅ Sincronización automática configurable por tienda
- ✅ Mapeo dinámico de series

---

## Resumen de Archivos Creados

### Backend (CodeIgniter 4)

| Archivo | Descripción |
|---------|-------------|
| [app/Database/Migrations/2025-11-04-000001_CreateTiendasCredencialesErp.php](../app/Database/Migrations/2025-11-04-000001_CreateTiendasCredencialesErp.php) | Migración tabla credenciales |
| [app/Database/Migrations/2025-11-04-000002_CreateTiendasSeriesErpMapping.php](../app/Database/Migrations/2025-11-04-000002_CreateTiendasSeriesErpMapping.php) | Migración tabla series |
| [app/Models/TiendaCredencialErpModel.php](../app/Models/TiendaCredencialErpModel.php) | Modelo de credenciales |
| [app/Models/TiendaSerieErpMappingModel.php](../app/Models/TiendaSerieErpMappingModel.php) | Modelo de series |
| [app/Controllers/V1/NetsuiteCredentials.php](../app/Controllers/V1/NetsuiteCredentials.php) | Controlador API |
| [app/Services/NetsuiteService.php](../app/Services/NetsuiteService.php) | MODIFICADO - Acepta credenciales |
| [app/Services/NetsuiteOrderMapper.php](../app/Services/NetsuiteOrderMapper.php) | MODIFICADO - Lee config de BD |
| [app/Services/NetsuiteOrderSync.php](../app/Services/NetsuiteOrderSync.php) | MODIFICADO - Pasa tiendaId |
| [app/Services/NetsuiteAutoSync.php](../app/Services/NetsuiteAutoSync.php) | MODIFICADO - Verifica BD primero |
| [app/Config/Routes.php](../app/Config/Routes.php) | MODIFICADO - Agrega rutas API |

### Frontend (Vue 3) - PENDIENTE

| Archivo | Descripción |
|---------|-------------|
| `src/views/configuracion/NetsuiteConfig.vue` | Página principal |
| `src/views/configuracion/components/NetsuiteCredentials.vue` | Formulario credenciales |
| `src/views/configuracion/components/NetsuiteSeriesMap.vue` | Mapeo series |
| `src/views/configuracion/components/NetsuiteTest.vue` | Probar conexión |
| `src/composables/useNetsuite.ts` | Lógica de negocio |
| `src/services/netsuiteApi.ts` | Cliente API |

---

## Próximos Pasos

1. ✅ **Backend completado**
2. ⏳ **Crear interfaz Vue 3** siguiendo estructura documentada
3. ⏳ **Migrar credenciales existentes** con script
4. ⏳ **Testing end-to-end**
5. ⏳ **Implementar encriptación** de secrets (opcional)
6. ⏳ **Documentación de usuario** con screenshots

---

## Soporte

Para dudas o problemas con el módulo:
- Revisar logs: `writable/logs/log-{FECHA}.log`
- Verificar migraciones: `php spark migrate:status`
- Test de conexión desde API antes de usar frontend
