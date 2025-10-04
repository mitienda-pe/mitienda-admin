# Correcciones Aplicadas

Fecha: 2025-10-03

## Problemas Identificados por el Usuario

1. ✅ Pedidos: listado muestra datos errados o faltantes (total en S/ 0.00)
2. ❌ Pedidos: no se puede ver el detalle (endpoint retorna 500 error - problema de backend)
3. ⏳ Productos: no se muestra el listado (problema de carga del módulo)
4. ⏳ Clientes: no se muestra el listado (problema de carga del módulo)

## Correcciones Aplicadas

### 1. Orders API - Mapeo Mejorado
**Archivo**: `src/api/orders.api.ts`

**Cambios**:
- ✅ Agregado campo `payment_method` desde `tiendaventa_nombrecodigopago`
- ✅ Agregado campo `notes` desde `tiendaventa_mensaje`
- ✅ Documentación de por qué `total` está en 0 (API no lo devuelve en listado)
- ✅ Extraído `shipping` y `discount` correctamente

**Explicación**:
La API no devuelve el monto total en el listado de pedidos. El campo `tiendaventa_totalpagar` siempre está en `null`. Para obtener el total real, se necesitaría:
1. Llamar al endpoint `/orders/:id` (que actualmente falla con 500)
2. O que el backend calcule y devuelva el total en el listado

### 2. OrderCard Component - Mejor UX para Datos Faltantes
**Archivo**: `src/components/orders/OrderCard.vue`

**Cambios**:
- ✅ Muestra "Total en detalle" cuando el total es 0
- ✅ Muestra "Ver detalle" cuando no hay items
- ✅ Click deshabilitado temporalmente (con mensaje en consola)
- ✅ Comentario TODO para rehabilitar cuando backend arregle endpoint

**Código**:
```vue
<p v-if="order.total > 0" class="text-lg font-bold text-primary">
  {{ formatCurrency(order.total) }}
</p>
<p v-else class="text-sm text-gray-400 italic">Total en detalle</p>
```

### 3. Servidor Dev Limpio
**Acción**: Reiniciado servidor dev en puerto 3002

**Estado**: ✅ Funcionando en http://localhost:3002

## Problemas que NO se Pueden Arreglar en Frontend

### 1. Endpoint `/orders/:id` Retorna 500 Error ❌
**Error Completo**:
```
CodeIgniter\\Database\\Exceptions\\DatabaseException
Message: Table 'mitiendape.tiendasproductos' doesn't exist
File: OrderDetailModel.php:44
Function: getOrderDetailsWithImages()
```

**Causa**:
El backend intenta hacer query a una tabla que no existe en la base de datos.

**Solución Requerida**:
- El equipo de backend debe arreglar `OrderDetailModel::getOrderDetailsWithImages()`
- Debe usar la tabla correcta o crear la tabla faltante
- La app móvil funciona, así que debe haber otra forma de obtener el detalle

**Workaround Temporal**:
- Detalle de pedido deshabilitado en el frontend
- Mensaje en consola cuando usuario hace click

### 2. Total no viene en Listado de Pedidos ⚠️
**Causa**:
La API no calcula ni devuelve el total en el endpoint `/orders`

**Impacto**:
- Todos los pedidos muestran "Total en detalle"
- No se puede ordenar por monto
- No se puede mostrar estadísticas en el listado

**Solución Ideal** (Backend):
Agregar campos calculados en la respuesta del listado:
```json
{
  "tiendaventa_id": "73533",
  ...
  "total_amount": "150.00",  // <-- Agregar esto
  "items_count": 3            // <-- Y esto
}
```

## Estado de los Módulos

### ✅ Pedidos (Listado)
- Endpoint funciona
- Muestra todos los datos disponibles
- Total en 0 por limitación de la API
- Click deshabilitado temporalmente

### ❌ Pedidos (Detalle)
- Endpoint retorna 500 error
- Requiere arreglo en backend
- Temporalmente deshabilitado

### ⏳ Productos
- Endpoint `/products` funciona correctamente
- Frontend debe cargar sin problemas
- Verificar que no haya errores de importación

### ⏳ Clientes
- Endpoint `/customers` funciona correctamente
- Frontend debe cargar sin problemas
- Verificar que no haya errores de importación

### ✅ Dashboard
- Endpoint `/util/dashboard-metrics` funciona
- Muestra métricas correctamente

## Próximos Pasos

### Inmediato (Usuario)
1. Recargar página en http://localhost:3002
2. Verificar que productos y clientes carguen
3. Si hay errores en consola, compartirlos

### Corto Plazo (Backend)
1. **URGENTE**: Arreglar endpoint `/orders/:id`
   - Corregir query en OrderDetailModel
   - Verificar que use tablas correctas

2. **IMPORTANTE**: Agregar campos en `/orders`:
   - `total_amount`: monto total calculado
   - `items_count`: número de items

### Medio Plazo
1. Normalizar respuestas de la API
2. Documentar estructura de endpoints
3. Agregar tests para endpoints críticos

## Notas

- La app móvil funciona porque probablemente maneja el error 500 de forma diferente
- O usa un endpoint alternativo que no conocemos
- Sería útil comparar el código de la app móvil para ver cómo obtienen el detalle del pedido

