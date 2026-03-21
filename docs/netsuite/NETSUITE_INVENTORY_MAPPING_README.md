# 📦 NetSuite Inventory Mapping - Documentación Completa

## 🎯 Objetivo

Implementar una interfaz para mapear productos de miTienda con items e inventory numbers (lotes) de NetSuite, facilitando la sincronización de órdenes.

---

## 📁 Documentación

### 1. Frontend (✅ COMPLETADO)
**Archivo:** [NETSUITE_INVENTORY_MAPPING_FRONTEND.md](./NETSUITE_INVENTORY_MAPPING_FRONTEND.md)

Contiene:
- Resumen de implementación
- Archivos creados/modificados
- Funcionalidades implementadas
- Estructura de datos
- Flujo de usuario
- Estado del proyecto

### 2. Backend API (⏳ PENDIENTE)
**Archivo:** [NETSUITE_INVENTORY_MAPPING_API.md](./NETSUITE_INVENTORY_MAPPING_API.md)

Contiene:
- Especificación completa de 7 endpoints
- Request/Response examples
- Estructura de base de datos
- Validaciones requeridas
- Rutas sugeridas
- Casos de prueba

---

## 🚀 Acceso Rápido

### URL de la Funcionalidad
```
https://admin.mitienda.pe/configuracion/netsuite/inventario
```

### Navegación en la App
```
Menú → Configuración → Mapeo de Inventario
```

---

## 📊 Resumen Visual

### Arquitectura de Datos

```
┌─────────────────────────┐
│  Producto miTienda      │
│  (tiendaproducto)       │
│                         │
│  - tiendaproducto_id    │
│  - tiendaproducto_sku ──┼──→ NetSuite Item ID (ej: 7544)
│  - tiendaproducto_titulo│
│  - tiendaproducto_estado│
└─────────────────────────┘
            │
            ↓
┌─────────────────────────────────┐
│  netsuite_inventory_numbers     │
│                                 │
│  - id                           │
│  - item_id (FK → SKU)           │
│  - lot_number (ej: L06MAY26)    │
│  - inventory_number_id (11039)  │
│  - location_id (323)            │
│  - quantity_available           │
└─────────────────────────────────┘
```

### Flujo de Trabajo

```
1. Usuario accede a Mapeo de Inventario
   ↓
2. Ve lista de productos activos (estado = 0)
   ↓
3. Busca/filtra producto deseado
   ↓
4. Hace clic en "Editar"
   ↓
5. Ve información del producto (nombre y SKU)
   ↓
6. Ingresa NetSuite Item ID
   ↓
7. Agrega uno o más lotes (inventory numbers)
   ↓
8. Guarda cambios
   ↓
9. Sistema actualiza:
   - tiendaproducto_sku = Item ID
   - netsuite_inventory_numbers records
```

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** Vue 3 + TypeScript
- **UI Library:** PrimeVue
- **State Management:** Pinia
- **HTTP Client:** Axios
- **Router:** Vue Router

### Backend (a implementar)
- **Framework:** CodeIgniter 4
- **Database:** MySQL
- **API:** RESTful
- **Auth:** JWT

---

## ✅ Checklist de Implementación

### Frontend
- [x] TypeScript types
- [x] API client methods
- [x] Vista principal con tabla
- [x] Modal de edición
- [x] Gestión de lotes
- [x] Búsqueda y filtros
- [x] Paginación
- [x] Validaciones
- [x] Manejo de errores
- [x] Loading/Empty states
- [x] Ruta configurada
- [x] Navegación actualizada
- [x] Documentación completa

### Backend (PENDIENTE)
- [ ] Controlador NetsuiteInventory
- [ ] 7 endpoints REST
- [ ] Validaciones
- [ ] Autenticación/Autorización
- [ ] Testing
- [ ] Rutas configuradas

---

## 🔗 Archivos Importantes

### Frontend

**Nueva Vista:**
```
src/views/configuracion/NetsuiteInventoryMapView.vue
```

**Types:**
```
src/types/netsuite.types.ts
```

**API:**
```
src/api/netsuite.api.ts
```

**Router:**
```
src/router/index.ts
```

**Layout:**
```
src/layouts/DashboardLayout.vue
```

### Backend (a crear)

**Controlador:**
```
app/Controllers/V1/NetsuiteInventory.php
```

**Modelo (existente):**
```
app/Models/NetsuiteInventoryNumberModel.php
```

**Rutas:**
```
app/Config/Routes.php
```

---

## 🧪 Testing

### Frontend Testing
```bash
# Type checking
npm run type-check

# Unit tests (cuando se implementen)
npm run test:unit

# E2E tests (cuando se implementen)
npm run test:e2e
```

### Backend Testing
```bash
# Unit tests
php spark test

# Specific test
php spark test --filter NetsuiteInventoryTest
```

---

