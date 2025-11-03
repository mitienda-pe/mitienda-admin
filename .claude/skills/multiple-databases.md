# Múltiples Bases de Datos en el Proyecto

## 🗄️ Configuración de Bases de Datos

Este proyecto tiene **2 bases de datos separadas**:

### 1. Base de Datos `default` (SOLO para logs)
```php
// app/Config/Database.php
$default = [
    'DSN'      => '',
    'hostname' => 'localhost',
    'username' => 'root',
    'password' => '',
    'database' => 'mitienda_api_logs',  // ← SOLO LOGS
    'DBDriver' => 'MySQLi',
    // ...
];
```

**Tablas en esta DB:**
- `logs` - Logs de la aplicación
- `api_logs` - Logs de peticiones API
- Posiblemente otras tablas de auditoría

**NO TIENE:**
- ❌ `productos`
- ❌ `tiendas`
- ❌ `usuarios`
- ❌ `tiendasventas`
- ❌ Ninguna tabla de negocio

### 2. Base de Datos `mitienda` (Base de datos PRINCIPAL)
```php
// app/Config/Database.php
$mitienda = [
    'DSN'      => '',
    'hostname' => 'localhost',
    'username' => 'root',
    'password' => '',
    'database' => 'mitienda',  // ← BASE DE DATOS PRINCIPAL
    'DBDriver' => 'MySQLi',
    // ...
];
```

**Contiene TODAS las tablas del negocio:**
- ✅ `productos`
- ✅ `tiendas`
- ✅ `usuarios`
- ✅ `administradores`
- ✅ `tiendasventas`
- ✅ `tiendasclientes`
- ✅ `tiendascategorias`
- ✅ Y todas las demás tablas...

## ⚠️ ERROR COMÚN: "La tabla no existe"

**Muchas veces me dices cosas como "la tabla no existe", pero es porque estás buscando en la base de datos equivocada.**

### Ejemplo del error:

```bash
# Consultando en la DB equivocada
mysql -u root -p
> USE mitienda_api_logs;  # ← DB de logs (equivocada)
> SELECT * FROM productos;
ERROR 1146 (42S02): Table 'mitienda_api_logs.productos' doesn't exist
```

```bash
# DB correcta
mysql -u root -p
> USE mitienda;  # ← DB principal (correcta)
> SELECT * FROM productos;
# ✅ Funciona
```

## ✅ Cómo Usar las Bases de Datos en Código

### Modelos - Especificar DBGroup

**Todos los modelos de negocio deben usar `$DBGroup = 'mitienda'`:**

```php
<?php
namespace App\Models;

use CodeIgniter\Model;

class ProductModel extends Model
{
    protected $table = 'productos';
    protected $primaryKey = 'producto_id';
    protected $DBGroup = 'mitienda';  // ← IMPORTANTE
    // ...
}
```

**Modelo de logs usa `default`:**
```php
class LogModel extends Model
{
    protected $table = 'logs';
    protected $DBGroup = 'default';  // ← Para logs
}
```

### Conexión Manual a la DB Correcta

```php
// Conectar a DB principal (mitienda)
$db = \Config\Database::connect('mitienda');
$query = $db->query('SELECT * FROM productos WHERE tienda_id = ?', [$tiendaId]);
$productos = $query->getResultArray();

// Conectar a DB de logs (default)
$logDb = \Config\Database::connect('default');
$logDb->query('INSERT INTO logs (message) VALUES (?)', ['Log message']);
```

### Query Builder

```php
// Opción 1: Usar el modelo (ya tiene DBGroup configurado)
$productModel = new ProductModel();
$products = $productModel->where('tienda_id', $tiendaId)->findAll();

// Opción 2: Query builder manual
$db = \Config\Database::connect('mitienda');
$builder = $db->table('productos');
$products = $builder->where('tienda_id', $tiendaId)->get()->getResultArray();
```

## 🔍 Verificar en Qué DB Estás

### Desde código (debugging):

```php
// Ver qué DB usa un modelo
$model = new ProductModel();
echo $model->DBGroup;  // Debe ser 'mitienda'

// Ver nombre de la DB actual
$db = \Config\Database::connect('mitienda');
echo $db->database;  // 'mitienda'
```

### Desde MySQL CLI:

```bash
# Listar todas las bases de datos
mysql -u root -p -e "SHOW DATABASES;"

# Ver qué DB estás usando
mysql -u root -p
> SELECT DATABASE();
```

