# ✅ Prueba de Endpoints de la API

**Fecha:** 3 de octubre de 2025
**API:** https://api2.mitienda.pe/api/v1
**Usuario:** carlos@mitienda.pe

## Resumen

Todos los endpoints principales de la API fueron probados exitosamente con autenticación JWT.

## Endpoints Probados

### 1. ✅ Autenticación
- **POST** `/auth/login`
- **Estado:** Funcionando correctamente
- **Respuesta:** Token JWT válido por 30 días

### 2. ✅ Tiendas
- **GET** `/user/stores`
- **Estado:** Funcionando correctamente
- **Datos:** 5 tiendas activas encontradas
  - MiTienda Eventos (Large)
  - Ziyaz (Large)
  - TiZO (Large)
  - Altea (Large)
  - ALMACÉN DE LUNA (Medium)

### 3. ✅ Pedidos
- **GET** `/orders?page=1&limit=3`
- **Estado:** Funcionando correctamente
- **Estructura:** Array de pedidos con información completa
- **Campos:** ID, fecha, cliente, productos, totales, estado de pago, etc.

### 4. ✅ Productos
- **GET** `/products?page=1&limit=2`
- **Estado:** Funcionando correctamente
- **Estructura:** Array de productos
- **Campos:** id, sku, name, price, stock, published, images, brand
- **Ejemplo:**
  ```json
  {
    "id": 130921,
    "sku": "7241561",
    "name": "NEW POLO TOMMY HILFIGER...",
    "price": "0.00",
    "stock": 0,
    "published": true,
    "images": ["https://..."],
    "brand": null
  }
  ```

### 5. ✅ Clientes
- **GET** `/customers?page=1&limit=2`
- **Estado:** Funcionando correctamente
- **Estructura:** `{ error: 0, data: [...] }`
- **Campos:** id, name, email, phone, address, document_type, document_number, birthdate, created_at, verified, blocked

### 6. ✅ Categorías
- **GET** `/categories`
- **Estado:** Funcionando correctamente
- **Estructura:** Array jerárquico con subcategorías
- **Campos:** tiendacategoria_id, parent_id, tiendacategoria_nombre, tiendacategoria_nombreurl, sub (array de subcategorías)
- **Características:** Soporte de categorías anidadas

### 7. ✅ Marcas
- **GET** `/brands`
- **Estado:** Funcionando correctamente
- **Estructura:** Array de marcas
- **Campos:** tiendamarca_id, tiendamarca_nombre, tiendamarca_nombreurl, tiendaimagen_id
- **Ejemplos:** TOMMY HILFIGER, RALPH LAUREN, etc.

## Formato de Respuestas

La API usa dos formatos diferentes:

### Formato 1: Error Code
```json
{
  "error": 0,
  "message": "Mensaje",
  "data": {...}
}
```
**Usado en:** `/auth/login`, `/user/stores`, `/customers`

### Formato 2: Datos Directos
```json
[...]
```
**Usado en:** `/products`, `/categories`, `/brands`

### Formato 3: Objeto Directo
```json
{
  "orders": [...],
  "pagination": {...}
}
```
**Usado en:** `/orders`

## Headers CORS

Todos los endpoints responden correctamente con headers CORS:
```
Access-Control-Allow-Origin: https://admin.mitienda.pe
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin
```

## Autenticación

- **Tipo:** Bearer Token (JWT)
- **Header:** `Authorization: Bearer {token}`
- **Expiración:** 30 días (2,592,000 segundos)
- **Incluye:** user_id, email (encriptado), store_id, permissions

## Próximos Pasos

### Endpoints a Implementar en el Frontend:

1. **Dashboard/Estadísticas**
   - GET `/dashboard/stats` - Estadísticas generales

2. **Detalle de Recursos**
   - GET `/orders/{id}` - Detalle de pedido
   - GET `/products/{id}` - Detalle de producto
   - GET `/customers/{id}` - Detalle de cliente
   - GET `/categories/{id}` - Detalle de categoría
   - GET `/brands/{id}` - Detalle de marca

3. **Operaciones CRUD**
   - POST `/products` - Crear producto
   - PUT `/products/{id}` - Actualizar producto
   - DELETE `/products/{id}` - Eliminar producto
   - (Similar para otras entidades)

4. **Búsqueda y Filtros**
   - GET `/products?search=...` - Buscar productos
   - GET `/orders?status=...` - Filtrar pedidos
   - GET `/customers?verified=true` - Filtrar clientes

## Notas Técnicas

### 1. Mapeo de Datos Necesario

El frontend necesita transformar los nombres de campos de la API:

**Tiendas:**
- `tienda_id` → `id`
- `tienda_nombre_comercial` → `name`
- `tienda_plan_status_text` → `status` (mapear "Activo" → "active")

**Categorías:**
- `tiendacategoria_id` → `id`
- `tiendacategoria_nombre` → `name`
- `tiendacategoria_nombreurl` → `slug`

**Marcas:**
- `tiendamarca_id` → `id`
- `tiendamarca_nombre` → `name`
- `tiendamarca_nombreurl` → `slug`

### 2. Normalización de Respuestas

El interceptor de Axios (`src/api/axios.ts`) ya normaliza:
```typescript
{ error: 0, data: {...} } → { success: true, data: {...} }
```

### 3. Paginación

Los endpoints que soporten paginación usan parámetros:
- `page` - Número de página (desde 1)
- `limit` - Cantidad de items por página

## Estado del Proyecto

✅ **CORS resuelto**
✅ **Autenticación funcionando**
✅ **Endpoints principales probados**
✅ **Mapeo de datos implementado para tiendas**
🔄 **Pendiente:** Implementar módulos restantes del PRD

---

**Generado:** 3 de octubre de 2025
**Herramienta:** Claude Code
