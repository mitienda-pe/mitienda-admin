# NetSuite Inventory Mapping - Backend API Documentation

Este documento describe los endpoints del backend que deben implementarse para soportar la funcionalidad de mapeo de inventario NetSuite en el frontend.

## ⚠️ IMPORTANTE: Filtro de Estado de Productos

**CRÍTICO:** Todos los endpoints que retornan productos **DEBEN** filtrar por `tiendaproducto_estado = 0`.

Solo se deben mostrar **productos activos** en la interfaz de mapeo. Los productos eliminados (`estado = 1`) **NO** deben aparecer en ninguna respuesta.

**Query correcto:**
```php
$builder->where('tienda_id', $tiendaId);
$builder->where('tiendaproducto_estado', 0);  // ✅ SIEMPRE incluir este filtro
```

**Query incorrecto:**
```php
$builder->where('tienda_id', $tiendaId);
// ❌ FALTA el filtro de estado - retornará productos eliminados
```

---

## Contexto

El sistema permite mapear productos de miTienda con items de NetSuite y sus inventory numbers (lotes). El mapeo se realiza de la siguiente manera:

- **Producto miTienda** → **NetSuite Item ID** (se guarda en `tiendaproducto_sku`)
- **NetSuite Item ID** → **Inventory Numbers** (se guarda en tabla `netsuite_inventory_numbers`)

### Sistema Multitenant

**IMPORTANTE:** Este es un sistema multitenant donde:
- Cada usuario puede tener acceso a múltiples tiendas
- El `tienda_id` viene del selector de tiendas en el header del frontend
- El JWT token contiene el `store_id` de la tienda seleccionada
- **TODOS los endpoints DEBEN validar que el token JWT tiene permisos sobre la tienda solicitada**
- El `{tienda_id}` en la URL debe coincidir con el `store_id` del token

**Ejemplo de validación en el controlador:**
```php
$tokenStoreId = $this->request->jwt->store_id;
if ($tokenStoreId != $tiendaId) {
    return $this->failUnauthorized('No tienes acceso a esta tienda');
}
```

## Base de Datos

### Tabla: `netsuite_inventory_numbers`

Ya existe con la siguiente estructura:

```sql
CREATE TABLE netsuite_inventory_numbers (
  id INT(11) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  item_id INT(11) COMMENT 'NetSuite Item Internal ID',
  lot_number VARCHAR(100) COMMENT 'Nombre del lote (ej: L06MAY26)',
  inventory_number_id INT(11) COMMENT 'NetSuite Inventory Number Internal ID',
  location_id INT(11) DEFAULT 323 COMMENT 'NetSuite Location ID (default: 323 LAVICTORIA)',
  quantity_available DECIMAL(10,2) NULL COMMENT 'Stock disponible (opcional)',
  created_at DATETIME NULL,
  updated_at DATETIME NULL,
  KEY idx_item_location (item_id, location_id),
  KEY idx_inventory_number (inventory_number_id)
);
```

### Tabla: `tiendaproducto`

Se utilizará el campo existente `tiendaproducto_sku` para almacenar el NetSuite Item ID.

## Endpoints a Implementar

### 1. Listar Productos con Mapeo de Inventario

**Endpoint:** `GET /api/v1/netsuite-inventory/{tienda_id}/products`

**Descripción:** Retorna todos los productos activos (estado = 0) de una tienda con su información de mapeo de NetSuite.

