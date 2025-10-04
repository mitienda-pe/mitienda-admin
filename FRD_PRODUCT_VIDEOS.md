# Feature Request Document: Videos para Productos

## 1. Resumen Ejecutivo

**Feature**: Sistema de gestión de videos para productos en MiTienda
**Versión**: 1.0
**Fecha**: 2025-10-03
**Estado**: Propuesta

### Objetivo
Permitir a los comerciantes subir videos de sus productos para mejorar la experiencia de compra y aumentar las conversiones. Los videos se procesarán automáticamente para garantizar calidad y duración óptimas antes de ser publicados en Cloudflare Stream.

### Valor de Negocio
- **Para comerciantes**: Mayor engagement y conversión en sus productos
- **Para compradores**: Mejor entendimiento del producto antes de comprar
- **Para la plataforma**: Diferenciación competitiva vs competidores

---

## 2. Contexto Técnico

### Stack Actual
- **Frontend (Backoffice)**: Vue 3 + TypeScript + Vite + PrimeVue + Tailwind
- **Backend (API)**: CodeIgniter 4 (PHP 8.4) - `/Users/carlosvidal/www/mitienda/mitienda-api-ci4`
- **Servicios (Colas)**: CodeIgniter 4 (PHP 8.4) - `/Users/carlosvidal/www/mitienda/mtservicios`
- **Base de datos**: MySQL
- **Infraestructura**: Nginx, Git, Deploy automático

### Arquitectura de Servicios
mtservicios es un sistema de microservicios con:
- Sistema de colas para procesamiento asíncrono
- Múltiples workers procesando jobs
- API REST con autenticación por API Key
- Proveedores actuales: WhatsApp, SMS, Push notifications (OneSignal, Firebase)

---

## 3. Requisitos Funcionales

### 3.1 Subida de Videos

**Como** comerciante
**Quiero** poder subir videos de mis productos desde el backoffice
**Para que** los compradores puedan ver el producto en acción

**Criterios de aceptación:**
- [x] Botón "Añadir Video" visible en ProductDetailView
- [x] Modal de upload con drag & drop y file picker
- [x] Preview del video antes de confirmar
- [x] Validación de formato (MP4, MOV, AVI, WebM)
- [x] Validación de tamaño máximo (100 MB sugerido)
- [x] Feedback visual durante upload (progress bar)
- [x] Mensaje de confirmación al finalizar

### 3.2 Procesamiento de Videos

**Como** sistema
**Debo** procesar automáticamente los videos subidos
**Para que** cumplan con los estándares de calidad y duración

**Criterios de aceptación:**
- [x] Video procesado con ffmpeg para verificar/recortar duración máxima 40 segundos
- [x] Conversión a formato óptimo para web (H.264, AAC audio)
- [x] Generación de thumbnail automático (frame a los 2 segundos)
- [x] Subida a Cloudflare Stream
- [x] Almacenamiento de metadata (duración, resolución, tamaño)
- [x] Actualización de estado: uploading → processing → ready → error

### 3.3 Visualización de Videos

**Como** comerciante
**Quiero** ver los videos asociados a mi producto
**Para que** pueda gestionar el contenido multimedia

**Criterios de aceptación:**
- [x] Sección de video en ProductDetailView
- [x] Player integrado (Cloudflare Stream Player)
- [x] Información: duración, fecha de subida, estado
- [x] Botón para eliminar/reemplazar video
- [x] Un solo video por producto (MVP simplificado)

### 3.4 Estados del Video

| Estado | Descripción | Acciones Disponibles |
|--------|-------------|---------------------|
| `uploading` | Archivo subiendo al servidor | Cancelar |
| `processing` | ffmpeg procesando video | Ver progreso |
| `ready` | Video listo en Cloudflare Stream | Ver, Eliminar, Reemplazar |
| `error` | Error en procesamiento | Ver error, Reintentar, Eliminar |

---

## 4. Requisitos No Funcionales

### 4.1 Rendimiento
- Upload debe soportar chunks para archivos grandes
- Procesamiento en background (no bloquear UI)
- Timeout de procesamiento: 5 minutos máximo
- Videos ready en < 10 minutos desde upload

