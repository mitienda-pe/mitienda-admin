# Módulo de Etiquetas de Productos (Product Tags/Ribbons)

Sistema completo para gestionar etiquetas o ribbons en productos, similar a Smart Product Tags for WooCommerce.

## 📋 Características

- ✅ **CRUD completo de etiquetas** desde el backoffice Vue 3
- ✅ **Dos tipos de ribbons**: Texto o Imagen
- ✅ **Posicionamiento configurable**: Superior izquierda/derecha, Inferior izquierda/derecha, Centro
- ✅ **Colores personalizables**: Color de fondo y texto para ribbons de texto
- ✅ **Asignación múltiple**: Múltiples etiquetas por producto
- ✅ **Prioridad de visualización**: Control del orden de ribbons cuando hay múltiples
- ✅ **Programación temporal**: Fechas de inicio y fin para cada asignación
- ✅ **Gestión desde detalle de producto**: Componente integrado en ProductDetailView

## 🗄️ Estructura de Base de Datos

### Tabla: `product_tags`
Almacena las etiquetas/ribbons configurables:

```sql
- tag_id (PK)
- tienda_id (FK a tiendas)
- tag_nombre (VARCHAR) - Nombre descriptivo
- tag_tipo (ENUM: texto, imagen)
- tag_texto (VARCHAR) - Texto del ribbon (solo tipo texto)
- tag_imagen_url (TEXT) - URL de imagen (solo tipo imagen)
- tag_posicion (ENUM: top-left, top-right, bottom-left, bottom-right, center)
- tag_color_fondo (VARCHAR) - Color hexadecimal
- tag_color_texto (VARCHAR) - Color hexadecimal
- tag_activo (TINYINT)
- tag_orden (INT) - Orden de visualización
- tag_fechacreacion, tag_fechamodificacion
```

### Tabla: `product_tag_assignments`
Relaciona productos con etiquetas:

```sql
- assignment_id (PK)
- producto_id (FK a productos)
- tag_id (FK a product_tags)
- assignment_fecha_inicio (DATETIME) - Opcional
- assignment_fecha_fin (DATETIME) - Opcional
- assignment_prioridad (INT) - Mayor = más prioridad
- assignment_fechacreacion
```

## 🚀 Instalación

### 1. Crear las tablas en la base de datos

Ejecuta el script SQL ubicado en:
```
/Users/carlosvidal/www/mitienda/mitienda-api-ci4/database_setup_product_tags.sql
```

Puedes ejecutarlo via phpMyAdmin, MySQL Workbench o línea de comandos:
```bash
mysql -u usuario -p nombre_base_datos < database_setup_product_tags.sql
```

### 2. Verificar archivos creados

#### Backend (API CI4):
- ✅ Migraciones en `app/Database/Migrations/`
- ✅ Modelos: `ProductTagModel.php`, `ProductTagAssignmentModel.php`
- ✅ Controlador: `app/Controllers/V1/ProductTag.php`
- ✅ Rutas configuradas en `app/Config/Routes.php`

#### Frontend (Vue 3):
- ✅ Tipos: `src/types/product-tag.types.ts`
- ✅ API Client: `src/api/product-tags.api.ts`
- ✅ Store: `src/stores/product-tags.store.ts`
- ✅ Vista principal: `src/views/catalog/ProductTagsListView.vue`
- ✅ Componente de asignación: `src/components/ProductTagAssignment.vue`
- ✅ Rutas configuradas en `src/router/index.ts`

## 📡 Endpoints de la API

Todos los endpoints requieren autenticación Bearer token.

### Gestión de Etiquetas (CRUD)

```
GET    /api/v1/product-tags           - Listar todas las etiquetas
GET    /api/v1/product-tags/:id       - Obtener una etiqueta
POST   /api/v1/product-tags           - Crear etiqueta
PUT    /api/v1/product-tags/:id       - Actualizar etiqueta
DELETE /api/v1/product-tags/:id       - Eliminar etiqueta
```

### Asignación a Productos

```
GET    /api/v1/products/:id/tags              - Obtener tags de un producto
POST   /api/v1/products/:id/tags              - Asignar tags a un producto
DELETE /api/v1/products/:id/tags/:tag_id     - Remover tag de un producto
```

