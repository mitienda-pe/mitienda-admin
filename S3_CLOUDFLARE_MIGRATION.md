# Migración de Imágenes S3 → Cloudflare

**Fecha:** 2025-10-17
**Fase:** 2 - Paso 1 Completado ✅
**Estado:** FUNCIONAL

---

## 🎯 Objetivo

Migrar todas las imágenes de productos almacenadas en AWS S3 hacia Cloudflare Images, manteniendo la compatibilidad con el sistema legacy mientras se implementa la nueva infraestructura.

---

## ✅ Fase 2 - Paso 1: Listar Imágenes S3 (COMPLETADO)

### Backend - API Endpoint

**Endpoint:** `GET /api/v1/superadmin/s3-images`

**Ubicación:** [SuperAdminController.php:302](/Users/carlosvidal/www/mitienda/mitienda-api-ci4/app/Controllers/V1/SuperAdminController.php#L302)

**Parámetros:**
```
?store_id=265      // ID de la tienda (requerido)
&page=1            // Página actual (default: 1)
&per_page=50       // Imágenes por página (default: 50)
```

**Autenticación:**
- Bearer Token requerido
- Solo Super-Administradores

**Respuesta:**
```json
{
  "error": 0,
  "data": {
    "store": {
      "id": 265,
      "name": "Tienda Ejemplo",
      "is_blocked": false
    },
    "images": [
      {
        "id": 5,
        "store_id": 265,
        "store_name": "Tienda Ejemplo",
        "name": "d6c2ba571d69f7e8bb48136beb49a81b638f2d83",
        "extension": "jpg",
        "title": "Producto ejemplo",
        "uploaded_at": "2024-01-15 10:30:00",
        "status": 1,
        "s3_url": "https://s3.amazonaws.com/mitiendape/tienda_000265/tienda_000265_d6c2ba571d69f7e8bb48136beb49a81b638f2d83_extra-large.jpg",
        "cdn_url": "https://d26lpennugtm8s.cloudfront.net/tienda_000265/tienda_000265_d6c2ba571d69f7e8bb48136beb49a81b638f2d83_extra-large.jpg",
        "cloudflare_id": null,
        "is_migrated": false
      }
    ],
    "stats": {
      "total_active": 150,
      "total_migrated": 0,
      "total_pending": 150,
      "migration_progress": 0
    },
    "pagination": {
      "total": 150,
      "page": 1,
      "per_page": 50,
      "total_pages": 3
    }
  }
}
```

### Características del Endpoint

#### Filtros Aplicados:
- ✅ Solo imágenes `extra-large` (de mejor calidad)
- ✅ Solo tiendas activas (`tienda_bloqueada = 0`)
- ✅ Solo imágenes activas (`tiendaimagen_status = 1`)
- ✅ Solo imágenes NO migradas (`cloudflare_id IS NULL OR cloudflare_id = ''`)

#### Estadísticas Calculadas:
- **total_active**: Total de imágenes activas de la tienda
- **total_migrated**: Imágenes ya migradas a Cloudflare
- **total_pending**: Imágenes pendientes de migración
- **migration_progress**: Porcentaje de progreso (0-100)

#### URLs Generadas:
- **S3 URL**: Ruta directa a AWS S3
- **CDN URL**: Ruta a CloudFront (más rápida, recomendada)

---

### Frontend - Vista Super-Admin

**Ruta:** `/admin/s3-migration`

**Ubicación:** [S3MigrationView.vue](/Users/carlosvidal/www/mitienda/mitienda-administrador/src/views/admin/S3MigrationView.vue)

**Características:**

#### 1. Selección de Tienda
- Input numérico para `store_id`
- Botón de búsqueda
- Validación de campo requerido
- Loading state durante carga

#### 2. Estadísticas Visuales
4 tarjetas de estadísticas:
- 📊 **Total Activas**: Cantidad total de imágenes
- ✅ **Migradas**: Imágenes ya en Cloudflare
- ⏰ **Pendientes**: Imágenes por migrar
- 📈 **Progreso**: Barra de progreso visual con porcentaje

#### 3. Información de Tienda
- Nombre de la tienda
- ID de la tienda
- Estado (Activa/Bloqueada)

#### 4. Tabla de Imágenes
Columnas:
- **Preview**: Thumbnail de la imagen (60x60px)
- **ID**: tiendaimagen_id
- **Título**: Título de la imagen
- **Formato**: Extensión (JPG, PNG, etc.)
- **Fecha Subida**: Timestamp formateado
- **URL S3**: Link para ver en CloudFront
- **Acciones**: Botón "Migrar" (deshabilitado - próximamente)

#### 5. Paginación
- Navegación anterior/siguiente
- Indicador de página actual
- Total de páginas y registros

#### 6. Estados de UI
- **Loading**: Spinner durante carga
- **Error**: Mensaje de error con icono
- **Empty State**: Mensaje cuando no hay imágenes pendientes
- **Success**: Toast notification al cargar datos

#### 7. Manejo de Errores
- Fallback para imágenes no disponibles
- Mensajes de error descriptivos
- Toast notifications para feedback

---

## 📊 Estructura de Base de Datos

### Tabla: `tiendasimagenes`

Almacena todas las imágenes de las tiendas en S3:

```sql
CREATE TABLE tiendasimagenes (
  tiendaimagen_id INT PRIMARY KEY,
  tienda_id INT,
  tiendaimagen_nombre VARCHAR(120),      -- SHA1 hash del archivo
  tiendaimagen_extension VARCHAR(10),    -- jpg, png, webp, etc.
  tiendaimagen_titulo VARCHAR(200),      -- Título de la imagen
  cloudflare_id VARCHAR(255),            -- ID de Cloudflare (NULL si no migrada)
  tiendaimagen_textoalternativo VARCHAR(250),
  tiendaimagen_descripcion TEXT,
  tiendaimagen_fechasubida DATETIME,
  tiendaimagen_permite_upgrade INT,
  tiendaimagen_equivalente_clon INT,
  tiendaimagen_detalle_upgrade INT,
  tiendaimagen_status INT                -- 1 = activa, 0 = inactiva
);
```

### Convención de Nombres S3

Las imágenes en S3 siguen este patrón:
```
s3://mitiendape/tienda_{TIENDA_ID_PADDED}/tienda_{TIENDA_ID_PADDED}_{NOMBRE_SHA1}_{TAMAÑO}.{EXTENSION}
```

**Ejemplo:**
```
Tienda ID: 265
Nombre: d6c2ba571d69f7e8bb48136beb49a81b638f2d83
Extensión: jpg

S3 URL:
https://s3.amazonaws.com/mitiendape/tienda_000265/tienda_000265_d6c2ba571d69f7e8bb48136beb49a81b638f2d83_extra-large.jpg

CloudFront URL:
https://d26lpennugtm8s.cloudfront.net/tienda_000265/tienda_000265_d6c2ba571d69f7e8bb48136beb49a81b638f2d83_extra-large.jpg
```

**Tamaños disponibles:**
- `original` - Imagen original sin procesar
- `extra-large` - 1200x1200 (usado para migración)
- `large` - 800x800
- `medium` - 400x400
- `small` - 200x200
- `thumbnail` - 100x100

---

## 🔒 Seguridad

### Autenticación
- ✅ Requiere token JWT válido
- ✅ Verificación de Super-Admin
- ✅ Validación de permisos en cada request

### Validaciones
- ✅ `store_id` es requerido y debe ser > 0
- ✅ Verificación de existencia de tienda
- ✅ Solo tiendas no bloqueadas
- ✅ Solo imágenes activas

### Logging
```php
log_message('info', "SuperAdmin {$user_id} listed S3 images for store {$store_id}");
```

---

## 🧪 Testing

### Caso de Prueba 1: Tienda con Imágenes Pendientes

**Request:**
```bash
curl -X GET "https://api2.mitienda.pe/api/v1/superadmin/s3-images?store_id=265&page=1" \
  -H "Authorization: Bearer {SUPERADMIN_TOKEN}"
```

**Expected:**
- Status: 200
- Retorna lista de imágenes con `is_migrated: false`
- `stats.total_pending > 0`

### Caso de Prueba 2: Tienda sin Imágenes Pendientes

**Request:**
```bash
curl -X GET "https://api2.mitienda.pe/api/v1/superadmin/s3-images?store_id=408&page=1" \
  -H "Authorization: Bearer {SUPERADMIN_TOKEN}"
```

**Expected:**
- Status: 200
- Array de images vacío `[]`
- `stats.total_pending = 0`
- `stats.migration_progress = 100` (si hay imágenes migradas)

### Caso de Prueba 3: Tienda Inexistente

**Request:**
```bash
curl -X GET "https://api2.mitienda.pe/api/v1/superadmin/s3-images?store_id=999999" \
  -H "Authorization: Bearer {SUPERADMIN_TOKEN}"
```

**Expected:**
- Status: 404
- Error: "Tienda no encontrada"

### Caso de Prueba 4: Sin Autenticación

**Request:**
```bash
curl -X GET "https://api2.mitienda.pe/api/v1/superadmin/s3-images?store_id=265"
```

**Expected:**
- Status: 401
- Error: "Token no enviado"

### Caso de Prueba 5: Usuario No SuperAdmin

**Request:**
```bash
curl -X GET "https://api2.mitienda.pe/api/v1/superadmin/s3-images?store_id=265" \
  -H "Authorization: Bearer {REGULAR_USER_TOKEN}"
```

**Expected:**
- Status: 403
- Error: "No autorizado. Solo superadministradores."

---

## 📋 Próximos Pasos

### ⏳ Fase 2 - Paso 2: Implementar Migración Individual

**Objetivo:** Migrar una imagen específica de S3 a Cloudflare

**Endpoint:** `POST /api/v1/superadmin/migrate-image`

**Body:**
```json
{
  "tiendaimagen_id": 5,
  "store_id": 265
}
```

**Proceso:**
1. Descargar imagen desde CloudFront URL
2. Validar tamaño mínimo (600x600)
3. Subir a Cloudflare usando `CloudflareImagesService`
4. Actualizar `tiendasimagenes.cloudflare_id`
5. Actualizar productos que usan esta imagen
6. Retornar URL de Cloudflare

---

### ⏳ Fase 2 - Paso 3: Migración en Lote (Batch)

**Objetivo:** Migrar múltiples imágenes de una tienda

**Endpoint:** `POST /api/v1/superadmin/migrate-batch`

**Body:**
```json
{
  "store_id": 265,
  "batch_size": 10,
  "start_from": 0
}
```

**Features:**
- Queue de trabajos
- Progress tracking
- Error handling y retry logic
- Límite de rate para Cloudflare API (1000/día)

---

### ⏳ Fase 2 - Paso 4: Validación Post-Migración

**Objetivo:** Verificar que todas las imágenes funcionan

**Endpoint:** `GET /api/v1/superadmin/validate-migration`

**Proceso:**
1. Listar todas las imágenes migradas
2. Verificar accesibilidad de URLs Cloudflare
3. Comparar con registros en BD
4. Generar reporte de imágenes rotas

---

### ⏳ Fase 2 - Paso 5: Limpieza de S3

**Objetivo:** Eliminar imágenes de S3 tras validación exitosa

**Manual:** Por seguridad, este paso será manual mediante AWS Console

**Checklist:**
- [ ] Todas las imágenes migradas y validadas
- [ ] Backup de S3 bucket realizado
- [ ] Confirmación de 30 días sin problemas
- [ ] Eliminar archivos de S3
- [ ] Actualizar documentación

---

## 📝 Notas Técnicas

### Performance

- **Paginación:** 50 imágenes por página para balance entre UX y performance
- **Caché:** Considerar agregar caché Redis para stats (actualizar cada 5 min)
- **Índices DB:** Asegurar índices en `tienda_id`, `tiendaimagen_status`, `cloudflare_id`

### Limitaciones Cloudflare

- **Free Plan:** 100,000 imágenes almacenadas, 100,000 entregas/mes
- **Rate Limits:** ~1000 uploads por día recomendado
- **Tamaño Max:** 10MB por imagen

### Consideraciones

1. **Imágenes Duplicadas:** Múltiples productos pueden usar la misma imagen en S3
2. **Orden de Migración:** Migrar primero tiendas activas con planes pagados
3. **Rollback:** Mantener imágenes S3 por 60 días post-migración
4. **Monitoreo:** Trackear errores 404 en Cloudflare

---

## 🔗 Enlaces Útiles

- [Cloudflare Images API Docs](https://developers.cloudflare.com/images/cloudflare-images/)
- [AWS S3 Bucket: mitiendape](https://s3.console.aws.amazon.com/s3/buckets/mitiendape)
- [CloudFront Distribution](https://d26lpennugtm8s.cloudfront.net)

---

**Última actualización:** 2025-10-17 02:15 UTC
**Autor:** Claude Code
**Estado:** ✅ Fase 2 - Paso 1 COMPLETADO
**Git Commits:**
- Backend: `2543722` - feat: Add S3 images migration endpoint
- Frontend: `493548c` - feat: Add S3 Migration view for Super-Admin
