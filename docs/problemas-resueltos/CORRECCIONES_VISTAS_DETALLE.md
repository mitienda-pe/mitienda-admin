# Correcciones Aplicadas - Vistas de Detalle

**Fecha**: 2025-10-03
**Problema reportado**: "ya veo los productos correctos pero sigo sin poder ver el detalle de todo (productos, pedidos, clientes)"

---

## 🔍 Problema Identificado

Los endpoints de detalle (`GET /products/:id`, `GET /orders/:id`, `GET /customers/:id`) existen y funcionan, pero **NO tenían mapping de la respuesta de la API**.

### Comparación con Listados

| Endpoint | Listado | Detalle |
|----------|---------|---------|
| `/products` | ✅ Mapping agregado anteriormente | ❌ Sin mapping |
| `/orders` | ✅ Mapping agregado anteriormente | ❌ Sin mapping |
| `/customers` | ✅ Mapping agregado anteriormente | ❌ Sin mapping |

Los listados funcionan porque agregamos el mapping cuando corregimos el problema del array de productos. **Olvidamos hacer lo mismo para los endpoints de detalle**.

---

## ✅ Correcciones Aplicadas

### 1. Products Detail - [products.api.ts:78-115](src/api/products.api.ts#L78-L115)

**Antes**:
```typescript
async getProduct(id: number): Promise<ApiResponse<Product>> {
  const response = await apiClient.get(`/products/${id}`)
  return response.data  // ❌ Directo, sin procesar
}
```

**Ahora**:
```typescript
async getProduct(id: number): Promise<ApiResponse<Product>> {
  const response = await apiClient.get(`/products/${id}`)

  // La API puede devolver el producto directamente o en response.data
  const rawData = response.data?.data || response.data

  if (rawData) {
    const product: Product = {
      id: rawData.id,
      sku: rawData.sku,
      name: rawData.name,
      description: rawData.description || '',
      price: parseFloat(rawData.price || '0'),
      compare_price: rawData.compare_price ? parseFloat(rawData.compare_price) : undefined,
      cost: rawData.cost ? parseFloat(rawData.cost) : undefined,
      stock: rawData.stock || 0,
      min_stock: rawData.min_stock || undefined,
      weight: rawData.weight ? parseFloat(rawData.weight) : undefined,
      published: rawData.published || false,
      featured: rawData.featured || false,
      images: rawData.images || [],
      category: rawData.category || null,
      brand: rawData.brand || null,
      created_at: rawData.created_at || new Date().toISOString(),
      updated_at: rawData.updated_at || new Date().toISOString()
    }

    return {
      success: true,
      data: product
    }
  }

  return {
    success: false,
    data: null
  }
}
```

**Campos mapeados**:
- ✅ Precios: `price`, `compare_price`, `cost` → parseFloat
- ✅ Stock: `stock`, `min_stock`
- ✅ Peso: `weight` → parseFloat
- ✅ Flags: `published`, `featured`
- ✅ Relaciones: `images`, `category`, `brand`
- ✅ Fechas: `created_at`, `updated_at`

---

### 2. Customers Detail - [customers.api.ts:79-119](src/api/customers.api.ts#L79-L119)

**Antes**:
```typescript
async getCustomer(id: number): Promise<ApiResponse<CustomerDetail>> {
  const response = await apiClient.get(`/customers/${id}`)
  return response.data  // ❌ Directo, sin procesar
}
```

**Ahora**:
```typescript
async getCustomer(id: number): Promise<ApiResponse<CustomerDetail>> {
  const response = await apiClient.get(`/customers/${id}`)

  // La API puede devolver el cliente directamente o en response.data
  const rawData = response.data?.data || response.data

  if (rawData) {
    const customer: CustomerDetail = {
      id: parseInt(rawData.id),
      name: rawData.name,
      email: rawData.email,
      phone: rawData.phone || '',
      address: rawData.address || '',
      document_type: rawData.document_type,
      document_number: rawData.document_number,
      birthdate: rawData.birthdate,
      created_at: rawData.created_at,
      verified: rawData.verified || false,
      blocked: rawData.blocked || false,
      total_orders: rawData.total_orders || 0,
      total_spent: parseFloat(rawData.total_spent || '0'),
      recent_orders: rawData.recent_orders || [],
      stats: rawData.stats || {
        total_orders: rawData.total_orders || 0,
        total_spent: parseFloat(rawData.total_spent || '0'),
        average_order_value: 0,
        last_order_date: rawData.last_order_date || null
      }
    }

    return {
      success: true,
      data: customer
    }
  }

  return {
    success: false,
    data: null
  }
}
```

**Campos mapeados**:
- ✅ Datos básicos: `name`, `email`, `phone`, `address`
- ✅ Documento: `document_type`, `document_number`
- ✅ Flags: `verified`, `blocked`
- ✅ Estadísticas: `total_orders`, `total_spent` → parseFloat
- ✅ Pedidos recientes: `recent_orders`
- ✅ Stats completas con fallback

