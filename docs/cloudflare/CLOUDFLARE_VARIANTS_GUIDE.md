# Cloudflare Images - Guía de Variants

**Fecha:** 2025-10-17
**Autor:** Claude Code

---

## 🎯 ¿Qué son los Variants?

Los **variants** en Cloudflare Images son diferentes versiones de una misma imagen con transformaciones aplicadas (resize, crop, format, quality, etc.). Son como las versiones `extra-large`, `large`, `medium`, `thumbnail` de S3, pero **generadas automáticamente on-the-fly** por Cloudflare.

---

## 🔑 Concepto Clave

**Con S3:** Tú subes 6 versiones diferentes del mismo archivo (original, extra-large, large, medium, small, thumbnail)

**Con Cloudflare:** Subes 1 sola vez, Cloudflare genera todas las versiones que necesites

---

## 📐 Variants Predefinidos

Cloudflare incluye un variant predefinido llamado `public`:

```
https://imagedelivery.net/{ACCOUNT_HASH}/{IMAGE_ID}/public
```

Este variant tiene configuración por defecto y es útil para empezar, pero **debes crear tus propios variants** para casos de uso específicos.

---

## 🛠️ Crear Variants Personalizados

### Opción 1: Cloudflare Dashboard

1. Ir a: https://dash.cloudflare.com/{ACCOUNT_ID}/images/variants
2. Click en "Create Variant"
3. Configurar:
   - **Name**: `thumbnail`, `product-card`, `product-detail`, etc.
   - **Width**: Ancho deseado (ej: 200px)
   - **Height**: Alto deseado (ej: 200px)
   - **Fit**: Modo de ajuste (scale-down, contain, cover, crop, pad)
   - **Format**: Auto, WebP, AVIF, JPEG, PNG
   - **Quality**: 1-100 (recomendado: 85)

### Opción 2: API

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/images/v1/variants" \
  -H "Authorization: Bearer {API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "id": "thumbnail",
    "options": {
      "fit": "scale-down",
      "width": 200,
      "height": 200,
      "metadata": "none"
    },
    "neverRequireSignedURLs": true
  }'
```

---

## 📋 Variants Recomendados para Mitienda

### 1. Product Thumbnail (200x200)
```json
{
  "id": "product-thumbnail",
  "options": {
    "fit": "cover",
    "width": 200,
    "height": 200,
    "quality": 85,
    "format": "auto"
  }
}
```

**Uso:** Grid de productos, carrito, búsqueda

---

### 2. Product Card (400x400)
```json
{
  "id": "product-card",
  "options": {
    "fit": "contain",
    "width": 400,
    "height": 400,
    "quality": 85,
    "format": "auto",
    "background": "white"
  }
}
```

**Uso:** Listado de productos en categorías

---

### 3. Product Detail (800x800)
```json
{
  "id": "product-detail",
  "options": {
    "fit": "contain",
    "width": 800,
    "height": 800,
    "quality": 90,
    "format": "auto"
  }
}
```

**Uso:** Página de detalle del producto, zoom

---

### 4. Product Gallery (1200x1200)
```json
{
  "id": "product-gallery",
  "options": {
    "fit": "scale-down",
    "width": 1200,
    "height": 1200,
    "quality": 90,
    "format": "auto"
  }
}
```

**Uso:** Lightbox, galería de imágenes

---

### 5. Logo Small (100x100)
```json
{
  "id": "logo-small",
  "options": {
    "fit": "contain",
    "width": 100,
    "height": 100,
    "quality": 90,
    "format": "png"
  }
}
```

**Uso:** Header, favicon, íconos

---

## 🌐 Uso de Variants

Una vez creados los variants, se usan así:

```
Base URL:
https://imagedelivery.net/{ACCOUNT_HASH}/{IMAGE_ID}/{VARIANT_NAME}

Ejemplos:
https://imagedelivery.net/RDUXbBjpIOT3MTiFEgbpNw/bcc2f281-0a78-42b9-1287-f1e2b5d4c300/public
https://imagedelivery.net/RDUXbBjpIOT3MTiFEgbpNw/bcc2f281-0a78-42b9-1287-f1e2b5d4c300/product-thumbnail
https://imagedelivery.net/RDUXbBjpIOT3MTiFEgbpNw/bcc2f281-0a78-42b9-1287-f1e2b5d4c300/product-card
https://imagedelivery.net/RDUXbBjpIOT3MTiFEgbpNw/bcc2f281-0a78-42b9-1287-f1e2b5d4c300/product-detail
```

---

## 🎨 Opciones de Fit

| Fit Mode | Comportamiento |
|----------|---------------|
| **scale-down** | Reduce si es más grande que el tamaño objetivo, nunca agranda. Mantiene aspect ratio. |
| **contain** | Ajusta la imagen dentro del tamaño objetivo. Mantiene aspect ratio. Puede dejar espacios. |
| **cover** | Llena completamente el área. Recorta si es necesario. Mantiene aspect ratio. |
| **crop** | Recorta al tamaño exacto especificado. Puede distorsionar. |
| **pad** | Como contain pero rellena con color de fondo. |

---

## 🚀 Migración desde S3

### Problema Actual con S3

Cada imagen tiene 6 versiones almacenadas:
```
tienda_000265_nombre_original.jpg      (Original sin procesar)
tienda_000265_nombre_extra-large.jpg   (1200x1200)
tienda_000265_nombre_large.jpg         (800x800)
tienda_000265_nombre_medium.jpg        (400x400)
tienda_000265_nombre_small.jpg         (200x200)
tienda_000265_nombre_thumbnail.jpg     (100x100)
```

**Esto multiplica por 6 el espacio de almacenamiento**

---

### Solución con Cloudflare

Solo subimos la imagen **original** (o extra-large como estándar):
```php
// Subir a Cloudflare
$cloudflareService->uploadImage($file, $tiendaId, $titulo, $productoId);

