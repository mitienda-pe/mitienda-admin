# Feature de Videos - Tareas Pendientes

## Estado Actual ✅

**Completado hasta ahora:**
- ✅ Frontend: Componente de upload de videos funcionando
- ✅ Backend API: Endpoint POST /products/{id}/video recibe y guarda archivo
- ✅ Base de datos: Se actualiza `producto_video_status = 'processing'` y `producto_video_created_at`
- ✅ Archivo guardado en: `/writable/uploads/videos/temp/product_{id}_{timestamp}.mp4`

**Problema actual:**
- ⚠️ El video se queda en la carpeta temp indefinidamente
- ⚠️ No se procesa con ffmpeg
- ⚠️ No se sube a Cloudflare Stream
- ⚠️ No se puede ver en el frontend

---

## FASE 5: Procesamiento de Videos con mtservicios

### 5.1 Configurar mtservicios (Backend Service)

**Ubicación:** `/var/www/mtservicios/` (o donde esté desplegado)

#### Tareas:

1. **Instalar ffmpeg y ffprobe** ✅ (ya está instalado según usuario)
   ```bash
   sudo apt-get install ffmpeg
   ffmpeg -version
   ffprobe -version
   ```

2. **Configurar variables de entorno en mtservicios**
   - Archivo: `mtservicios/.env`
   ```env
   # Cloudflare Stream
   CLOUDFLARE_ACCOUNT_ID=tu_account_id
   CLOUDFLARE_API_TOKEN=tu_api_token

   # API Authentication
   MTSERVICIOS_API_KEY=un_secret_key_para_autenticar

   # FFmpeg paths
   FFMPEG_PATH=/usr/bin/ffmpeg
   FFPROBE_PATH=/usr/bin/ffprobe
   ```

3. **Crear CloudflareStreamService.php**
   - Ubicación: `mtservicios/app/Services/CloudflareStreamService.php`
   - Métodos:
     - `uploadVideo($videoFilePath, $maxDuration = 40)` - Sube video a Cloudflare
     - `deleteVideo($cloudflareUid)` - Elimina video de Cloudflare
     - `getVideoStatus($cloudflareUid)` - Obtiene estado del video
   - Documentación ya existe en: `CLOUDFLARE_STREAM_SETUP.md`

4. **Crear VideoProcessingService.php** (SIMPLIFICADO)
   - Ubicación: `mtservicios/app/Services/VideoProcessingService.php`
   - Métodos:
     - `getVideoDuration($videoPath)` - Usa ffprobe
       ```bash
       ffprobe -v error -show_entries format=duration -of csv=p=0 video.mp4
       ```
     - `trimVideo($inputPath, $outputPath, $maxDuration = 40)` - Usa ffmpeg
       ```bash
       ffmpeg -i input.mp4 -t 40 -c copy output.mp4
       ```
     - `cleanup($filePaths)` - Borra archivos temporales

5. **Crear VideoJobController.php**
   - Ubicación: `mtservicios/app/Controllers/VideoJobController.php`
   - Endpoints:
     - `POST /api/jobs/video-process` - Procesa video
     - `POST /api/jobs/video-delete` - Elimina video de Cloudflare

   **Flujo de video-process:**
   ```
   1. Recibir job con: product_id, tienda_id, temp_file_path
   2. Validar que el archivo existe
   3. Verificar duración con ffprobe
   4. Si > 40s: recortar con ffmpeg
   5. Subir a Cloudflare Stream
   6. Esperar procesamiento en Cloudflare (polling)
   7. Actualizar producto en mitiendape DB con:
      - producto_video_cloudflare_uid
      - producto_video_stream_url
      - producto_video_thumbnail_url
      - producto_video_duration
      - producto_video_status = 'ready'
   8. Eliminar archivo temporal
   9. Si hay error: marcar producto_video_status = 'error'
   ```

6. **Agregar rutas en mtservicios**
   - Archivo: `mtservicios/app/Config/Routes.php`
   ```php
   $routes->group('api/jobs', function($routes) {
       $routes->post('video-process', 'VideoJobController::processVideo');
       $routes->post('video-delete', 'VideoJobController::deleteVideo');
   });
   ```

---

### 5.2 Conectar API con mtservicios

**Ubicación:** `mitienda-api-ci4/app/Controllers/V1/Product.php`

1. **Configurar variables de entorno en API**
   - Archivo: `mitienda-api-ci4/.env`
   ```env
   MTSERVICIOS_URL=https://mtservicios.mitienda.host
   MTSERVICIOS_API_KEY=el_mismo_secret_key
   ```

