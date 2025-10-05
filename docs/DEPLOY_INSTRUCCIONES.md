# 🚀 Instrucciones de Deploy - Feature de Videos

## 📋 Checklist Pre-Deploy

Antes de hacer deploy, asegúrate de tener:

- [x] Código en GitHub/Bitbucket actualizado
- [x] Acceso SSH a:
  - `api2.mitienda.pe`
  - `mtservicios.mitienda.host`
- [ ] Cloudflare Account ID (ver sección "Obtener Cloudflare Account ID")
- [ ] Revisar estos archivos `.env` antes de deploy

## 🔑 Obtener Cloudflare Account ID

### Opción 1: Dashboard de Cloudflare
1. Ir a https://dash.cloudflare.com/
2. Seleccionar tu cuenta
3. Click en "Stream" (en el menú lateral)
4. Click en "Settings"
5. Copiar el "Account ID"

### Opción 2: API de Cloudflare
```bash
curl -X GET "https://api.cloudflare.com/client/v4/accounts" \
  -H "Authorization: Bearer wg73vWKekhCgxk7LrCJvndtpVWomNSQjXhaDLMz_" \
  | jq '.result[0].id'
```

**Guardar este ID**, lo necesitarás para configurar mtservicios.

---

## 📦 Deploy Paso a Paso

### 1. Deploy API (api2.mitienda.pe)

```bash
# 1.1 Conectar al servidor
ssh root@api2.mitienda.pe

# 1.2 Ir al directorio del proyecto
cd /var/www/api2.mitienda.pe

# 1.3 Pull del código
git pull origin main

# 1.4 Crear carpeta compartida
bash setup-shared-folder.sh

# Debe mostrar:
# ✅ Carpeta compartida configurada correctamente
# Ruta: /var/www/shared/uploads/videos/temp

# 1.5 Verificar que existe
ls -la /var/www/shared/uploads/videos/temp
# Debe mostrar permisos: drwxrwxr-x www-data www-data

# 1.6 Actualizar .env (agregar al final)
nano .env
```

**Agregar estas líneas al .env:**
```env
# mtservicios Configuration
MTSERVICIOS_URL=https://mtservicios.mitienda.host
MTSERVICIOS_API_KEY=3c3441babdbf3208bbcbc47ffd62e12ee493a2c9eeeec4de29e666ccde9bf8a7
```

```bash
# 1.7 Reiniciar PHP-FPM (si es necesario)
sudo systemctl restart php8.4-fpm

# 1.8 Verificar logs
tail -f writable/logs/log-$(date +%Y-%m-%d).log
```

---

### 2. Deploy mtservicios (mtservicios.mitienda.host)

```bash
# 2.1 Conectar al servidor
ssh root@mtservicios.mitienda.host

# 2.2 Ir al directorio del proyecto
cd /var/www/mtservicios.mitienda.host

# 2.3 Pull del código
git pull origin main

# 2.4 Actualizar .env
nano .env
```

**Actualizar/Agregar estas líneas en .env:**
```env
# Cloudflare Stream Configuration
CLOUDFLARE_ACCOUNT_ID=TU_ACCOUNT_ID_AQUI  # ⚠️ Reemplazar con el ID real
CLOUDFLARE_STREAM_API_TOKEN=wg73vWKekhCgxk7LrCJvndtpVWomNSQjXhaDLMz_
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe
VIDEO_MAX_DURATION=40
VIDEO_TEMP_PATH=/var/www/shared/uploads/videos/temp  # ⚠️ Carpeta compartida
MITIENDA_API_URL=https://api2.mitienda.pe

# API Key for securing mtservicios endpoints
API_KEY=3c3441babdbf3208bbcbc47ffd62e12ee493a2c9eeeec4de29e666ccde9bf8a7
```

