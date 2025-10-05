# Fase 4 - Frontend (ProductVideoUploader) - COMPLETADA ✅

**Fecha:** 2025-10-03/04
**Duración:** ~4 horas de debugging intenso
**Estado:** ✅ Funcionando correctamente

## Resumen

Implementación exitosa del componente `ProductVideoUploader.vue` que permite a los usuarios subir videos a productos desde el backoffice Vue 3.

## Componentes Creados

### 1. ProductVideoUploader.vue
- **Ubicación:** `src/components/products/ProductVideoUploader.vue`
- **Funcionalidad:**
  - Componente modal con PrimeVue Dialog
  - FileUpload en modo básico con drag & drop
  - Validación de formato (mp4, mov, avi, webm) y tamaño (max 100MB)
  - Preview del video antes de subir
  - ProgressBar durante la carga
  - Manejo de errores con mensajes específicos
  - Eventos: `upload-success` y `upload-error`

### 2. Integración en ProductDetailView.vue
- Botón "Añadir Video" junto al botón "Editar"
- Handlers para upload-success y upload-error
- Auto-refresh del producto después de subir
- Toast notifications para feedback

### 3. API Client
- **Archivo:** `src/api/products.api.ts`
- Método `uploadVideo(id, videoFile)` para subir videos
- Método `deleteVideo(id)` para eliminar videos

### 4. Types
- **Archivo:** `src/types/product-video.types.ts`
- Interface `ProductVideo` con campos de Cloudflare Stream
- Type `VideoStatus` con estados: uploading, processing, ready, error

## Problemas Encontrados y Soluciones

### ❌ Problema 1: URL.createObjectURL en template Vue
**Error:** `Property "URL" was accessed during render but is not defined on instance`

**Causa:** `URL` es un objeto global del navegador no disponible directamente en templates Vue

**Solución:** Crear computed property `videoPreviewUrl`:
```typescript
const videoPreviewUrl = computed(() => {
  if (selectedFile.value) {
    return URL.createObjectURL(selectedFile.value)
  }
  return null
})
```

**Commit:** `7f1a03c`

---

### ❌ Problema 2: Content-Type manual en FormData
**Error:** `400 Bad Request` - archivo no llegaba al backend

**Causa:** Especificar manualmente `Content-Type: multipart/form-data` sin el boundary impedía el envío correcto

**Solución:** Remover header manual y dejar que Axios lo configure automáticamente:
```typescript
// ANTES (incorrecto):
const response = await apiClient.post(`/products/${id}/video`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

// DESPUÉS (correcto):
const response = await apiClient.post(`/products/${id}/video`, formData)
```

**Commit:** `1679158`

---

### ❌ Problema 3: Interceptor Axios forzaba application/json
**Error:** `400 Bad Request` - `$_FILES` vacío en PHP, archivo no llegaba

**Causa:** El interceptor de Axios configuraba `Content-Type: application/json` para TODAS las peticiones, sobrescribiendo el multipart/form-data necesario para archivos

**Solución:** Detectar FormData en el interceptor y eliminar Content-Type:
```typescript
apiClient.interceptors.request.use((config) => {
  // ... auth token ...

  // Si estamos enviando FormData, eliminar Content-Type
  if (config.data instanceof FormData && config.headers) {
    delete config.headers['Content-Type']
  }

  return config
})
```

**Commit:** `9e6a8c0`

---

### ❌ Problema 4: Límites de upload de PHP muy bajos
**Error:** `400 Bad Request` - archivo no llegaba a `$_FILES`

**Causa:** Configuración de PHP-FPM:
```
upload_max_filesize = 2M  ❌
post_max_size = 8M        ❌
```

**Solución:** Aumentar límites en `/etc/php/8.4/fpm/php.ini`:
```bash
upload_max_filesize = 100M ✅
post_max_size = 100M       ✅
```

Reiniciar PHP-FPM:
```bash
sudo systemctl restart php8.4-fpm
```

---

### ❌ Problema 5: Validación de archivos en CodeIgniter 4
**Error:** `500 Internal Server Error`
```
TypeError: CodeIgniter\Validation\StrictRules\FileRules::uploaded():
Argument #1 ($blank) must be of type ?string, array given
```

**Causa:** Las reglas de validación estrictas de CI4 no manejan bien archivos subidos via FormData

**Solución:** Remover reglas automáticas e implementar validación manual:
```php
// ANTES (causaba TypeError):
$validationRule = [
    'video' => [
        'rules' => 'uploaded[video]|max_size[video,102400]|ext_in[video,mp4,mov,avi,webm]'
    ]
];

// DESPUÉS (validación manual):
$videoFile = $this->request->getFile('video');

if (!$videoFile) {
    return $this->fail('No video file uploaded');
}

if ($videoFile->getSize() > 100 * 1024 * 1024) {
    return $this->fail('Video file too large. Maximum size is 100MB');
}

if (!in_array($videoFile->getExtension(), ['mp4', 'mov', 'avi', 'webm'])) {
    return $this->fail('Invalid video format');
}
```

**Commit:** `5ff607f`

---

### ⚠️ Problema 6: Integración con mtservicios
**Estado:** Temporalmente deshabilitado

**Causa:** mtservicios no está configurado aún

