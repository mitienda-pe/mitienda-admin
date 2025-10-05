# Implementación de Upload de Videos a Cloudflare Stream

## Resumen

Este documento describe la implementación del sistema de upload de videos para productos en MiTienda, utilizando Cloudflare Stream como servicio de hosting y streaming de videos.

## Arquitectura

### Flujo General

```
Frontend (Vue 3) → Backend API (CodeIgniter 4) → mtservicios → Cloudflare Stream
```

### Componentes

1. **Frontend**: `ProductVideoUploader.vue`
2. **Backend API**: `Product.php` controller
3. **Servicio de procesamiento**: `mtservicios/CloudflareStreamService.php`

## Implementación Frontend

### ProductVideoUploader.vue

**Ubicación**: `src/components/products/ProductVideoUploader.vue`

**Funcionalidad**:
- Permite seleccionar un archivo de video (MP4, MOV, AVI, WebM)
- Valida tamaño máximo: 100MB
- Sube el video al backend usando FormData
- Muestra progreso de upload
- Maneja estados: uploading, processing, ready, error

**Método de upload**:
```typescript
const handleUpload = async () => {
  const { productsApi } = await import('@/api/products.api')
  const response = await productsApi.uploadVideo(props.productId, selectedFile.value)

  if (response.success) {
    emit('upload-success', response.data)
  }
}
```

## Implementación Backend

### API Endpoint

**Endpoint**: `POST /api/v1/products/{id}/video`

**Controller**: `app/Controllers/V1/Product.php::uploadVideo()`

**Flujo**:
1. Valida que el producto exista y pertenezca al usuario
2. Valida el archivo (tamaño, formato, MIME type)
3. Guarda el video temporalmente en `/var/www/shared/uploads/videos/temp`
4. Encola el job de procesamiento en mtservicios
5. Retorna respuesta inmediata al frontend

## Servicio de Procesamiento (mtservicios)

### CloudflareStreamService

**Ubicación**: `mtservicios/app/Services/CloudflareStreamService.php`

**Método principal**: `uploadVideo($videoFilePath, $maxDuration = 40)`

### Flujo de Upload a Cloudflare

```php
// 1. Upload directo usando multipart/form-data
$url = "https://api.cloudflare.com/client/v4/accounts/{$accountId}/stream";

curl_setopt($ch, CURLOPT_POSTFIELDS, [
    'file' => new \CURLFile($videoFilePath, $mimeType, $filename)
]);

// 2. Esperar procesamiento (polling cada 5 segundos)
$videoDetails = $this->waitForProcessing($uid);

// 3. Validar duración (máx 40 segundos)
if ($duration > $maxDuration) {
    $this->deleteVideo($uid);
    throw new \Exception("Duration exceeds maximum");
}

// 4. Retornar detalles del video
return [
    'uid' => $uid,
    'playback' => [...],
    'thumbnail' => '...',
    'duration' => 28
];
```

## Problema Resuelto: Video Corrupto

### Intentos Previos (Fallidos)

1. ❌ **Direct Creator Upload API con TUS protocol**: Complejo, errores de implementación
2. ❌ **Direct Creator Upload API con archivo RAW**: Error 400 "Decoding Error"
3. ❌ **Direct Creator Upload API con multipart/form-data**: Video se sube pero se corrompe

### Solución Final (Exitosa)

✅ **Usar endpoint estándar `/stream` con multipart/form-data**

**¿Por qué funciona?**
- El endpoint `/stream` está diseñado para aceptar multipart/form-data
- `CURLFile` en PHP genera el multipart correcto
- Cloudflare procesa el video sin corrupción

**¿Por qué Direct Creator Upload fallaba?**
- La API `direct_upload` genera URLs **exclusivamente para TUS protocol**
- Usar esas URLs con multipart/form-data o archivo raw causa corrupción
- El video se "sube" (200 OK) pero queda corrupto y no se puede reproducir

## Configuración Requerida

### Variables de Entorno

**Backend API** (`.env`):
```
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
MTSERVICIOS_URL=https://mtservicios.mitienda.host
MTSERVICIOS_API_KEY=your_api_key
```

**mtservicios** (`.env`):
```
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_STREAM_API_TOKEN=your_stream_token
```

### Permisos de Cloudflare API Token

El token debe tener permisos para:
- Stream: Read
- Stream: Edit

## Player de Video

### ProductVideoPlayer.vue

**Ubicación**: `src/components/products/ProductVideoPlayer.vue`

**Características**:
- Usa iframe de Cloudflare Stream
- Auto-refresh cada 5 segundos cuando está "processing"
- Maneja estados: processing, ready, error
- Permite eliminar video

**URL del iframe**:
```
https://customer-{customer_code}.cloudflarestream.com/{uid}/iframe?poster={thumbnail_url}
```

## Base de Datos

### Campos en tabla `productos`

```sql
producto_video_cloudflare_uid VARCHAR(255)     -- UID del video en Cloudflare
producto_video_stream_url VARCHAR(500)         -- URL HLS para reproducción
producto_video_thumbnail_url VARCHAR(500)      -- URL del thumbnail
producto_video_duration DECIMAL(10,2)          -- Duración en segundos
producto_video_status VARCHAR(50)              -- uploading|processing|ready|error
producto_video_error TEXT                       -- Mensaje de error si falla
producto_video_created_at DATETIME             -- Fecha de creación
```

## Límites y Validaciones

- **Tamaño máximo**: 100MB
- **Duración máxima**: 40 segundos (se valida después del upload, si excede se elimina)
- **Formatos soportados**: MP4, MOV, AVI, WebM
- **Timeout de upload**: 5 minutos

## Testing

### Probar upload de video

1. Ir a detalle de producto
2. Click en "Añadir Video"
3. Seleccionar archivo de video (< 100MB, < 40s)
4. Esperar a que se complete el upload
5. El video debería estar en estado "processing" (~10-30 segundos)
6. Al finalizar, el video se reproduce correctamente

### Verificar en Cloudflare Dashboard

1. Ir a: https://dash.cloudflare.com → Stream
2. Buscar el video por UID
3. Verificar que está "Ready" y se puede reproducir
4. Verificar duración, thumbnail, etc.

## Troubleshooting

### Video se sube pero está corrupto
- ✅ Verificar que se está usando el endpoint `/stream` (no `direct_upload`)
- ✅ Verificar que se usa `CURLFile` con multipart/form-data
- ✅ NO usar archivo RAW (CURLOPT_INFILE)

### Error 500 en iframe
- ⏳ Esperar a que el video termine de procesarse
- 🔄 Refrescar la página después de 30 segundos
- ❌ Si persiste, el video está corrupto → verificar método de upload

### Video excede 40 segundos
- El sistema automáticamente elimina el video de Cloudflare
- Mostrar error al usuario
- Usuario debe recortar el video antes de subirlo

## Mejoras Futuras

1. **Recorte automático**: En lugar de rechazar videos >40s, recortarlos automáticamente
2. **Compresión**: Comprimir videos antes de subir para reducir tamaño
3. **Múltiples videos**: Permitir galería de videos por producto
4. **Watermark**: Agregar watermark de la tienda al video
5. **Analytics**: Trackear reproducciones de video

## Referencias

- [Cloudflare Stream API Docs](https://developers.cloudflare.com/stream/uploading-videos/upload-video-file/)
- [Direct Creator Uploads](https://developers.cloudflare.com/stream/uploading-videos/direct-creator-uploads/)
- [TUS Protocol](https://tus.io/)