```bash
# 2.5 Verificar que ffmpeg y ffprobe existen
which ffmpeg
# Debe mostrar: /usr/bin/ffmpeg

which ffprobe
# Debe mostrar: /usr/bin/ffprobe

# Si no están instalados:
sudo apt update
sudo apt install ffmpeg -y

# 2.6 Verificar acceso a carpeta compartida
ls -la /var/www/shared/uploads/videos/temp
# Debe mostrar: drwxrwxr-x www-data www-data

# Si no existe o no tiene permisos:
mkdir -p /var/www/shared/uploads/videos/temp
chown -R www-data:www-data /var/www/shared
chmod -R 775 /var/www/shared

# 2.7 Reiniciar PHP-FPM (si es necesario)
sudo systemctl restart php8.4-fpm

# 2.8 Verificar logs
tail -f writable/logs/log-$(date +%Y-%m-%d).log
```

---

### 3. Deploy Frontend (mitienda-administrador)

El frontend ya está desplegado en Vercel/Netlify. Solo necesita rebuild:

```bash
# Opción A: Auto-deploy (si está configurado en Vercel/Netlify)
# Push a main ya debería triggerear deploy automático

# Opción B: Manual deploy
cd /Users/carlosvidal/www/mitienda/mitienda-administrador
npm run build
# Luego sube la carpeta dist/ a tu hosting
```

---

## 🧪 Testing Post-Deploy

### Test 1: Verificar Configuración

```bash
# En api2.mitienda.pe
curl -H "Authorization: Bearer <TU_TOKEN>" \
  https://api2.mitienda.pe/api/v1/products/429991

# Debe devolver el producto con campo "video" (null si no tiene video)
```

### Test 2: Upload Video Corto (< 40s)

1. Ir al backoffice → Productos → Ver detalle
2. Click "Añadir Video"
3. Seleccionar video de prueba (< 40s)
4. Upload debe ser exitoso
5. Modal se cierra
6. Debe aparecer Card "Video del producto" con spinner
7. Esperar ~30 segundos (auto-refresh activo)
8. Debe cambiar a reproductor Cloudflare

**Verificar en logs:**
```bash
# En api2.mitienda.pe
tail -f /var/www/api2.mitienda.pe/writable/logs/log-$(date +%Y-%m-%d).log | grep -i video

# Debe mostrar:
# Starting video upload for product...
# Video uploaded for product...
# Video processing job enqueued...
```

```bash
# En mtservicios.mitienda.host
tail -f /var/www/mtservicios.mitienda.host/writable/logs/log-$(date +%Y-%m-%d).log | grep -i video

# Debe mostrar:
# Processing video for product...
# Video duration: X.Xs (max: 40s)
# Video duration is OK. No trimming needed.
# Uploading video to Cloudflare Stream...
# Video uploaded to Cloudflare: {...}
# Video processing completed successfully
```

### Test 3: Upload Video Largo (> 40s)

1. Subir video > 40s
2. Mismo flujo que Test 2
3. En logs de mtservicios debe mostrar:
   ```
   Video exceeds max duration. Trimming to 40s...
   Video trimmed successfully to 40 seconds
   ```
4. Video final debe durar exactamente 40s

### Test 4: Verificar en Cloudflare

1. Ir a https://dash.cloudflare.com/
2. Stream → Videos
3. Debe aparecer el video subido
4. Click en el video → Ver detalles
5. Copiar "Video ID" (cloudflare_uid)
6. Comparar con el UID en la base de datos:
   ```sql
   SELECT
       producto_id,
       producto_titulo,
       producto_video_cloudflare_uid,
       producto_video_duration,
       producto_video_status
   FROM productos
   WHERE producto_video_cloudflare_uid IS NOT NULL;
   ```

### Test 5: Eliminar Video

1. En backoffice → Ver producto con video
2. Click "Eliminar" en el player
3. Confirmar eliminación
4. Toast verde "Video eliminado"
5. Card de video desaparece
6. En Cloudflare: Video debe ser eliminado

**Verificar en logs:**
```bash
# En api2.mitienda.pe
tail -f /var/www/api2.mitienda.pe/writable/logs/log-$(date +%Y-%m-%d).log | grep -i "video deletion"

# En mtservicios.mitienda.host
tail -f /var/www/mtservicios.mitienda.host/writable/logs/log-$(date +%Y-%m-%d).log | grep -i "deleting video"
```

---

## 🐛 Troubleshooting

### Error: "Video file not found"
**Causa:** Carpeta compartida no creada o sin permisos

