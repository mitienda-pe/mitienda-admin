# Pendientes de Implementación - Backoffice MiTienda

**Fecha**: 3 de octubre de 2025
**Estado**: En progreso - Fases 1-5 completadas

---

## 📊 Estado Actual vs PRD

### ✅ **Implementado** (Fases 1-5 completadas)

#### Fase 1: Autenticación
- ✅ Login con validación
- ✅ Selección de tienda (multi-tenant)
- ✅ Sistema de dos tokens (userToken + storeToken)
- ✅ Route guards
- ✅ Interceptor Axios para renovación

#### Fase 2: Dashboard
- ✅ Layout principal (header, sidebar)
- ✅ 4 métricas principales con cambios vs período anterior
- ✅ Selector de período (hoy, semana, mes)
- ✅ Pedidos recientes

#### Fase 3: Productos
- ✅ Lista con scroll infinito
- ✅ Búsqueda en tiempo real
- ✅ Filtros (estado, stock, categoría, marca)
- ✅ Detalle de producto con galería
- ✅ Placeholder local para imágenes

#### Fase 4: Pedidos
- ✅ Lista con scroll infinito
- ✅ Búsqueda por número/cliente
- ✅ Filtros por estado y fecha
- ✅ Detalle completo con productos, cliente, envío, pago

#### Fase 5: Clientes
- ✅ Lista con búsqueda
- ✅ Detalle con estadísticas e historial

---

## ❌ **Pendiente** - Funcionalidades CRUD

### 1️⃣ **CRUD de Productos** (Prioridad Alta)

Endpoints disponibles en API:
```
POST /products          - Crear producto
PUT /products/{id}      - Actualizar producto
DELETE /products/{id}   - Eliminar producto
```

**Casos de uso comunes**:
- ✏️ **Editar rápido**: Cambiar precio, stock, estado publicado
- 📸 **Gestionar imágenes**: Subir/eliminar fotos
- 📝 **Editar información**: Descripción, categoría, marca
- 🗑️ **Eliminar producto**: Soft delete

**Tareas**:
- [ ] Botón "Editar" en ProductDetailView
- [ ] Formulario modal para edición rápida (precio, stock, estado)
- [ ] Formulario completo para crear/editar producto
- [ ] Upload de imágenes
- [ ] Validaciones de formulario
- [ ] Confirmación para eliminar

---

### 2️⃣ **CRUD de Pedidos** (Prioridad Media)

Endpoints disponibles:
```
POST /orders           - Crear pedido (manual)
PUT /orders/{id}       - Actualizar pedido
```

**Casos de uso comunes**:
- 🔄 **Cambiar estado**: Pendiente → Pagado → Enviado → Entregado
- 📝 **Agregar notas**: Comentarios internos del pedido
- 📦 **Actualizar tracking**: Número de guía, courier

**Tareas**:
- [ ] Dropdown para cambiar estado en OrderDetailView
- [ ] Modal de confirmación para cambio de estado
- [ ] Campo de notas/comentarios
- [ ] Actualización de tracking
- [ ] Timeline de estados (histórico)

---

### 3️⃣ **CRUD de Clientes** (Prioridad Baja)

Endpoints disponibles:
```
POST /customers        - Crear cliente
PUT /customers/{id}    - Actualizar cliente
DELETE /customers/{id} - Eliminar cliente
```

**Tareas**:
- [ ] Botón "Nuevo cliente" en CustomersListView
- [ ] Formulario de creación de cliente
- [ ] Formulario de edición en CustomerDetailView
- [ ] Validación de email y teléfono
- [ ] Confirmación para eliminar

---

### 4️⃣ **Gestión de Catálogo** (Prioridad Media)

Endpoints disponibles:
```
GET /categories        - Listar categorías (✅ implementado)
POST /categories       - Crear categoría
PUT /categories/{id}   - Actualizar categoría
DELETE /categories/{id}- Eliminar categoría

GET /brands           - Listar marcas (✅ implementado)
POST /brands          - Crear marca
PUT /brands/{id}      - Actualizar marca
DELETE /brands/{id}   - Eliminar marca
```

**Casos de uso**:
- 📁 Crear nuevas categorías para organizar productos
- 🏷️ Agregar marcas nuevas
- ✏️ Editar/eliminar categorías y marcas existentes
- 🗂️ Ver listado completo de catálogo

**Tareas**:
- [ ] Vista de Categorías (CategoriesListView)
- [ ] Vista de Marcas (BrandsListView)
- [ ] Formularios de creación/edición
- [ ] Confirmación para eliminar
- [ ] Manejo de categorías con subcategorías (si aplica)

---

## 🎯 **Recomendación de Priorización**

### **Sprint 1** - Edición básica (Más impacto inmediato)
1. ✏️ **Edición rápida de productos**
   - Formulario modal para editar: precio, stock, estado publicado
   - Botón "Editar" en ProductDetailView
   - Validaciones básicas

2. 🔄 **Cambio de estado de pedidos**
   - Dropdown en OrderDetailView para cambiar estado
   - Confirmación antes de cambiar
   - Actualización en tiempo real

3. 🗂️ **Vistas de Catálogo**
   - Vista de categorías con CRUD completo
   - Vista de marcas con CRUD completo

---

### **Sprint 2** - Gestión completa
4. ➕ **Crear producto nuevo**
   - Formulario completo con todos los campos
   - Upload de imágenes
   - Asignación de categoría y marca

5. 📝 **Edición completa de productos**
   - Formulario con todos los campos
   - Gestión avanzada de imágenes
   - Campos de SEO (meta tags)

---

### **Sprint 3** - Funcionalidades avanzadas
6. 🗑️ **Eliminar productos y clientes**
   - Confirmación doble
   - Soft delete (preferible)

7. 📊 **Reportes y estadísticas avanzadas**
   - Exportación de datos
   - Gráficos adicionales
   - Filtros avanzados

---

## 📝 Notas Técnicas

### Seguridad
- ⚠️ Todos los endpoints de escritura (POST/PUT/DELETE) requieren validación de permisos en backend
- ✅ El frontend ya maneja el sistema de tokens correctamente
- ⚠️ Validar siempre en el cliente ANTES de enviar al servidor

### UX/UI
- Usar modales para acciones rápidas (editar precio, cambiar estado)
- Usar vistas completas para formularios extensos (crear producto)
- Confirmaciones obligatorias para acciones destructivas (eliminar)
- Feedback visual inmediato (toasts, loading states)

### Backend
- ✅ API en producción, funciona correctamente con app móvil
- ⚠️ NO modificar endpoints existentes sin validar con app móvil
- ✅ Todos los endpoints CRUD ya existen según el PRD

---

## 🔗 Referencias

- **PRD Completo**: `/PRD_BACKOFFICE_VUE3.md`
- **API Endpoints**: Líneas 59-113 del PRD
- **Estructura de datos**: Ver tipos en `src/types/`
- **App móvil (referencia)**: `/Users/carlosvidal/Developer/mitienda_app`

---

**Última actualización**: 9 de octubre de 2025