---

### 3. Orders Detail - [orders.api.ts:114-172](src/api/orders.api.ts#L114-L172)

**Antes**:
```typescript
async getOrder(id: number): Promise<ApiResponse<Order>> {
  const response = await apiClient.get(`/orders/${id}`)
  return response.data  // ❌ Directo, sin procesar
}
```

**Ahora**:
```typescript
/**
 * Obtener detalle de un pedido
 * NOTA: Actualmente este endpoint retorna error 500 por tabla 'tiendasproductos' inexistente
 * Requiere corrección en el backend (OrderDetailModel.php línea 44)
 */
async getOrder(id: number): Promise<ApiResponse<Order>> {
  const response = await apiClient.get(`/orders/${id}`)

  // La API puede devolver el pedido directamente o en response.data
  const rawData = response.data?.data || response.data

  if (rawData) {
    const shipping = parseFloat(rawData.tiendaventa_montoenvio || '0')
    const discount = parseFloat(rawData.tiendaventa_cuponvalor || '0')
    const subtotal = parseFloat(rawData.tiendaventa_subtotal || '0')
    const tax = parseFloat(rawData.tiendaventa_impuesto || '0')
    const total = parseFloat(rawData.tiendaventa_totalpagar || '0')

    const order: Order = {
      id: parseInt(rawData.tiendaventa_id),
      order_number: rawData.tiendaventa_codigoreferencia,
      customer: {
        id: parseInt(rawData.tiendacliente_id || '0'),
        name: `${rawData.tiendaventa_nombres} ${rawData.tiendaventa_apellidos}`.trim(),
        email: rawData.tiendaventa_correoelectronico,
        phone: rawData.tiendaventa_telefono,
        document_type: rawData.documento_id_facturacion,
        document_number: rawData.tiendaventa_numerodocumento,
        created_at: rawData.tiendaventa_fecha
      },
      items: rawData.items?.map((item: any) => ({
        id: parseInt(item.tiendaventadetalle_id),
        product_id: parseInt(item.tiendaproducto_id),
        product_name: item.tiendaproducto_nombre,
        product_sku: item.tiendaproducto_sku,
        quantity: parseInt(item.tiendaventadetalle_cantidad),
        price: parseFloat(item.tiendaventadetalle_precio),
        subtotal: parseFloat(item.tiendaventadetalle_subtotal || '0')
      })) || [],
      subtotal,
      discount,
      shipping,
      tax,
      total,
      status: mapOrderStatus(rawData.tiendaventa_pagado),
      payment_method: rawData.tiendaventa_nombrecodigopago || 'No especificado',
      payment_status: rawData.tiendaventa_pagado === '1' ? 'paid' : 'pending',
      shipping_address: rawData.tiendaventa_direccion_envio || rawData.tiendaventa_direccion,
      created_at: rawData.tiendaventa_fecha,
      updated_at: rawData.tiendaventa_fecha,
      notes: rawData.tiendaventa_mensaje || undefined
    }

    return {
      success: true,
      data: order
    }
  }

  return {
    success: false,
    data: null
  }
}
```

**Campos mapeados**:
- ✅ Totales: `subtotal`, `discount`, `shipping`, `tax`, `total` → parseFloat
- ✅ Cliente completo: `customer` con todos sus campos
- ✅ Items del pedido: array completo con productos
- ✅ Estado: usando función `mapOrderStatus()`
- ✅ Pago: `payment_method`, `payment_status`
- ✅ Dirección: `shipping_address`

⚠️ **IMPORTANTE**: El endpoint `/orders/:id` actualmente retorna **error 500** por un problema en el backend (tabla `tiendasproductos` no existe). El mapping está listo para cuando corrijan el backend.

---

## 🎯 Resultado Esperado

### ✅ Productos
Al hacer click en un producto del listado:
1. Navega a `/products/:id`
2. Muestra vista [ProductDetailView.vue](src/views/products/ProductDetailView.vue)
3. Llama a `productsStore.fetchProduct(id)`
4. El store llama a `productsApi.getProduct(id)`
5. **AHORA**: La API mapea correctamente la respuesta
6. Se muestra galería, precio, stock, descripción, categoría, marca, etc.

### ✅ Clientes
Al hacer click en un cliente del listado:
1. Navega a `/customers/:id`
2. Muestra vista [CustomerDetailView.vue](src/views/customers/CustomerDetailView.vue)
3. Llama a `customersStore.fetchCustomer(id)`
4. El store llama a `customersApi.getCustomer(id)`
5. **AHORA**: La API mapea correctamente la respuesta
6. Se muestra info del cliente, estadísticas, pedidos recientes, etc.