**Query Parameters:**
- `search` (string, opcional): Búsqueda por SKU o nombre de producto
- `has_mapping` (boolean, opcional): Filtrar por productos con/sin mapeo (1 = con mapeo, 0 = sin mapeo)
- `page` (int, opcional, default: 1): Página actual
- `limit` (int, opcional, default: 25): Cantidad de resultados por página

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "tiendaproducto_id": 123,
        "tiendaproducto_sku": "7544",
        "tiendaproducto_titulo": "FRUTA MIXTA X 55G X 25 PQTS SAN JORGE",
        "tiendaproducto_estado": 0,
        "netsuite_item_id": "7544",
        "has_mapping": true,
        "inventory_numbers": [
          {
            "id": 1,
            "item_id": 7544,
            "lot_number": "L06MAY26",
            "inventory_number_id": 11039,
            "location_id": 323,
            "quantity_available": 100.50,
            "created_at": "2025-11-04 10:30:00",
            "updated_at": "2025-11-04 10:30:00"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 25,
      "total": 150,
      "total_pages": 6
    }
  },
  "message": "Productos obtenidos exitosamente"
}
```

**Nota:** El campo `tiendaproducto_imagen` no es necesario ya que no se muestra en la interfaz.

**Lógica:**
1. **IMPORTANTE:** Obtener productos de `tiendaproducto` donde `tienda_id = {tienda_id}` **Y `tiendaproducto_estado = 0`** (solo productos activos)
2. Para cada producto, el `netsuite_item_id` es el valor de `tiendaproducto_sku` (si es numérico)
3. Si el producto tiene un SKU numérico, buscar en `netsuite_inventory_numbers` los lotes asociados (`item_id = tiendaproducto_sku`)
4. `has_mapping` es `true` si el producto tiene SKU Y tiene al menos un inventory number
5. Aplicar filtros de búsqueda y paginación

**Query SQL sugerido:**
```sql
SELECT
  tiendaproducto_id,
  tiendaproducto_sku,
  tiendaproducto_titulo,
  tiendaproducto_estado
FROM tiendaproducto
WHERE tienda_id = ?
  AND tiendaproducto_estado = 0  -- Solo productos activos
  AND (? = '' OR tiendaproducto_titulo LIKE ? OR tiendaproducto_sku LIKE ?)  -- Búsqueda
ORDER BY tiendaproducto_id DESC
LIMIT ? OFFSET ?
```

---

### 2. Obtener un Producto con su Mapeo

**Endpoint:** `GET /api/v1/netsuite-inventory/{tienda_id}/products/{producto_id}`

**Descripción:** Retorna un producto específico con toda su información de mapeo.

**Response:**
```json
{
  "success": true,
  "data": {
    "tiendaproducto_id": 123,
    "tiendaproducto_sku": "7544",
    "tiendaproducto_titulo": "FRUTA MIXTA X 55G X 25 PQTS SAN JORGE",
    "tiendaproducto_estado": 0,
    "netsuite_item_id": "7544",
    "has_mapping": true,
    "inventory_numbers": [
      {
        "id": 1,
        "item_id": 7544,
        "lot_number": "L06MAY26",
        "inventory_number_id": 11039,
        "location_id": 323,
        "quantity_available": 100.50,
        "created_at": "2025-11-04 10:30:00",
        "updated_at": "2025-11-04 10:30:00"
      }
    ]
  },
  "message": "Producto obtenido exitosamente"
}
```

**Nota:** El campo `tiendaproducto_imagen` no es necesario en la respuesta.

---

### 3. Guardar/Actualizar Mapeo de Producto

**Endpoint:** `POST /api/v1/netsuite-inventory/{tienda_id}/products/{producto_id}`

**Descripción:** Guarda o actualiza el NetSuite Item ID de un producto. El Item ID se guarda en el campo `tiendaproducto_sku`.

**Request Body:**
```json
{
  "tienda_id": 408,
  "producto_id": 123,
  "netsuite_item_id": "7544"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true
  },
  "message": "Mapeo del producto guardado exitosamente"
}
```

**Lógica:**
1. Validar que el producto pertenece a la tienda
2. Actualizar `tiendaproducto_sku = netsuite_item_id` en la tabla `tiendaproducto`
3. Retornar éxito

**Validaciones:**
- `netsuite_item_id` debe ser un string numérico
- El producto debe existir y pertenecer a la tienda

---

### 4. Obtener Inventory Numbers de un Item

**Endpoint:** `GET /api/v1/netsuite-inventory/{tienda_id}/items/{item_id}/numbers`

**Descripción:** Retorna todos los inventory numbers (lotes) asociados a un NetSuite Item ID.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "item_id": 7544,
      "lot_number": "L06MAY26",
      "inventory_number_id": 11039,
      "location_id": 323,
      "quantity_available": 100.50,
      "created_at": "2025-11-04 10:30:00",
      "updated_at": "2025-11-04 10:30:00"
    },
    {
      "id": 2,
      "item_id": 7544,
      "lot_number": "L07JUN26",
      "inventory_number_id": 11040,
      "location_id": 323,
      "quantity_available": 50.00,
      "created_at": "2025-11-04 10:31:00",
      "updated_at": "2025-11-04 10:31:00"
    }
  ],
  "message": "Inventory numbers obtenidos exitosamente"
}
```

