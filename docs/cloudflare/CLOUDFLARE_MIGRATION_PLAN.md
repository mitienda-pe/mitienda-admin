# Plan de Migración Masiva: AWS S3 → Cloudflare Images

## Resumen Ejecutivo

**Objetivo**: Migrar todas las imágenes de tiendas activas desde AWS S3 a Cloudflare Images para eventualmente desenchufar AWS y reducir costos.

**Alcance**:
- **878,309 imágenes** totales en sistema
- **9,659 tiendas** con imágenes
- **343,061 productos** con imágenes vinculadas
- **635,519 vinculaciones** producto-imagen

**Estado Actual**:
- ✅ Solo **35 imágenes** (0.004%) migradas a Cloudflare
- ❌ **878,274 imágenes** (99.996%) pendientes de migración

**Enfoque**: Migración gradual tienda por tienda con checkpoints para reanudar en caso de interrupción.

**Plataforma**: CI4 API (PHP 8.4) + Vue 3 Backoffice

---

## Tabla de Contenidos

1. [Análisis de Alcance](#1-análisis-de-alcance)
2. [Arquitectura de Migración](#2-arquitectura-de-migración)
3. [Estrategia de Ejecución](#3-estrategia-de-ejecución)
4. [Diseño de Base de Datos](#4-diseño-de-base-de-datos)
5. [API Endpoints](#5-api-endpoints)
6. [Interfaz Vue 3](#6-interfaz-vue-3)
7. [Flujo de Migración](#7-flujo-de-migración)
8. [Manejo de Errores y Reintentos](#8-manejo-de-errores-y-reintentos)
9. [Estimación de Recursos](#9-estimación-de-recursos)
10. [Plan de Implementación](#10-plan-de-implementación)
11. [Monitoreo y Reportes](#11-monitoreo-y-reportes)
12. [Plan de Rollback](#12-plan-de-rollback)

---

## 1. Análisis de Alcance

### 1.1 Estadísticas Globales

```sql
-- Ejecutado: 2025-10-16

Total de imágenes:           878,309
Tiendas con imágenes:        9,659
Productos con imágenes:      343,061
Vinculaciones:               635,519

Imágenes en Cloudflare:      35 (0.004%)
Imágenes en AWS S3:          878,274 (99.996%)
```

### 1.2 Top 10 Tiendas por Volumen

| Tienda ID | Nombre | Imágenes | % del Total |
|-----------|--------|----------|-------------|
| 8377 | hourglass | 30,327 | 3.45% |
| 14447 | Antiguedades del Castillo | 17,058 | 1.94% |
| 634 | Ziyaz | 14,880 | 1.69% |
| 22913 | Fabrimer | 13,366 | 1.52% |
| 576 | Scrapbooking Peru | 13,319 | 1.52% |
| 11317 | PequeSale® | 13,308 | 1.52% |
| 10816 | Doña Elsa | 12,474 | 1.42% |
| 9854 | Ludicojugueteria | 11,556 | 1.32% |
| 8379 | DECORPLAS | 11,019 | 1.25% |
| 17310 | Limay Store | 10,282 | 1.17% |
| **TOTAL TOP 10** | | **137,589** | **15.66%** |

### 1.3 Distribución de Imágenes por Tienda

```sql
-- Query para análisis de distribución
SELECT
  CASE
    WHEN num_imagenes <= 10 THEN '1-10 imágenes'
    WHEN num_imagenes <= 50 THEN '11-50 imágenes'
    WHEN num_imagenes <= 100 THEN '51-100 imágenes'
    WHEN num_imagenes <= 500 THEN '101-500 imágenes'
    WHEN num_imagenes <= 1000 THEN '501-1000 imágenes'
    ELSE 'Más de 1000 imágenes'
  END as rango,
  COUNT(*) as num_tiendas,
  SUM(num_imagenes) as total_imagenes
FROM (
  SELECT tienda_id, COUNT(*) as num_imagenes
  FROM tiendasimagenes
  GROUP BY tienda_id
) t
GROUP BY rango
ORDER BY MIN(num_imagenes);
```

### 1.4 Criterios de Elegibilidad

**Tiendas a migrar**:
- ✅ Tiendas activas (cualquier status activo)
- ✅ Tiendas vencidas en últimos 60 días (posible reactivación)

**Tiendas a excluir**:
- ❌ Tiendas vencidas hace más de 60 días
- ❌ Tiendas marcadas como "demo" o "test"
- ❌ Tiendas sin productos activos

---

## 2. Arquitectura de Migración

### 2.1 Componentes del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                      Vue 3 Backoffice                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐│
│  │ Migration        │  │ Progress         │  │ Reports       ││
│  │ Dashboard        │  │ Monitor          │  │ Viewer        ││
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬───────┘│
│           │                     │                     │        │
│           └─────────────────────┴─────────────────────┘        │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API
┌────────────────────────────▼────────────────────────────────────┐
│                     CI4 API (PHP 8.4)                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            MigrationController                            │  │
│  │  - POST /migration/start                                 │  │
│  │  - POST /migration/pause                                 │  │
│  │  - POST /migration/resume                                │  │
│  │  - GET  /migration/status                                │  │
│  └────────┬─────────────────────────────────────────────┬────┘  │
│           │                                             │        │
│  ┌────────▼────────────┐                   ┌───────────▼──────┐ │
│  │ MigrationService    │                   │ CloudflareImages │ │
│  │ - processTienda()   │────────────────▶  │ Service          │ │
│  │ - processImagen()   │                   │ - upload()       │ │
│  │ - checkpoint()      │                   └──────────────────┘ │
│  └────────┬────────────┘                                        │
│           │                                                      │
│  ┌────────▼────────────────────────────────────────────────┐   │
│  │              Queue System (Redis)                       │   │
│  │  - migration_queue                                      │   │
│  │  - failed_queue                                         │   │
│  │  - retry_queue                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    MySQL Database                               │
│  ┌─────────────────────┐  ┌─────────────────────┐             │
│  │ migration_jobs      │  │ migration_images    │             │
│  │ (Control tiendas)   │  │ (Control imágenes)  │             │
│  └─────────────────────┘  └─────────────────────┘             │
│  ┌─────────────────────┐  ┌─────────────────────┐             │
│  │ tiendasimagenes     │  │ cloudflare_images   │             │
│  │ (Legacy)            │  │ (Nueva)             │             │
│  └─────────────────────┘  └─────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ Upload
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare Images                            │
│  - Almacenamiento ilimitado                                     │
│  - Transformaciones on-the-fly                                  │
│  - CDN global                                                   │
└─────────────────────────────────────────────────────────────────┘
                             │
                             │ Fallback (durante migración)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AWS S3 (Legacy)                              │
│  - Fuente de imágenes originales                               │
│  - Se desconectará después de migración completa               │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flujo de Datos

```
1. Usuario inicia migración desde Vue 3
   ↓
2. API crea job en migration_jobs con status 'pending'
   ↓
3. API encola tiendas en Redis (migration_queue)
   ↓
4. Worker procesa tienda por tienda:
   4.1. Obtiene lista de imágenes de la tienda
   4.2. Para cada imagen:
        - Descarga desde S3
        - Sube a Cloudflare
        - Inserta en cloudflare_images
        - Actualiza tiendasimagenes.cloudflare_id
        - Vincula productos en productos_cloudflare_images
        - Registra en migration_images
   4.3. Guarda checkpoint cada N imágenes
   ↓
5. Al completar tienda, actualiza migration_jobs
   ↓
6. Continúa con siguiente tienda hasta terminar
```

---

## 3. Estrategia de Ejecución

### 3.1 Fases de Migración

#### **Fase 1: Preparación** (1 semana)
- Implementar tablas de control (`migration_jobs`, `migration_images`)
- Desarrollar API endpoints
- Crear interfaz Vue 3
- Configurar queue system (Redis)
- Tests en staging con 3-5 tiendas pequeñas

#### **Fase 2: Piloto** (1 semana)
- Migrar 50 tiendas pequeñas (< 100 imágenes c/u)
- Validar integridad de datos
- Ajustar performance
- Documentar problemas encontrados

#### **Fase 3: Migración Masiva** (4-8 semanas)
- Migrar tiendas en batches de 100
- Ejecutar 24/7 con monitoreo
- Priorizar tiendas activas primero
- Pausar/reanudar según carga del servidor

#### **Fase 4: Validación** (1 semana)
- Verificar integridad de todas las migraciones
- Corregir errores encontrados
- Re-migrar imágenes fallidas
- Pruebas de carga con Cloudflare

#### **Fase 5: Transición** (1 semana)
- Cambiar frontend para usar Cloudflare primero
- Mantener S3 como fallback
- Monitorear errores 404

#### **Fase 6: Desconexión AWS** (después de 30 días)
- Si todo OK, eliminar dependencias de S3
- Cancelar servicios AWS
- Archivar backups de S3

### 3.2 Priorización de Tiendas

**Orden de ejecución**:

1. **Prioridad ALTA** (primeras 2 semanas):
   - Tiendas activas con < 1000 imágenes
   - Tiendas con ventas en últimos 30 días

2. **Prioridad MEDIA** (semanas 3-4):
   - Tiendas activas con 1000-5000 imágenes
   - Tiendas con ventas en últimos 60 días

3. **Prioridad BAJA** (semanas 5-6):
   - Tiendas activas con > 5000 imágenes
   - Tiendas vencidas en últimos 60 días

4. **Prioridad MUY BAJA** (opcional):
   - Tiendas vencidas hace más de 60 días
   - Solo si hay capacidad disponible

### 3.3 Estrategia de Checkpoint

**Checkpoint cada**:
- ✅ 100 imágenes procesadas
- ✅ 5 minutos de ejecución
- ✅ Antes de pausar/detener
- ✅ Después de completar una tienda

**Información guardada en checkpoint**:
```json
{
  "job_id": 12345,
  "tienda_id": 8377,
  "total_images": 30327,
  "processed_images": 15000,
  "failed_images": 23,
  "current_image_id": 888123,
  "timestamp": "2025-10-16 14:30:00",
  "estimated_remaining_seconds": 7200
}
```

---

## 4. Diseño de Base de Datos

### 4.1 Tabla: `migration_jobs`

Control de alto nivel por tienda.

```sql
CREATE TABLE IF NOT EXISTS `migration_jobs` (
  `job_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tienda_id` INT UNSIGNED NOT NULL,
  `tienda_nombre` VARCHAR(200) DEFAULT NULL,
  `status` ENUM('pending', 'in_progress', 'paused', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
  `priority` TINYINT NOT NULL DEFAULT 3 COMMENT '1=alta, 2=media, 3=baja',

  -- Contadores
  `total_images` INT UNSIGNED NOT NULL DEFAULT 0,
  `processed_images` INT UNSIGNED NOT NULL DEFAULT 0,
  `successful_images` INT UNSIGNED NOT NULL DEFAULT 0,
  `failed_images` INT UNSIGNED NOT NULL DEFAULT 0,
  `skipped_images` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Ya estaban en Cloudflare',

  -- Checkpoint
  `last_processed_image_id` INT UNSIGNED DEFAULT NULL,
  `checkpoint_data` JSON DEFAULT NULL COMMENT 'Metadata adicional para reanudar',

  -- Tiempos
  `started_at` DATETIME DEFAULT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  `paused_at` DATETIME DEFAULT NULL,
  `estimated_completion` DATETIME DEFAULT NULL,

  -- Errores
  `error_message` TEXT DEFAULT NULL,
  `retry_count` TINYINT NOT NULL DEFAULT 0,
  `max_retries` TINYINT NOT NULL DEFAULT 3,

  -- Auditoría
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` INT UNSIGNED DEFAULT NULL COMMENT 'Usuario que inició',

  PRIMARY KEY (`job_id`),
  UNIQUE KEY `unique_tienda` (`tienda_id`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4.2 Tabla: `migration_images`

Control detallado por imagen.

```sql
CREATE TABLE IF NOT EXISTS `migration_images` (
  `migration_image_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `job_id` INT UNSIGNED NOT NULL,
  `tienda_id` INT UNSIGNED NOT NULL,
  `tiendaimagen_id` INT UNSIGNED NOT NULL,
  `cloudflare_imagen_id` INT UNSIGNED DEFAULT NULL COMMENT 'FK a cloudflare_images',

  `status` ENUM('pending', 'processing', 'completed', 'failed', 'skipped') NOT NULL DEFAULT 'pending',

  -- URLs
  `s3_url` VARCHAR(500) DEFAULT NULL,
  `cloudflare_id` VARCHAR(255) DEFAULT NULL,
  `cloudflare_url` VARCHAR(500) DEFAULT NULL,

  -- Metadata
  `file_size_bytes` INT UNSIGNED DEFAULT NULL,
  `file_extension` VARCHAR(10) DEFAULT NULL,
  `image_width` INT UNSIGNED DEFAULT NULL,
  `image_height` INT UNSIGNED DEFAULT NULL,

  -- Productos vinculados
  `linked_products_count` INT UNSIGNED NOT NULL DEFAULT 0,

  -- Tiempos
  `started_at` DATETIME DEFAULT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  `processing_time_ms` INT UNSIGNED DEFAULT NULL,

  -- Errores
  `error_message` TEXT DEFAULT NULL,
  `retry_count` TINYINT NOT NULL DEFAULT 0,

  -- Auditoría
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`migration_image_id`),
  UNIQUE KEY `unique_job_image` (`job_id`, `tiendaimagen_id`),
  KEY `idx_job_id` (`job_id`),
  KEY `idx_tienda_id` (`tienda_id`),
  KEY `idx_tiendaimagen_id` (`tiendaimagen_id`),
  KEY `idx_status` (`status`),
  KEY `idx_cloudflare_imagen_id` (`cloudflare_imagen_id`),

  CONSTRAINT `fk_mi_job` FOREIGN KEY (`job_id`)
    REFERENCES `migration_jobs` (`job_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT `fk_mi_cloudflare` FOREIGN KEY (`cloudflare_imagen_id`)
    REFERENCES `cloudflare_images` (`cloudflare_imagen_id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4.3 Índices Adicionales

```sql
-- Índice para búsqueda rápida de jobs pendientes
CREATE INDEX idx_status_priority_created
ON migration_jobs (status, priority, created_at);

-- Índice para reportes de progreso por tienda
CREATE INDEX idx_tienda_status
ON migration_images (tienda_id, status);

-- Índice para reportes de errores
CREATE INDEX idx_failed_images
ON migration_images (status, created_at)
WHERE status = 'failed';
```

---

## 5. API Endpoints

### 5.1 Gestión de Migración

#### POST `/api/v1/migration/jobs`

Crea un nuevo job de migración para una o varias tiendas.

**Request**:
```json
{
  "tienda_ids": [8377, 14447, 634],
  "priority": 1,
  "options": {
    "skip_existing": true,
    "retry_failed": true,
    "checkpoint_interval": 100
  }
}
```

**Response 201**:
```json
{
  "success": true,
  "data": {
    "jobs_created": 3,
    "job_ids": [12345, 12346, 12347],
    "total_images": 62265,
    "estimated_duration_minutes": 520
  }
}
```

#### POST `/api/v1/migration/jobs/bulk`

Crea jobs masivos según criterios.

**Request**:
```json
{
  "criteria": {
    "status": "active",
    "max_images_per_tienda": 5000,
    "exclude_tienda_ids": [123, 456]
  },
  "priority": 2,
  "batch_size": 100
}
```

**Response 201**:
```json
{
  "success": true,
  "data": {
    "jobs_created": 8542,
    "total_images": 650123,
    "estimated_duration_days": 12
  }
}
```

#### GET `/api/v1/migration/jobs/{job_id}`

Obtiene estado de un job específico.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "job_id": 12345,
    "tienda_id": 8377,
    "tienda_nombre": "hourglass",
    "status": "in_progress",
    "priority": 1,
    "progress": {
      "total_images": 30327,
      "processed_images": 15234,
      "successful_images": 15210,
      "failed_images": 24,
      "skipped_images": 0,
      "percentage": 50.23
    },
    "timing": {
      "started_at": "2025-10-16 10:00:00",
      "elapsed_seconds": 7200,
      "estimated_remaining_seconds": 7100,
      "estimated_completion": "2025-10-16 14:00:00"
    },
    "current_rate": {
      "images_per_second": 2.12,
      "images_per_minute": 127,
      "images_per_hour": 7620
    }
  }
}
```

#### GET `/api/v1/migration/jobs`

Lista todos los jobs con filtros.

**Query Params**:
- `status`: pending, in_progress, completed, failed
- `priority`: 1, 2, 3
- `tienda_id`: ID específico
- `page`: Página (default: 1)
- `per_page`: Items por página (default: 20)

**Response 200**:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 8542,
      "total_pages": 428
    },
    "summary": {
      "total_jobs": 8542,
      "pending": 7234,
      "in_progress": 8,
      "completed": 1250,
      "failed": 50
    }
  }
}
```

#### POST `/api/v1/migration/jobs/{job_id}/pause`

Pausa un job en ejecución.

**Response 200**:
```json
{
  "success": true,
  "message": "Job paused successfully",
  "data": {
    "job_id": 12345,
    "status": "paused",
    "checkpoint": {
      "last_processed_image_id": 888123,
      "processed_images": 15234
    }
  }
}
```

#### POST `/api/v1/migration/jobs/{job_id}/resume`

Reanuda un job pausado.

**Response 200**:
```json
{
  "success": true,
  "message": "Job resumed successfully",
  "data": {
    "job_id": 12345,
    "status": "in_progress",
    "resuming_from": {
      "last_processed_image_id": 888123,
      "remaining_images": 15093
    }
  }
}
```

#### POST `/api/v1/migration/jobs/{job_id}/cancel`

Cancela un job (no elimina progreso).

**Response 200**:
```json
{
  "success": true,
  "message": "Job cancelled",
  "data": {
    "job_id": 12345,
    "status": "cancelled",
    "processed_images": 15234,
    "can_resume": true
  }
}
```

#### POST `/api/v1/migration/jobs/{job_id}/retry`

Reintenta imágenes fallidas de un job.

**Response 200**:
```json
{
  "success": true,
  "message": "Retry initiated",
  "data": {
    "job_id": 12345,
    "failed_images": 24,
    "retrying": 24
  }
}
```

### 5.2 Monitoreo y Estadísticas

#### GET `/api/v1/migration/stats`

Estadísticas globales de migración.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "global": {
      "total_images_in_system": 878309,
      "images_in_cloudflare": 35,
      "images_pending_migration": 878274,
      "migration_percentage": 0.004
    },
    "jobs": {
      "total": 8542,
      "pending": 7234,
      "in_progress": 8,
      "completed": 1250,
      "failed": 50,
      "cancelled": 0
    },
    "performance": {
      "images_migrated_today": 125430,
      "average_rate_per_hour": 5226,
      "estimated_days_remaining": 11.5
    },
    "errors": {
      "total_failed_images": 1523,
      "failure_rate_percentage": 0.17,
      "common_errors": [
        {"error": "Timeout downloading from S3", "count": 856},
        {"error": "Invalid image format", "count": 412},
        {"error": "Cloudflare rate limit", "count": 255}
      ]
    }
  }
}
```

#### GET `/api/v1/migration/dashboard`

Datos para dashboard en tiempo real.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "current_jobs": [
      {
        "job_id": 12345,
        "tienda_nombre": "hourglass",
        "progress_percentage": 50.23,
        "images_per_second": 2.12,
        "eta_seconds": 7100
      },
      ...8 jobs activos máximo...
    ],
    "recent_completions": [
      {
        "job_id": 12340,
        "tienda_nombre": "Ziyaz",
        "completed_at": "2025-10-16 13:45:00",
        "total_images": 14880,
        "duration_seconds": 6200
      },
      ...últimos 10...
    ],
    "system_health": {
      "cpu_usage_percentage": 75,
      "memory_usage_percentage": 68,
      "queue_size": 7234,
      "workers_active": 8,
      "workers_idle": 2
    }
  }
}
```

---

## 6. Interfaz Vue 3

### 6.1 Vistas Principales

#### **MigrationDashboard.vue**

Panel principal con resumen y control.

**Componentes**:
```vue
<template>
  <div class="migration-dashboard">
    <!-- Header con stats globales -->
    <StatsOverview
      :total-images="stats.total_images"
      :migrated="stats.migrated"
      :pending="stats.pending"
      :percentage="stats.percentage"
    />

    <!-- Control de migración -->
    <MigrationControls
      @start-migration="handleStart"
      @pause-all="handlePauseAll"
      @resume-all="handleResumeAll"
    />

    <!-- Jobs en progreso -->
    <ActiveJobsList
      :jobs="activeJobs"
      @pause-job="handlePauseJob"
      @cancel-job="handleCancelJob"
    />

    <!-- Tabla de todas las tiendas -->
    <TiendasTable
      :tiendas="tiendas"
      :pagination="pagination"
      @select-tiendas="handleSelectTiendas"
      @start-tienda="handleStartTienda"
    />
  </div>
</template>
```

#### **JobDetailView.vue**

Vista detallada de un job específico.

**Componentes**:
```vue
<template>
  <div class="job-detail">
    <!-- Header con info de la tienda -->
    <JobHeader
      :job="job"
      :tienda="tienda"
    />

    <!-- Progreso visual -->
    <ProgressBar
      :processed="job.processed_images"
      :total="job.total_images"
      :failed="job.failed_images"
    />

    <!-- Métricas en tiempo real -->
    <MetricsCards
      :rate="job.images_per_second"
      :eta="job.estimated_completion"
      :elapsed="job.elapsed_seconds"
    />

    <!-- Tabla de imágenes procesadas -->
    <ImagesTable
      :images="images"
      :status-filter="statusFilter"
      @retry-image="handleRetryImage"
    />

    <!-- Log de errores -->
    <ErrorLog
      v-if="job.failed_images > 0"
      :errors="errors"
    />
  </div>
</template>
```

#### **ReportsView.vue**

Reportes y análisis de migración.

**Componentes**:
```vue
<template>
  <div class="reports">
    <!-- Filtros -->
    <ReportFilters
      v-model:date-range="dateRange"
      v-model:status="statusFilter"
      @generate="generateReport"
    />

    <!-- Gráficos -->
    <Charts
      :migration-progress="chartData.progress"
      :error-distribution="chartData.errors"
      :performance-over-time="chartData.performance"
    />

    <!-- Tabla de tiendas completadas -->
    <CompletedJobsTable
      :jobs="completedJobs"
      @export="handleExport"
    />
  </div>
</template>
```

### 6.2 Composables

#### `useMigrationJobs.ts`

```typescript
import { ref, computed } from 'vue';
import { apiClient } from '@/services/api';

export function useMigrationJobs() {
  const jobs = ref<MigrationJob[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const activeJobs = computed(() =>
    jobs.value.filter((j) => j.status === 'in_progress')
  );

  const pendingJobs = computed(() =>
    jobs.value.filter((j) => j.status === 'pending')
  );

  const fetchJobs = async (filters?: JobFilters) => {
    loading.value = true;
    try {
      const response = await apiClient.get('/api/v1/migration/jobs', {
        params: filters,
      });
      jobs.value = response.data.data.items;
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  };

  const startMigration = async (tiendaIds: number[], priority: number = 2) => {
    loading.value = true;
    try {
      const response = await apiClient.post('/api/v1/migration/jobs', {
        tienda_ids: tiendaIds,
        priority,
        options: {
          skip_existing: true,
          retry_failed: true,
          checkpoint_interval: 100,
        },
      });
      await fetchJobs();
      return response.data.data;
    } catch (e) {
      error.value = e as Error;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const pauseJob = async (jobId: number) => {
    await apiClient.post(`/api/v1/migration/jobs/${jobId}/pause`);
    await fetchJobs();
  };

  const resumeJob = async (jobId: number) => {
    await apiClient.post(`/api/v1/migration/jobs/${jobId}/resume`);
    await fetchJobs();
  };

  const cancelJob = async (jobId: number) => {
    await apiClient.post(`/api/v1/migration/jobs/${jobId}/cancel`);
    await fetchJobs();
  };

  const retryJob = async (jobId: number) => {
    await apiClient.post(`/api/v1/migration/jobs/${jobId}/retry`);
    await fetchJobs();
  };

  return {
    jobs,
    activeJobs,
    pendingJobs,
    loading,
    error,
    fetchJobs,
    startMigration,
    pauseJob,
    resumeJob,
    cancelJob,
    retryJob,
  };
}
```

#### `useMigrationStats.ts`

```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import { apiClient } from '@/services/api';

export function useMigrationStats(refreshInterval: number = 5000) {
  const stats = ref<MigrationStats | null>(null);
  const loading = ref(false);
  let intervalId: number | null = null;

  const fetchStats = async () => {
    loading.value = true;
    try {
      const response = await apiClient.get('/api/v1/migration/stats');
      stats.value = response.data.data;
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    } finally {
      loading.value = false;
    }
  };

  const startAutoRefresh = () => {
    fetchStats();
    intervalId = window.setInterval(fetchStats, refreshInterval);
  };

  const stopAutoRefresh = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  onMounted(startAutoRefresh);
  onUnmounted(stopAutoRefresh);

  return {
    stats,
    loading,
    refresh: fetchStats,
  };
}
```

---

## 7. Flujo de Migración

### 7.1 Proceso Detallado por Imagen

```php
<?php
// CI4: MigrationService.php

class MigrationService
{
    public function processImagen(int $tiendaimagenId, int $jobId): bool
    {
        $startTime = microtime(true);

        try {
            // 1. Obtener datos de la imagen
            $tiendaimagen = $this->getTiendaimagen($tiendaimagenId);

            // 2. Verificar si ya existe en Cloudflare
            if ($tiendaimagen->cloudflare_id) {
                $this->markAsSkipped($tiendaimagenId, $jobId);
                return true;
            }

            // 3. Construir URL de S3
            $s3Url = $this->buildS3Url($tiendaimagen);

            // 4. Descargar desde S3 a temp
            $tempPath = $this->downloadFromS3($s3Url);

            if (!$tempPath) {
                throw new \Exception("Failed to download from S3");
            }

            // 5. Subir a Cloudflare
            $cloudflareResult = $this->cloudflareService->uploadImage(
                $tempPath,
                $tiendaimagen->tiendaimagen_titulo ?? ''
            );

            // 6. Insertar en cloudflare_images
            $cloudflareImagenId = $this->insertCloudflareImage([
                'tienda_id' => $tiendaimagen->tienda_id,
                'cloudflare_id' => $cloudflareResult['id'],
                'cloudflare_url' => $cloudflareResult['url'],
                'imagen_nombre' => $tiendaimagen->tiendaimagen_nombre,
                'imagen_titulo' => $tiendaimagen->tiendaimagen_titulo,
                'tiendaimagen_id' => $tiendaimagenId,
                'fecha_subida' => date('Y-m-d H:i:s'),
            ]);

            // 7. Actualizar tiendasimagenes
            $this->updateTiendasimagenes($tiendaimagenId, $cloudflareResult['id']);

            // 8. Vincular productos
            $linkedProducts = $this->linkProducts($tiendaimagenId, $cloudflareImagenId);

            // 9. Registrar en migration_images
            $processingTime = (microtime(true) - $startTime) * 1000;

            $this->recordMigrationImage([
                'job_id' => $jobId,
                'tienda_id' => $tiendaimagen->tienda_id,
                'tiendaimagen_id' => $tiendaimagenId,
                'cloudflare_imagen_id' => $cloudflareImagenId,
                'status' => 'completed',
                'cloudflare_id' => $cloudflareResult['id'],
                'cloudflare_url' => $cloudflareResult['url'],
                'linked_products_count' => count($linkedProducts),
                'processing_time_ms' => $processingTime,
            ]);

            // 10. Limpiar temp
            @unlink($tempPath);

            return true;

        } catch (\Exception $e) {
            // Registrar error
            $this->recordMigrationImage([
                'job_id' => $jobId,
                'tienda_id' => $tiendaimagen->tienda_id ?? 0,
                'tiendaimagen_id' => $tiendaimagenId,
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            log_message('error', "Migration failed for image {$tiendaimagenId}: " . $e->getMessage());

            return false;
        }
    }

    protected function linkProducts(int $tiendaimagenId, int $cloudflareImagenId): array
    {
        // Buscar productos vinculados a esta imagen
        $productosImagenes = $this->db->table('productosimagenes')
            ->where('tiendaimagen_id', $tiendaimagenId)
            ->get()
            ->getResult();

        $linked = [];

        foreach ($productosImagenes as $pi) {
            // Insertar en productos_cloudflare_images
            $this->db->table('productos_cloudflare_images')->insert([
                'producto_id' => $pi->producto_id,
                'cloudflare_imagen_id' => $cloudflareImagenId,
                'orden' => $pi->productoimagen_orden,
                'fecha_vinculo' => date('Y-m-d H:i:s'),
            ]);

            $linked[] = $pi->producto_id;
        }

        return $linked;
    }
}
```

### 7.2 Worker de Migración

```php
<?php
// CI4: Commands/MigrationWorker.php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;

class MigrationWorker extends BaseCommand
{
    protected $group = 'Migration';
    protected $name = 'migration:worker';
    protected $description = 'Procesa jobs de migración desde la cola';

    public function run(array $params)
    {
        $this->write('Starting migration worker...', 'green');

        $migrationService = service('MigrationService');
        $redis = service('redis');

        while (true) {
            try {
                // 1. Obtener siguiente job de la cola
                $jobData = $redis->lpop('migration_queue');

                if (!$jobData) {
                    // No hay jobs, esperar
                    sleep(5);
                    continue;
                }

                $job = json_decode($jobData, true);
                $jobId = $job['job_id'];
                $tiendaId = $job['tienda_id'];

                $this->write("Processing job {$jobId} for tienda {$tiendaId}...");

                // 2. Marcar job como in_progress
                $migrationService->updateJobStatus($jobId, 'in_progress');

                // 3. Obtener imágenes de la tienda
                $imagenes = $migrationService->getImagenesPendientes($tiendaId, $jobId);

                $this->write("Found {$imagenes->countAllResults()} images to process");

                $processed = 0;
                $successful = 0;
                $failed = 0;
                $checkpointInterval = 100;

                // 4. Procesar cada imagen
                foreach ($imagenes as $imagen) {
                    $success = $migrationService->processImagen(
                        $imagen->tiendaimagen_id,
                        $jobId
                    );

                    $processed++;
                    if ($success) {
                        $successful++;
                    } else {
                        $failed++;
                    }

                    // 5. Checkpoint cada N imágenes
                    if ($processed % $checkpointInterval === 0) {
                        $migrationService->saveCheckpoint($jobId, [
                            'processed_images' => $processed,
                            'successful_images' => $successful,
                            'failed_images' => $failed,
                            'last_processed_image_id' => $imagen->tiendaimagen_id,
                        ]);

                        $this->write("Checkpoint: {$processed} images processed");
                    }

                    // 6. Verificar si el job fue pausado
                    if ($migrationService->isJobPaused($jobId)) {
                        $this->write("Job {$jobId} was paused. Stopping.", 'yellow');
                        break;
                    }
                }

                // 7. Marcar job como completado
                $migrationService->updateJobStatus($jobId, 'completed', [
                    'processed_images' => $processed,
                    'successful_images' => $successful,
                    'failed_images' => $failed,
                ]);

                $this->write("Job {$jobId} completed! Success: {$successful}, Failed: {$failed}", 'green');

            } catch (\Exception $e) {
                $this->write("Error: " . $e->getMessage(), 'red');

                // Mover a failed_queue para retry
                if (isset($jobData)) {
                    $redis->rpush('failed_queue', $jobData);
                }

                sleep(10); // Esperar antes de continuar
            }
        }
    }
}
```

**Ejecutar worker**:
```bash
php spark migration:worker
```

**Ejecutar múltiples workers** (para procesar en paralelo):
```bash
# Terminal 1
php spark migration:worker

# Terminal 2
php spark migration:worker

# Terminal 3
php spark migration:worker

# ...hasta 10 workers
```

---

## 8. Manejo de Errores y Reintentos

### 8.1 Categorías de Errores

#### **Errores Recuperables** (reintento automático)
- Timeout al descargar de S3
- Rate limit de Cloudflare (429)
- Timeout de red
- Error temporal de S3 (503)

**Estrategia**: Retry con backoff exponencial (1s, 2s, 4s, 8s, 16s)

#### **Errores No Recuperables** (manual)
- Imagen no existe en S3 (404)
- Formato de imagen inválido
- Imagen corrupta
- Credenciales inválidas de Cloudflare

**Estrategia**: Marcar como failed, revisar manualmente

#### **Errores de Sistema**
- Disco lleno
- Out of memory
- Conexión a BD perdida

**Estrategia**: Pausar worker, alertar administrador

### 8.2 Lógica de Reintentos

```php
<?php
// MigrationService.php

protected function processImagenWithRetry(
    int $tiendaimagenId,
    int $jobId,
    int $maxRetries = 3
): bool {
    $retryCount = 0;
    $lastError = null;

    while ($retryCount < $maxRetries) {
        try {
            return $this->processImagen($tiendaimagenId, $jobId);
        } catch (RecoverableException $e) {
            $retryCount++;
            $lastError = $e;

            // Backoff exponencial
            $waitSeconds = pow(2, $retryCount);
            log_message('warning', "Retry {$retryCount}/{$maxRetries} for image {$tiendaimagenId} after {$waitSeconds}s");
            sleep($waitSeconds);

        } catch (NonRecoverableException $e) {
            // No reintentar
            log_message('error', "Non-recoverable error for image {$tiendaimagenId}: " . $e->getMessage());
            return false;
        }
    }

    // Agotados los reintentos
    log_message('error', "Max retries reached for image {$tiendaimagenId}. Last error: " . $lastError->getMessage());
    return false;
}
```

### 8.3 Cola de Failed Jobs

```php
<?php
// Commands/RetryFailedJobs.php

class RetryFailedJobs extends BaseCommand
{
    protected $name = 'migration:retry-failed';

    public function run(array $params)
    {
        $redis = service('redis');
        $migrationService = service('MigrationService');

        $this->write('Retrying failed jobs...');

        $retried = 0;

        while ($jobData = $redis->lpop('failed_queue')) {
            $job = json_decode($jobData, true);

            // Verificar si ya se reintentó demasiadas veces
            $currentRetries = $migrationService->getJobRetryCount($job['job_id']);

            if ($currentRetries >= 3) {
                $this->write("Job {$job['job_id']} exceeded max retries. Skipping.", 'yellow');
                $redis->rpush('dead_queue', $jobData);
                continue;
            }

            // Re-encolar para retry
            $redis->rpush('migration_queue', $jobData);
            $migrationService->incrementJobRetryCount($job['job_id']);

            $retried++;
        }

        $this->write("Retried {$retried} failed jobs", 'green');
    }
}
```

---

## 9. Estimación de Recursos

### 9.1 Capacidad de Procesamiento

**Mediciones del sistema legacy**:
- Tiempo promedio por imagen: **0.47 segundos** (upload + inserción + vinculación)
- 1 worker puede procesar: **~7,600 imágenes/hora** = **~127 imágenes/minuto** = **~2.1 imágenes/segundo**

**Con 10 workers en paralelo**:
- Capacidad: **~76,000 imágenes/hora**
- **~1.8 millones imágenes/día**

### 9.2 Tiempo Estimado

**Escenario Optimista** (10 workers, 24/7, sin errores):
- 878,274 imágenes ÷ 76,000 img/hora = **11.6 horas** ✅

**Escenario Realista** (8 workers promedio, errores 2%, pausas):
- Capacidad efectiva: ~50,000 img/hora
- 878,274 imágenes ÷ 50,000 img/hora = **17.5 horas** ≈ **2 días**

**Escenario Conservador** (5 workers, errores 5%, mantenimiento):
- Capacidad efectiva: ~30,000 img/hora
- 878,274 imágenes ÷ 30,000 img/hora = **29.3 horas** ≈ **4 días**

### 9.3 Recursos de Servidor

**CPU**:
- 10 workers simultáneos
- ~70% CPU por worker (procesamiento de imagen)
- Total: 1-2 cores dedicados

**Memoria**:
- ~50MB por worker
- Total: ~500MB RAM

**Disco**:
- Temp storage: ~20GB (imágenes temporales)
- Logs: ~5GB (durante migración)

**Red**:
- Download desde S3: ~10 Mbps promedio
- Upload a Cloudflare: ~15 Mbps promedio
- Total: ~25 Mbps

**Base de Datos**:
- ~200 queries/segundo (inserts/updates)
- Índices optimizados necesarios

### 9.4 Costos

**Cloudflare Images**:
- Plan actual: Verificar límites
- Storage: Ilimitado (incluido)
- Bandwidth: Ilimitado (incluido)
- Transformaciones: Ilimitadas (incluido)

**AWS S3** (durante migración):
- Data transfer OUT: ~500 GB × $0.09/GB = **$45 USD** (one-time)
- Requests: ~900,000 GET × $0.0004/1000 = **$0.36 USD** (one-time)
- **Total AWS**: ~$45 USD one-time

**Servidor**:
- Sin costo adicional (usar servidor actual)

---

## 10. Plan de Implementación

### 10.1 Timeline

| Semana | Fase | Tareas | Entregables |
|--------|------|--------|-------------|
| **1** | Setup | - Crear tablas migration_*<br>- Implementar MigrationService<br>- Crear endpoints API<br>- Setup Redis queue | DB schema<br>API funcional<br>Queue configurado |
| **2** | Frontend | - Crear componentes Vue 3<br>- Implementar dashboard<br>- Tests E2E | UI completo<br>Tests pasando |
| **3** | Testing | - Migrar 3 tiendas pequeñas<br>- Validar integridad<br>- Ajustar performance | Piloto exitoso<br>Métricas validadas |
| **4** | Piloto | - Migrar 50 tiendas<br>- Documentar problemas<br>- Optimizaciones | 50 tiendas OK<br>Checklist ajustado |
| **5-6** | Masiva 1 | - Migrar 4,000 tiendas<br>- Monitoreo 24/7<br>- Corrección de errores | ~350k imágenes<br>Reportes diarios |
| **7-8** | Masiva 2 | - Migrar restantes 5,659 tiendas<br>- Re-intentar failed<br>- Validación completa | Migración completa<br>Reporte final |
| **9** | Validación | - Verificar integridad<br>- Tests de carga<br>- Documentación | Certificación OK<br>Docs actualizados |
| **10** | Transición | - Frontend usa Cloudflare first<br>- S3 como fallback<br>- Monitoreo errores | Live en producción |
| **11-14** | Observación | - Monitoreo 30 días<br>- Fix edge cases<br>- Performance tuning | Sistema estable |
| **15** | Desconexión | - Eliminar dependencias S3<br>- Cancelar servicios AWS<br>- Archivar backups | AWS desconectado ✅ |

### 10.2 Hitos Críticos

✅ **Milestone 1**: Piloto de 3 tiendas exitoso (fin semana 3)
✅ **Milestone 2**: 50 tiendas migradas sin errores críticos (fin semana 4)
✅ **Milestone 3**: 50% de imágenes migradas (fin semana 6)
✅ **Milestone 4**: 100% de imágenes migradas (fin semana 8)
✅ **Milestone 5**: Frontend live con Cloudflare (fin semana 10)
✅ **Milestone 6**: AWS desconectado (fin semana 15)

### 10.3 Criterios de Éxito

**Técnicos**:
- ✅ 99.9% de imágenes migradas exitosamente
- ✅ 0% de pérdida de datos
- ✅ 100% de vinculaciones producto-imagen preservadas
- ✅ Tasa de error < 0.5%
- ✅ Tiempo de respuesta frontend < 500ms

**Negocio**:
- ✅ Ahorro de costos AWS > 80%
- ✅ Zero downtime para usuarios finales
- ✅ Performance igual o mejor que S3

---

## 11. Monitoreo y Reportes

### 11.1 Dashboard en Tiempo Real

**Métricas en vivo** (actualización cada 5 segundos):
- Jobs activos (máx 10)
- Imágenes procesadas/hora
- Tasa de éxito/error
- ETA para completar migración total
- Workers activos
- CPU/RAM/Red usage

### 11.2 Reportes Diarios

**Email automático cada día a las 8 AM**:
```
Subject: Reporte Diario Migración Cloudflare - 2025-10-20

Resumen del día (últimas 24h):
- Imágenes migradas: 125,430
- Jobs completados: 287 tiendas
- Tasa de éxito: 99.87%
- Errores: 163 (0.13%)

Progreso total:
- Total migrado: 450,230 / 878,274 (51.26%)
- Días restantes estimados: 3.5 días

Top 3 errores:
1. Timeout S3: 89 casos
2. Invalid format: 45 casos
3. Rate limit: 29 casos

Tiendas pendientes prioridad ALTA: 1,234
```

### 11.3 Alertas

**Críticas** (Slack/Email inmediato):
- Tasa de error > 5%
- Worker crashed
- Disco lleno > 90%
- BD conexión perdida
- Cloudflare API down

**Warnings** (Slack):
- Tasa de error > 2%
- Queue size > 5,000
- CPU > 85%
- RAM > 85%

### 11.4 Logs

**Estructura de logs**:
```
logs/
├── migration/
│   ├── 2025-10-16-jobs.log
│   ├── 2025-10-16-images.log
│   ├── 2025-10-16-errors.log
│   └── 2025-10-16-performance.log
```

**Nivel de logging**:
- INFO: Checkpoints, completions
- WARNING: Reintentos, timeouts
- ERROR: Fallos permanentes
- DEBUG: Detalle de cada imagen (solo en dev)

---

## 12. Plan de Rollback

### 12.1 Escenarios de Rollback

#### **Escenario 1: Errores en masa (>10% failure rate)**

**Acciones**:
1. Pausar todos los workers inmediatamente
2. Analizar logs para identificar causa raíz
3. Rollback código si es bug de la migración
4. Corregir issue
5. Re-validar con 1 tienda de prueba
6. Reanudar migración

**Datos NO afectados**:
- Imágenes ya migradas permanecen en Cloudflare
- Tablas legacy intactas
- Puede reanudarse desde checkpoint

#### **Escenario 2: Cloudflare tiene problemas**

**Acciones**:
1. Pausar migración
2. Sistema sigue funcionando con S3 (no hay downtime para usuarios)
3. Esperar a que Cloudflare se recupere
4. Reanudar migración

#### **Escenario 3: Performance inaceptable después de switch**

**Acciones**:
1. Cambiar frontend para volver a usar S3 first
2. Investigar issue de performance
3. Optimizar (CDN config, imagen variants, etc)
4. Re-switch a Cloudflare cuando esté listo

### 12.2 Backups

**Antes de iniciar migración**:
```bash
# Backup de tablas críticas
mysqldump -h 129.213.75.80 -u admin -p mitiendape \
  tiendasimagenes \
  productosimagenes \
  cloudflare_images \
  productos_cloudflare_images \
  > backup_pre_migration_$(date +%Y%m%d).sql
```

**Durante migración** (daily):
```bash
# Backup incremental de tablas migration_*
mysqldump -h 129.213.75.80 -u admin -p mitiendape \
  migration_jobs \
  migration_images \
  > backup_migration_progress_$(date +%Y%m%d).sql
```

### 12.3 Rollback de Datos

**Si necesitas eliminar migración de una tienda específica**:
```sql
-- 1. Identificar job
SELECT job_id FROM migration_jobs WHERE tienda_id = 8377;

-- 2. Obtener imágenes migradas
SELECT cloudflare_imagen_id, tiendaimagen_id
FROM migration_images
WHERE job_id = 12345 AND status = 'completed';

-- 3. Eliminar de Cloudflare (via API)
-- Ver script rollback_tienda.php

-- 4. Limpiar vinculaciones
DELETE FROM productos_cloudflare_images
WHERE cloudflare_imagen_id IN (
  SELECT cloudflare_imagen_id FROM migration_images WHERE job_id = 12345
);

-- 5. Limpiar cloudflare_images
DELETE FROM cloudflare_images
WHERE cloudflare_imagen_id IN (
  SELECT cloudflare_imagen_id FROM migration_images WHERE job_id = 12345
);

-- 6. Limpiar tiendasimagenes.cloudflare_id
UPDATE tiendasimagenes
SET cloudflare_id = NULL
WHERE tiendaimagen_id IN (
  SELECT tiendaimagen_id FROM migration_images WHERE job_id = 12345
);

-- 7. Eliminar registros de migración
DELETE FROM migration_images WHERE job_id = 12345;
DELETE FROM migration_jobs WHERE job_id = 12345;
```

---

## 13. Checklist Pre-Launch

### 13.1 Infraestructura

- [ ] Servidor tiene recursos suficientes (CPU, RAM, Disco)
- [ ] Redis instalado y configurado
- [ ] Cloudflare API credentials válidos
- [ ] S3 access configurado correctamente
- [ ] Logs directory con permisos correctos
- [ ] Backups configurados y testeados

### 13.2 Base de Datos

- [ ] Tablas `migration_jobs` y `migration_images` creadas
- [ ] Índices optimizados
- [ ] Backup de tablas legacy realizado
- [ ] Espacio suficiente en disco (logs + migration tables)

### 13.3 Código

- [ ] MigrationService implementado y testeado
- [ ] CloudflareImagesService validado
- [ ] Worker command funcional
- [ ] Retry logic implementada
- [ ] Error handling completo
- [ ] Tests unitarios passing

### 13.4 Frontend

- [ ] Dashboard Vue 3 funcional
- [ ] Componentes testeados
- [ ] API integration OK
- [ ] Real-time updates funcionando
- [ ] Error messages user-friendly

### 13.5 Monitoreo

- [ ] Logs configurados
- [ ] Alertas de Slack/Email setup
- [ ] Dashboard de métricas en vivo
- [ ] Reportes diarios automatizados

### 13.6 Documentación

- [ ] Runbook para equipo de ops
- [ ] Procedimientos de rollback documentados
- [ ] FAQs para issues comunes
- [ ] Contactos de escalamiento

---

## 14. Contacto y Soporte

**Responsable del Proyecto**: Carlos Vidal (carlos@mitienda.pe)
**Equipo Técnico**: Desarrollo CI4 + Vue 3
**Infraestructura**: DevOps Team

**Documentos Relacionados**:
- [CLOUDFLARE_IMAGES_API_DOCUMENTATION.md](CLOUDFLARE_IMAGES_API_DOCUMENTATION.md)
- [CLOUDFLARE_IMAGES_INTEGRATION.md](CLOUDFLARE_IMAGES_INTEGRATION.md)

**Última actualización**: 2025-10-16
**Versión**: 1.0
**Estado**: Plan aprobado, pendiente de implementación

---

## ACTUALIZACIÓN CRÍTICA: Solo Subir Original/XLarge

**Fecha**: 2025-10-16 (post-creación del plan)

### Optimización de Estrategia

**IMPORTANTE**: Cloudflare Images hace redimensionamiento on-the-fly, por lo que **NO es necesario subir múltiples variantes** de cada imagen.

#### Estrategia Optimizada

Por cada `tiendaimagen_id`, subir **SOLO UNA imagen**:

1. **Si la imagen tiene crop aplicado**: Subir `producto_xlarge` (807x807 o similar, con crop)
2. **Si la imagen NO tiene crop**: Subir `_original` (imagen completa en su tamaño original)

#### Beneficios

- ✅ **Reduce uploads en ~85%** (solo 1 variante en vez de ~7)
- ✅ **Ahorra tiempo**: Migración puede completarse en **1-2 días** en vez de 4-8 días
- ✅ **Ahorra storage en S3 temp**: Solo descargar 1 archivo, no 7
- ✅ **Reduce costos AWS**: Menos data transfer desde S3
- ✅ **Simplifica lógica**: No necesita iterar sobre thumbnails

#### Cómo Determinar Qué Subir

```php
<?php
// MigrationService.php - ACTUALIZADO

protected function getImageToUpload(object $tiendaimagen): ?string
{
    $tiendaId = $tiendaimagen->tienda_id;
    $imagenNombre = $tiendaimagen->tiendaimagen_nombre;

    // Determinar directorio (ej: tienda_000265)
    $directorio = 'tienda_' . str_pad($tiendaId, 6, '0', STR_PAD_LEFT);

    // Buscar en tiendasimagenesdetalles
    $detalles = $this->db->table('tiendasimagenesdetalles')
        ->where('tiendaimagen_id', $tiendaimagen->tiendaimagen_id)
        ->get()
        ->getResult();

    // 1. Priorizar producto_xlarge si existe (puede tener crop)
    foreach ($detalles as $detalle) {
        if (strpos($detalle->tiendaimagendetalle_tamannio, 'producto_xlarge') !== false) {
            $filename = $detalle->tiendaimagendetalle_nombre;
            $s3Path = "uploads/{$directorio}/{$filename}";
            return $s3Path;
        }
    }

    // 2. Fallback a _original (sin crop, imagen completa)
    foreach ($detalles as $detalle) {
        if ($detalle->tiendaimagendetalle_tamannio === 'original') {
            $filename = $detalle->tiendaimagendetalle_nombre;
            $s3Path = "uploads/{$directorio}/{$filename}";
            return $s3Path;
        }
    }

    // 3. Si no existe ninguna, log warning
    log_message('warning', "No suitable image found for tiendaimagen_id: {$tiendaimagen->tiendaimagen_id}");
    return null;
}
```

#### Uso en Migración

```php
<?php
public function processImagen(int $tiendaimagenId, int $jobId): bool
{
    try {
        $tiendaimagen = $this->getTiendaimagen($tiendaimagenId);

        // Verificar si ya existe
        if ($tiendaimagen->cloudflare_id) {
            $this->markAsSkipped($tiendaimagenId, $jobId);
            return true;
        }

        // CAMBIO: Obtener SOLO la imagen óptima
        $s3Path = $this->getImageToUpload($tiendaimagen);

        if (!$s3Path) {
            throw new \Exception("No suitable image variant found");
        }

        // Descargar SOLO esa imagen
        $tempPath = $this->downloadFromS3($s3Path);

        // Subir a Cloudflare
        $cloudflareResult = $this->cloudflareService->uploadImage($tempPath);

        // ... resto del proceso igual ...

        return true;
    } catch (\Exception $e) {
        // ... manejo de errores ...
    }
}
```

#### Variantes en Frontend

Cloudflare genera variantes on-the-fly usando URLs:

```typescript
// Vue 3 - useCloudflareVariants.ts

export function useCloudflareVariants() {
  const accountHash = '2998d27925d94d6941e16e703022867d';

  // Generar URL con transformaciones
  const getImageUrl = (
    cloudflareId: string,
    options: {
      width?: number;
      height?: number;
      fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
      format?: 'auto' | 'avif' | 'webp' | 'json';
      quality?: number;
    } = {}
  ): string => {
    const params = new URLSearchParams();

    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.fit) params.append('fit', options.fit);
    if (options.format) params.append('format', options.format);
    if (options.quality) params.append('quality', options.quality.toString());

    const query = params.toString();
    return `https://imagedelivery.net/${accountHash}/${cloudflareId}/${query ? `?${query}` : 'public'}`;
  };

  return { getImageUrl };
}
```

**Ejemplos de uso**:
```vue
<template>
  <!-- Thumbnail pequeño -->
  <img :src="getImageUrl(image.cloudflare_id, { width: 150, height: 150, fit: 'cover' })" />

  <!-- Imagen mediana -->
  <img :src="getImageUrl(image.cloudflare_id, { width: 600, fit: 'scale-down', format: 'auto' })" />

  <!-- Imagen grande con calidad alta -->
  <img :src="getImageUrl(image.cloudflare_id, { width: 1200, quality: 90, format: 'webp' })" />

  <!-- Responsive con srcset -->
  <img
    :srcset="`
      ${getImageUrl(image.cloudflare_id, { width: 400 })} 400w,
      ${getImageUrl(image.cloudflare_id, { width: 800 })} 800w,
      ${getImageUrl(image.cloudflare_id, { width: 1200 })} 1200w
    `"
    sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
  />
</template>
```

#### Estimación Actualizada

**Tiempo de migración** (solo 1 imagen por tiendaimagen_id):
- 878,274 imágenes × 0.47s/imagen = **412,488 segundos** = **~115 horas** = **~5 días**

**Con 10 workers en paralelo**:
- 115 horas ÷ 10 = **~11.5 horas** ✅

**Escenario realista** (8 workers, 2% errores):
- **~14-18 horas** = **1-2 días** ✅

**Ahorro de storage**:
- **No necesitamos** almacenar ~6M thumbnails en Cloudflare
- Solo almacenamos **878K imágenes originales**
- Cloudflare genera variantes on-demand (sin costo adicional)

#### Checklist Actualizado

- [ ] Modificar `getImageToUpload()` para seleccionar solo xlarge o original
- [ ] Actualizar tests para validar selección correcta
- [ ] Documentar en frontend cómo usar URLs de Cloudflare con transformaciones
- [ ] Validar que producto_xlarge tiene crop aplicado vs original
- [ ] Verificar performance de Cloudflare con transformaciones on-the-fly

---