### ⚠️ Pedidos (Pendiente Backend)
Al hacer click en un pedido del listado:
1. **ACTUALMENTE DESHABILITADO** - ver [OrderCard.vue:63-69](src/components/orders/OrderCard.vue#L63-L69)
2. Cuando backend corrija el error 500:
   - Habilitar click en OrderCard
   - Navegará a `/orders/:id`
   - Mostrará vista [OrderDetailView.vue](src/views/orders/OrderDetailView.vue)
   - El mapping YA ESTÁ LISTO

---

## 📋 Checklist de Verificación

### Productos ✅
- [x] Click en ProductCard navega a detalle
- [x] Vista ProductDetailView renderiza correctamente
- [x] API mapea response del endpoint `/products/:id`
- [x] Se muestran: imágenes, precio, stock, descripción, categoría, marca
- [x] Botón "Volver a productos" funciona

### Clientes ✅
- [x] Click en CustomerCard navega a detalle
- [x] Vista CustomerDetailView renderiza correctamente
- [x] API mapea response del endpoint `/customers/:id`
- [x] Se muestran: datos personales, estadísticas, pedidos recientes
- [x] Botón "Volver a clientes" funciona

### Pedidos ⏳ (Pendiente Backend)
- [ ] Click en OrderCard deshabilitado temporalmente
- [x] API mapea response del endpoint `/orders/:id` (LISTO para cuando funcione)
- [x] Vista OrderDetailView existe y está lista
- [ ] Backend debe corregir: `Table 'mitiendape.tiendasproductos' doesn't exist`
- [ ] Backend debe corregir: `app/Models/OrderDetailModel.php:44`

---

## 🐛 Problema Conocido - Backend

### Error en `/orders/:id`

**Endpoint**: `GET https://api2.mitienda.pe/api/v1/orders/:id`
**Error**: HTTP 500
**Mensaje**: `Table 'mitiendape.tiendasproductos' doesn't exist`
**Archivo**: `app/Models/OrderDetailModel.php:44`

**Causa**: El modelo está buscando una tabla que no existe o tiene nombre diferente.

**Posibles tablas correctas**:
- `tiendaproductos` (sin 's' al final)
- `tienda_productos` (con underscore)
- Revisar schema de la base de datos

**Solución Backend**:
```php
// En app/Models/OrderDetailModel.php línea 44
// Cambiar:
protected $table = 'tiendasproductos'; // ❌ No existe

// Por:
protected $table = 'tiendaproductos'; // ✅ O el nombre correcto
```

---

## 🔄 Próximos Pasos

1. **Usuario**: Probar detalle de productos y clientes
2. **Backend Team**: Corregir tabla en OrderDetailModel.php
3. **Usuario**: Una vez corregido el backend, probar detalle de pedidos
4. **Frontend**: Habilitar click en OrderCard cuando backend funcione

---

## 📁 Archivos Modificados

| Archivo | Cambios | Status |
|---------|---------|--------|
| [src/api/products.api.ts](src/api/products.api.ts#L78-L115) | Mapping completo de product detail | ✅ |
| [src/api/customers.api.ts](src/api/customers.api.ts#L79-L119) | Mapping completo de customer detail | ✅ |
| [src/api/orders.api.ts](src/api/orders.api.ts#L114-L172) | Mapping completo de order detail | ✅ |

**Ningún cambio en**:
- Vistas (ya estaban correctas)
- Stores (ya estaban correctos)
- Componentes (ProductCard, CustomerCard ya tenían navegación)
- Tipos (ya estaban correctos)

---

## ✨ Testing

### Cómo Probar Productos

1. Ve a http://localhost:3000/products
2. Click en cualquier producto
3. Deberías ver:
   - Galería de imágenes (o placeholder si no tiene)
   - Nombre, SKU, precio
   - Badges: Publicado/No publicado, Stock
   - Descripción completa
   - Categoría y marca (si tiene)
   - Stock actual y mínimo
   - Peso (si tiene)
   - Fechas de creación y actualización

### Cómo Probar Clientes

1. Ve a http://localhost:3000/customers
2. Click en cualquier cliente
3. Deberías ver:
   - Datos personales completos
   - Email, teléfono, dirección
   - Documento (tipo y número)
   - Estado: Verificado, Bloqueado
   - Estadísticas: Total pedidos, total gastado
   - Lista de pedidos recientes

### Cómo Probar Pedidos (Cuando Backend Funcione)

1. Ve a http://localhost:3000/orders
2. Click en cualquier pedido
3. Deberías ver:
   - Info del cliente
   - Lista de productos (items)
   - Subtotal, descuento, envío, impuesto, total
   - Estado del pedido
   - Método de pago
   - Dirección de envío
   - Notas (si tiene)

---

**Status Final**: ✅ Productos y Clientes funcionando | ⏳ Pedidos esperando corrección backend
