# 🔴 PROBLEMA CRÍTICO: Sistema de Dos Tokens

## El Problema

Los productos mostrados NO corresponden a la tienda seleccionada. Los endpoints de detalle (products, orders, customers) fallan.

## Causa Raíz

La API usa **DOS tokens JWT diferentes**:

### 1. Token de Usuario (`userToken`)
- Se obtiene en `/auth/login`
- Sirve SOLO para:
  - `/user/stores` - Listar tiendas del usuario
  - `/user/store/select` - Seleccionar tienda

### 2. Token de Tienda (`storeToken`)
- Se obtiene en `/user/store/select`
- Sirve para:
  - `/api/v1/products` - Productos de ESA tienda
  - `/api/v1/orders` - Pedidos de ESA tienda
  - `/api/v1/customers` - Clientes de ESA tienda

## Cómo lo Hace la App Móvil

```dart
class _MiTiendaAuthInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    final storeToken = prefs.getString('storeToken');  // Token de tienda
    final userToken = prefs.getString('userToken');     // Token de usuario

    if (options.path.contains('/user/stores')) {
      // Usa userToken
      options.headers['Authorization'] = 'Bearer $userToken';
    } else if (options.path.contains('/api/v1/products')) {
      // Usa storeToken
      options.headers['Authorization'] = 'Bearer $storeToken';
    }
  }
}
```

## Qué Hacía el Backoffice (INCORRECTO)

```typescript
// ❌ INCORRECTO - Siempre usaba el mismo token
async function selectStore(store: Store) {
  await authApi.selectStore(store.id)
  // Solo guardaba la tienda, NO el nuevo token
  selectedStore.value = store
  localStorage.setItem('selected_store', JSON.stringify(store))
}
```

## Solución Aplicada

### 1. Actualizado `auth.api.ts`
```typescript
async selectStore(storeId: number): Promise<ApiResponse<{
  access_token: string;  // Nuevo token con permisos de tienda
  expires_in: number;
  store_id: number;
}>> {
  const response = await apiClient.post('/user/store/select', { store_id: storeId })
  return response.data
}
```

### 2. Actualizado `auth.store.ts`
```typescript
async function selectStore(store: Store) {
  const response = await authApi.selectStore(store.id)

  if (response.success && response.data) {
    // ✅ CORRECTO - Guardar el NUEVO token
    const storeToken = response.data.access_token

    accessToken.value = storeToken
    localStorage.setItem('access_token', storeToken)  // Reemplaza el token

    selectedStore.value = store
    localStorage.setItem('selected_store', JSON.stringify(store))

    console.log('✅ Token de tienda actualizado')
  }
}
```

## Flujo Correcto

```
1. Login
   POST /auth/login
   → Devuelve userToken (permisos limitados)
   → Guardar en localStorage

2. Listar tiendas
   GET /user/stores
   → Usa userToken
   → Muestra tiendas disponibles

3. Seleccionar tienda
   POST /user/store/select {"store_id": 408}
   → Usa userToken
   → Devuelve storeToken (permisos completos para esa tienda)
   → REEMPLAZAR token en localStorage con storeToken

4. Obtener productos
   GET /api/v1/products
   → Usa storeToken
   → Devuelve productos de la tienda 408
```

## Respuesta de `/user/store/select`

```json
{
  "error": 0,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGci...nuevo-token",
    "expires_in": 2592000,
    "store_id": 408
  }
}
```

Este nuevo `access_token` contiene:
- `store_id`: 408
- `permissions`: ["read_products", "write_products", "read_orders", ...]

## Comparación de Tokens

### UserToken (Login)
```json
{
  "user_id": 408,
  "email": "...",
  "store_id": 408,
  "permissions": ["read_products", "read_orders", "read_customers"]
}
```

### StoreToken (Select Store)
```json
{
  "user_id": 408,
  "email": "...",
  "store_id": 408,
  "permissions": [
    "read_products", "write_products", "update_products", "delete_products",
    "read_orders", "write_orders", "update_orders",
    "read_customers", "write_customers", "update_customers"
  ]
}
```

## Impacto de NO Usar el Token Correcto

❌ **Sin storeToken**:
- Productos de TODAS las tiendas del usuario (mezcla)
- Pedidos pueden ser de otra tienda
- Clientes incorrectos
- Endpoints de detalle pueden fallar (500)

✅ **Con storeToken**:
- Solo productos de la tienda seleccionada
- Solo pedidos de esa tienda
- Solo clientes de esa tienda
- Permisos correctos para operaciones

## Verificación

Para verificar que funciona:

1. **Abrir DevTools → Application → LocalStorage**
2. **Verificar que `access_token` cambia al seleccionar tienda**
3. **Decodificar el JWT en jwt.io**
4. **Verificar que `store_id` coincide con tienda seleccionada**

## Instrucciones para Usuario

### IMPORTANTE: Debes hacer esto para que funcione

1. **Cierra sesión** (si estás logueado)
2. **Borra localStorage** (DevTools → Application → Clear storage)
3. **Recarga la página**: http://localhost:3000
4. **Inicia sesión de nuevo**
5. **Selecciona la tienda**
6. **Verás en consola**: "✅ Token de tienda actualizado con permisos completos para store_id: 408"
7. **Ahora sí verás los productos correctos**

## Archivos Modificados

- ✅ `src/api/auth.api.ts` - Tipado correcto del response
- ✅ `src/stores/auth.store.ts` - Guarda el nuevo token
- 📄 Este documento explicativo

---

**Fecha**: 2025-10-03
**Status**: ✅ SOLUCIONADO
**Requiere**: Cerrar sesión y volver a entrar