2. **Habilitar `_enqueueVideoProcessing()` en Product.php** (línea 527)
   - **CAMBIAR:**
     ```php
     // TODO: Enqueue video processing job in mtservicios
     // $this->_enqueueVideoProcessing($id, $tienda_id, $tempFilePath);
     ```
   - **A:**
     ```php
     // Enqueue video processing job in mtservicios
     $this->_enqueueVideoProcessing($id, $tienda_id, $tempFilePath);
     ```

3. **Verificar método `_enqueueVideoProcessing()`** (línea 594)
   - Ya existe y hace curl POST a mtservicios
   - Envía: `product_id`, `tienda_id`, `temp_file_path`

---

## FASE 6: Frontend - Mostrar Videos

### 6.1 Crear ProductVideoPlayer Component

**Ubicación:** `src/components/products/ProductVideoPlayer.vue`

**Props:**
- `video: ProductVideo` - Datos del video

**Features:**
- Mostrar video con Cloudflare Stream player
- Estados:
  - `uploading`: Mostrar spinner + "Subiendo video..."
  - `processing`: Mostrar spinner + "Procesando video..."
  - `ready`: Mostrar video player
  - `error`: Mostrar mensaje de error
- Mostrar metadata: duración, fecha
- Botón "Eliminar video" (llama a API DELETE)

**Cloudflare Stream Player:**
```html
<iframe
  src="https://iframe.cloudflare.com/{video.cloudflare_uid}"
  style="border: none"
  height="360"
  width="640"
  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
  allowfullscreen="true"
></iframe>
```

### 6.2 Integrar en ProductDetailView.vue

1. **Importar ProductVideoPlayer**
   ```typescript
   import ProductVideoPlayer from '@/components/products/ProductVideoPlayer.vue'
   ```

2. **Agregar al template**
   ```vue
   <div v-if="product.video" class="mb-4">
     <h3>Video del Producto</h3>
     <ProductVideoPlayer
       :video="product.video"
       @delete-success="handleVideoDelete"
     />
   </div>
   ```

3. **Lógica de botón "Añadir Video"**
   - Mostrar solo si: `!product.video || product.video.status === 'error'`
   - Ocultar si ya hay video `ready` o `processing`

4. **Polling de estado** (opcional, para ver progreso en tiempo real)
   - Cuando `video.status === 'processing'`
   - Hacer polling cada 5 segundos para refrescar el producto
   - Detener cuando `status === 'ready'` o `status === 'error'`

### 6.3 Implementar DELETE de video

1. **Backend ya tiene el endpoint:**
   - `DELETE /products/{id}/video`
   - Limpia todos los campos de video
   - Encola job de eliminación en Cloudflare

2. **Frontend:**
   - Método `deleteVideo()` ya existe en `products.api.ts`
   - Agregar handler en ProductVideoPlayer
   - Mostrar confirmación antes de eliminar

---

## FASE 7: Limpieza de Archivos Temporales

### 7.1 Limpiar archivo después de procesar

**Ubicación:** `mtservicios/app/Controllers/VideoJobController.php`

En el método `processVideo()`, después de subir a Cloudflare:

```php
// Cleanup temp file
if (file_exists($tempFilePath)) {
    unlink($tempFilePath);
    log_message('info', "Deleted temp file: {$tempFilePath}");
}
```

### 7.2 Crear tarea cron de limpieza (por si quedan archivos huérfanos)

**Ubicación:** Servidor de producción

Crear script: `/var/www/api2.mitienda.pe/scripts/cleanup-old-videos.sh`

```bash
#!/bin/bash
# Eliminar videos temp mayores a 24 horas
find /var/www/api2.mitienda.pe/writable/uploads/videos/temp/ \
  -name "*.mp4" -mtime +1 -delete

echo "$(date): Cleanup completed" >> /var/log/video-cleanup.log
```

Agregar a crontab:
```bash
# Ejecutar diario a las 3 AM
0 3 * * * /var/www/api2.mitienda.pe/scripts/cleanup-old-videos.sh
```

---

## FASE 8: Testing End-to-End

### Test Cases:

1. **Video < 40 segundos**
   - ✅ Se sube correctamente
   - ✅ NO se recorta
   - ✅ Se sube a Cloudflare
   - ✅ Se muestra en frontend

2. **Video > 40 segundos**
   - ✅ Se sube correctamente
   - ✅ Se recorta a 40 segundos con ffmpeg
   - ✅ Se sube a Cloudflare
   - ✅ Duración mostrada es 40s

3. **Formato inválido**
   - ✅ Frontend rechaza (antes de subir)
   - ✅ Backend rechaza con error 400

