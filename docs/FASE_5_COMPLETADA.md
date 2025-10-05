# ✅ Fase 5: Procesamiento con mtservicios - COMPLETADA

## Resumen
Se ha configurado la infraestructura completa para procesar videos con ffmpeg y subirlos a Cloudflare Stream.

## ✅ Componentes Implementados

### 1. Services en mtservicios

#### CloudflareStreamService.php
- ✅ Método `uploadVideo()`: Sube videos a Cloudflare Stream usando TUS protocol
- ✅ Método `deleteVideo()`: Elimina videos de Cloudflare
- ✅ Método `getVideoDetails()`: Obtiene detalles de un video
- ✅ Direct Creator Upload: Implementado para uploads resumibles
- ✅ Polling automático: Espera a que Cloudflare procese el video

#### VideoProcessingService.php
- ✅ Método `processVideo()`: Valida duración y recorta si es necesario
- ✅ Método `getVideoDuration()`: Usa ffprobe con el comando exacto solicitado
- ✅ Método `trimVideo()`: Recorta a 40s usando `ffmpeg -i input.mp4 -t 40 -c copy output.mp4`
- ✅ Método `cleanup()`: Limpia archivos temporales

### 2. Controller en mtservicios

#### VideoJobController.php
- ✅ POST `/api/jobs/video-process`: Procesa video completo
  - Valida duración con ffprobe
  - Recorta si excede 40s
  - Sube a Cloudflare Stream
  - Actualiza producto en base de datos
  - Limpia archivos temporales
- ✅ POST `/api/jobs/video-delete`: Elimina video de Cloudflare
- ✅ Autenticación con API Key
- ✅ Conexión a base de datos `mitienda` para actualizar productos

### 3. Routes en mtservicios
```php
$routes->group('api', function($routes) {
    $routes->group('jobs', function($routes) {
        $routes->post('video-process', 'VideoJobController::processVideo');
        $routes->post('video-delete', 'VideoJobController::deleteVideo');
    });
});
```

### 4. Configuración

#### mtservicios/.env
```env
# Cloudflare Stream Configuration
CLOUDFLARE_ACCOUNT_ID=tu_account_id  # ⚠️ PENDIENTE: Actualizar con Account ID real
CLOUDFLARE_STREAM_API_TOKEN=wg73vWKekhCgxk7LrCJvndtpVWomNSQjXhaDLMz_
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe
VIDEO_MAX_DURATION=40
VIDEO_TEMP_PATH=/tmp/mtservicios/videos
MITIENDA_API_URL=https://api2.mitienda.pe

# API Key for securing mtservicios endpoints
API_KEY=3c3441babdbf3208bbcbc47ffd62e12ee493a2c9eeeec4de29e666ccde9bf8a7
```

#### mitienda-api-ci4/.env
```env
# mtservicios Configuration
MTSERVICIOS_URL=https://mtservicios.mitienda.host
MTSERVICIOS_API_KEY=3c3441babdbf3208bbcbc47ffd62e12ee493a2c9eeeec4de29e666ccde9bf8a7
```

### 5. API Controller

#### Product.php
- ✅ Método `_enqueueVideoProcessing()` habilitado
- ✅ Hace POST a mtservicios con:
  - `product_id`: ID del producto
  - `tienda_id`: ID de la tienda
  - `temp_file_path`: Ruta del archivo temporal
- ✅ Autenticación con Bearer token

## 🔄 Flujo Completo

1. **Frontend**: Usuario sube video → ProductVideoUploader.vue
2. **API**: POST `/api/v1/products/{id}/video`
   - Valida archivo (100MB max, mp4/mov/avi/webm)
   - Guarda en `/writable/uploads/videos/temp/`
   - Marca producto como `processing`
   - Llama a mtservicios
3. **mtservicios**: POST `/api/jobs/video-process`
   - Verifica duración con ffprobe
   - Si > 40s: recorta con ffmpeg
   - Sube a Cloudflare Stream
   - Espera a que Cloudflare procese (polling)
   - Actualiza producto en DB:
     - `producto_video_cloudflare_uid`
     - `producto_video_stream_url`
     - `producto_video_thumbnail_url`
     - `producto_video_duration`
     - `producto_video_status = 'ready'`
   - Elimina archivos temporales