## 🎨 Uso en el Backoffice Vue

### 1. Acceder a la gestión de etiquetas

Navega a: **Catálogo → Etiquetas de Productos**
URL: `http://tu-backoffice/catalog/product-tags`

### 2. Crear una etiqueta

1. Clic en "Nueva Etiqueta"
2. Completa el formulario:
   - **Nombre**: Identificador interno
   - **Tipo**: Texto o Imagen
   - **Texto/Imagen**: Según el tipo seleccionado
   - **Posición**: Dónde aparecerá en la imagen del producto
   - **Colores**: (solo para tipo texto) Fondo y texto
   - **Estado**: Activo/Inactivo
   - **Orden**: Número para ordenar cuando hay múltiples tags

### 3. Asignar etiquetas a productos

Desde el detalle de cualquier producto:
1. Busca la sección "Etiquetas (Ribbons)"
2. Clic en "Asignar Etiquetas"
3. Selecciona las etiquetas que deseas asignar
4. (Opcional) Configura:
   - **Prioridad**: Si hay múltiples tags, mayor número = más visible
   - **Fecha inicio**: Cuándo empezar a mostrar el tag
   - **Fecha fin**: Cuándo dejar de mostrar el tag

## 🎯 Ejemplos de Uso

### Ejemplo 1: Tag "Nuevo" para productos recientes

```typescript
{
  nombre: "Nuevo",
  tipo: "texto",
  texto: "NUEVO",
  posicion: "top-right",
  color_fondo: "#3b82f6",
  color_texto: "#ffffff",
  activo: true,
  orden: 0
}
```

### Ejemplo 2: Tag "Oferta" con temporalidad

```typescript
// Crear el tag
{
  nombre: "Oferta Flash",
  tipo: "texto",
  texto: "-50%",
  posicion: "top-left",
  color_fondo: "#ef4444",
  color_texto: "#ffffff",
  activo: true,
  orden: 10
}

// Asignarlo al producto con fechas
{
  tag_id: 2,
  prioridad: 100,
  fecha_inicio: "2025-12-01 00:00:00",
  fecha_fin: "2025-12-25 23:59:59"
}
```

### Ejemplo 3: Tag con imagen personalizada

```typescript
{
  nombre: "Black Friday",
  tipo: "imagen",
  imagen_url: "https://cdn.mitienda.com/ribbons/black-friday.png",
  posicion: "top-right",
  activo: true,
  orden: 0
}
```

## 🔌 Integración en el Frontend Legacy

Para mostrar los ribbons en la tienda (sistema PHP 5.6 legacy), necesitarás:

### 1. Obtener los tags de un producto

```php
// En tu controlador o helper de productos
function getProductTags($producto_id) {
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => "https://api2.mitienda.pe/api/v1/products/{$producto_id}/tags",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            "Authorization: Bearer " . $_SESSION['api_token']
        ]
    ]);

    $response = curl_exec($curl);
    curl_close($curl);

    $data = json_decode($response, true);
    return $data['data'] ?? [];
}
```

### 2. Renderizar los ribbons en HTML/CSS

```php
<!-- En tu vista de producto -->
<div class="product-image-container" style="position: relative;">
    <img src="<?= $producto['imagen'] ?>" alt="<?= $producto['nombre'] ?>">

    <?php foreach (getProductTags($producto['id']) as $tag): ?>
        <?php
        $position_styles = [
            'top-left' => 'top: 10px; left: 10px;',
            'top-right' => 'top: 10px; right: 10px;',
            'bottom-left' => 'bottom: 10px; left: 10px;',
            'bottom-right' => 'bottom: 10px; right: 10px;',
            'center' => 'top: 50%; left: 50%; transform: translate(-50%, -50%);'
        ];
        $style = $position_styles[$tag['tag']['posicion']] ?? 'top: 10px; right: 10px;';
        ?>

        <?php if ($tag['tag']['tipo'] === 'texto'): ?>
            <div class="product-ribbon" style="
                position: absolute;
                <?= $style ?>
                background-color: <?= $tag['tag']['color_fondo'] ?>;
                color: <?= $tag['tag']['color_texto'] ?>;
                padding: 5px 10px;
                border-radius: 4px;
                font-weight: bold;
                font-size: 12px;
                z-index: 10;
            ">
                <?= htmlspecialchars($tag['tag']['texto']) ?>
            </div>
        <?php elseif ($tag['tag']['tipo'] === 'imagen' && !empty($tag['tag']['imagen_url'])): ?>
            <img src="<?= $tag['tag']['imagen_url'] ?>"
                 alt="<?= $tag['tag']['nombre'] ?>"
                 style="position: absolute; <?= $style ?> max-width: 80px; z-index: 10;">
        <?php endif; ?>
    <?php endforeach; ?>
</div>
```