// Usar en frontend
<img src="https://imagedelivery.net/{HASH}/{IMAGE_ID}/product-thumbnail" />
<img src="https://imagedelivery.net/{HASH}/{IMAGE_ID}/product-card" />
<img src="https://imagedelivery.net/{HASH}/{IMAGE_ID}/product-detail" />
```

Cloudflare genera automáticamente cada versión la primera vez que se solicita, y luego la cachea en su CDN global.

---

## 🔍 ¿Por qué no funciona el preview en S3MigrationView?

### Problema

Las imágenes de S3 **NO son públicas por defecto**. Necesitan:
1. URL firmada (signed URL) con tiempo de expiración
2. O configurar el bucket como público

### URLs Actuales

**S3 Direct (PRIVATE):**
```
https://s3.amazonaws.com/mitiendape/tienda_000265/tienda_000265_nombre_extra-large.jpg
❌ Error 403: Access Denied
```

**CloudFront (PUBLIC):**
```
https://d26lpennugtm8s.cloudfront.net/tienda_000265/tienda_000265_nombre_extra-large.jpg
✅ Funciona (si el bucket tiene permisos configurados correctamente)
```

### Solución Temporal

Ya estamos usando CloudFront URLs en el preview:
```typescript
cdn_url: "https://d26lpennugtm8s.cloudfront.net/..."
```

Si no funciona, verificar:
1. Permisos del bucket S3
2. Configuración de CloudFront distribution
3. CORS headers

### Solución Definitiva

Una vez migrado a Cloudflare, todas las imágenes serán públicas por defecto (a menos que configures signed URLs) y el preview funcionará perfectamente.

---

## ⚡ Ventajas de Cloudflare Variants

### 1. **Ahorro de Espacio**
- S3: 6 archivos × 100KB = 600KB por imagen
- Cloudflare: 1 archivo × 100KB = 100KB (6x menos espacio)

### 2. **Procesamiento Automático**
- No necesitas redimensionar imágenes manualmente
- Cloudflare lo hace on-the-fly

### 3. **Formato Moderno**
- Cloudflare puede servir WebP/AVIF automáticamente si el navegador lo soporta
- S3 solo sirve el formato que subiste

### 4. **CDN Global**
- Cloudflare tiene 300+ data centers
- AWS CloudFront tiene menos puntos de presencia

### 5. **Sin Costo de Transferencia**
- Cloudflare no cobra por bandwidth
- AWS S3 cobra $0.09 por GB de transferencia

### 6. **Lazy Resize**
- Solo genera las versiones que realmente se usan
- S3 genera todas las versiones siempre

---

## 🛡️ Limitaciones

### Free Plan
- 100,000 imágenes almacenadas
- 100,000 imágenes servidas/mes
- Variants ilimitados ✅

### Paid Plan ($5/mes)
- 100,000 imágenes incluidas
- 500,000 imágenes servidas incluidas
- $0.001 por imagen adicional
- $1 por 10,000 imágenes servidas adicionales

---

## 📝 Próximos Pasos Sugeridos

1. **Crear variants en Dashboard**
   - `product-thumbnail` (200x200)
   - `product-card` (400x400)
   - `product-detail` (800x800)

2. **Actualizar CloudflareImagesService**
   - Agregar método `getImageUrl($imageId, $variant = 'public')`
   - Helper para generar URLs con diferentes variants

3. **Actualizar Frontend**
   - Usar `product-thumbnail` en grids
   - Usar `product-card` en listados
   - Usar `product-detail` en páginas de producto

4. **Migración**
   - Subir solo imágenes extra-large (1200x1200)
   - Cloudflare genera el resto automáticamente

---

## 🔗 Referencias

- [Cloudflare Images Docs](https://developers.cloudflare.com/images/)
- [Variants Documentation](https://developers.cloudflare.com/images/cloudflare-images/transform/resize-images/)
- [Pricing](https://www.cloudflare.com/plans/developer-platform/)
- [API Reference](https://developers.cloudflare.com/api/operations/cloudflare-images-variants-list-variants)

---

**Account Hash:** `RDUXbBjpIOT3MTiFEgbpNw`
**Account ID:** `2998d27925d94d6941e16e703022867d`

---

**Última actualización:** 2025-10-17
**Autor:** Claude Code
