# Smart Deletion Logic - Test Documentation

## Overview

The `ProductController::deleteImage()` method implements smart deletion logic that prevents accidental deletion of shared images from Cloudflare.

## Implementation Details

Location: [Product.php:1365-1433](/Users/carlosvidal/www/mitienda/mitienda-api-ci4/app/Controllers/V1/Product.php#L1365)

### Deletion Flow

```
1. Receive DELETE request: /api/v1/products/{productId}/images/{cloudflareImagenId}
   ↓
2. Verify image ownership (tienda_id)
   ↓
3. Unlink image from product (delete from productos_cloudflare_images)
   ↓
4. Check if other products use this image
   ↓
5. If NO other links → Delete from Cloudflare API + Soft delete in DB
   If YES other links → Keep in Cloudflare (only unlinked)
   ↓
6. Return updated image list for product
```

## Test Scenarios

### Scenario 1: Delete Image Used by Single Product ✅

**Setup:**
- Image: `cloudflare_imagen_id = 57`
- Product: `producto_id = 221884`
- Links: Only 1 (productos_cloudflare_images has single entry)

**Expected Behavior:**
1. Unlink from product 221884
2. Check for other links → finds 0
3. Delete from Cloudflare API
4. Soft delete in cloudflare_images (status = 0)
5. Return success with updated image list

**SQL to verify:**
```sql
-- Before deletion
SELECT * FROM productos_cloudflare_images WHERE cloudflare_imagen_id = 57;
-- Returns: 1 row (producto_id: 221884, orden: 4)

-- After deletion
SELECT * FROM productos_cloudflare_images WHERE cloudflare_imagen_id = 57;
-- Returns: 0 rows

SELECT status FROM cloudflare_images WHERE cloudflare_imagen_id = 57;
-- Returns: status = 0
```

### Scenario 2: Delete Image Shared by Multiple Products ✅

**Setup:**
- Image: `cloudflare_imagen_id = X`
- Products: `producto_id = A, B, C`
- Links: 3 entries in productos_cloudflare_images

**Expected Behavior (delete from product A):**
1. Unlink from product A
2. Check for other links → finds 2 (products B and C)
3. **DO NOT delete from Cloudflare API** (image still in use)
4. Keep status = 1 in cloudflare_images
5. Return success with updated image list for product A

**SQL to verify:**
```sql
-- Before deletion (from product A)
SELECT * FROM productos_cloudflare_images WHERE cloudflare_imagen_id = X;
-- Returns: 3 rows (productos A, B, C)

-- After deletion (from product A)
SELECT * FROM productos_cloudflare_images WHERE cloudflare_imagen_id = X;
-- Returns: 2 rows (productos B, C only)

SELECT status FROM cloudflare_images WHERE cloudflare_imagen_id = X;
-- Returns: status = 1 (still active)
```

### Scenario 3: Security - Delete Image from Different Tienda ❌

**Setup:**
- Image: `cloudflare_imagen_id = 57, tienda_id = 265`
- Request: User with `tienda_id = 408` tries to delete

**Expected Behavior:**
1. Check image ownership
2. Verify `image.tienda_id != request.tienda_id`
3. **Return 403 Forbidden**
4. NO changes made to database or Cloudflare

**Expected Response:**
```json
{
  "status": 403,
  "error": 403,
  "messages": {
    "error": "Image does not belong to your store"
  }
}
```

## Code Implementation

### Method Signature
```php
public function deleteImage($id = null, $imageId = null)
```

### Key Logic (Excerpt)

```php
// 1. Verify ownership
$image = $cloudflareImagenModel->find($imageId);
if ($image['tienda_id'] != $tienda_id) {
    return $this->failForbidden('Image does not belong to your store');
}

// 2. Unlink from product
$linkModel->unlinkFromProduct($id, $imageId);

// 3. Smart deletion check
$otherLinks = $linkModel->getProductsByImageId($imageId);

if (empty($otherLinks)) {
    // No other products use this image - safe to delete
    $cloudflareService->deleteImage($imageId);
    log_message('info', "Image deleted from Cloudflare: cloudflare_imagen_id={$imageId}");
} else {
    // Other products still use this image - keep it
    log_message('info', "Image kept in Cloudflare (used by other products): cloudflare_imagen_id={$imageId}");
}
```

## Current Database State

From check_image.php output:
- **Image 57** uploaded successfully
- Linked to product 221884 (tienda 265)
- Product has 3 legacy images (orden 1, 2, 3)
- Cloudflare image has orden 4

## Testing Status

- [x] ✅ Upload functionality tested (image 57)
- [ ] ⏳ Delete single-use image (planned)
- [ ] ⏳ Delete shared image (requires setup)
- [ ] ⏳ Security test - cross-tienda deletion (requires setup)

## Next Steps

1. **Manual test deletion of image 57** via API or frontend
2. Verify database state after deletion
3. Check Cloudflare dashboard to confirm image removal
4. Test with shared image scenario (upload same image to 2 products)

---

**Created:** 2025-10-17
**Status:** Documentation complete, awaiting manual testing
