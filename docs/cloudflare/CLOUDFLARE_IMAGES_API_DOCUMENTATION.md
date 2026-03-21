# Documentación: Cloudflare Images para CI4 API y Vue 3 Backoffice

## Resumen Ejecutivo

Esta documentación describe los cambios en la base de datos y la arquitectura necesarios para replicar la integración de Cloudflare Images en el nuevo sistema CI4 API + Vue 3 Backoffice.

**Estado del Sistema Legacy**: ✅ Totalmente funcional (commit `5730a49d38`)
**Fecha de Documentación**: 2025-10-16
**Autor**: Carlos Vidal + Claude Code

---

## Índice

1. [Cambios en Base de Datos](#1-cambios-en-base-de-datos)
2. [Arquitectura de Datos](#2-arquitectura-de-datos)
3. [Flujos de Negocio](#3-flujos-de-negocio)
4. [API Endpoints Requeridos](#4-api-endpoints-requeridos)
5. [Integración Vue 3](#5-integración-vue-3)
6. [Configuración de Cloudflare](#6-configuración-de-cloudflare)
7. [Migración de Datos](#7-migración-de-datos)

---

## 1. Cambios en Base de Datos

### 1.1 Nuevas Tablas

#### Tabla: `cloudflare_images`

Pool central de imágenes almacenadas en Cloudflare (equivalente a `tiendasimagenes` pero específico para Cloudflare).

```sql
CREATE TABLE IF NOT EXISTS `cloudflare_images` (
  `cloudflare_imagen_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `tienda_id` INT UNSIGNED NOT NULL,
  `cloudflare_id` VARCHAR(255) NOT NULL COMMENT 'ID único de Cloudflare (ej: 694be399-dde4-428f-aa65-d2b3ac2d8100)',
  `cloudflare_url` VARCHAR(500) NOT NULL COMMENT 'URL base de entrega (sin variantes)',
  `imagen_nombre` VARCHAR(120) NOT NULL COMMENT 'Hash único de la imagen (mismo que tiendasimagenes.tiendaimagen_nombre)',
  `imagen_titulo` VARCHAR(200) DEFAULT NULL,
  `imagen_ancho` INT UNSIGNED DEFAULT NULL COMMENT 'Ancho original en píxeles',
  `imagen_alto` INT UNSIGNED DEFAULT NULL COMMENT 'Alto original en píxeles',
  `imagen_bytes` INT UNSIGNED DEFAULT NULL COMMENT 'Tamaño del archivo en bytes',
  `fecha_subida` DATETIME NOT NULL,
  `status` TINYINT DEFAULT 1 COMMENT '1=activo, 0=inactivo/eliminado',
  `tiendaimagen_id` INT UNSIGNED DEFAULT NULL COMMENT 'FK legacy para migración gradual',
  PRIMARY KEY (`cloudflare_imagen_id`),
  UNIQUE KEY `unique_cloudflare_id` (`cloudflare_id`),
  KEY `idx_tienda_id` (`tienda_id`),
  KEY `idx_status` (`status`),
  KEY `idx_fecha_subida` (`fecha_subida`),
  KEY `idx_tiendaimagen_id` (`tiendaimagen_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Campos clave**:
- `cloudflare_imagen_id`: PK autoincremental
- `cloudflare_id`: ID único generado por Cloudflare (UUID)
- `cloudflare_url`: URL base sin variantes
- `imagen_nombre`: Hash SHA1 de la imagen (para compatibilidad con legacy)
- `tiendaimagen_id`: FK opcional para vincular con sistema legacy durante migración

#### Tabla: `productos_cloudflare_images`

Tabla de vinculación N:N entre productos e imágenes de Cloudflare (equivalente a `productosimagenes` pero para Cloudflare).

```sql
CREATE TABLE IF NOT EXISTS `productos_cloudflare_images` (
  `producto_id` INT NOT NULL,
  `cloudflare_imagen_id` INT UNSIGNED NOT NULL,
  `orden` INT NOT NULL DEFAULT 0 COMMENT 'Orden de visualización (1=principal, 2=segunda, etc)',
  `fecha_vinculo` DATETIME NOT NULL,
  PRIMARY KEY (`producto_id`, `cloudflare_imagen_id`),
  KEY `idx_producto_orden` (`producto_id`, `orden`),
  KEY `idx_cloudflare_imagen` (`cloudflare_imagen_id`),
  CONSTRAINT `fk_pci_producto` FOREIGN KEY (`producto_id`)
    REFERENCES `productos` (`producto_id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pci_cloudflare_imagen` FOREIGN KEY (`cloudflare_imagen_id`)
    REFERENCES `cloudflare_images` (`cloudflare_imagen_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Campos clave**:
- `producto_id` + `cloudflare_imagen_id`: PK compuesta
- `orden`: Determina el orden de visualización (imagen principal = orden más bajo)
- FKs con `CASCADE` para mantener integridad referencial

### 1.2 Modificaciones a Tablas Existentes

#### Tabla: `tiendasimagenes` (Legacy)

**NO MODIFICAR** - Se mantiene intacta por compatibilidad con sistema legacy.

La tabla `cloudflare_images` tiene el campo `tiendaimagen_id` para vincular con esta tabla durante la migración.

#### Tabla: `productosimagenes` (Legacy)

**NO MODIFICAR** - Se mantiene intacta por compatibilidad con sistema legacy.

Ambos sistemas (S3/CloudFront y Cloudflare) coexisten durante la transición.

---

## 2. Arquitectura de Datos

### 2.1 Diagrama de Relaciones

```
┌─────────────────────┐
│     productos       │
│  producto_id (PK)   │
└──────────┬──────────┘
           │
           │ N:N
           │
┌──────────▼──────────────────────────┐
│  productos_cloudflare_images       │
│  producto_id (PK, FK)               │◄──────┐
│  cloudflare_imagen_id (PK, FK)     │       │
│  orden                              │       │
│  fecha_vinculo                      │       │
└─────────────────────────────────────┘       │
                                               │
                                               │ 1:N
                                               │
                            ┌──────────────────▼─────────────────┐
                            │     cloudflare_images              │
                            │  cloudflare_imagen_id (PK)         │
                            │  tienda_id (FK)                    │
                            │  cloudflare_id (UNIQUE)            │
                            │  cloudflare_url                    │
                            │  imagen_nombre                     │
                            │  tiendaimagen_id (FK legacy)       │
                            └────────────────────────────────────┘
                                               │
                                               │ Legacy Link
                                               │ (opcional)
                                               │
                            ┌──────────────────▼─────────────────┐
                            │     tiendasimagenes (Legacy)       │
                            │  tiendaimagen_id (PK)              │
                            │  tiendaimagen_nombre               │
                            └────────────────────────────────────┘
```

### 2.2 Estrategia de Migración

**Enfoque**: Migración completa (no gradual)

- ✅ Tablas nuevas creadas
- ✅ Datos migrados (23 imágenes, 22 vinculaciones)
- ✅ Sistema legacy actualizado para usar nueva estructura
- ⏳ CI4 API debe implementar nueva estructura desde el inicio
- ⏳ Vue 3 debe usar nueva estructura desde el inicio

### 2.3 Flujo de Datos

#### Upload de Imagen

```
1. Usuario sube imagen (Vue 3 / Legacy)
   ↓
2. API CI4 recibe archivo
   ↓
3. Upload a Cloudflare Images API
   ↓ (retorna cloudflare_id + url)
4. INSERT en cloudflare_images
   ↓ (retorna cloudflare_imagen_id)
5. (Opcional) INSERT en tiendasimagenes para compatibilidad legacy
   ↓
6. (Si vincula a producto) INSERT en productos_cloudflare_images
```

#### Vinculación a Producto

```
1. Usuario selecciona imagen para producto
   ↓
2. API recibe: producto_id + cloudflare_imagen_id + orden
   ↓
3. INSERT en productos_cloudflare_images
   ↓
4. (Opcional) INSERT en productosimagenes para compatibilidad legacy
```

---

## 3. Flujos de Negocio

### 3.1 Flow 1: Upload Individual sin Crop

**Caso de uso**: Usuario sube imagen completa desde galería de imágenes.

**Pasos**:
1. Usuario selecciona archivo desde `Gestión de Imágenes`
2. Frontend valida: tipo (jpg/png/webp), tamaño máximo (11MB), dimensiones (max 3000x3000)
3. POST a `/api/v1/images/upload`
4. Backend:
   - Valida archivo
   - Genera hash SHA1 del contenido (`imagen_nombre`)
   - Genera thumbnails localmente (original, xlarge, large, medium, small, micro)
   - Sube thumbnail `_original` a Cloudflare
   - Inserta en `cloudflare_images`
   - Sube thumbnails a S3 (para legacy)
   - Inserta en `tiendasimagenes` (para legacy)
   - Actualiza `cloudflare_images.tiendaimagen_id`
5. Retorna: `cloudflare_imagen_id`, `cloudflare_id`, `cloudflare_url`

### 3.2 Flow 2: Upload Individual con Crop

**Caso de uso**: Usuario sube imagen desde edición de producto y la recorta.

**Pasos**:
1. Usuario selecciona archivo desde `Producto > Imágenes`
2. Frontend muestra editor de crop (jCrop o similar)
3. Usuario ajusta área de recorte (x, y, w, h)
4. POST a `/api/v1/images/upload` con parámetros:
   ```json
   {
     "file": <binary>,
     "crop": {
       "x": 100,
       "y": 50,
       "w": 800,
       "h": 800
     },
     "producto_id": 268408,
     "orden": 2
   }
   ```
5. Backend:
   - Valida archivo
   - Genera hash SHA1 del contenido original
   - **Genera thumbnails con crop aplicado**
   - **Sube thumbnail `producto_xlarge` (CON CROP) a Cloudflare**
   - Inserta en `cloudflare_images`
   - Vincula con producto en `productos_cloudflare_images`
   - Inserta en `tiendasimagenes` + `productosimagenes` (legacy)
6. Retorna: `cloudflare_imagen_id`, vinculación exitosa

**IMPORTANTE**: Para crop, subir `producto_xlarge` (no `_original`). Ver sección 3.4.

### 3.3 Flow 3: Batch Upload via ZIP

**Caso de uso**: Usuario sube ZIP con múltiples imágenes nombradas con SKU de productos.

**Pasos**:
1. Usuario sube archivo ZIP desde `Carga de Lotes`
2. Estructura esperada del ZIP:
   ```
   PRODUCTO-SKU-001.jpg
   PRODUCTO-SKU-002.jpg
   PRODUCTO-SKU-003-alt.jpg
   ```
3. POST a `/api/v1/images/batch-upload`
4. Backend:
   - Descomprime ZIP
   - Para cada imagen:
     - Extrae SKU del nombre de archivo
     - Busca producto por SKU
     - Si encuentra producto:
       - Procesa imagen (thumbnails)
       - Sube a Cloudflare
       - Inserta en `cloudflare_images`
       - Vincula con producto en `productos_cloudflare_images`
     - Si NO encuentra producto:
       - Sube a Cloudflare de todas formas
       - Inserta en `cloudflare_images` (sin vincular)
5. Retorna: resumen de procesamiento
   ```json
   {
     "total": 100,
     "exitosos": 87,
     "vinculados": 85,
     "no_vinculados": 2,
     "errores": 13
   }
   ```

### 3.4 Crop vs Original: ¿Qué Subir a Cloudflare?

**Problema identificado**: Los thumbnails `producto_*` se generan pero no se guardan localmente (se suben directo a S3).

**Solución implementada en Legacy**:
```php
// En Tiendaimagen_model.php líneas 598-601
if (strpos($sufijo_imagen[$key], 'producto_xlarge') !== false && !empty($POST_w)) {
    $cloudflare_crop_path = $nombre_imagen; // Capturar DURANTE generación
}
```

**Para CI4 API**:
1. Generar thumbnail `producto_xlarge` con crop
2. **Capturar el archivo INMEDIATAMENTE después de generarlo**
3. Subir a Cloudflare ANTES de enviarlo a S3
4. No confiar en que el archivo exista después en disco

**Código de referencia**:
```php
// Pseudo-código para CI4
$thumbnailPath = $this->generateThumbnail($source, 'producto_xlarge', $cropData);

// Subir INMEDIATAMENTE a Cloudflare
if (file_exists($thumbnailPath)) {
    $cloudflareResult = $this->cloudflareService->upload($thumbnailPath);
    // Luego subir a S3
    $this->s3Service->upload($thumbnailPath);
    // Finalmente eliminar temporal
    unlink($thumbnailPath);
}
```

---

## 4. API Endpoints Requeridos

### 4.1 Gestión de Imágenes

#### POST `/api/v1/images/upload`

Sube una imagen a Cloudflare y opcionalmente la vincula a un producto.

**Request**:
```http
POST /api/v1/images/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}

file: <binary>
titulo: "Producto principal"
crop: {"x": 100, "y": 50, "w": 800, "h": 800}  // Opcional
producto_id: 268408  // Opcional
orden: 2  // Opcional (requerido si producto_id)
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "cloudflare_imagen_id": 44,
    "cloudflare_id": "694be399-dde4-428f-aa65-d2b3ac2d8100",
    "cloudflare_url": "https://imagedelivery.net/{account_hash}/{cloudflare_id}/public",
    "imagen_nombre": "4678f3a590086420e91a25f56ab065d9ba510384",
    "tiendaimagen_id": 888307,
    "vinculado": true,
    "producto_id": 268408
  }
}
```

**Response 400** (Validación):
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "file": "File type not allowed. Only jpg, png, webp.",
    "crop": "Crop width and height must be greater than 0"
  }
}
```

**Response 413** (Tamaño):
```json
{
  "success": false,
  "error": "File too large. Maximum 11MB."
}
```

#### POST `/api/v1/images/batch-upload`

Sube múltiples imágenes desde un ZIP.

**Request**:
```http
POST /api/v1/images/batch-upload
Content-Type: multipart/form-data
Authorization: Bearer {token}

file: <ZIP binary>
```

**Response 200**:
```json
{
  "success": true,
  "data": {
    "total": 100,
    "procesados": 100,
    "exitosos": 87,
    "vinculados": 85,
    "no_vinculados": 2,
    "errores": 13,
    "detalles": [
      {
        "archivo": "PROD-001.jpg",
        "status": "success",
        "cloudflare_id": "abc123...",
        "producto_id": 12345,
        "vinculado": true
      },
      {
        "archivo": "PROD-002.jpg",
        "status": "error",
        "mensaje": "SKU not found"
      }
    ]
  }
}
```

#### GET `/api/v1/images/{cloudflare_imagen_id}`

Obtiene detalles de una imagen.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "cloudflare_imagen_id": 44,
    "cloudflare_id": "694be399-dde4-428f-aa65-d2b3ac2d8100",
    "cloudflare_url": "https://imagedelivery.net/{account_hash}/{cloudflare_id}/public",
    "imagen_nombre": "4678f3a590086420e91a25f56ab065d9ba510384",
    "imagen_titulo": "Producto principal",
    "imagen_ancho": 710,
    "imagen_alto": 710,
    "imagen_bytes": 45678,
    "fecha_subida": "2025-10-16 14:30:00",
    "status": 1,
    "productos_vinculados": [
      {
        "producto_id": 268408,
        "producto_nombre": "Zapatillas Nike",
        "orden": 2
      }
    ]
  }
}
```

#### DELETE `/api/v1/images/{cloudflare_imagen_id}`

Elimina imagen de Cloudflare y BD (soft delete).

**Response 200**:
```json
{
  "success": true,
  "message": "Image deleted successfully",
  "data": {
    "cloudflare_imagen_id": 44,
    "deleted_from_cloudflare": true,
    "productos_desvinculados": 1
  }
}
```

### 4.2 Vinculación Producto-Imagen

#### POST `/api/v1/products/{producto_id}/images`

Vincula una imagen existente a un producto.

**Request**:
```json
{
  "cloudflare_imagen_id": 44,
  "orden": 2
}
```

**Response 200**:
```json
{
  "success": true,
  "message": "Image linked to product",
  "data": {
    "producto_id": 268408,
    "cloudflare_imagen_id": 44,
    "orden": 2,
    "fecha_vinculo": "2025-10-16 14:30:00"
  }
}
```

#### GET `/api/v1/products/{producto_id}/images`

Lista todas las imágenes de un producto.

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "cloudflare_imagen_id": 32,
      "cloudflare_id": "6bdf7f24-f004-43a3-0e94-ca439feeb100",
      "cloudflare_url": "https://imagedelivery.net/{account_hash}/{cloudflare_id}/public",
      "orden": 1,
      "es_principal": true,
      "fecha_vinculo": "2025-10-16 11:26:06"
    },
    {
      "cloudflare_imagen_id": 33,
      "cloudflare_id": "f05130d7-4b11-4e53-c743-d29d9acc7300",
      "cloudflare_url": "https://imagedelivery.net/{account_hash}/{cloudflare_id}/public",
      "orden": 2,
      "es_principal": false,
      "fecha_vinculo": "2025-10-16 11:26:06"
    }
  ]
}
```

#### PUT `/api/v1/products/{producto_id}/images/{cloudflare_imagen_id}`

Actualiza el orden de una imagen vinculada.

**Request**:
```json
{
  "orden": 1
}
```

**Response 200**:
```json
{
  "success": true,
  "message": "Image order updated"
}
```

#### DELETE `/api/v1/products/{producto_id}/images/{cloudflare_imagen_id}`

Desvincula imagen de producto (no elimina la imagen de Cloudflare).

**Response 200**:
```json
{
  "success": true,
  "message": "Image unlinked from product"
}
```

### 4.3 Consultas y Reportes

#### GET `/api/v1/images?tienda_id={tienda_id}&page={page}&per_page={per_page}`

Lista todas las imágenes de una tienda con paginación.

**Response 200**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "cloudflare_imagen_id": 44,
        "cloudflare_id": "694be399-dde4-428f-aa65-d2b3ac2d8100",
        "imagen_titulo": "Producto principal",
        "fecha_subida": "2025-10-16 14:30:00",
        "productos_count": 1
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 150,
      "total_pages": 8
    }
  }
}
```

---

## 5. Integración Vue 3

### 5.1 Componentes Requeridos

#### `ImageUpload.vue`

Componente para upload de imágenes individuales con drag & drop.

**Props**:
```typescript
interface Props {
  productoId?: number;
  orden?: number;
  showCrop?: boolean;
  maxFiles?: number;
  acceptedFormats?: string[];
}
```

**Events**:
```typescript
interface Events {
  'upload-success': (result: CloudflareImage) => void;
  'upload-error': (error: Error) => void;
}
```

**Ejemplo de uso**:
```vue
<template>
  <ImageUpload
    :producto-id="268408"
    :orden="2"
    :show-crop="true"
    @upload-success="handleSuccess"
  />
</template>
```

#### `ImageCropper.vue`

Componente para recortar imágenes (integra Cropper.js o similar).

**Props**:
```typescript
interface Props {
  imageUrl: string;
  aspectRatio?: number; // null = libre, 1 = cuadrado
  minWidth?: number;
  minHeight?: number;
}
```

**Events**:
```typescript
interface Events {
  'crop-complete': (cropData: CropData) => void;
}

interface CropData {
  x: number;
  y: number;
  w: number;
  h: number;
}
```

#### `ImageGallery.vue`

Galería de imágenes con drag & drop para reordenar.

**Props**:
```typescript
interface Props {
  productoId: number;
  editable?: boolean;
}
```

**Ejemplo de uso**:
```vue
<template>
  <ImageGallery
    :producto-id="268408"
    :editable="true"
    @order-changed="handleReorder"
    @image-deleted="handleDelete"
  />
</template>
```

#### `BatchUpload.vue`

Componente para carga masiva via ZIP.

**Events**:
```typescript
interface Events {
  'upload-progress': (progress: UploadProgress) => void;
  'upload-complete': (summary: BatchSummary) => void;
}

interface UploadProgress {
  total: number;
  current: number;
  percentage: number;
  currentFile: string;
}

interface BatchSummary {
  total: number;
  exitosos: number;
  vinculados: number;
  errores: number;
  detalles: Array<{
    archivo: string;
    status: 'success' | 'error';
    mensaje?: string;
  }>;
}
```

### 5.2 Composables

#### `useCloudflareImages.ts`

```typescript
import { ref, computed } from 'vue';
import { apiClient } from '@/services/api';

export interface CloudflareImage {
  cloudflare_imagen_id: number;
  cloudflare_id: string;
  cloudflare_url: string;
  imagen_nombre: string;
  imagen_titulo?: string;
  orden?: number;
}

export function useCloudflareImages(productoId?: number) {
  const images = ref<CloudflareImage[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const fetchImages = async () => {
    loading.value = true;
    try {
      const response = await apiClient.get(
        `/api/v1/products/${productoId}/images`
      );
      images.value = response.data.data;
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  };

  const uploadImage = async (
    file: File,
    options?: {
      crop?: { x: number; y: number; w: number; h: number };
      orden?: number;
    }
  ) => {
    loading.value = true;
    const formData = new FormData();
    formData.append('file', file);
    if (options?.crop) {
      formData.append('crop', JSON.stringify(options.crop));
    }
    if (productoId) {
      formData.append('producto_id', productoId.toString());
    }
    if (options?.orden) {
      formData.append('orden', options.orden.toString());
    }

    try {
      const response = await apiClient.post(
        '/api/v1/images/upload',
        formData
      );
      await fetchImages();
      return response.data.data;
    } catch (e) {
      error.value = e as Error;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const deleteImage = async (cloudflareImagenId: number) => {
    loading.value = true;
    try {
      await apiClient.delete(
        `/api/v1/products/${productoId}/images/${cloudflareImagenId}`
      );
      await fetchImages();
    } catch (e) {
      error.value = e as Error;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const updateOrder = async (
    cloudflareImagenId: number,
    newOrder: number
  ) => {
    loading.value = true;
    try {
      await apiClient.put(
        `/api/v1/products/${productoId}/images/${cloudflareImagenId}`,
        { orden: newOrder }
      );
      await fetchImages();
    } catch (e) {
      error.value = e as Error;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const principalImage = computed(() =>
    images.value.find((img) => img.orden === 1)
  );

  return {
    images,
    loading,
    error,
    principalImage,
    fetchImages,
    uploadImage,
    deleteImage,
    updateOrder,
  };
}
```

### 5.3 Stores (Pinia)

#### `stores/cloudflareImages.ts`

```typescript
import { defineStore } from 'pinia';
import { apiClient } from '@/services/api';

interface CloudflareImagesState {
  images: Map<number, CloudflareImage>;
  productImages: Map<number, number[]>; // producto_id -> cloudflare_imagen_ids
  loading: boolean;
  error: Error | null;
}

export const useCloudflareImagesStore = defineStore('cloudflareImages', {
  state: (): CloudflareImagesState => ({
    images: new Map(),
    productImages: new Map(),
    loading: false,
    error: null,
  }),

  getters: {
    getImageById: (state) => (id: number) => state.images.get(id),

    getProductImages: (state) => (productoId: number) => {
      const imageIds = state.productImages.get(productoId) || [];
      return imageIds
        .map((id) => state.images.get(id))
        .filter(Boolean) as CloudflareImage[];
    },

    getPrincipalImage: (state) => (productoId: number) => {
      const imgs = state.productImages.get(productoId) || [];
      return imgs
        .map((id) => state.images.get(id))
        .find((img) => img?.orden === 1);
    },
  },

  actions: {
    async fetchProductImages(productoId: number) {
      this.loading = true;
      try {
        const response = await apiClient.get(
          `/api/v1/products/${productoId}/images`
        );
        const images = response.data.data as CloudflareImage[];

        // Actualizar store
        const imageIds: number[] = [];
        images.forEach((img) => {
          this.images.set(img.cloudflare_imagen_id, img);
          imageIds.push(img.cloudflare_imagen_id);
        });
        this.productImages.set(productoId, imageIds);

      } catch (e) {
        this.error = e as Error;
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async uploadImage(file: File, productoId?: number, crop?: any) {
      // Implementación similar a composable
    },

    clearProductImages(productoId: number) {
      this.productImages.delete(productoId);
    },
  },
});
```

### 5.4 Variantes de Cloudflare Images

Cloudflare Images permite generar variantes on-the-fly cambiando la URL:

```typescript
// Composable para generar URLs de variantes
export function useCloudflareVariants() {
  const accountHash = '2998d27925d94d6941e16e703022867d';

  const getVariantUrl = (
    cloudflareId: string,
    variant: 'public' | 'thumbnail' | 'product' | 'hero' = 'public'
  ): string => {
    return `https://imagedelivery.net/${accountHash}/${cloudflareId}/${variant}`;
  };

  // Generar URL con dimensiones personalizadas
  const getCustomUrl = (
    cloudflareId: string,
    options: {
      width?: number;
      height?: number;
      fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
      format?: 'auto' | 'avif' | 'webp' | 'json';
      quality?: number; // 1-100
    }
  ): string => {
    const params = new URLSearchParams();
    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.fit) params.append('fit', options.fit);
    if (options.format) params.append('format', options.format);
    if (options.quality) params.append('quality', options.quality.toString());

    return `https://imagedelivery.net/${accountHash}/${cloudflareId}/custom?${params}`;
  };

  return {
    getVariantUrl,
    getCustomUrl,
  };
}
```

**Uso en componentes**:
```vue
<template>
  <img
    :src="getVariantUrl(image.cloudflare_id, 'thumbnail')"
    :srcset="`
      ${getCustomUrl(image.cloudflare_id, { width: 400 })} 400w,
      ${getCustomUrl(image.cloudflare_id, { width: 800 })} 800w,
      ${getCustomUrl(image.cloudflare_id, { width: 1200 })} 1200w
    `"
    sizes="(max-width: 400px) 400px, (max-width: 800px) 800px, 1200px"
    alt="Product image"
  />
</template>
```

---

## 6. Configuración de Cloudflare

### 6.1 Credenciales

**IMPORTANTE**: Nunca hardcodear credenciales en código. Usar variables de entorno.

```php
// CI4: .env
cloudflare.account_id = 2998d27925d94d6941e16e703022867d
cloudflare.api_token = wg73vWKekhCgxk7LrCJvndtpVWomNSQjXhaDLMz_
cloudflare.delivery_url = https://imagedelivery.net/2998d27925d94d6941e16e703022867d
```

```typescript
// Vue 3: .env
VITE_CLOUDFLARE_ACCOUNT_ID=2998d27925d94d6941e16e703022867d
VITE_CLOUDFLARE_DELIVERY_URL=https://imagedelivery.net/2998d27925d94d6941e16e703022867d
```

### 6.2 API Service (CI4)

```php
<?php

namespace App\Services;

use CodeIgniter\HTTP\CURLRequest;

class CloudflareImagesService
{
    protected string $accountId;
    protected string $apiToken;
    protected string $apiBaseUrl;
    protected CURLRequest $client;

    public function __construct()
    {
        $this->accountId = env('cloudflare.account_id');
        $this->apiToken = env('cloudflare.api_token');
        $this->apiBaseUrl = "https://api.cloudflare.com/client/v4/accounts/{$this->accountId}/images/v1";

        $this->client = \Config\Services::curlrequest([
            'headers' => [
                'Authorization' => "Bearer {$this->apiToken}",
            ]
        ]);
    }

    /**
     * Upload image to Cloudflare
     *
     * @param string $filePath Path to local file
     * @param string $metadata Optional metadata
     * @return array ['id' => string, 'url' => string]
     * @throws \Exception
     */
    public function uploadImage(string $filePath, string $metadata = ''): array
    {
        if (!file_exists($filePath)) {
            throw new \Exception("File not found: {$filePath}");
        }

        $response = $this->client->request('POST', $this->apiBaseUrl, [
            'multipart' => [
                [
                    'name' => 'file',
                    'contents' => file_get_contents($filePath),
                    'filename' => basename($filePath),
                ],
                [
                    'name' => 'metadata',
                    'contents' => $metadata,
                ],
            ],
        ]);

        $body = json_decode($response->getBody(), true);

        if (!$body['success']) {
            $errors = implode(', ', array_column($body['errors'] ?? [], 'message'));
            throw new \Exception("Cloudflare upload failed: {$errors}");
        }

        return [
            'id' => $body['result']['id'],
            'url' => $body['result']['variants'][0] ?? '',
        ];
    }

    /**
     * Delete image from Cloudflare
     *
     * @param string $imageId Cloudflare image ID
     * @return bool
     */
    public function deleteImage(string $imageId): bool
    {
        $response = $this->client->request('DELETE', "{$this->apiBaseUrl}/{$imageId}");
        $body = json_decode($response->getBody(), true);
        return $body['success'] ?? false;
    }

    /**
     * Get image details
     *
     * @param string $imageId Cloudflare image ID
     * @return array
     */
    public function getImage(string $imageId): array
    {
        $response = $this->client->request('GET', "{$this->apiBaseUrl}/{$imageId}");
        $body = json_decode($response->getBody(), true);
        return $body['result'] ?? [];
    }
}
```

### 6.3 Límites y Cuotas

**Plan Cloudflare Images** (verificar plan actual):
- Storage: Ilimitado
- Bandwidth: Ilimitado
- Transformaciones: Ilimitadas
- Requests: Según plan

**Límites de API**:
- Upload: Max 10MB por imagen (configurar según necesidad)
- Rate limit: 1200 requests/5min (verificar plan actual)

**Recomendaciones**:
- Implementar queue para uploads masivos
- Usar retry logic con backoff exponencial
- Cachear metadatos de imágenes en Redis

---

## 7. Migración de Datos

### 7.1 Script de Migración (SQL)

El script de migración ya está disponible en: `database/migrations/2025-10-16_cloudflare_images_migration_v2.sql`

**Contenido**:
```sql
-- Crear tablas si no existen
CREATE TABLE IF NOT EXISTS cloudflare_images (...);
CREATE TABLE IF NOT EXISTS productos_cloudflare_images (...);

-- Migrar datos existentes desde tiendasimagenes
INSERT INTO cloudflare_images (...)
SELECT ... FROM tiendasimagenes WHERE cloudflare_id IS NOT NULL;

-- Migrar vinculaciones desde productosimagenes
INSERT INTO productos_cloudflare_images (...)
SELECT ... FROM productosimagenes pi
INNER JOIN cloudflare_images ci ON ci.tiendaimagen_id = pi.tiendaimagen_id;
```

**Ejecutar en producción**:
```bash
mysql -h 129.213.75.80 -u admin -p mitiendape < database/migrations/2025-10-16_cloudflare_images_migration_v2.sql
```

### 7.2 Verificación Post-Migración

```sql
-- 1. Verificar tablas creadas
SHOW TABLES LIKE 'cloudflare%';

-- 2. Contar registros migrados
SELECT COUNT(*) as total_imagenes FROM cloudflare_images;
SELECT COUNT(*) as total_vinculaciones FROM productos_cloudflare_images;

-- 3. Verificar integridad referencial
SELECT COUNT(*) as huerfanos
FROM productos_cloudflare_images pci
LEFT JOIN cloudflare_images ci ON ci.cloudflare_imagen_id = pci.cloudflare_imagen_id
WHERE ci.cloudflare_imagen_id IS NULL;

-- 4. Verificar productos con imágenes
SELECT p.producto_id, p.producto_nombre, COUNT(pci.cloudflare_imagen_id) as num_imagenes
FROM productos p
INNER JOIN productos_cloudflare_images pci ON pci.producto_id = p.producto_id
GROUP BY p.producto_id
ORDER BY num_imagenes DESC
LIMIT 10;
```

### 7.3 Rollback Plan

En caso de necesitar revertir:

```sql
-- Backup antes de migración
CREATE TABLE cloudflare_images_backup_20251016 AS SELECT * FROM cloudflare_images;
CREATE TABLE productos_cloudflare_images_backup_20251016 AS SELECT * FROM productos_cloudflare_images;

-- Rollback
DROP TABLE productos_cloudflare_images;
DROP TABLE cloudflare_images;

-- Restaurar desde backup
RENAME TABLE
  cloudflare_images_backup_20251016 TO cloudflare_images,
  productos_cloudflare_images_backup_20251016 TO productos_cloudflare_images;
```

---

## 8. Testing

### 8.1 Tests de Integración (CI4)

```php
<?php

namespace Tests\Integration;

use CodeIgniter\Test\CIUnitTestCase;
use App\Services\CloudflareImagesService;

class CloudflareImagesTest extends CIUnitTestCase
{
    protected CloudflareImagesService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new CloudflareImagesService();
    }

    public function testUploadImage()
    {
        $testImage = WRITEPATH . 'uploads/test_image.jpg';

        // Crear imagen de prueba
        $this->createTestImage($testImage);

        $result = $this->service->uploadImage($testImage, 'Test upload');

        $this->assertArrayHasKey('id', $result);
        $this->assertArrayHasKey('url', $result);
        $this->assertNotEmpty($result['id']);

        // Cleanup
        $this->service->deleteImage($result['id']);
        unlink($testImage);
    }

    public function testImageProductLink()
    {
        $imageModel = model('CloudflareImagenModel');
        $linkModel = model('ProductosCloudflareImagenModel');

        // Insertar imagen de prueba
        $imageId = $imageModel->insert([
            'tienda_id' => 265,
            'cloudflare_id' => 'test-' . uniqid(),
            'cloudflare_url' => 'https://test.com/image.jpg',
            'imagen_nombre' => 'test_' . sha1(random_bytes(20)),
            'fecha_subida' => date('Y-m-d H:i:s'),
        ]);

        // Vincular a producto
        $linkModel->insert([
            'producto_id' => 268408,
            'cloudflare_imagen_id' => $imageId,
            'orden' => 1,
            'fecha_vinculo' => date('Y-m-d H:i:s'),
        ]);

        // Verificar vinculación
        $images = $linkModel->where('producto_id', 268408)->findAll();
        $this->assertCount(1, $images);
        $this->assertEquals($imageId, $images[0]['cloudflare_imagen_id']);

        // Cleanup
        $linkModel->where('producto_id', 268408)->delete();
        $imageModel->delete($imageId);
    }

    private function createTestImage(string $path): void
    {
        $image = imagecreatetruecolor(800, 600);
        $color = imagecolorallocate($image, 255, 0, 0);
        imagefill($image, 0, 0, $color);
        imagejpeg($image, $path);
        imagedestroy($image);
    }
}
```

### 8.2 Tests E2E (Vue 3 + Cypress)

```typescript
// cypress/e2e/cloudflare-images.cy.ts

describe('Cloudflare Images Integration', () => {
  beforeEach(() => {
    cy.login('admin@mitienda.pe', 'password');
    cy.visit('/productos/268408/editar');
  });

  it('should upload and crop image', () => {
    // Abrir modal de imágenes
    cy.get('[data-testid="btn-add-image"]').click();

    // Upload imagen
    cy.get('input[type="file"]').selectFile('cypress/fixtures/test-product.jpg');

    // Esperar preview
    cy.get('[data-testid="image-preview"]').should('be.visible');

    // Ajustar crop
    cy.get('[data-testid="crop-area"]')
      .trigger('mousedown', { clientX: 100, clientY: 100 })
      .trigger('mousemove', { clientX: 500, clientY: 500 })
      .trigger('mouseup');

    // Confirmar upload
    cy.get('[data-testid="btn-confirm-upload"]').click();

    // Verificar aparece en galería
    cy.get('[data-testid="image-gallery"]')
      .find('img')
      .should('have.length.greaterThan', 0);
  });

  it('should reorder images via drag and drop', () => {
    // Verificar orden inicial
    cy.get('[data-testid="image-item"]').first().should('have.attr', 'data-orden', '1');

    // Arrastrar segunda imagen a primera posición
    cy.get('[data-testid="image-item"]')
      .eq(1)
      .drag('[data-testid="image-item"]:first');

    // Verificar nuevo orden
    cy.wait(1000); // Esperar animación
    cy.get('[data-testid="image-item"]').first().should('have.attr', 'data-orden', '1');
  });

  it('should delete image', () => {
    const initialCount = cy.get('[data-testid="image-item"]').its('length');

    // Hover sobre imagen y click en eliminar
    cy.get('[data-testid="image-item"]').first().trigger('mouseover');
    cy.get('[data-testid="btn-delete-image"]').first().click();

    // Confirmar eliminación
    cy.get('[data-testid="confirm-delete"]').click();

    // Verificar reducción
    cy.get('[data-testid="image-item"]').should('have.length', initialCount - 1);
  });
});
```

---

## 9. Monitoreo y Logs

### 9.1 Logs Recomendados

**CI4 Logger**:
```php
log_message('info', "Cloudflare: Image uploaded. ID: {$cloudflareId}, tienda: {$tiendaId}");
log_message('info', "Cloudflare: Image linked to product {$productoId}, orden: {$orden}");
log_message('error', "Cloudflare: Upload failed. Error: {$error}");
log_message('debug', "Cloudflare: Crop data - x:{$x}, y:{$y}, w:{$w}, h:{$h}");
```

### 9.2 Métricas Sugeridas

- Total de imágenes subidas por día/mes
- Tasa de éxito/error en uploads
- Tiempo promedio de upload
- Tamaño promedio de archivos
- Uso de bandwidth de Cloudflare
- Productos sin imágenes vs con imágenes

### 9.3 Alertas

- Upload failure rate > 5%
- API response time > 3s
- Cuota de Cloudflare > 80%
- FK constraint violations

---

## 10. Checklist de Implementación

### CI4 API

- [ ] Crear modelos `CloudflareImagenModel` y `ProductosCloudflareImagenModel`
- [ ] Implementar `CloudflareImagesService`
- [ ] Crear endpoints REST (ver sección 4)
- [ ] Implementar validaciones de archivos
- [ ] Agregar procesamiento de crop (ImageMagick/GD)
- [ ] Configurar queue para batch uploads
- [ ] Implementar tests de integración
- [ ] Configurar logs y monitoreo
- [ ] Deploy en staging y testing
- [ ] Deploy en producción

### Vue 3 Backoffice

- [ ] Crear componentes (ImageUpload, ImageCropper, ImageGallery, BatchUpload)
- [ ] Implementar composables (useCloudflareImages, useCloudflareVariants)
- [ ] Crear stores Pinia
- [ ] Integrar con API CI4
- [ ] Implementar drag & drop para reordenar
- [ ] Agregar tests E2E con Cypress
- [ ] Testing en staging
- [ ] Deploy en producción

### Base de Datos

- [x] Crear tablas `cloudflare_images` y `productos_cloudflare_images`
- [x] Ejecutar migración de datos
- [ ] Verificar integridad referencial
- [ ] Crear índices adicionales si necesario
- [ ] Configurar backups automáticos

---

## 11. Contacto y Soporte

**Desarrollador**: Carlos Vidal (carlos@mitienda.pe)
**Documentación Legacy**: [CLOUDFLARE_IMAGES_INTEGRATION.md](CLOUDFLARE_IMAGES_INTEGRATION.md)
**Repositorio**: Git remote `devpanel3`
**Base de Datos**: 129.213.75.80 / mitiendape

**Última actualización**: 2025-10-16
**Versión del Documento**: 1.0
**Commit de Referencia**: `5730a49d38`