4. **Archivo muy grande (> 100MB)**
   - ✅ Frontend rechaza
   - ✅ Backend rechaza

5. **Eliminar video**
   - ✅ Se elimina de base de datos
   - ✅ Se elimina de Cloudflare Stream
   - ✅ Archivo temp se elimina (si aún existe)
   - ✅ Frontend actualiza y muestra botón "Añadir Video" nuevamente

6. **Error de procesamiento**
   - ✅ Si ffmpeg falla: marcar status = 'error'
   - ✅ Si Cloudflare falla: marcar status = 'error'
   - ✅ Frontend muestra mensaje de error
   - ✅ Permitir reintentar (eliminar y volver a subir)

---

## Estimación de Tiempo

| Fase | Tarea | Tiempo Estimado |
|------|-------|----------------|
| 5.1 | Configurar mtservicios | 2-3 horas |
| 5.2 | Conectar API con mtservicios | 30 min |
| 6.1 | Crear ProductVideoPlayer | 1-2 horas |
| 6.2 | Integrar en ProductDetailView | 1 hora |
| 6.3 | Implementar DELETE | 30 min |
| 7 | Limpieza de archivos | 30 min |
| 8 | Testing completo | 2 horas |
| **TOTAL** | | **7-9 horas** |

---

## Prioridades

### Alta Prioridad (MVP):
1. ✅ Upload de videos (COMPLETADO)
2. ⏳ Procesamiento con mtservicios (PENDIENTE)
3. ⏳ Mostrar video en frontend (PENDIENTE)

### Media Prioridad:
4. ⏳ Eliminar videos (PENDIENTE)
5. ⏳ Manejo de errores robusto (PENDIENTE)

### Baja Prioridad (Mejoras):
6. ⏳ Polling de estado en tiempo real (PENDIENTE)
7. ⏳ Limpieza automática de archivos (PENDIENTE)
8. ⏳ Múltiples videos por producto (FUTURO)

---

## Checklist de Deployment

Cuando esté todo listo:

### Backend API
- [ ] Verificar variables de entorno (.env)
- [ ] Habilitar `_enqueueVideoProcessing()`
- [ ] Remover logs de debug
- [ ] Deploy con git push

### mtservicios
- [ ] Instalar ffmpeg en servidor
- [ ] Configurar .env con credenciales Cloudflare
- [ ] Crear servicios y controllers
- [ ] Agregar rutas
- [ ] Deploy con git push

### Frontend
- [ ] Crear ProductVideoPlayer component
- [ ] Integrar en ProductDetailView
- [ ] Remover console.logs de debug
- [ ] Deploy con git push

### Servidor
- [ ] Verificar permisos en /writable/uploads
- [ ] Crear script de limpieza
- [ ] Configurar cron job
- [ ] Monitorear logs

---

## Notas Importantes

1. **Seguridad:**
   - MTSERVICIOS_API_KEY debe ser un secreto compartido entre API y mtservicios
   - Cloudflare tokens deben estar en .env, NUNCA en código
   - Validar siempre que el producto pertenece a la tienda (ya lo hace)

2. **Performance:**
   - El procesamiento puede tomar 1-2 minutos para videos grandes
   - Considerar queue real (Redis + workers) si hay mucho volumen
   - Por ahora, procesamiento síncrono está OK

3. **Costos:**
   - Cloudflare Stream cobra por:
     - Almacenamiento (videos guardados)
     - Minutos de video entregados (streaming)
   - Monitorear uso mensual en dashboard de Cloudflare

4. **Escalabilidad:**
   - Si crece mucho: considerar S3 + Lambda para procesamiento
   - Por ahora, mtservicios en el mismo servidor está OK

---

## Archivos a Crear

### mtservicios:
- [ ] `app/Services/CloudflareStreamService.php`
- [ ] `app/Services/VideoProcessingService.php`
- [ ] `app/Controllers/VideoJobController.php`
- [ ] `app/Config/Routes.php` (actualizar)
- [ ] `.env` (agregar variables)
- [ ] `CLOUDFLARE_STREAM_SETUP.md` (ya existe)

### Frontend:
- [ ] `src/components/products/ProductVideoPlayer.vue`
- [ ] `src/views/products/ProductDetailView.vue` (actualizar)

### Backend API:
- [ ] `app/Controllers/V1/Product.php` (descomentar línea 527)
- [ ] `.env` (agregar MTSERVICIOS_URL y API_KEY)

### Scripts:
- [ ] `/var/www/api2.mitienda.pe/scripts/cleanup-old-videos.sh`

---

**Última actualización:** 2025-10-04
**Estado:** Fase 4 completada ✅, Fases 5-8 pendientes ⏳