## 📝 Endpoints API (Resumen)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/v1/netsuite-inventory/{tienda_id}/products` | Lista productos activos con mapeo |
| GET | `/api/v1/netsuite-inventory/{tienda_id}/products/{producto_id}` | Obtiene producto específico |
| POST | `/api/v1/netsuite-inventory/{tienda_id}/products/{producto_id}` | Guarda mapeo de producto |
| GET | `/api/v1/netsuite-inventory/{tienda_id}/items/{item_id}/numbers` | Lista inventory numbers |
| POST | `/api/v1/netsuite-inventory/{tienda_id}/items/{item_id}/numbers` | Crea inventory number |
| PUT | `/api/v1/netsuite-inventory/{tienda_id}/items/{item_id}/numbers/{number_id}` | Actualiza inventory number |
| DELETE | `/api/v1/netsuite-inventory/{tienda_id}/items/{item_id}/numbers/{number_id}` | Elimina inventory number |

**Nota:** Solo se trabaja con productos activos (`tiendaproducto_estado = 0`). La imagen del producto no es necesaria en las respuestas.

Ver detalles completos en [NETSUITE_INVENTORY_MAPPING_API.md](./NETSUITE_INVENTORY_MAPPING_API.md)

---

## 🚨 Notas Importantes

### 1. SKU = NetSuite Item ID
El campo `tiendaproducto_sku` almacena el NetSuite Item ID. Al guardar un mapeo, el SKU se sobrescribe.

### 2. FIFO (First In, First Out)
Los inventory numbers se ordenan por `id ASC` para implementar FIFO en la selección de lotes.

### 3. Location ID por Defecto
El sistema usa `323` (LAVICTORIA) como location por defecto, pero cada inventory number puede tener su propia location.

### 4. Productos Activos
Solo se muestran productos con `tiendaproducto_estado = 0` (activos).

---

## 🔐 Seguridad

- Autenticación JWT requerida
- Validación de permisos por tienda
- Validación de datos de entrada
- Sanitización de queries SQL

---

## 📚 Referencias

### Documentación Relacionada

**En el Backend (mitienda-api-ci4):**
- `docs/COMO_OBTENER_INVENTORY_NUMBER_IDS.md` - Cómo obtener IDs de NetSuite
- `docs/NETSUITE_ARCHITECTURE_ANALYSIS.md` - Arquitectura actual
- `docs/NETSUITE_INTEGRATION.md` - Integración general
- `app/Models/NetsuiteInventoryNumberModel.php` - Modelo existente

**En el Frontend (mitienda-administrador):**
- `NETSUITE_INVENTORY_MAPPING_FRONTEND.md` - Implementación frontend
- `NETSUITE_INVENTORY_MAPPING_API.md` - Especificación API
- `src/views/configuracion/NetsuiteConfigView.vue` - Vista principal NetSuite

---

## 🎨 UI Components Utilizados

- **DataTable** - Lista de productos con paginación
- **Dialog** - Modal de edición
- **InputText** - Campos de texto
- **InputNumber** - Campos numéricos
- **Dropdown** - Filtros
- **Tag** - Estados visuales
- **Button** - Acciones
- **Card** - Containers
- **Toast** - Notificaciones

---

## 🐛 Troubleshooting

### Frontend no carga productos
1. Verificar que el backend esté implementado
2. Revisar console del navegador para errores
3. Verificar autenticación JWT
4. Confirmar permisos de tienda

### Error al guardar
1. Verificar validaciones de formulario
2. Revisar formato de datos enviados
3. Confirmar que el backend acepta el formato
4. Revisar logs del backend

### Inventory numbers no se muestran
1. Verificar que el producto tenga SKU numérico
2. Confirmar que existen registros en `netsuite_inventory_numbers`
3. Revisar que `item_id` coincida con el SKU

---

## 👥 Contacto

Para dudas o soporte:
- **Frontend:** Revisar `NETSUITE_INVENTORY_MAPPING_FRONTEND.md`
- **Backend:** Revisar `NETSUITE_INVENTORY_MAPPING_API.md`
- **NetSuite:** Contactar al equipo de integración

---

## 📅 Changelog

### v1.0.0 - 2025-11-05
- ✅ Implementación completa del frontend
- ✅ Documentación completa
- ⏳ Backend pendiente de implementación

---

## 🚀 Próximos Pasos

1. **Implementar Backend**
   - Crear controlador `NetsuiteInventory`
   - Implementar 7 endpoints
   - Agregar validaciones
   - Escribir tests

2. **Testing Integración**
   - Probar flujo completo
   - Validar casos edge
   - Optimizar queries

3. **Deploy**
   - Verificar en staging
   - Validar con datos reales
   - Deploy a producción

4. **Mejoras Futuras**
   - Importación masiva desde CSV
   - Sincronización automática con NetSuite
   - Dashboard de estadísticas de mapeo
   - Histórico de cambios

---

**Estado Actual:** Frontend ✅ | Backend ⏳
**Última Actualización:** 2025-11-05
**Versión:** 1.0.0
