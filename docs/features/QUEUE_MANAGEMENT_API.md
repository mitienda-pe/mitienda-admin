# Queue Management API

API endpoints para gestionar la cola de trabajos asíncronos (NetSuite sync jobs) desde el backoffice.

## 🔐 Autenticación

Todos los endpoints requieren autenticación con token JWT.

```
Authorization: Bearer {token}
```

---

## 📊 Endpoints Disponibles

### 1. **GET /api/v1/queue/status**

Obtener estado general de todas las colas.

**Response:**
```json
{
  "success": true,
  "data": {
    "pending_jobs": [
      {"queue": "netsuite", "count": 3}
    ],
    "reserved_jobs": [
      {"queue": "netsuite", "count": 1}
    ],
    "failed_jobs_count": 5,
    "oldest_pending_age_seconds": 120,
    "oldest_pending_job": {
      "queue": "netsuite",
      "created_at": 1730997654,
      "available_at": 1730997654
    },
    "timestamp": "2025-11-07 19:30:00"
  }
}
```

---

### 2. **GET /api/v1/queue/jobs**

Listar jobs en la cola (pending o processing).

**Query Parameters:**
- `queue` (optional): Filtrar por cola (ej: `netsuite`)
- `status` (optional): `pending` | `reserved` | `all` (default: `all`)
- `limit` (optional): Cantidad de resultados (default: 50, max: 200)

**Ejemplos:**
```bash
# Ver todos los jobs pendientes de NetSuite
GET /api/v1/queue/jobs?queue=netsuite&status=pending

# Ver últimos 100 jobs
GET /api/v1/queue/jobs?limit=100
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": 123,
        "queue": "netsuite",
        "attempts": 0,
        "max_attempts": 3,
        "job_class": "App\\Jobs\\NetsuiteSyncJob",
        "order_id": 803196,
        "tienda_id": 12097,
        "created_at_human": "2025-11-07 17:42:56",
        "available_at_human": "2025-11-07 17:42:56",
        "reserved_at_human": null,
        "age_seconds": 245
      }
    ],
    "count": 1,
    "filters": {
      "queue": "netsuite",
      "status": "pending",
      "limit": 50
    }
  }
}
```

---

### 3. **GET /api/v1/queue/failed**

Listar jobs que fallaron permanentemente.

**Query Parameters:**
- `limit` (optional): Cantidad de resultados (default: 50, max: 200)

**Response:**
```json
{
  "success": true,
  "data": {
    "failed_jobs": [
      {
        "id": 45,
        "queue": "netsuite",
        "job_class": "App\\Jobs\\NetsuiteSyncJob",
        "order_id": 803193,
        "tienda_id": 12097,
        "exception_short": "NetSuite sync failed: exception - MySQL server has gone away...",
        "failed_at": "2025-11-07 17:45:59"
      }
    ],
    "count": 1
  }
}
```

---

### 4. **POST /api/v1/queue/retry/{failed_job_id}**

Reintentar un job fallido específico.

**Parámetros:**
- `failed_job_id`: ID del failed job

**Ejemplo:**
```bash
POST /api/v1/queue/retry/45
```

**Response:**
```json
{
  "success": true,
  "message": "Job 45 moved back to queue for retry",
  "data": {
    "queue": "netsuite",
    "failed_at": "2025-11-07 17:45:59"
  }
}
```

**Efecto:**
- Mueve el job de `failed_jobs` a `jobs`
- Resetea attempts a 0
- El job se procesará nuevamente (con el fix aplicado)

---

### 5. **POST /api/v1/queue/retry-all-failed**

Reintentar TODOS los jobs fallidos.

**⚠️ CUIDADO:** Si hay muchos jobs fallidos, esto puede generar mucha carga.

**Response:**
```json
{
  "success": true,
  "message": "Retried 5 failed jobs",
  "data": {
    "retried_count": 5
  }
}
```

---

### 6. **DELETE /api/v1/queue/jobs/{job_id}**

Eliminar un job de la cola (pending o reserved).

**Parámetros:**
- `job_id`: ID del job

**Ejemplo:**
```bash
DELETE /api/v1/queue/jobs/123
```

**Response:**
```json
{
  "success": true,
  "message": "Job 123 deleted",
  "data": {
    "queue": "netsuite",
    "attempts": 2
  }
}
```

**Uso:** Para cancelar jobs que están atascados o que no quieres procesar.

---

### 7. **DELETE /api/v1/queue/failed/{failed_job_id}**

Eliminar permanentemente un job fallido (sin retry).

**Parámetros:**
- `failed_job_id`: ID del failed job

**Ejemplo:**
```bash
DELETE /api/v1/queue/failed/45
```

**Response:**
```json
{
  "success": true,
  "message": "Failed job 45 deleted permanently",
  "data": {
    "queue": "netsuite",
    "failed_at": "2025-11-07 17:45:59"
  }
}
```

