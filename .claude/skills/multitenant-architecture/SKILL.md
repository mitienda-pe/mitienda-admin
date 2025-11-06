# MiTienda.pe - Arquitectura Multitenant

## 🏗️ Arquitectura General

MiTienda.pe es una plataforma **MULTITENANT (tiendas) y MULTIUSUARIO**:

- **Un mismo usuario puede gestionar MÚLTIPLES tiendas (tenants)**
- Cada tienda es un tenant completamente aislado con sus propios datos
- Los usuarios se autentican una vez y luego seleccionan con qué tienda trabajar

## 🔑 Flujo de Autenticación Multitenant

### 1. Login Inicial (Genera Token #1)
```
POST /api/v1/auth/login
```

**Respuesta:**
```json
{
  "data": {
    "access_token": "eyJ...",  // Token con PRIMERA tienda del usuario
    "user": { "id": 123, "email": "...", "name": "..." },
    "store_id": 456  // ID de la primera tienda
  }
}
```

**Ubicación en código:** [AuthController.php:48](../../../app/Controllers/AuthController.php#L48)
- Línea 130-135: Obtiene la primera tienda del usuario
- Línea 159-169: Genera JWT con `store_id` de la primera tienda

### 2. Obtener Lista de Tiendas del Usuario
```
GET /api/v1/user/stores
Headers: Authorization: Bearer <token_1>
```

**Respuesta:**
```json
{
  "data": {
    "stores": [
      { "tienda_id": 456, "tienda_nombre_comercial": "Tienda A", "tienda_plan_vigente": "1" },
      { "tienda_id": 789, "tienda_nombre_comercial": "Tienda B", "tienda_plan_vigente": "1" }
    ]
  }
}
```

**Ubicación en código:** [UserController.php:65](../../../app/Controllers/V1/UserController.php#L65)

### 3. Store Selector (Genera Token #2)
```
POST /api/v1/user/store-select
Headers: Authorization: Bearer <token_1>
Body: { "store_id": 789 }
```

**Respuesta:**
```json
{
  "data": {
    "access_token": "eyJ...",  // NUEVO token con tienda seleccionada
    "store_id": 789
  }
}
```

**Ubicación en código:** [UserController.php:136](../../../app/Controllers/V1/UserController.php#L136)
- Línea 158-179: Genera un NUEVO JWT con el `store_id` seleccionado
- Línea 166: El `store_id` en el JWT determina el tenant activo

### 4. Usar Token #2 para Todas las Peticiones
Todos los endpoints protegidos usan el Token #2 que contiene el `store_id` correcto.

## 🗄️ Estructura de Base de Datos

### Tabla de Relación Usuario-Tienda
```sql
CREATE TABLE `administradores` (
  `usuario_id` int NOT NULL,
  `usuariotipo_id` int NOT NULL,
  `tienda_id` int NOT NULL,
  PRIMARY KEY (`usuario_id`, `usuariotipo_id`, `tienda_id`)
)
```

**Ubicación:** [database/scripts/Dump20251011.sql:52](../../../database/scripts/Dump20251011.sql#L52)

**Propósito:** Relaciona usuarios con las tiendas que pueden gestionar.

**Método en código:** `AuthModel::getUserStores()` - [AuthModel.php:103](../../../app/Models/AuthModel.php#L103)

### Caso Especial: Propietarios Directos
Algunos usuarios son propietarios directos de su tienda donde `usuario_id = tienda_id`.
Estos usuarios NO aparecen en la tabla `administradores`.

**Ubicación en código:** [AuthController.php:139-152](../../../app/Controllers/AuthController.php#L139)

### Todas las Tablas Principales Tienen `tienda_id`

✅ `productos` → `tienda_id` - [Dump20251011.sql:1554](../../../database/scripts/Dump20251011.sql#L1554)
✅ `tiendasventas` (orders) → `tienda_id` - [Dump20251011.sql:4459](../../../database/scripts/Dump20251011.sql#L4459)
✅ `tiendasclientes` (customers) → `tienda_id` - [Dump20251011.sql:2742](../../../database/scripts/Dump20251011.sql#L2742)
✅ `tiendascategorias` → `tienda_id`
✅ `tiendasmarcas` → `tienda_id`
✅ Todas las demás tablas relacionadas

## 🛡️ AuthFilter - Inyección de `tienda_id`

**Ubicación:** [app/Filters/AuthFilter.php](../../../app/Filters/AuthFilter.php)

```php
// AuthFilter.php:113-135
private function validateJWT(string $token): ?array
{
    $decoded = JWT::decode($token, new Key($jwtSecret, 'HS256'));

    if (isset($decoded->store_id)) {
        return [
            'tienda_id' => (int)$decoded->store_id,  // ← EXTRAE DEL JWT
            'user_id' => isset($decoded->user_id) ? (int)$decoded->user_id : null
        ];
    }
    return null;
}

// AuthFilter.php:62-64
$request->tienda_id = $authData['tienda_id'];  // ← INYECTA EN REQUEST
$request->user_id = $authData['user_id'] ?? null;
```

**Resultado:** Todos los controladores tienen acceso a `$this->request->tienda_id`

## 📱 Frontends que Implementan Store Selector

### 1. App Móvil Flutter
**Ubicación:** `/Users/carlosvidal/Developer/mitienda_app`

**Archivos clave:**
- [lib/screens/auth/store_selection_screen.dart](../../../Developer/mitienda_app/lib/screens/auth/store_selection_screen.dart) - Pantalla de selección
- [lib/services/auth_service.dart](../../../Developer/mitienda_app/lib/services/auth_service.dart#L64) - Método `loadUserStores()`

**Flujo:**
1. Login → guarda Token #1
2. Carga tiendas del usuario
3. Si tiene múltiples tiendas → muestra `StoreSelectionScreen`
4. Usuario selecciona tienda → llama a `selectStore()` → obtiene Token #2
5. Usa Token #2 para todas las peticiones

### 2. Backoffice Vue.js
**Ubicación:** `/Users/carlosvidal/www/mitienda/mitienda-administrador`

**Archivos clave:**
- [src/views/auth/LoginView.vue](../../../mitienda-administrador/src/views/auth/LoginView.vue)
- [src/stores/auth.store.ts](../../../mitienda-administrador/src/stores/auth.store.ts)

### 3. POS (Point of Sale)
**Ubicación:** `/Users/carlosvidal/www/mitienda/mitienda-POS`

## ⚠️ Errores Comunes que DEBES EVITAR

### ❌ ERROR #1: "El producto con ID X no existe"
**Problema:** Estás buscando en el tenant equivocado porque usas el Token #1 (primera tienda) en lugar del Token #2 (tienda seleccionada).

**Solución:**
- SIEMPRE verifica que estás usando el token correcto
- El `store_id` del JWT debe coincidir con la tienda en la que el usuario está trabajando
- Pregunta al usuario: "¿En qué tienda estás trabajando actualmente?"

### ❌ ERROR #2: Usar solo el primer token
**Problema:** No consideras que hay 2 tokens en el flujo multitenant.

**Solución:**
- Token #1 (login): Solo para obtener lista de tiendas
- Token #2 (store-select): Para todas las operaciones CRUD

### ❌ ERROR #3: No filtrar por `tienda_id`
**Problema:** Cuando propones queries directas, olvidas filtrar por `tienda_id`.

**Solución:** SIEMPRE incluye `WHERE tienda_id = ?` en queries SQL.

### ❌ ERROR #4: Asumir que `user_id = tienda_id` siempre
**Problema:** Solo aplica para propietarios directos, no para administradores.

**Solución:** Usa la tabla `administradores` para obtener las tiendas del usuario.

## 💡 Reglas de Oro para Testing

### Cuando hagas pruebas con curl o Postman:

1. **Obtén el token correcto:**
   ```bash
   # Paso 1: Login
   TOKEN_1=$(curl -X POST https://api.mitienda.pe/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"pass"}' \
     | jq -r '.data.access_token')

   # Paso 2: Ver tiendas disponibles
   curl -H "Authorization: Bearer $TOKEN_1" \
     https://api.mitienda.pe/api/v1/user/stores

   # Paso 3: Seleccionar tienda
   TOKEN_2=$(curl -X POST https://api.mitienda.pe/api/v1/user/store-select \
     -H "Authorization: Bearer $TOKEN_1" \
     -H "Content-Type: application/json" \
     -d '{"store_id":789}' \
     | jq -r '.data.access_token')

   # Paso 4: Usar TOKEN_2 para operaciones
   curl -H "Authorization: Bearer $TOKEN_2" \
     https://api.mitienda.pe/api/v1/products
   ```

2. **Verifica el `store_id` del token:**
   ```bash
   # Decodificar JWT (payload es la parte del medio)
   echo "eyJ..." | cut -d. -f2 | base64 -d | jq
   ```

3. **Siempre pregunta al usuario:**
   - "¿Qué token estás usando?"
   - "¿En qué tienda estás trabajando?"
   - "¿El token tiene el `store_id` correcto?"

## 🔍 Ejemplo de Uso en Controladores

```php
// Product.php:23-24
public function index()
{
    // El tienda_id ya está validado por AuthFilter
    $tienda_id = $this->request->tienda_id;

    // SIEMPRE filtrar por tienda_id
    $this->model->where('tienda_id', $tienda_id)
                ->where('producto_status', 1);

    // ... resto del código
}
```

**Ubicación:** [app/Controllers/V1/Product.php:23](../../../app/Controllers/V1/Product.php#L23)

## 📊 Resumen Visual del Flujo

```
Usuario Login
    ↓
[Token #1 con store_id = primera_tienda]
    ↓
GET /user/stores → Lista de tiendas del usuario
    ↓
Usuario selecciona Tienda B
    ↓
POST /user/store-select { store_id: tienda_b_id }
    ↓
[Token #2 con store_id = tienda_b_id] ← ESTE ES EL TOKEN CORRECTO
    ↓
Todas las peticiones CRUD usan Token #2
    ↓
AuthFilter extrae store_id del JWT
    ↓
$request->tienda_id = store_id_del_jwt
    ↓
Controladores filtran por $this->request->tienda_id
```

## 🎯 Checklist ANTES de Responder

Cuando el usuario reporte un error tipo "no existe":

- [ ] ¿Verificaste qué token está usando (Token #1 o Token #2)?
- [ ] ¿Confirmaste el `store_id` del JWT?
- [ ] ¿El usuario seleccionó una tienda en el store selector?
- [ ] ¿El recurso realmente existe en ESA tienda específica?
- [ ] ¿Tu query filtra correctamente por `tienda_id`?

## 📝 Notas Adicionales

- Los tokens JWT expiran en 30 días por defecto (configurable con `JWT_EXPIRES_IN`)
- El endpoint `/api/v1/auth/refresh` permite renovar tokens
- El store selector SOLO aparece si el usuario tiene > 1 tienda vigente
- Si tiene 1 sola tienda, se selecciona automáticamente (no ve el selector)
- Las tiendas sin plan vigente (`tienda_plan_vigente = 0`) NO aparecen en el selector