### 4.2 Seguridad
- Solo comerciante owner puede subir/eliminar videos de sus productos
- Validación de tipo MIME real (no solo extensión)
- Sanitización de nombres de archivo
- Límite de rate (max 5 videos por hora por comerciante)

### 4.3 Escalabilidad
- Sistema de colas para procesar múltiples videos concurrentemente
- Workers configurables (1-4 workers según carga)
- Cleanup automático de archivos temporales

### 4.4 Disponibilidad
- Retry automático en caso de fallo (max 3 intentos)
- Logs detallados para debugging
- Notificación al comerciante cuando video está listo o falla

---

## 5. Arquitectura Propuesta

### 5.1 Flujo de Datos

```
┌─────────────────┐
│   Backoffice    │
│   (Vue 3)       │
└────────┬────────┘
         │
         │ 1. POST /products/{id}/videos
         │    (multipart/form-data)
         ▼
┌─────────────────────────────┐
│   API (mitienda-api-ci4)    │
│                             │
│  - Validar archivo          │
│  - Guardar temp             │
│  - Crear registro DB        │
│  - Encolar job              │
└────────┬────────────────────┘
         │
         │ 2. POST /api/jobs/video-process
         │    (API Key auth)
         ▼
┌─────────────────────────────┐
│  Servicios (mtservicios)    │
│                             │
│  - Recibir job en cola      │
│  - Procesar con ffmpeg      │
│  - Upload a Cloudflare      │
│  - Actualizar estado        │
│  - Limpiar temp             │
└────────┬────────────────────┘
         │
         │ 3. Webhook callback (opcional)
         │    o polling desde API
         ▼
┌─────────────────────────────┐
│   API actualiza registro    │
│   status: ready/error       │
└─────────────────────────────┘
         │
         │ 4. Frontend polling
         │    GET /products/{id}/videos
         ▼
┌─────────────────┐
│   UI muestra    │
│   video ready   │
└─────────────────┘
```

### 5.2 Modelos de Base de Datos

**IMPORTANTE**: Se usarán migrations de CodeIgniter 4 para crear/modificar tablas.

#### Opción 1: Modificar tabla `producto` (Recomendada para 1 video por producto)

```sql
-- Migration en mitienda-api-ci4: app/Database/Migrations/YYYY-MM-DD-add_video_to_producto.php
ALTER TABLE producto ADD COLUMN producto_video_cloudflare_uid VARCHAR(100) DEFAULT NULL;
ALTER TABLE producto ADD COLUMN producto_video_stream_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE producto ADD COLUMN producto_video_thumbnail_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE producto ADD COLUMN producto_video_duration DECIMAL(5,2) DEFAULT NULL COMMENT 'segundos';
ALTER TABLE producto ADD COLUMN producto_video_status ENUM('uploading', 'processing', 'ready', 'error') DEFAULT NULL;
ALTER TABLE producto ADD COLUMN producto_video_error TEXT DEFAULT NULL;
ALTER TABLE producto ADD COLUMN producto_video_created_at DATETIME DEFAULT NULL;

-- Índice para búsqueda por status
ALTER TABLE producto ADD INDEX idx_video_status (producto_video_status);
```

**Ventajas de esta opción:**
- ✅ Más simple (no requiere tabla adicional ni JOINs)
- ✅ Relación 1:1 garantizada a nivel de esquema
- ✅ Menos consultas SQL (video ya viene en producto)
- ✅ Producto puede o no tener video (campos NULL)

#### Tabla: `jobs` (ya existe en mtservicios)

Se reutiliza la tabla existente del sistema de colas para procesar videos.

---

## 6. Componentes a Desarrollar

### 6.1 Backend (mitienda-api-ci4)

#### Archivos nuevos:
- `app/Database/Migrations/YYYY-MM-DD-add_video_to_producto.php` - Migration para agregar campos de video

#### Archivos a modificar:
- `app/Controllers/V1/Product.php` - Agregar métodos: uploadVideo(), deleteVideo()
- `app/Models/ProductModel.php` - Incluir campos de video
- `app/Libraries/ProductTransformer.php` - Incluir video en respuesta de producto

#### Endpoints:

