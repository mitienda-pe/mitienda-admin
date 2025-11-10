# ✅ Checklist Backend - NetSuite Inventory Mapping

## 🚨 PROBLEMA ACTUAL

**Estado:** El endpoint está retornando TODOS los productos (~500+) cuando debería retornar solo productos activos (~281).

**Contexto Multitenant:**
- El sistema es multitenant - cada usuario puede tener múltiples tiendas
- El frontend usa `authStore.selectedStore.id` para obtener el `tienda_id` actual
- El usuario de prueba tiene la tienda **12097** seleccionada
- El `tienda_id` viene del selector de tiendas en el header

**Causa:**
1. Posiblemente el endpoint `/api/v1/netsuite-inventory/{tienda_id}/products` **NO está implementado**
2. O está usando el endpoint genérico `/products` que NO filtra por estado
3. Falta el filtro `tiendaproducto_estado = 0` en las queries

**Impacto:** Se están mostrando productos eliminados (estado = 1) en la interfaz de mapeo.

---

## 🎯 Solución Requerida

### Filtro Obligatorio en TODAS las Queries

```php
// ✅ CORRECTO - Siempre incluir ambos filtros
$builder = $db->table('tiendaproducto');
$builder->where('tienda_id', $tiendaId);
$builder->where('tiendaproducto_estado', 0);  // ← CRÍTICO

// ❌ INCORRECTO - Falta el filtro de estado
$builder = $db->table('tiendaproducto');
$builder->where('tienda_id', $tiendaId);
// Esto retornará productos activos Y eliminados
```

---

## 📋 Tareas de Implementación

### 1. Endpoint: GET /api/v1/netsuite-inventory/{tienda_id}/products

**⚠️ IMPORTANTE:** Este debe ser un endpoint ESPECÍFICO, NO reutilizar el endpoint genérico `/products`.

- [ ] Crear controlador `app/Controllers/V1/NetsuiteInventory.php`
- [ ] Crear método `getProducts($tiendaId)` en el controlador
- [ ] **Validar que el usuario tiene permisos sobre la tienda** (del JWT token)
- [ ] **Aplicar AMBOS filtros:**
  - `tienda_id = $tiendaId`
  - `tiendaproducto_estado = 0` ← **CRÍTICO**
- [ ] Implementar búsqueda por SKU/nombre (parámetro `search`)
- [ ] Implementar filtro por mapeo (parámetro `has_mapping`)
- [ ] Implementar paginación (parámetros `page`, `limit`)
- [ ] LEFT JOIN con `netsuite_inventory_numbers` para obtener lotes
- [ ] Retornar estructura esperada por el frontend
- [ ] **Probar con tienda 12097** que tiene ~281 productos activos

**Query SQL esperado:**
```sql
SELECT
  p.tiendaproducto_id,
  p.tiendaproducto_sku,
  p.tiendaproducto_titulo,
  p.tiendaproducto_estado,
  p.tiendaproducto_sku as netsuite_item_id,
  CASE
    WHEN COUNT(n.id) > 0 THEN 1
    ELSE 0
  END as has_mapping
FROM tiendaproducto p
LEFT JOIN netsuite_inventory_numbers n ON n.item_id = p.tiendaproducto_sku
WHERE p.tienda_id = ?
  AND p.tiendaproducto_estado = 0  -- ← CRÍTICO
  AND (? = '' OR p.tiendaproducto_titulo LIKE ? OR p.tiendaproducto_sku LIKE ?)
GROUP BY p.tiendaproducto_id
ORDER BY p.tiendaproducto_id DESC
LIMIT ? OFFSET ?
```

---

### 2. Endpoint: GET /api/v1/netsuite-inventory/{tienda_id}/products/{producto_id}

- [ ] Crear método `getProduct()`
- [ ] **Aplicar filtro `tiendaproducto_estado = 0`**
- [ ] Verificar que el producto pertenece a la tienda
- [ ] JOIN con `netsuite_inventory_numbers`
- [ ] Retornar producto con todos sus lotes
- [ ] Validar permisos

---

### 3. Endpoint: POST /api/v1/netsuite-inventory/{tienda_id}/products/{producto_id}

- [ ] Crear método `saveProductMapping()`
- [ ] Validar que el producto existe y es activo (`estado = 0`)
- [ ] Validar que pertenece a la tienda
- [ ] Actualizar `tiendaproducto_sku` con el `netsuite_item_id`
- [ ] Retornar éxito
- [ ] Manejar errores