### Desde phpMyAdmin:
- Base de datos en el menú lateral izquierdo
- Verificar que estás en "mitienda" y no en "mitienda_api_logs"

## 📋 Lista de Modelos por Base de Datos

### Modelos que usan `mitienda` (mayoría):
- `ProductModel` - productos
- `OrderModel` - tiendasventas
- `CustomerModel` - tiendasclientes
- `CategoryModel` - tiendascategorias
- `BrandModel` - tiendasmarcas
- `AuthModel` - usuarios, administradores
- `TiendaModel` - tiendas
- Todos los demás modelos de negocio...

### Modelos que usan `default` (pocos):
- `LogModel` - logs
- `ApiLogModel` - api_logs (si existe)

## 🚨 Checklist Antes de Decir "La tabla no existe"

Cuando encuentres un error "Table doesn't exist":

- [ ] ¿Verificaste en qué base de datos estás consultando?
  - `mysql> SELECT DATABASE();`

- [ ] ¿Estás usando la DB `mitienda` para tablas de negocio?
  - Para productos, tiendas, usuarios → `USE mitienda;`

- [ ] ¿El modelo tiene `$DBGroup = 'mitienda'` configurado?
  - Revisar el modelo correspondiente

- [ ] ¿Existe la tabla en la DB correcta?
  - `mysql> SHOW TABLES LIKE 'productos';`

- [ ] ¿El nombre de la tabla es correcto?
  - Verificar en [database/scripts/Dump20251011.sql](../../../database/scripts/Dump20251011.sql)

## 🛠️ Comandos Útiles para Debugging

### Ver todas las tablas en cada DB:

```bash
# Ver tablas en mitienda (DB principal)
mysql -u root -p mitienda -e "SHOW TABLES;" | head -20

# Ver tablas en default (logs)
mysql -u root -p mitienda_api_logs -e "SHOW TABLES;"
```

### Buscar una tabla en todas las DBs:

```bash
# Buscar tabla 'productos'
mysql -u root -p -e "
SELECT TABLE_SCHEMA, TABLE_NAME
FROM information_schema.TABLES
WHERE TABLE_NAME = 'productos';
"
# Resultado debe mostrar: mitienda | productos
```

### Ver estructura de una tabla:

```bash
# En la DB correcta
mysql -u root -p mitienda -e "DESCRIBE productos;" | head -20
```

## 💡 Por Qué Tenemos 2 Bases de Datos

### Separación de Responsabilidades:
- **`mitienda`**: Datos del negocio (productos, ventas, clientes)
- **`default`**: Logs, auditoría, métricas (no afecta el negocio)

### Beneficios:
1. **Performance**: Logs no afectan consultas de negocio
2. **Backup**: Podemos hacer backup de `mitienda` sin incluir logs gigantes
3. **Limpieza**: Podemos limpiar logs viejos sin tocar datos importantes
4. **Seguridad**: Permisos diferentes para cada DB

## 🎯 Ejemplos Prácticos

### ❌ INCORRECTO:
```php
// Buscar productos en DB de logs
$db = \Config\Database::connect('default');
$query = $db->query('SELECT * FROM productos');  // ❌ NO EXISTE
```

### ✅ CORRECTO:
```php
// Buscar productos en DB principal
$db = \Config\Database::connect('mitienda');
$query = $db->query('SELECT * FROM productos WHERE tienda_id = ?', [$tiendaId]);
```

### ❌ INCORRECTO:
```bash
# Verificar tabla en DB equivocada
mysql -u root -p
> USE mitienda_api_logs;
> SHOW TABLES LIKE 'productos';
Empty set  # ← "No existe" pero en realidad está en otra DB
```

### ✅ CORRECTO:
```bash
# Verificar en DB correcta
mysql -u root -p
> USE mitienda;
> SHOW TABLES LIKE 'productos';
+---------------------------+
| Tables_in_mitienda        |
+---------------------------+
| productos                 |
+---------------------------+
```

## 🎯 Resumen

**REGLA DE ORO:**
- 🗄️ **`default` (mitienda_api_logs)** → SOLO logs
- 🗄️ **`mitienda`** → TODO lo demás (productos, tiendas, usuarios, ventas, etc.)

**Antes de decir "la tabla no existe":**
1. Verificar que estoy en la DB `mitienda`
2. Verificar que el modelo tiene `$DBGroup = 'mitienda'`
3. Listar tablas con `SHOW TABLES;` para confirmar

**TODAS las tablas de negocio están en `mitienda`, no en `default`.**