---

### 8. **POST /api/v1/queue/clear-failed**

Eliminar TODOS los jobs fallidos permanentemente.

**⚠️ CUIDADO:** Esta acción NO se puede deshacer.

**Response:**
```json
{
  "success": true,
  "message": "Cleared 5 failed jobs",
  "data": {
    "deleted_count": 5
  }
}
```

---

## 🎯 Casos de Uso Comunes

### Caso 1: Ver estado de las órdenes 803193 y 803196

```bash
# Ver jobs fallidos
GET /api/v1/queue/failed

# Buscar por order_id en la respuesta
# Si están en failed_jobs, significa que fallaron permanentemente
```

### Caso 2: Reintentar órdenes que fallaron por "MySQL server has gone away"

```bash
# Opción A: Retry específico (recomendado)
POST /api/v1/queue/retry/45  # ID del failed job

# Opción B: Retry todos los fallidos (si todos son por el mismo error ya corregido)
POST /api/v1/queue/retry-all-failed
```

### Caso 3: Cancelar un job atascado

```bash
# Ver jobs en la cola
GET /api/v1/queue/jobs?status=reserved

# Si hay un job "reserved" por mucho tiempo (>5min), eliminarlo
DELETE /api/v1/queue/jobs/123
```

### Caso 4: Limpiar jobs fallidos antiguos

```bash
# Ver failed jobs
GET /api/v1/queue/failed

# Eliminar uno por uno
DELETE /api/v1/queue/failed/45

# O eliminar todos de una vez
POST /api/v1/queue/clear-failed
```

---

## 📋 Estados de Jobs

### Jobs Table (jobs activos)

| Campo | Descripción |
|-------|-------------|
| `reserved_at IS NULL` | **Pending** - Esperando ser procesado |
| `reserved_at IS NOT NULL` | **Reserved/Processing** - Siendo procesado ahora |
| `attempts` | Número de intentos realizados |
| `max_attempts` | Máximo de intentos antes de fallar permanentemente |

### Failed Jobs Table (failed_jobs)

Jobs que fallaron después de `max_attempts` intentos.

| Campo | Descripción |
|-------|-------------|
| `exception` | Error completo que causó el fallo |
| `failed_at` | Timestamp cuando falló permanentemente |
| `payload` | Datos serializados del job (para retry) |

---

## 🔄 Flujo de Retry

1. **Job falla** → Se intenta hasta `max_attempts` veces (default: 3)
2. **Falla permanentemente** → Se mueve a `failed_jobs` table
3. **Admin hace retry** → `POST /api/v1/queue/retry/{id}`
4. **Job vuelve a `jobs`** → Con `attempts = 0` y `max_attempts = 3`
5. **Worker procesa** → Con el fix aplicado, debería pasar

---

## 💡 Recomendaciones

### ¿Qué hacer con las órdenes 803193 y 803196?

**Opción 1: Retry después del fix (RECOMENDADO)**
```bash
# 1. Verificar que están en failed_jobs
GET /api/v1/queue/failed

# 2. Encontrar sus IDs en failed_jobs (ej: 45, 46)

# 3. Retry uno por uno
POST /api/v1/queue/retry/45
POST /api/v1/queue/retry/46

# 4. Monitorear logs para ver si pasan
tail -f /var/www/api2.mitienda.pe/writable/logs/log-$(date +%Y-%m-%d).log | grep "803193\|803196"
```

**Opción 2: Eliminar y re-sincronizar manualmente**
```bash
# 1. Eliminar de failed_jobs
DELETE /api/v1/queue/failed/45

# 2. Usar endpoint manual de sync
POST /test/netsuite/sync-order/803193
```

### Monitoreo Continuo

Agregar al backoffice un dashboard que muestre:
- Total pending jobs
- Total reserved jobs
- Total failed jobs
- Oldest pending job age (alertar si > 5 min)
- Botón "Retry All Failed"
- Lista de failed jobs con botón "Retry" individual

---

## 🔧 Troubleshooting

### Error: "Failed job X not found"

El job ya fue reintentado o eliminado.

### Error: "Job X not found"

El job ya fue procesado o movido a failed_jobs.

### Jobs se quedan en "reserved" por mucho tiempo

Los workers pueden estar muertos o atascados. Revisar:
```bash
# Ver procesos de queue workers
ps aux | grep queue

# Reiniciar workers si es necesario
systemctl restart queue-worker
```

### Failed jobs se acumulan

- Verificar logs del error común
- Aplicar fix si es necesario
- Hacer retry masivo después del fix

---

**Base de datos:** Los jobs están en la base de datos `mitienda_api_logs` (conexión `default` en CodeIgniter).

**Tablas:**
- `jobs` - Jobs activos (pending/reserved)
- `failed_jobs` - Jobs que fallaron permanentemente