**Request esperado:**
```json
{
  "tienda_id": 408,
  "producto_id": 123,
  "netsuite_item_id": "7544"
}
```

---

### 4. Endpoint: GET /api/v1/netsuite-inventory/{tienda_id}/items/{item_id}/numbers

- [ ] Crear método `getInventoryNumbers()`
- [ ] Query a `netsuite_inventory_numbers` WHERE `item_id = ?`
- [ ] Ordenar por `id ASC` (FIFO)
- [ ] Retornar array de inventory numbers

---

### 5. Endpoint: POST /api/v1/netsuite-inventory/{tienda_id}/items/{item_id}/numbers

- [ ] Crear método `createInventoryNumber()`
- [ ] Validar datos requeridos: `item_id`, `lot_number`, `inventory_number_id`, `location_id`
- [ ] Verificar que no existe duplicado
- [ ] Insertar en `netsuite_inventory_numbers`
- [ ] Retornar ID generado

---

### 6. Endpoint: PUT /api/v1/netsuite-inventory/{tienda_id}/items/{item_id}/numbers/{number_id}

- [ ] Crear método `updateInventoryNumber()`
- [ ] Validar que el registro existe
- [ ] Actualizar registro
- [ ] Retornar éxito

---

### 7. Endpoint: DELETE /api/v1/netsuite-inventory/{tienda_id}/items/{item_id}/numbers/{number_id}

- [ ] Crear método `deleteInventoryNumber()`
- [ ] Validar que el registro existe
- [ ] Eliminar registro
- [ ] Retornar éxito

---

## 🧪 Testing

### Tests Unitarios

- [ ] Test: `getProducts()` solo retorna productos con `estado = 0`
- [ ] Test: `getProducts()` retorna count correcto (~281 para tienda test)
- [ ] Test: `getProducts()` con búsqueda funciona
- [ ] Test: `getProducts()` con filtro `has_mapping` funciona
- [ ] Test: `getProducts()` paginación funciona
- [ ] Test: `getProduct()` retorna producto activo
- [ ] Test: `getProduct()` falla con producto eliminado
- [ ] Test: `saveProductMapping()` actualiza SKU
- [ ] Test: CRUD de inventory numbers funciona

### Tests de Integración

- [ ] Flujo completo: listar → editar → guardar → recargar
- [ ] Verificar que productos eliminados nunca aparecen
- [ ] Verificar count correcto de productos por tienda

### Tests Manuales

**⚠️ NOTA:** Usa la tienda **12097** para las pruebas (o la tienda que tengas seleccionada en el frontend).

```bash
# 0. Obtener el token JWT del navegador
# En el navegador, abre DevTools > Application > Local Storage > access_token
# O desde el frontend: authStore.accessToken

TOKEN="TU_JWT_TOKEN_AQUI"
TIENDA_ID=12097  # O la tienda que estés probando

# 1. Verificar count de productos activos
curl -H "Authorization: Bearer $TOKEN" \
  "https://api2.mitienda.pe/api/v1/netsuite-inventory/${TIENDA_ID}/products?limit=1000" \
  | jq '.data.pagination.total'
# Debe ser ~281 para tienda 12097, NO 500+

# 2. Verificar que no hay productos con estado = 1
curl -H "Authorization: Bearer $TOKEN" \
  "https://api2.mitienda.pe/api/v1/netsuite-inventory/${TIENDA_ID}/products?limit=1000" \
  | jq '.data.products[] | select(.tiendaproducto_estado == 1)'
# Debe retornar vacío (sin resultados)

# 3. Probar búsqueda
curl -H "Authorization: Bearer $TOKEN" \
  "https://api2.mitienda.pe/api/v1/netsuite-inventory/${TIENDA_ID}/products?search=FRUTA"

# 4. Probar filtro has_mapping
curl -H "Authorization: Bearer $TOKEN" \
  "https://api2.mitienda.pe/api/v1/netsuite-inventory/${TIENDA_ID}/products?has_mapping=1"

# 5. Verificar count directo en base de datos
# Ejecutar en MySQL:
SELECT COUNT(*)
FROM tiendaproducto
WHERE tienda_id = 12097
  AND tiendaproducto_estado = 0;
# Este debe coincidir con el total del API
```