**Lógica:**
- Query: `SELECT * FROM netsuite_inventory_numbers WHERE item_id = {item_id} ORDER BY id ASC`

---

### 5. Crear Inventory Number

**Endpoint:** `POST /api/v1/netsuite-inventory/{tienda_id}/items/{item_id}/numbers`

**Descripción:** Crea un nuevo inventory number (lote) para un item de NetSuite.

**Request Body:**
```json
{
  "item_id": 7544,
  "lot_number": "L06MAY26",
  "inventory_number_id": 11039,
  "location_id": 323,
  "quantity_available": 100.50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1
  },
  "message": "Inventory number creado exitosamente"
}
```

**Lógica:**
1. Validar que no exista ya un registro con el mismo `item_id`, `inventory_number_id` y `location_id`
2. Insertar en `netsuite_inventory_numbers`
3. Retornar el ID generado

**Validaciones:**
- `item_id`, `inventory_number_id`, `location_id` son requeridos
- `lot_number` es requerido
- `quantity_available` es opcional (puede ser NULL)

---

### 6. Actualizar Inventory Number

**Endpoint:** `PUT /api/v1/netsuite-inventory/{tienda_id}/items/{item_id}/numbers/{number_id}`

**Descripción:** Actualiza un inventory number existente.

**Request Body:**
```json
{
  "item_id": 7544,
  "lot_number": "L06MAY26",
  "inventory_number_id": 11039,
  "location_id": 323,
  "quantity_available": 150.00
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true
  },
  "message": "Inventory number actualizado exitosamente"
}
```

**Lógica:**
1. Validar que el registro existe (`id = {number_id}`)
2. Actualizar el registro en `netsuite_inventory_numbers`
3. Actualizar `updated_at` automáticamente

---

### 7. Eliminar Inventory Number

**Endpoint:** `DELETE /api/v1/netsuite-inventory/{tienda_id}/items/{item_id}/numbers/{number_id}`