```php
// Obtener producto (incluye video si existe)
GET /api/v1/products/{id}
Response: {
  id: 123,
  name: "Producto ejemplo",
  price: 99.90,
  video: {
    cloudflare_uid: "abc123",
    stream_url: "https://customer-...",
    thumbnail_url: "https://customer-...",
    duration: 30.5,
    status: "ready",
    created_at: "2025-10-03T10:00:00Z"
  }
}

// Subir video (reemplaza si ya existe)
POST /api/v1/products/{id}/video
Content-Type: multipart/form-data
Body: { video: File }
Response: {
  success: true,
  data: { status: "uploading", ... }
}

// Eliminar video
DELETE /api/v1/products/{id}/video
Response: { success: true }
```

### 6.2 Servicios (mtservicios)

#### Archivos nuevos:
- `app/Services/VideoProcessingService.php` - Lógica de procesamiento
- `app/Services/CloudflareStreamService.php` - Cliente de Cloudflare Stream API
- `app/Controllers/VideoJobController.php` - Endpoint para encolar jobs
- `app/Commands/ProcessVideoQueue.php` - CLI para procesar cola de videos

#### Configuración:
```env
# Cloudflare Stream
CLOUDFLARE_ACCOUNT_ID=xxx
CLOUDFLARE_STREAM_API_TOKEN=xxx

# FFmpeg
FFMPEG_PATH=/usr/local/bin/ffmpeg
FFPROBE_PATH=/usr/local/bin/ffprobe
VIDEO_MAX_DURATION=40
VIDEO_TEMP_PATH=/tmp/mtservicios/videos
```

#### Instalación de dependencias:
```bash
# Instalar ffmpeg en servidor
apt-get install ffmpeg

# Composer (Cloudflare SDK si existe, o usar cURL)
# composer require cloudflare/stream-php
```

### 6.3 Frontend (mitienda-administrador)

#### Archivos nuevos:
- `src/components/products/ProductVideoUploader.vue` - Modal de upload
- `src/components/products/ProductVideoPlayer.vue` - Player de Cloudflare
- `src/types/product-video.types.ts` - Tipos TypeScript

#### Archivos a modificar:
- `src/views/products/ProductDetailView.vue` - Agregar sección de video
- `src/types/product.types.ts` - Agregar campo `video?: ProductVideo`
- `src/api/products.api.ts` - Agregar métodos uploadVideo(), deleteVideo()
- `src/stores/products.store.ts` - Integrar acciones de video

#### Componentes de PrimeVue a usar:
- `FileUpload` - Subida de archivos
- `ProgressBar` - Progreso de upload
- `Dialog` - Modal
- `Button` - Acciones
- `Tag` - Estados (uploading, processing, ready, error)

---

## 7. Implementación por Fases

### Fase 1: Setup & Infraestructura (1-2 horas)
- [ ] Crear migración para agregar campos de video a tabla `producto`
- [ ] Instalar ffmpeg en servidor mtservicios
- [ ] Configurar Cloudflare Stream (cuenta, API tokens)

### Fase 2: Backend API (2-3 horas)
- [ ] Modificar ProductModel para incluir campos de video
- [ ] Agregar métodos uploadVideo() y deleteVideo() en Product controller
- [ ] Endpoint de upload con validaciones (formato, tamaño)
- [ ] Integración con mtservicios (encolar job de procesamiento)
- [ ] ProductTransformer incluyendo video

### Fase 3: Servicio de Procesamiento (3-4 horas)
- [ ] CloudflareStreamService (upload, metadata, delete)
- [ ] VideoProcessingService (ffmpeg: validar duración, recortar si > 40s)
- [ ] VideoJobController (recibir jobs de API)
- [ ] Command CLI para procesar cola de videos
- [ ] Manejo de errores y retry automático

### Fase 4: Frontend UI (3-4 horas)
- [ ] ProductVideoUploader component (drag & drop, validaciones)
- [ ] ProductVideoPlayer component (Cloudflare Stream Player)
- [ ] Integración en ProductDetailView (mostrar/upload/delete)
- [ ] Tipos TypeScript y métodos API

### Fase 5: Testing & Refinamiento (1-2 horas)
- [ ] Pruebas de upload de diferentes formatos (MP4, MOV, WebM)
- [ ] Pruebas de videos > 40 segundos (debe recortar)
- [ ] Pruebas de errores y retry
- [ ] UI/UX polish
- [ ] Documentación de uso

