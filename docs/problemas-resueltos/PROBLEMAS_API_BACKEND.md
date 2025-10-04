# 🐛 Problemas Encontrados en la API Backend

**Fecha:** 3 de octubre de 2025
**API:** https://api2.mitienda.pe/api/v1

## ❌ Error Crítico: Detalle de Pedidos

### Endpoint Afectado
- **GET** `/api/v1/orders/{id}`

### Error
```
CodeIgniter\Database\Exceptions\DatabaseException
Table 'mitiendape.tiendasproductos' doesn't exist
```

### Stack Trace
```
File: /var/www/api2.mitienda.pe/app/Models/OrderDetailModel.php:44
Method: getOrderDetailsWithImages
Controller: App\Controllers\V1\Order::show (line 96)
```

### Descripción
El endpoint de detalle de pedidos intenta consultar una tabla `tiendasproductos` que no existe en la base de datos.

### Impacto
- ❌ No se puede ver el detalle de ningún pedido
- ❌ La vista de detalle de pedidos no funciona
- ✅ La lista de pedidos **SÍ funciona** correctamente

### Solución Temporal (Frontend)
Se deshabilitó temporalmente la navegación al detalle del pedido en `OrdersListView.vue`:

```typescript
const handleOrderClick = (order: Order) => {
  // TODO: El endpoint /orders/{id} tiene un error en la API
  toast.add({
    severity: 'info',
    summary: 'Detalle de pedido',
    detail: `Pedido #${order.order_number} - ${order.customer.name}`,
    life: 3000
  })

  // Descomentar cuando la API esté corregida:
  // router.push(`/orders/${order.id}`)
}
```

### Solución Requerida (Backend)
Verificar y corregir en el backend:

1. **Verificar nombre de tabla:**
   - ¿Es `tiendasproductos` o `tiendas_productos`?
   - ¿La tabla existe en la base de datos?

2. **Revisar `OrderDetailModel.php`:**
   ```php
   // Línea 44 - método getOrderDetailsWithImages
   // Verificar la consulta SQL
   ```

3. **Opciones:**
   - Crear la tabla faltante si es necesaria
   - Corregir el nombre de la tabla en el modelo
   - Usar una tabla existente con el mismo propósito

### Ejemplo de Request que Falla
```bash
curl -X GET "https://api2.mitienda.pe/api/v1/orders/73533" \
  -H "Authorization: Bearer {token}"
```

**Response:**
```json
{
  "title": "CodeIgniter\\Database\\Exceptions\\DatabaseException",
  "type": "CodeIgniter\\Database\\Exceptions\\DatabaseException",
  "code": 500,
  "message": "Table 'mitiendape.tiendasproductos' doesn't exist"
}
```

---

## ✅ Endpoints que Funcionan Correctamente

### Listado de Pedidos
- **GET** `/api/v1/orders?page=1&limit=20` ✅
- Devuelve: `{ orders: [...], pager: {...} }`

### Autenticación
- **POST** `/api/v1/auth/login` ✅
- Devuelve token JWT válido

### Tiendas
- **GET** `/api/v1/user/stores` ✅
- Devuelve lista de tiendas del usuario

### Productos
- **GET** `/api/v1/products?page=1&limit=20` ✅
- Devuelve array de productos

### Clientes
- **GET** `/api/v1/customers?page=1&limit=20` ✅
- Devuelve `{ error: 0, data: [...], pagination: {...} }`

### Categorías
- **GET** `/api/v1/categories` ✅
- Devuelve array jerárquico de categorías

### Marcas
- **GET** `/api/v1/brands` ✅
- Devuelve array de marcas

---

## 📋 Próximos Pasos

1. **Corregir error de `tiendasproductos`** en el backend
2. **Verificar otros endpoints de detalle:**
   - `/products/{id}`
   - `/customers/{id}`
   - `/categories/{id}`
   - `/brands/{id}`

3. **Implementar paginación correcta:**
   - El endpoint `/orders` debería devolver información de paginación en `pager`
   - Actualmente solo devuelve los pedidos sin metadata completa

4. **Agregar campos faltantes en `/orders`:**
   - `total` calculado del pedido
   - `items_count` número de items
   - `pasarela_nombre` nombre de la pasarela de pago

---

## 🔧 Workarounds Implementados

### 1. Normalización de Respuestas
Se agregó un interceptor en `axios.ts` que convierte:
```typescript
{ error: 0, data: {...} } → { success: true, data: {...} }
```

### 2. Mapeo de Datos de Pedidos
Se agregó transformación en `orders.api.ts`:
```typescript
// De:
{
  tiendaventa_id: "73533",
  tiendaventa_nombres: "Juan",
  tiendaventa_pagado: "0"
}

// A:
{
  id: 73533,
  customer: { name: "Juan" },
  status: "pending"
}
```

### 3. Mapeo de Datos de Tiendas
Se agregó transformación en `auth.api.ts`:
```typescript
// De:
{
  tienda_id: "408",
  tienda_nombre_comercial: "MiTienda",
  tienda_plan_status_text: "Activo"
}

// A:
{
  id: 408,
  name: "MiTienda",
  status: "active"
}
```

---

**Última actualización:** 3 de octubre de 2025
**Estado:** En desarrollo - esperando correcciones del backend