### 3. Verificar fechas de visualización

```php
function isTagActive($tag) {
    $now = time();
    $start = !empty($tag['fecha_inicio']) ? strtotime($tag['fecha_inicio']) : 0;
    $end = !empty($tag['fecha_fin']) ? strtotime($tag['fecha_fin']) : PHP_INT_MAX;

    return $now >= $start && $now <= $end;
}

// Filtrar solo tags activos
$activeTags = array_filter(getProductTags($producto_id), 'isTagActive');
```

## 🎨 Personalización de Estilos

Puedes personalizar los ribbons con CSS adicional:

```css
.product-ribbon {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    text-transform: uppercase;
    letter-spacing: 1px;
    animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
}

/* Ribbon con forma de cinta */
.product-ribbon.ribbon-style {
    padding: 8px 15px;
    position: relative;
}

.product-ribbon.ribbon-style::before,
.product-ribbon.ribbon-style::after {
    content: '';
    position: absolute;
    border-style: solid;
}
```

## 📊 Casos de Uso Recomendados

1. **Productos Nuevos**: Tag "NUEVO" con fecha de fin 30 días después de creación
2. **Ofertas Temporales**: Tag con fechas específicas y alta prioridad
3. **Stock Limitado**: Tag "ÚLTIMAS UNIDADES" cuando stock < 5
4. **Envío Gratis**: Tag visual para productos con envío gratuito
5. **Mejor Vendido**: Tag para productos destacados o más vendidos
6. **Descuentos**: Tag mostrando porcentaje de descuento
7. **Exclusivo Online**: Tag para productos solo disponibles online

## 🔧 Mantenimiento

### Limpiar asignaciones expiradas

```sql
-- Eliminar asignaciones que ya pasaron su fecha de fin
DELETE FROM product_tag_assignments
WHERE assignment_fecha_fin IS NOT NULL
  AND assignment_fecha_fin < NOW();
```

### Ver estadísticas de uso

```sql
-- Tags más utilizados
SELECT pt.tag_nombre, COUNT(pta.assignment_id) as total_asignaciones
FROM product_tags pt
LEFT JOIN product_tag_assignments pta ON pt.tag_id = pta.tag_id
GROUP BY pt.tag_id
ORDER BY total_asignaciones DESC;
```

## 🐛 Troubleshooting

### Las etiquetas no aparecen en el frontend
1. Verifica que el tag esté activo (`tag_activo = 1`)
2. Verifica las fechas de inicio/fin de la asignación
3. Verifica que el API token tenga permisos correctos

### Error al crear etiqueta
1. Verifica que el nombre no esté vacío
2. Para tipo "texto", el campo `texto` es obligatorio
3. Para tipo "imagen", el campo `imagen_url` es obligatorio

### El componente no carga en ProductDetailView
1. Verifica que el import esté correcto
2. Verifica que las rutas API estén configuradas
3. Revisa la consola del navegador para errores

## 📝 Próximas Mejoras

- [ ] Upload directo de imágenes para ribbons (integrar con Cloudflare Images)
- [ ] Templates prediseñados de ribbons
- [ ] Asignación masiva de tags a múltiples productos
- [ ] Preview en tiempo real desde el backoffice
- [ ] Reglas automáticas (ej: auto-asignar "NUEVO" a productos < 30 días)
- [ ] Estadísticas de conversión por ribbon
- [ ] A/B testing de diferentes ribbons

## 🤝 Soporte

Para problemas o mejoras, contacta al equipo de desarrollo.

---

**Versión**: 1.0.0
**Fecha**: Octubre 2025
**Autor**: Equipo Mitienda
