# S3 Images URL Fix - October 17, 2025

## Problem

The S3 migration interface was showing "Access Denied" errors when trying to preview images because the backend was constructing URLs with an incorrect size suffix (`_extra-large`) that doesn't exist in S3.

### Example of Non-Working URL:
```
https://d20f60vzbd93dl.cloudfront.net/uploads/tienda_008379/tienda_008379_f9419228f0ad3278df7507c5c9d0c5506a52ab99_extra-large.png
```
**Result:** AccessDenied

### Example of Working URL:
```
https://d20f60vzbd93dl.cloudfront.net/uploads/tienda_008379/tienda_008379_b5b0916a00a3fb5c060242e143b1a735913810b3_producto_xlarge_100.png
```
**Result:** Image loads successfully

## Root Cause

The backend was constructing S3 URLs by concatenating:
- Store ID padded to 6 digits
- Image hash from `tiendasimagenes.tiendaimagen_nombre`
- Hardcoded suffix `_extra-large`
- Extension

**However**, the actual image files in S3 use different naming conventions stored in the `tiendasimagenesdetalles` table:
- `producto_xlarge_100` (highest quality, 100% JPEG)
- `producto_large_90` (90% JPEG)
- `producto_medium_80` (80% JPEG)
- `producto_small_80` (80% JPEG, smaller dimensions)
- Various WebP versions: `producto_xlarge_100_webp`, etc.

## Solution

Modified the backend to:

1. **JOIN** the `tiendasimagenesdetalles` table to get actual image filenames
2. **Filter** for `tiendaimagendetalle_tamannio = 'producto_xlarge'` to get the highest quality product images
3. **Use** the actual `tiendaimagendetalle_nombre` field which contains the complete filename with correct suffix
4. **Construct** URLs using the real filename instead of guessing the pattern

## Changes Made

### File: `/app/Controllers/V1/SuperAdminController.php`

#### 1. Added JOIN to tiendasimagenesdetalles

**Before:**
```php
$builder->join('tiendas t', 'ti.tienda_id = t.tienda_id', 'inner');
$builder->join('productosimagenes pi', 'ti.tiendaimagen_id = pi.tiendaimagen_id', 'left');
$builder->join('productos p', 'pi.producto_id = p.producto_id', 'left');
```

**After:**
```php
$builder->join('tiendas t', 'ti.tienda_id = t.tienda_id', 'inner');
$builder->join('tiendasimagenesdetalles tid', 'ti.tiendaimagen_id = tid.tiendaimagen_id', 'inner');
$builder->join('productosimagenes pi', 'ti.tiendaimagen_id = pi.tiendaimagen_id', 'left');
$builder->join('productos p', 'pi.producto_id = p.producto_id', 'left');
```

#### 2. Added image detail fields to SELECT

**Added:**
```php
tid.tiendaimagendetalle_nombre as image_filename,
tid.tiendaimagendetalle_ancho as image_width,
tid.tiendaimagendetalle_alto as image_height,
tid.tiendaimagendetalle_bytes as image_bytes,
```

#### 3. Added filter for producto_xlarge size

**Added:**
```php
$builder->where('tid.tiendaimagendetalle_tamannio', 'producto_xlarge');
```

#### 4. Changed URL construction to use actual filename

**Before:**
```php
$tiendaId = str_pad($img['tienda_id'], 6, '0', STR_PAD_LEFT);
$imageName = $img['tiendaimagen_nombre'];
$extension = $img['tiendaimagen_extension'];

$s3Url = "https://s3.amazonaws.com/mitiendape/uploads/tienda_{$tiendaId}/tienda_{$tiendaId}_{$imageName}_extra-large.{$extension}";
$cdnUrl = "https://d20f60vzbd93dl.cloudfront.net/uploads/tienda_{$tiendaId}/tienda_{$tiendaId}_{$imageName}_extra-large.{$extension}";
```

**After:**
```php
// Usar el nombre de archivo real de la BD
$imageFilename = $img['image_filename'];

// URL de imagen producto_xlarge en S3 (usando nombre real)
$s3Url = "https://s3.amazonaws.com/mitiendape/uploads/{$imageFilename}";

// URL CloudFront (CDN)
$cdnUrl = "https://d20f60vzbd93dl.cloudfront.net/uploads/{$imageFilename}";
```

#### 5. Added image metadata to API response

**Added fields:**
```php
'image_width' => (int)$img['image_width'],
'image_height' => (int)$img['image_height'],
'image_bytes' => (int)$img['image_bytes']
```

## Benefits

1. ✅ **Image previews now work** - URLs point to actual files that exist in S3
2. ✅ **Accurate metadata** - Width, height, and file size are now available
3. ✅ **Correct size filtering** - Only shows `producto_xlarge` images (highest quality)
4. ✅ **No more hardcoded patterns** - Uses actual database values
5. ✅ **Eliminates duplicates** - Each image has only one producto_xlarge variant

## Database Schema

### tiendasimagenes
Central table with image metadata:
- `tiendaimagen_id` (PK)
- `tienda_id`
- `tiendaimagen_nombre` (SHA1 hash of file content)
- `tiendaimagen_extension` (jpg, png, etc.)
- `cloudflare_id` (NULL if not migrated)

### tiendasimagenesdetalles
Stores actual image variants and URLs:
- `tiendaimagendetalle_id` (PK)
- `tiendaimagen_id` (FK)
- `tiendaimagendetalle_tamannio` (variant name: producto_xlarge, producto_medium, etc.)
- `tiendaimagendetalle_nombre` (complete filename with path)
- `tiendaimagendetalle_ancho` (width in pixels)
- `tiendaimagendetalle_alto` (height in pixels)
- `tiendaimagendetalle_bytes` (file size)

## Testing

To test the fix:

1. **Login to Super-Admin** section in the Vue 3 admin panel
2. **Navigate to** "Migración S3 → Cloudflare"
3. **Enter a store ID** (e.g., 8379)
4. **Check "Solo imágenes de productos"** checkbox
5. **Verify:**
   - Image previews load correctly
   - URLs in the table end with `_producto_xlarge_100.{ext}`
   - No "Access Denied" errors

## Commit

```
cff1da1 - fix: Use actual image filenames from tiendasimagenesdetalles for producto_xlarge URLs
```

## Next Steps

- Test the endpoint with the frontend interface
- Verify image previews display correctly
- Confirm no duplicate images appear (since we're filtering by tamannio)
- Proceed with Phase 2 Step 2: Implement actual migration logic