## ⚠️ IMPORTANTE: Configuración Pendiente

### CLOUDFLARE_ACCOUNT_ID

**Acción requerida**: Actualizar el Account ID en `mtservicios/.env`

El Account ID se encuentra en el dashboard de Cloudflare:
1. Ir a https://dash.cloudflare.com/
2. Seleccionar cuenta
3. Stream → Settings
4. Copiar "Account ID"

O ejecutar:
```bash
curl -X GET "https://api.cloudflare.com/client/v4/accounts" \
  -H "Authorization: Bearer wg73vWKekhCgxk7LrCJvndtpVWomNSQjXhaDLMz_" \
  | jq '.result[0].id'
```

**Actualizar en**:
```bash
ssh root@mtservicios.mitienda.host
cd /var/www/mtservicios.mitienda.host
nano .env
# Cambiar CLOUDFLARE_ACCOUNT_ID=tu_account_id por el ID real
```

## 📊 Estado de Base de Datos

Campos agregados a tabla `productos`:
- ✅ `producto_video_cloudflare_uid` VARCHAR(100)
- ✅ `producto_video_stream_url` TEXT
- ✅ `producto_video_thumbnail_url` TEXT
- ✅ `producto_video_duration` DECIMAL(5,2)
- ✅ `producto_video_status` ENUM('uploading', 'processing', 'ready', 'error')
- ✅ `producto_video_error` TEXT
- ✅ `producto_video_created_at` DATETIME

## 🧪 Testing

### Test Manual (después de configurar CLOUDFLARE_ACCOUNT_ID):

1. **Subir video corto (< 40s)**:
```bash
# Debería subir sin recortar
# Verificar en logs: "Video duration is OK. No trimming needed."
```

2. **Subir video largo (> 40s)**:
```bash
# Debería recortar a 40s
# Verificar en logs: "Video exceeds max duration. Trimming to 40s..."
```

3. **Verificar en Cloudflare**:
   - Ir a Stream dashboard
   - Ver videos subidos
   - Verificar playback URL

4. **Verificar en Base de Datos**:
```sql
SELECT
    producto_id,
    producto_titulo,
    producto_video_cloudflare_uid,
    producto_video_stream_url,
    producto_video_duration,
    producto_video_status
FROM productos
WHERE producto_video_status IS NOT NULL;
```

## 🔐 Seguridad

- ✅ API Key generada (256-bit random hex)
- ✅ Autenticación Bearer token en todas las peticiones
- ✅ Validación de API key en VideoJobController
- ✅ La misma key en ambos sistemas (API y mtservicios)

## 📝 Logs

Para monitorear el procesamiento:

**En API (api2.mitienda.pe)**:
```bash
tail -f /var/www/api2.mitienda.pe/writable/logs/log-*.log
```

**En mtservicios (mtservicios.mitienda.host)**:
```bash
tail -f /var/www/mtservicios.mitienda.host/writable/logs/log-*.log
```

## 🚀 Deploy

### API (ya deployado)
```bash
cd /var/www/api2.mitienda.pe
git pull
# Actualizar .env con MTSERVICIOS_URL y MTSERVICIOS_API_KEY
```

### mtservicios
```bash
ssh root@mtservicios.mitienda.host
cd /var/www/mtservicios.mitienda.host
git pull

# Actualizar .env:
# 1. CLOUDFLARE_ACCOUNT_ID (⚠️ IMPORTANTE)
# 2. API_KEY (ya agregado en .env local)

# Verificar ffmpeg y ffprobe
which ffmpeg  # /usr/bin/ffmpeg
which ffprobe # /usr/bin/ffprobe

# Crear directorio temp
mkdir -p /tmp/mtservicios/videos
chmod 755 /tmp/mtservicios/videos
```

## ✅ Commits

- **API**: `dd00fe3` - feat: Habilitar procesamiento de videos con mtservicios
- **mtservicios**: `f3e10ea` - feat: Agregar API_KEY para seguridad de endpoints

## 📋 Próximos Pasos (Fase 6 y 7)

Ver archivo: `PENDIENTES_VIDEO_FEATURE.md`
- [ ] Fase 6: Frontend Video Player
- [ ] Fase 7: Cleanup y testing final
