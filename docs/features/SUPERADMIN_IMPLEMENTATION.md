# Implementación Módulo Super-Admin

## Objetivo
Migrar las funcionalidades de super-administrador del backoffice legacy (PHP 5.6 + CI3) al nuevo stack (Vue 3 + CodeIgniter 4).

## Arquitectura

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Vue 3 SPA     │────────▶│   CI4 API        │────────▶│   MySQL DB      │
│  (Frontend)     │  HTTPS  │  (api2.mitienda) │  Query  │  (mitienda)     │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## Base de Datos (Ya existente)

### Tabla: `superadministradores`
```sql
- superadministrador_id (PK)
- usuario_id (FK → usuarios)
- parner_id (FK → parners)
- superadmintipo_id (FK → superadmintipos)
```

### Tabla: `superadmintipos`
```sql
- superadmintipo_id (PK)
- superadmintipo_nombre (VARCHAR) -- Ej: "SUPER_ADMIN", "SOPORTE"
```

## Plan de Implementación

### FASE 1: Backend (CodeIgniter 4) ⏳

#### 1.1 Crear SuperAdminController ⬜
**Archivo**: `/app/Controllers/V1/SuperAdminController.php`

**Endpoints a implementar:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/superadmin/check` | Verificar si usuario es superadmin |
| GET | `/api/v1/superadmin/stores` | Listar TODAS las tiendas con filtros |
| POST | `/api/v1/superadmin/impersonate` | Generar token para acceder a tienda |
| POST | `/api/v1/superadmin/exit-impersonation` | Salir del modo impersonación |

#### 1.2 Método: check() ⬜
```php
// GET /api/v1/superadmin/check
// Response:
{
  "error": 0,
  "data": {
    "is_superadmin": true,
    "superadmin_type_id": 1,
    "superadmin_type_name": "SUPER_ADMIN",
    "partner_id": 10,
    "partner_name": "MiTienda"
  }
}
```

#### 1.3 Método: stores() ⬜
```php
// GET /api/v1/superadmin/stores?status=active&plan=medium&search=zapatos
// Response:
{
  "error": 0,
  "data": {
    "stores": [
      {
        "id": 408,
        "name": "Tienda Demo",
        "slug": "demo",
        "url": "https://demo.mitienda.pe",
        "plan": {
          "id": 3,
          "name": "Medium",
          "status": "active",
          "expires_at": "2025-12-31"
        },
        "owner": {
          "name": "Carlos Vidal",
          "email": "carlos@example.com"
        },
        "created_at": "2024-01-01",
        "ssl_enabled": true
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "per_page": 20
    }
  }
}
```

#### 1.4 Método: impersonate() ⬜
```php
// POST /api/v1/superadmin/impersonate
// Body: { "store_id": 408 }
// Response:
{
  "error": 0,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJ...",
    "store_id": 408,
    "impersonation_context": {
      "original_user_id": 1,
      "original_token": "eyJ0eXAiOiJKV1QiLC...",
      "started_at": "2025-10-15 14:30:00"
    }
  }
}
```

#### 1.5 Método: exitImpersonation() ⬜
```php
// POST /api/v1/superadmin/exit-impersonation
// Body: { "original_token": "eyJ0eXAiOiJKV1QiLC..." }
// Response:
{
  "error": 0,
  "data": {
    "access_token": "eyJ0eXAiOiJKV1QiLC...", // Token original restaurado
    "message": "Impersonación finalizada"
  }
}
```

---

### FASE 2: Frontend (Vue 3) ⏳

#### 2.1 Tipos TypeScript ⬜
**Archivo**: `src/types/admin.types.ts`

```typescript
export interface SuperAdminInfo {
  is_superadmin: boolean
  superadmin_type_id: number
  superadmin_type_name: string
  partner_id: number
  partner_name: string
}

export interface AdminStore {
  id: number
  name: string
  slug: string
  url: string
  plan: {
    id: number
    name: string
    status: 'active' | 'expired' | 'suspended'
    expires_at: string
  }
  owner: {
    name: string
    email: string
  }
  created_at: string
  ssl_enabled: boolean
}