---

## 📁 Archivos a Crear/Modificar

### Backend (CodeIgniter 4)

```
app/Controllers/V1/
  └── NetsuiteInventory.php          [CREAR]

app/Config/
  └── Routes.php                      [MODIFICAR - agregar rutas]

app/Models/
  └── NetsuiteInventoryNumberModel.php  [YA EXISTE - reutilizar]
  └── ProductoModel.php                  [YA EXISTE - usar para queries]

tests/
  └── NetsuiteInventoryTest.php      [CREAR]
```

### Rutas a Agregar (Routes.php)

```php
$routes->group('api/v1/netsuite-inventory', ['namespace' => 'App\Controllers\V1'], function($routes) {
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

## 🔍 Debugging

### Si retorna más productos de los esperados:

1. **Verificar que estás usando el endpoint correcto:**
   ```
   ✅ Correcto: /api/v1/netsuite-inventory/12097/products
   ❌ Incorrecto: /api/v1/products (este es el genérico, no filtra por estado)
   ```

2. **Verificar el query SQL:**
   ```php
   log_message('debug', 'Query: ' . $builder->getCompiledSelect());
   log_message('debug', 'Tienda ID: ' . $tiendaId);
   ```

3. **Verificar filtro de estado:**
   ```php
   log_message('debug', 'Estado filter applied: ' . ($builder->hasWhere('tiendaproducto_estado') ? 'YES' : 'NO'));
   ```

4. **Verificar count en DB para la tienda correcta:**
   ```sql
   -- En MySQL - Usar la tienda que estés probando
   SELECT COUNT(*)
   FROM tiendaproducto
   WHERE tienda_id = 12097  -- Tu tienda de prueba
     AND tiendaproducto_estado = 0;
   -- Debe coincidir con el total del API
   ```

5. **Verificar productos eliminados:**
   ```sql
   SELECT COUNT(*)
   FROM tiendaproducto
   WHERE tienda_id = 12097
     AND tiendaproducto_estado = 1;
   -- Estos NO deben aparecer en el API
   ```

6. **Verificar permisos del token JWT:**
   ```php
   // En el controlador, verificar que el token tiene acceso a la tienda
   $tokenStoreId = $this->request->jwt->store_id;
   log_message('debug', 'Token store_id: ' . $tokenStoreId);
   log_message('debug', 'Requested tienda_id: ' . $tiendaId);

   if ($tokenStoreId != $tiendaId) {
       return $this->failUnauthorized('No tienes acceso a esta tienda');
   }
   ```

---

## 📚 Documentación de Referencia

- **Especificación completa:** [NETSUITE_INVENTORY_MAPPING_API.md](./NETSUITE_INVENTORY_MAPPING_API.md)
- **Frontend implementado:** [NETSUITE_INVENTORY_MAPPING_FRONTEND.md](./NETSUITE_INVENTORY_MAPPING_FRONTEND.md)
- **Overview general:** [NETSUITE_INVENTORY_MAPPING_README.md](./NETSUITE_INVENTORY_MAPPING_README.md)

---

## ✅ Criterios de Aceptación

### Funcional
- [ ] Solo se muestran productos con `tiendaproducto_estado = 0`
- [ ] Count de productos es correcto (~281 para tienda test)
- [ ] Búsqueda funciona correctamente
- [ ] Filtros funcionan correctamente
- [ ] Paginación funciona correctamente
- [ ] Se puede mapear un producto
- [ ] Se pueden agregar/editar/eliminar inventory numbers

### Performance
- [ ] Query de productos toma < 500ms
- [ ] Uso correcto de índices
- [ ] No hay N+1 queries

### Seguridad
- [ ] Autenticación JWT requerida
- [ ] Validación de permisos por tienda
- [ ] Validación de datos de entrada
- [ ] Sanitización de queries SQL

---

## 🚀 Deploy

1. **Staging:**
   - [ ] Probar con datos reales
   - [ ] Verificar count correcto
   - [ ] Validar flujo completo

2. **Producción:**
   - [ ] Backup de DB antes de deploy
   - [ ] Deploy del código
   - [ ] Smoke tests
   - [ ] Monitorear logs por 24h

---

**Última actualización:** 2025-11-05
**Prioridad:** 🔴 ALTA (bloqueador para funcionalidad)
**Estimación:** 4-6 horas