**Total estimado: 10-15 horas** (simplificado por usar 1 video por producto)

---

## 8. Consideraciones de Cloudflare Stream

### API Authentication
```bash
# Direct Creator Upload (más simple, recomendado)
POST https://api.cloudflare.com/client/v4/accounts/{account_id}/stream/direct_upload
Headers:
  Authorization: Bearer {API_TOKEN}
Body: {
  maxDurationSeconds: 40,
  requireSignedURLs: false
}

Response: {
  uploadURL: "https://upload.cloudflare.com/...",
  uid: "abc123"
}

# Luego frontend sube directamente a uploadURL
```

### Embed Player
```html
<stream src="{video_uid}" controls></stream>
<script data-cfasync="false" defer type="text/javascript"
  src="https://embed.cloudflare.com/embed/sdk.latest.js"></script>
```

### Webhooks (opcional para esta fase)
Cloudflare puede notificar cuando video esté listo. Por ahora usaremos polling.

---

## 9. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| ffmpeg no instalado en servidor | Media | Alto | Validar en setup, documentar instalación |
| Videos muy grandes timeout | Media | Medio | Límite de 100MB, usar chunked upload |
| Cloudflare Stream cuota excedida | Baja | Alto | Monitorear uso, alertas |
| Procesamiento lento (> 10 min) | Media | Medio | Múltiples workers, optimizar ffmpeg |
| Comerciante sube contenido inapropiado | Media | Alto | Revisión manual (futuro), Terms of Service |

---

## 10. Métricas de Éxito

### Técnicas
- ✅ 95% de videos procesados exitosamente
- ✅ < 5 minutos tiempo promedio de procesamiento
- ✅ 0 archivos temporales sin limpiar
- ✅ 100% de videos < 40 segundos

### Negocio (3 meses post-lanzamiento)
- 📊 20% de productos con video
- 📊 +15% conversión en productos con video vs sin video
- 📊 +30% tiempo de permanencia en productos con video

---

## 11. Documentación Necesaria

- [ ] README de setup de ffmpeg
- [ ] Guía de configuración de Cloudflare Stream
- [ ] API docs de endpoints de videos
- [ ] Guía de usuario para comerciantes (cómo subir videos)

---

## 12. Preguntas Pendientes

1. ✅ **¿Límite de videos por producto?** → 1 video por producto (MVP)
2. ✅ **¿Usar migrations para crear campos?** → Sí, migrations de CodeIgniter 4
3. ⏳ **¿Soporte para videos verticales (stories)?** → Fase 2
4. ⏳ **¿Auto-generación de subtítulos?** → Fase 2 (Cloudflare Stream AI)
5. ✅ **¿Notificar al comerciante cuando video esté listo?** → Sí, vía push notification (mtservicios)
6. ⏳ **¿Mostrar videos en app móvil?** → Sí, pero fuera del scope de este FRD

---

## 13. Aprobación

**Preparado por**: Claude Code
**Fecha**: 2025-10-03
**Estado**: ⏳ Pendiente de aprobación

**Aprobadores**:
- [ ] Product Owner
- [ ] Tech Lead
- [ ] DevOps (infraestructura ffmpeg + Cloudflare)

---

## Anexos

### A. Ejemplo de ffmpeg command

```bash
# Verificar duración
ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 input.mp4

# Recortar a 40 segundos
ffmpeg -i input.mp4 -t 40 -c:v libx264 -preset fast \
  -c:a aac -b:a 128k output.mp4

# Generar thumbnail
ffmpeg -i input.mp4 -ss 00:00:02 -vframes 1 thumbnail.jpg
```

### B. Estructura de respuesta de producto con video

```json
{
  "id": 123,
  "name": "Zapatillas Nike Air",
  "price": 299.90,
  "images": [...],
  "video": {
    "cloudflare_uid": "abc123",
    "stream_url": "https://customer-xxx.cloudflarestream.com/abc123/manifest/video.m3u8",
    "thumbnail_url": "https://customer-xxx.cloudflarestream.com/abc123/thumbnails/thumbnail.jpg",
    "duration": 30.5,
    "status": "ready",
    "created_at": "2025-10-03T10:00:00Z"
  }
}
```

**Nota**: El campo `video` será `null` si el producto no tiene video.

---

**Fin del documento**
