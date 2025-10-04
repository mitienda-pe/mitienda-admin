# Problemas Encontrados en el Backoffice

## 1. Endpoint `/orders/:id` retorna 500 Error
**Error**: Table 'mitiendape.tiendasproductos' doesn't exist
**Endpoint**: `GET /api/v1/orders/73533`
**Problema Backend**: El controlador Order.php línea 96 llama a `OrderDetailModel::getOrderDetailsWithImages()` que hace query a tabla inexistente
**Impacto**: No se puede ver el detalle de ningún pedido
**Solución**: Requiere arreglo en el backend API

## 2. Campo `total` faltante en listado de pedidos
**Endpoint**: `GET /api/v1/orders`
**Problema**: La API no devuelve un campo `total` calculado en el listado
**Campos disponibles**:
- `tiendaventa_totalpagar`: null en todos los casos
- `tiendaventa_montoenvio`: S/ envío
- `tiendaventa_cuponvalor`: descuento
- `tiendaventa_igv`: 18 (porcentaje)

**Impacto**: El frontend muestra "S/ 0.00" en todos los pedidos
**Solución Temporal**: Calcular en el frontend basado en items (pero items no vienen en el listado)
**Solución Ideal**: Backend debería incluir `total_amount` calculado

## 3. Items no vienen en el listado de pedidos
**Endpoint**: `GET /api/v1/orders`
**Problema**: No incluye los items del pedido en el listado
**Impacto**: No se puede calcular subtotal ni total, no se puede mostrar cantidad de items
**Solución**: Backend debería incluir al menos:
- `items_count`: número de items
- `total_amount`: monto total calculado

## 4. Vista de productos no carga
**Error**: Failed to fetch dynamically imported module
**Problema**: El frontend intenta cargar desde puerto 3001 en vez de 3002
**Posible causa**: Hay múltiples servidores dev corriendo simultáneamente
**Solución**: Matar todos los procesos y reiniciar dev server

## 5. Vista de clientes no carga
**Error**: Same as productos
**Problema**: Failed to fetch CustomerCard styles
**Solución**: Reiniciar servidor dev

## Comparación con App Móvil

### App Móvil (Funciona)
- Usa modelo `DetailedOrder` con estructura completa
- Endpoint `/orders/:id` funciona correctamente
- Calcula totales en el frontend si es necesario
- Maneja respuestas inconsistentes de la API

### Backoffice (Problemas)
- Usa modelo `Order` simplificado
- Endpoint `/orders/:id` falla con error 500
- No puede calcular totales sin los items
- No maneja caso cuando total no viene

## Soluciones Propuestas

### Corto Plazo (Frontend)
1. ❌ Deshabilitar click en pedidos (no abrir detalle) hasta que backend arregle endpoint
2. ✅ No mostrar total en listado (o mostrar "Pendiente")
3. ✅ Reiniciar servidor dev limpiamente
4. ✅ Verificar que productos y clientes carguen correctamente

### Medio Plazo (Backend)
1. Arreglar query en `OrderDetailModel::getOrderDetailsWithImages()` para no usar tabla inexistente
2. Agregar `total_amount` calculado en listado de pedidos
3. Agregar `items_count` en listado de pedidos
4. Considerar incluir items resumidos en listado

## Estado Actual

- ✅ Productos: API funciona, frontend debe cargar
- ✅ Clientes: API funciona, frontend debe cargar
- ⚠️ Pedidos Listado: API funciona pero falta campo total
- ❌ Pedidos Detalle: API retorna 500 error
- ✅ Dashboard: API funciona correctamente