**Descripción:** Elimina un inventory number.

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Inventory number eliminado exitosamente"
}
```

**Lógica:**
1. Validar que el registro existe
2. Eliminar de `netsuite_inventory_numbers` WHERE `id = {number_id}`

---

## Consideraciones de Implementación

### Seguridad
- Todos los endpoints requieren autenticación JWT
- Validar que el usuario tiene permisos sobre la tienda especificada
- Validar que los `tienda_id` en los parámetros coinciden con los del token

### Base de Datos
- Usar transacciones para operaciones múltiples
- El modelo `NetsuiteInventoryNumberModel` ya existe y puede reutilizarse
- Usar el modelo `ProductoModel` para las operaciones de productos

### Validaciones
- **CRÍTICO:** Siempre filtrar por `tiendaproducto_estado = 0` en queries de productos
- Validar tipos de datos (números deben ser numéricos)
- Validar que los registros existen antes de actualizar/eliminar
- Manejar errores de duplicados en inventory numbers
- Asegurar que el usuario tiene permisos sobre la tienda

### Performance
- Usar JOINs eficientes para obtener productos con sus inventory numbers
- Indexar correctamente las búsquedas por `item_id`
- Implementar paginación adecuada

---

## Rutas Sugeridas en Routes.php

```php
// Netsuite Inventory Mapping Routes
$routes->group('netsuite-inventory', ['namespace' => 'App\Controllers\V1'], function($routes) {
    // Products
    $routes->get('(:num)/products', 'NetsuiteInventory::getProducts/$1');
    $routes->get('(:num)/products/(:num)', 'NetsuiteInventory::getProduct/$1/$2');
    $routes->post('(:num)/products/(:num)', 'NetsuiteInventory::saveProductMapping/$1/$2');

    // Inventory Numbers
    $routes->get('(:num)/items/(:num)/numbers', 'NetsuiteInventory::getInventoryNumbers/$1/$2');
    $routes->post('(:num)/items/(:num)/numbers', 'NetsuiteInventory::createInventoryNumber/$1/$2');
    $routes->put('(:num)/items/(:num)/numbers/(:num)', 'NetsuiteInventory::updateInventoryNumber/$1/$2/$3');
    $routes->delete('(:num)/items/(:num)/numbers/(:num)', 'NetsuiteInventory::deleteInventoryNumber/$1/$2/$3');
});
```

---

## Controlador Sugerido

Crear: `app/Controllers/V1/NetsuiteInventory.php`

El controlador debe:
1. Extender `BaseController`
2. Usar `NetsuiteInventoryNumberModel`
3. Usar el modelo de productos existente
4. Implementar los 7 endpoints descritos
5. Manejar errores y validaciones
6. Retornar respuestas en formato estándar API

---

## Testing

### Casos de Prueba
1. **Listar productos**: Con y sin filtros, paginación
2. **Buscar productos**: Por SKU y nombre
3. **Guardar mapeo**: Item ID válido e inválido
4. **Crear lote**: Con y sin datos opcionales
5. **Actualizar lote**: Datos válidos e inválidos
6. **Eliminar lote**: Existente y no existente

### Datos de Prueba
```sql
-- Producto de ejemplo
INSERT INTO tiendaproducto (tienda_id, tiendaproducto_titulo, tiendaproducto_sku, tiendaproducto_estado)
VALUES (408, 'FRUTA MIXTA X 55G X 25 PQTS SAN JORGE', '7544', 0);

-- Inventory number de ejemplo
INSERT INTO netsuite_inventory_numbers (item_id, lot_number, inventory_number_id, location_id, quantity_available)
VALUES (7544, 'L06MAY26', 11039, 323, 100.50);
```

---

## Documentación Adicional

Para más información sobre cómo obtener inventory numbers de NetSuite, ver:
- `/Users/carlosvidal/www/mitienda/mitienda-api-ci4/docs/COMO_OBTENER_INVENTORY_NUMBER_IDS.md`

Para entender la arquitectura actual de NetSuite, ver:
- `/Users/carlosvidal/www/mitienda/mitienda-api-ci4/docs/NETSUITE_ARCHITECTURE_ANALYSIS.md`
- `/Users/carlosvidal/www/mitienda/mitienda-api-ci4/app/Models/NetsuiteInventoryNumberModel.php`

---

## Notas Importantes

1. **SKU como Item ID**: En este sistema, el campo `tiendaproducto_sku` almacena el NetSuite Item ID. Esto significa que cuando se guarda un mapeo, el SKU del producto se sobrescribe con el Item ID de NetSuite.

2. **Location ID por defecto**: El sistema usa `323` (LAVICTORIA) como location por defecto, pero debe ser configurable por inventory number.

3. **Inventory Numbers vs Stock**: Los inventory numbers (lotes) son independientes del stock del producto en miTienda. El campo `quantity_available` es solo informativo de NetSuite.

4. **FIFO**: El sistema existente usa FIFO (First In, First Out) para seleccionar lotes al crear facturas. Los lotes deben ordenarse por `id ASC`.

---

**Última actualización:** 2025-11-05
**Versión de API:** v1
**Estado:** Documentación completa - Pendiente de implementación