export interface ImpersonationContext {
  original_user_id: number
  original_token: string
  target_store_id: number
  started_at: string
}
```

#### 2.2 API Client ⬜
**Archivo**: `src/api/admin.api.ts`

Métodos:
- `checkSuperAdmin()`
- `getStores(filters)`
- `impersonate(storeId)`
- `exitImpersonation(originalToken)`

#### 2.3 Pinia Store ⬜
**Archivo**: `src/stores/admin.store.ts`

Estado:
- `superAdminInfo`
- `stores`
- `impersonationContext`
- `isImpersonating`

#### 2.4 Actualizar Auth Store ⬜
**Archivo**: `src/stores/auth.store.ts`

Agregar:
- `superAdminInfo`
- Acción `checkSuperAdmin()`
- Getter `isSuperAdmin`

#### 2.5 Vista Principal ⬜
**Archivo**: `src/views/admin/StoresListView.vue`

Características:
- Tabla con todas las tiendas
- Filtros: plan, status, búsqueda
- Botón "Acceder" por tienda
- Paginación

#### 2.6 Componentes ⬜
**Archivos**:
- `src/components/admin/StoreCard.vue` - Card de tienda
- `src/components/admin/StoreFilters.vue` - Filtros de búsqueda
- `src/components/admin/ImpersonationBanner.vue` - Banner de advertencia

#### 2.7 Router ⬜
**Archivo**: `src/router/index.ts`

Agregar:
- Ruta `/admin/stores`
- Guard `requiresSuperAdmin: true`
- Lógica de verificación en `beforeEach`

#### 2.8 Layout ⬜
**Archivo**: `src/layouts/DashboardLayout.vue`

Agregar:
- Menú "Administración" (visible solo para superadmin)
- Banner de impersonación cuando `isImpersonating === true`
- Botón "Salir de Impersonación"

---

## Flujo de Usuario

### 1. Login Normal
```
Usuario → Login → API verifica superadmin → Frontend carga menú Admin
```

### 2. Acceder a Tienda (Impersonación)
```
SuperAdmin → /admin/stores → Click "Acceder" en Tienda X
  ↓
API genera token con store_id de Tienda X
  ↓
Frontend guarda original_token en localStorage
  ↓
Frontend muestra banner: "⚠️ Accediendo como SuperAdmin a Tienda X"
  ↓
Usuario navega normalmente (products, orders, etc.) de Tienda X
```

### 3. Salir de Impersonación
```
Usuario → Click "Salir de Impersonación"
  ↓
API restaura token original
  ↓
Frontend limpia impersonation_context
  ↓
Redirect a /admin/stores
```

---

## Checklist de Progreso

### Backend (CI4)
- [x] Crear `SuperAdminController.php`
- [x] Implementar `check()`
- [x] Implementar `stores()` con filtros
- [x] Implementar `impersonate()`
- [x] Implementar `exitImpersonation()`
- [x] Agregar rutas en `app/Config/Routes.php`
- [ ] Probar endpoints con Postman/curl
- [ ] Verificar que tabla `superadministradores` tiene datos de prueba

### Frontend (Vue 3)
- [x] Crear `admin.types.ts`
- [x] Crear `admin.api.ts`
- [x] Crear `admin.store.ts`
- [x] Actualizar `auth.store.ts`
- [x] Crear `StoresListView.vue`
- [x] Crear `StoreCard.vue`
- [x] Crear `StoreFilters.vue`
- [x] Crear `ImpersonationBanner.vue`
- [x] Actualizar `router/index.ts`
- [x] Actualizar `DashboardLayout.vue`
- [ ] Probar flujo completo
- [ ] Verificar que el menú "Administración" aparece solo para superadmin

---

## Notas de Seguridad

1. **Validación estricta**: El token de impersonación debe validarse en CADA request
2. **Logging**: Registrar TODAS las impersonaciones (quién, cuándo, qué tienda)
3. **Expiración**: Los tokens de impersonación deben expirar más rápido (ej: 1 hora)
4. **Auditoría**: Guardar en BD cada acceso de superadmin a tiendas

---

## Estado Actual

**Última actualización**: 2025-10-15 18:30

| Fase | Estado | Progreso |
|------|--------|----------|
| Backend | ✅ Completa | 100% |
| Frontend | ✅ Completa | 100% |
| Testing | ⏳ En progreso | 0% |
| Documentación | ✅ Completa | 100% |

### ✅ Completado

**Backend (CodeIgniter 4):**
- `SuperAdminController.php` creado con todos los métodos
- Rutas agregadas en `Routes.php`
- Sistema de verificación de superadmin
- Sistema de impersonación con tokens JWT
- Filtros de búsqueda (status, plan, search)
- Paginación de resultados

**Frontend (Vue 3):**
- Tipos TypeScript completos
- API client configurado
- Pinia store para administración
- Auth store extendido con soporte de superadmin
- Vista principal de listado de tiendas
- Componentes: StoreCard, StoreFilters, ImpersonationBanner
- Router configurado con guards
- DashboardLayout actualizado con menú admin

### 🔨 Próximos Pasos

1. **Probar endpoints del backend:**
   ```bash
   curl -X GET "https://api2.mitienda.pe/api/v1/superadmin/check" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Verificar datos en BD:**
   - Confirmar que existe al menos un usuario en `superadministradores`
   - Verificar tipos en `superadmintipos`

3. **Probar flujo completo:**
   - Login como superadmin
   - Verificar que aparece menú "Administración"
   - Acceder a `/admin/stores`
   - Filtrar tiendas
   - Impersonar una tienda
   - Verificar banner de impersonación
   - Navegar por módulos (productos, orders)
   - Salir de impersonación

---

## Comandos útiles

```bash
# Desarrollo backend CI4
cd /Users/carlosvidal/www/mitienda/mitienda-api-ci4
php spark serve

# Desarrollo frontend Vue 3
cd /Users/carlosvidal/www/mitienda/mitienda-administrador
npm run dev

# Probar endpoint
curl -X GET "https://api2.mitienda.pe/api/v1/superadmin/check" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