**Solución:**
```bash
# En api2.mitienda.pe
bash /var/www/api2.mitienda.pe/setup-shared-folder.sh
ls -la /var/www/shared/uploads/videos/temp
```

### Error: "Failed to enqueue video processing"
**Causa:** mtservicios URL o API_KEY incorrecta

**Solución:**
```bash
# Verificar .env en api2.mitienda.pe
cat /var/www/api2.mitienda.pe/.env | grep MTSERVICIOS

# Debe mostrar:
# MTSERVICIOS_URL=https://mtservicios.mitienda.host
# MTSERVICIOS_API_KEY=3c3441babdbf3208bbcbc47ffd62e12ee493a2c9eeeec4de29e666ccde9bf8a7
```

### Error: "Cloudflare Stream credentials not configured"
**Causa:** CLOUDFLARE_ACCOUNT_ID vacío o inválido

**Solución:**
```bash
# En mtservicios.mitienda.host
nano /var/www/mtservicios.mitienda.host/.env

# Actualizar:
# CLOUDFLARE_ACCOUNT_ID=<ID_REAL>  # NO dejar "tu_account_id"
```

### Error: "ffmpeg not found"
**Causa:** ffmpeg no instalado

**Solución:**
```bash
# En mtservicios.mitienda.host
sudo apt update
sudo apt install ffmpeg -y
which ffmpeg  # Debe mostrar: /usr/bin/ffmpeg
```

### Video queda en "processing" forever
**Causa:** Error en mtservicios (revisar logs)

**Solución:**
```bash
# Ver logs completos en mtservicios
tail -100 /var/www/mtservicios.mitienda.host/writable/logs/log-$(date +%Y-%m-%d).log

# Buscar errores:
grep -i error /var/www/mtservicios.mitienda.host/writable/logs/log-$(date +%Y-%m-%d).log
```

### Error: "Video processing timeout - exceeded maximum attempts"
**Causa:** Cloudflare tardó más de 150s (30 attempts * 5s) en procesar

**Opciones:**
1. Video muy grande → reducir tamaño antes de subir
2. Aumentar `$maxAttempts` en CloudflareStreamService.php
3. Revisar en Cloudflare si el video está en error

---

## 📊 Monitoreo

### Logs en tiempo real

```bash
# Terminal 1: API logs
ssh root@api2.mitienda.pe
tail -f /var/www/api2.mitienda.pe/writable/logs/log-$(date +%Y-%m-%d).log

# Terminal 2: mtservicios logs
ssh root@mtservicios.mitienda.host
tail -f /var/www/mtservicios.mitienda.host/writable/logs/log-$(date +%Y-%m-%d).log
```

### Base de Datos

```sql
-- Ver todos los videos
SELECT
    p.producto_id,
    p.producto_titulo,
    p.producto_video_status,
    p.producto_video_duration,
    p.producto_video_cloudflare_uid,
    p.producto_video_created_at
FROM productos p
WHERE p.producto_video_status IS NOT NULL
ORDER BY p.producto_video_created_at DESC;

-- Ver videos en error
SELECT
    p.producto_id,
    p.producto_titulo,
    p.producto_video_error
FROM productos p
WHERE p.producto_video_status = 'error';
```

### Cloudflare Dashboard

URL: https://dash.cloudflare.com/ → Stream → Videos

Métricas disponibles:
- Total de videos
- Storage usado
- Minutes delivered (streaming)
- Errores de encoding

---

## 🎉 Deploy Completado

Si todos los tests pasan:

- [x] Upload funciona
- [x] Procesamiento funciona (trim si > 40s)
- [x] Cloudflare recibe videos
- [x] Reproductor muestra videos
- [x] Eliminar funciona
- [x] Auto-refresh funciona

**¡Feature de videos está en producción!** 🚀

---

## 📞 Soporte

Si tienes problemas:

1. Revisar logs (API y mtservicios)
2. Verificar configuración .env
3. Verificar permisos de carpetas
4. Verificar Cloudflare dashboard
5. Consultar documentación:
   - `FASE_4_COMPLETADA.md`
   - `FASE_5_COMPLETADA.md`
   - `FASE_6_COMPLETADA.md`
