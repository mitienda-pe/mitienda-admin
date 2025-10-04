# ✅ Instrucciones de Verificación - Sistema de Dos Tokens

## Estado Actual

Se ha aplicado el **FIX CRÍTICO** del sistema de dos tokens JWT en [auth.store.ts:89-119](src/stores/auth.store.ts#L89-L119).

**Servidor corriendo en**: http://localhost:3000

---

## 🔴 PASOS OBLIGATORIOS PARA VERIFICAR

### 1. Cerrar Sesión (si estás logueado)

Haz clic en el botón de cerrar sesión en el backoffice.

### 2. Limpiar LocalStorage

**Opción A - DevTools (Recomendado)**:
1. Abre DevTools (F12 o Cmd+Option+I)
2. Ve a la pestaña **Application**
3. En el menú izquierdo: **Storage → Local Storage → http://localhost:3000**
4. Haz clic en **Clear All** (icono de ⊗ o botón "Clear")

**Opción B - Console**:
```javascript
localStorage.clear()
```

### 3. Recargar la Página

Presiona `Cmd+Shift+R` (Mac) o `Ctrl+Shift+R` (Windows/Linux) para hard refresh.

### 4. Iniciar Sesión Nuevamente

Ingresa tus credenciales normalmente.

### 5. Seleccionar Tienda

Al seleccionar la tienda, deberías ver en **Console** (DevTools → Console):

```
✅ Token de tienda actualizado con permisos completos para store_id: 408
```

### 6. Verificar en DevTools

**Application → Local Storage → http://localhost:3000**

Deberías ver:
- `access_token`: Un token JWT largo (el storeToken)
- `selected_store`: `{"id":408,"name":"Tu Tienda",...}`

### 7. Decodificar el Token

1. Copia el valor de `access_token` desde DevTools
2. Ve a https://jwt.io
3. Pega el token en el campo "Encoded"
4. En el payload decodificado, verifica que contenga:
   ```json
   {
     "store_id": 408,
     "permissions": [
       "read_products",
       "write_products",
       "read_orders",
       "write_orders",
       "read_customers",
       "write_customers",
       ...
     ]
   }
   ```

---

## ✅ Qué Deberías Ver Ahora

### Dashboard
- Métricas de ventas
- Productos publicados
- Stock agotado
- Pedidos recientes

### Productos
- **SOLO productos de la tienda seleccionada (store_id: 408)**
- NO productos mezclados de otras tiendas
- Click en producto debería mostrar detalles (si el endpoint funciona)

### Pedidos
- **SOLO pedidos de la tienda 408**
- Lista de pedidos con datos correctos
- ⚠️ Detalle de pedido aún deshabilitado (error 500 del backend)

### Clientes
- **SOLO clientes de la tienda 408**
- Lista de clientes
- Click en cliente debería mostrar detalles

---

## 🔍 Cómo Verificar que el Fix Funciona

### Test 1: Productos Correctos

**Antes del fix**:
- Mostraba productos de TODAS las tiendas del usuario (mezcla)

**Después del fix**:
- Debe mostrar SOLO productos con `tiendaproducto_tienda_id = 408`

**Cómo verificar**:
1. Abre DevTools → Network
2. Ve a Productos
3. Busca la petición `GET /products`
4. En la respuesta, todos los productos deben tener `tiendaproducto_tienda_id: 408`

### Test 2: Token Cambia al Seleccionar Tienda

**Antes del fix**:
- El token NO cambiaba al seleccionar tienda
- Siempre usaba el token del login

**Después del fix**:
- El token DEBE CAMBIAR cuando seleccionas una tienda

**Cómo verificar**:
1. Login → Copia el `access_token` del localStorage
2. Seleccionar tienda → Copia el NUEVO `access_token`
3. Decodifica ambos en jwt.io
4. Los `permissions` del segundo deben ser más completos

---

## 🐛 Problemas Conocidos (NO del Fix)

Estos problemas **NO están relacionados con el sistema de tokens** y requieren correcciones en el backend:

### 1. Detalle de Pedido - Error 500
- **Endpoint**: `GET /orders/:id`
- **Error**: `Table 'mitiendape.tiendasproductos' doesn't exist`
- **Archivo backend**: `app/Models/OrderDetailModel.php:44`
- **Estado**: Click deshabilitado temporalmente
- **Fix**: Backend debe corregir el modelo

### 2. Total en Listado de Pedidos
- **Issue**: API no devuelve `total` calculado en el listado
- **Campo**: `tiendaventa_totalpagar` siempre viene `null`
- **Workaround**: UI muestra "Total en detalle"
- **Fix**: Backend debe agregar `total_amount` al listado

---

## 📊 Comparación de Tokens

### UserToken (del Login)

```json
{
  "iss": "https://api2.mitienda.pe/",
  "sub": "408",
  "aud": "mobile",
  "user_id": 408,
  "email": "...",
  "store_id": 408,
  "permissions": [
    "read_products",
    "read_orders",
    "read_customers"
  ]
}
```

**Permisos limitados** - Solo lectura

### StoreToken (de /user/store/select)

```json
{
  "iss": "https://api2.mitienda.pe/",
  "sub": "408",
  "aud": "mobile",
  "user_id": 408,
  "email": "...",
  "store_id": 408,
  "permissions": [
    "read_products",
    "write_products",
    "update_products",
    "delete_products",
    "read_orders",
    "write_orders",
    "update_orders",
    "read_customers",
    "write_customers",
    "update_customers"
  ]
}
```

**Permisos completos** - CRUD completo para esa tienda

---

## 🎯 Resultado Esperado

✅ **ANTES** (Incorrecto):
```
Login → userToken (408)
Select Store 408 → userToken (no cambia)
GET /products → Devuelve productos de tiendas 408, 409, 410, etc. (mezcla)
```

✅ **AHORA** (Correcto):
```
Login → userToken (408)
Select Store 408 → storeToken (408 con permisos completos)
GET /products → Devuelve SOLO productos de tienda 408
```

---

## 📁 Archivos Modificados

- ✅ [src/api/auth.api.ts](src/api/auth.api.ts#L58-L67) - Tipado correcto del response
- ✅ [src/stores/auth.store.ts](src/stores/auth.store.ts#L89-L119) - Guarda el nuevo token
- ✅ [src/api/products.api.ts](src/api/products.api.ts) - Mapping correcto de array
- ✅ [src/components/orders/OrderCard.vue](src/components/orders/OrderCard.vue) - UX mejorada
- 📄 [PROBLEMA_CRITICO_TOKEN.md](PROBLEMA_CRITICO_TOKEN.md) - Documentación del problema

---

## 💡 Si Algo No Funciona

### Productos siguen mostrando mezcla de tiendas

1. Verifica que el token cambió en localStorage
2. Decodifica el token en jwt.io
3. Confirma que `store_id` coincide con tienda seleccionada
4. Revisa Console para ver el mensaje "✅ Token de tienda actualizado"

### No puedo ver productos

1. Abre DevTools → Network
2. Busca la petición `GET /products`
3. Revisa el header `Authorization: Bearer ...`
4. Copia el token y decodifícalo en jwt.io
5. Verifica que tenga `permissions: ["read_products", ...]`

### Error 401 Unauthorized

Significa que el token no es válido:
1. Cierra sesión
2. Limpia localStorage
3. Inicia sesión de nuevo

---

**Fecha**: 2025-10-03
**Servidor**: http://localhost:3000
**Status**: ✅ FIX APLICADO - Requiere logout/login
**Próximos pasos**: Verificar que productos correspondan a tienda seleccionada