**Solución temporal:** Comentar llamada a `_enqueueVideoProcessing()`:
```php
// TODO: Enqueue video processing job in mtservicios
// $this->_enqueueVideoProcessing($id, $tienda_id, $tempFilePath);

log_message('info', "Video uploaded for product {$id}: {$tempFilePath}");
```

El video se guarda en `/writable/uploads/videos/temp/` y el producto se marca como `processing`.

**Commit:** `5262bc6`

**Pendiente:** Habilitar cuando mtservicios esté listo con ffmpeg y Cloudflare Stream

---

## Configuración del Servidor (Producción)

### Nginx
```nginx
client_max_body_size 100M; ✅ (ya estaba configurado)
```

### PHP 8.4 FPM
```ini
upload_max_filesize = 100M ✅ (configurado)
post_max_size = 100M       ✅ (configurado)
max_file_uploads = 20      ✅ (suficiente)
```

### Permisos
```bash
/var/www/api2.mitienda.pe/writable/uploads/videos/temp/
Owner: www-data:www-data
Permissions: 0755
```

---

## Prueba Exitosa

**Producto:** ID 429991
**Video subido:** WhatsApp Video 2025-10-01 at 17.29.45.mp4
**Tamaño:** 13MB
**Archivo en servidor:** `/var/www/api2.mitienda.pe/writable/uploads/videos/temp/product_429991_1759547404.mp4`

**Respuesta del backend:**
```json
{
  "success": true,
  "message": "Video uploaded successfully and queued for processing",
  "data": {
    "product_id": 429991,
    "status": "processing",
    "filename": "product_429991_1759547404.mp4",
    "temp_path": "/var/www/.../product_429991_1759547404.mp4"
  }
}
```

---

## Commits Realizados

### Frontend (mitienda-administrador)
1. `f4cac50` - feat: Implementar componente de subida de videos para productos
2. `7f1a03c` - fix: Corregir error de URL.createObjectURL en ProductVideoUploader
3. `1679158` - fix: Remover header Content-Type manual en uploadVideo
4. `ea232ab` - debug: Agregar console.logs para debugging de upload
5. `9e6a8c0` - fix: Permitir FormData en interceptor de Axios ⭐ **FIX PRINCIPAL**
6. `0788cec` - chore: Ignorar archivos de video en git

### Backend (mitienda-api-ci4)
1. `5262bc6` - fix: Deshabilitar temporalmente integración con mtservicios
2. `397c226` - debug: Agregar logging detallado en uploadVideo
3. `5ff607f` - fix: Corregir error de validación de archivo en uploadVideo ⭐ **FIX PRINCIPAL**
4. `1eece7c` - debug: Agregar logging de request completo en uploadVideo

---

## Próximos Pasos (Fase 5 - Pendiente)

### 1. Crear ProductVideoPlayer Component
- Mostrar video con Cloudflare Stream player
- Mostrar metadata (duración, estado)
- Loading state para uploading/processing
- Error state con mensaje

### 2. Integración en ProductDetailView
- Mostrar video player si existe y está ready
- Mostrar progress si está uploading/processing
- Mostrar error si falló
- Botón para eliminar video

### 3. Habilitar mtservicios
- Configurar variables de entorno (MTSERVICIOS_URL, MTSERVICIOS_API_KEY)
- Implementar VideoProcessingService (ffprobe duration check, ffmpeg trim)
- Implementar CloudflareStreamService (upload, delete, polling)
- Implementar VideoJobController endpoints
- Habilitar `_enqueueVideoProcessing()` en Product controller

### 4. Testing End-to-End
- Subir video < 40s (no debe recortar)
- Subir video > 40s (debe recortar a 40s)
- Verificar video en Cloudflare Stream
- Verificar thumbnail generado
- Probar delete de video
- Probar manejo de errores

---

## Lecciones Aprendidas

1. **Axios + FormData:** NUNCA especificar Content-Type manualmente con FormData
2. **Interceptores:** Verificar que no sobrescriban headers necesarios para casos específicos
3. **PHP Upload Limits:** Siempre verificar `upload_max_filesize` y `post_max_size`
4. **CI4 File Validation:** Las reglas estrictas pueden causar TypeErrors, validar manualmente cuando sea necesario
5. **Debugging:** Los logs detallados son esenciales para problemas de integración frontend-backend
6. **curl Testing:** Probar endpoints directamente con curl ayuda a aislar problemas

---

## Archivos Clave

### Frontend
- `src/components/products/ProductVideoUploader.vue` - Componente principal
- `src/views/products/ProductDetailView.vue` - Integración
- `src/api/products.api.ts` - API client methods
- `src/api/axios.ts` - Configuración con fix de FormData
- `src/types/product-video.types.ts` - Type definitions

### Backend
- `app/Controllers/V1/Product.php` - uploadVideo() y deleteVideo()
- `app/Models/ProductModel.php` - allowedFields con campos de video
- `app/Libraries/ProductTransformer.php` - buildVideoData()
- `app/Config/Routes.php` - Rutas de video
- `app/Database/Migrations/2025-10-03-150000_AddVideoFieldsToProducto.php` - Migración

---

**Estado Final:** ✅ FUNCIONANDO - Upload de videos completo y probado en producción
