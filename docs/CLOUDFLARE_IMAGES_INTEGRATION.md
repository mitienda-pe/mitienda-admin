# Integración de Cloudflare Images - Sistema Legacy CI3

## Estado Actual (2025-10-15)

### ✅ Lo que FUNCIONA
1. **Upload a Cloudflare**: Las imágenes se suben correctamente a Cloudflare Images
2. **Guardado de cloudflare_id**: Se guarda correctamente en la columna `tiendasimagenes.cloudflare_id`
3. **Commit funcional**: `309e32d91a` - "fix: Hardcodear credenciales y simplificar constructor"

### ❌ Lo que NO FUNCIONA
1. **CRÍTICO**: La vinculación automática a `productos_cloudflare_images` NO se ejecuta
2. **BLOQUEANTE**: Los logs DEBUG/INFO dejaron de aparecer después de las 11:50 AM
   - log_threshold está en 4
   - Código de debug está desplegado y verificado en servidor
   - Solo aparecen logs de ERROR
   - Esto impide cualquier debugging

## El Misterio Central

**Observación paradójica**: Las imágenes SE SUBEN a Cloudflare y el cloudflare_id SE GUARDA en la BD, pero:
- No hay logs que indiquen que el código se ejecutó
- Solo existe UNA llamada a `uploadImage()` en todo el código (línea 1089 de Tiendaimagen_model.php)
- A pesar de agregar múltiples logs debug, NINGUNO aparece en los archivos de log

**Esto sugiere**:
1. Existe otro proceso/código que sube imágenes que no hemos identificado
2. O los logs están siendo redirigidos/suprimidos de alguna manera
3. O hay un mecanismo de caché/proxy que está sirviendo código antiguo

## Evidencia de Imágenes de Prueba

Todas estas imágenes se subieron exitosamente y tienen cloudflare_id en la BD:

| Cloudflare ID | Timestamp | Producto | Estado Vinculación |
|--------------|-----------|----------|-------------------|
| 96b7e141-a35b-4f63-d0ea-fcf3f030f800 | 16:03:51 | ? | ✅ Vinculado manualmente |
| afbabb9a-a94b-43a7-b60e-c83b0d8d6300 | 16:14:55 | ? | ✅ Vinculado manualmente |
| e37597f2-3f30-4410-7203-75a8b9d69400 | 16:30:30 | ? | ✅ Vinculado manualmente |
| 95517e7a-d285-4520-416b-ff1d9aff1600 | 16:33:29 | ? | ✅ Vinculado manualmente |
| 508ef3be-d52c-45bc-83f8-2b1221783500 | 16:36:19 | ? | ✅ Vinculado manualmente |
| e91a7711-3739-4d91-aabf-338af6a8b100 | 16:45:29 | ? | ❌ No vinculado |
| f06fa3cf-9e34-4cfe-ab51-978801bc8000 | 16:55:57 | ? | ❌ No vinculado |
| 94b2b21f-12b5-420c-9c82-d71088317700 | 17:10:12 | 261001 | ❌ No vinculado |

## Arquitectura del Código

### Flujo de Upload de Imágenes

```
Controller: Tiendaimagen::procesarimagen()
    ↓
Model: Tiendaimagen_model::crearimagenesv2()
    ↓
    ├─→ subir_original_a_cloudflare()  [línea 1040-1080]
    │       ↓
    │   CloudflareImagesService::uploadImage()
    │       ↓
    │   Guarda resultado en $this->cloudflare_upload_result
    │
    ├─→ agregarImagen()  [línea 854-871]
    │       ↓
    │   INSERT tiendasimagenes (con cloudflare_id si existe)
    │       ↓
    │   Retorna tiendaimagen_id
    │
    └─→ agregarImagenProducto()  [línea 883-916]
            ↓
        INSERT productosimagenes (legacy)
            ↓
        vincular_cloudflare_con_producto()  [línea 1090-1138]
            ↓
        DEBERÍA insertar en productos_cloudflare_images
        PERO NO LO HACE (sin logs ni errores)
```

### Archivos Clave

#### 1. `/var/www/dev3.mitienda.host/application/libraries/CloudflareImagesService.php`
```php
class CloudflareImagesService {
    // NOTA: Credenciales hardcodeadas temporalmente para debug
    private $accountId = '2998d27925d94d6941e16e703022867d';
    private $apiToken = 'wg73vWKekhCgxk7LrCJvndtpVWomNSQjXhaDLMz_';

    public function uploadImage($filePath, $metadata = '') {
        // Upload via cURL a Cloudflare Images API
        // Retorna: array('id' => $imageId, 'url' => $imageUrl)
    }
}
```

**Estado**: ✅ Funcional
**Ubicación única de llamada**: `Tiendaimagen_model.php:1089`

#### 2. `/var/www/dev3.mitienda.host/application/models/Tiendaimagen_model.php`

**Función: subir_original_a_cloudflare()** (líneas 1040-1080)
```php
private function subir_original_a_cloudflare($source_nombre_imagen, $titulo, $nombreAleatorio) {
    // Verificaciones de archivo y library
    $CI = &get_instance();
    $CI->load->library('CloudflareImagesService');

    $resultado = $CI->cloudflareimagesservice->uploadImage($source_nombre_imagen, $titulo);

    // Guarda resultado en propiedades de la clase
    $this->cloudflare_upload_result = $resultado;
    $this->cloudflare_upload_hash = $nombreAleatorio;

    return $resultado;
}
```

**Función: agregarImagen()** (líneas 854-871)
```php
public function agregarImagen() {
    $data['tienda_id'] = $this->tiendaId;
    $data['tiendaimagen_nombre'] = $this->nombreAleatorio;
    $data['tiendaimagen_extension'] = $this->extension;
    $data['tiendaimagen_fechasubida'] = date('Y-m-d H:i:s');
    $data['tiendaimagen_titulo'] = $this->titulo;

    // Guarda cloudflare_id si existe
    if ($this->cloudflare_upload_result && isset($this->cloudflare_upload_result['id'])) {
        $data['cloudflare_id'] = $this->cloudflare_upload_result['id'];
    }

    $CI->db->insert('tiendasimagenes', $data);
    return $CI->db->insert_id();
}
```

**Estado**: ✅ Funcional - cloudflare_id se guarda correctamente

**Función: vincular_cloudflare_con_producto()** (líneas 1090-1138)
```php
private function vincular_cloudflare_con_producto($producto_id, $orden, $tiendaimagen_id) {
    $CI = &get_instance();

    // Verificar tabla existe
    if (!$CI->db->table_exists('productos_cloudflare_images')) {
        log_message('debug', 'Cloudflare: Table productos_cloudflare_images not found');
        return;
    }

    // Buscar cloudflare_id desde tiendasimagenes
    $tiendaimagen = $CI->db->select('cloudflare_id')
                           ->where('tiendaimagen_id', $tiendaimagen_id)
                           ->get('tiendasimagenes')
                           ->row();

    if (!$tiendaimagen || empty($tiendaimagen->cloudflare_id)) {
        log_message('debug', "Cloudflare: No cloudflare_id found for tiendaimagen_id {$tiendaimagen_id}");
        return;
    }

    $cloudflare_id = $tiendaimagen->cloudflare_id;
    $cloudflare_url = "https://imagedelivery.net/2998d27925d94d6941e16e703022867d/{$cloudflare_id}/public";

    // Verificar si ya existe
    $existe = $CI->db->where('producto_id', $producto_id)
                     ->where('cloudflare_id', $cloudflare_id)
                     ->get('productos_cloudflare_images')
                     ->num_rows();

    if ($existe > 0) {
        log_message('info', "Cloudflare: Image already linked to product {$producto_id}");
        return;
    }

    // Insertar en productos_cloudflare_images
    $data = array(
        'producto_id' => $producto_id,
        'cloudflare_id' => $cloudflare_id,
        'cloudflare_url' => $cloudflare_url,
        'orden' => $orden,
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s')
    );

    $CI->db->insert('productos_cloudflare_images', $data);

    log_message('info', "Cloudflare: Image linked to product {$producto_id}. Cloudflare ID: {$cloudflare_id}");
}
```

**Estado**: ❌ NO FUNCIONAL - Se llama desde agregarImagenProducto() línea 904 pero no ejecuta (sin logs)

**Llamada**:
```php
// En agregarImagenProducto() línea 904
$this->vincular_cloudflare_con_producto($producto_id, $orden, $tiendaimagen_id);
```

#### 3. `/var/www/dev3.mitienda.host/application/controllers/administrador/Tiendaimagen.php`

**Función: procesarimagen()**
```php
function procesarimagen () {
    ini_set('memory_limit', '64M');
    $this->load->model('tiendaimagen_model');
    $resultado = $this->tiendaimagen_model->crearimagenesv2();
    echo $resultado;
}
```

**Estado**: ✅ Entry point funcional

## Estructura de Base de Datos

### Tabla: `tiendasimagenes`
Tabla principal de galería de imágenes de la tienda.

```sql
CREATE TABLE tiendasimagenes (
    tiendaimagen_id INT PRIMARY KEY AUTO_INCREMENT,
    tienda_id INT,
    tiendaimagen_nombre VARCHAR(255),
    tiendaimagen_extension VARCHAR(10),
    tiendaimagen_fechasubida DATETIME,
    tiendaimagen_titulo VARCHAR(255),
    cloudflare_id VARCHAR(255),  -- NUEVA COLUMNA
    -- ... otros campos
);
```

**Estado**: ✅ Columna cloudflare_id agregada y funcionando

### Tabla: `productos_cloudflare_images`
Tabla para vincular productos con imágenes de Cloudflare.

```sql
CREATE TABLE productos_cloudflare_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT NOT NULL,
    cloudflare_id VARCHAR(255) NOT NULL,
    cloudflare_url VARCHAR(512),
    orden INT DEFAULT 0,
    created_at DATETIME,
    updated_at DATETIME,
    UNIQUE KEY unique_producto_cloudflare (producto_id, cloudflare_id)
);
```

**Estado**: ✅ Tabla existe pero NO se llena automáticamente

### Tabla: `productosimagenes` (legacy)
Tabla anterior para vincular productos con imágenes en S3.

```sql
CREATE TABLE productosimagenes (
    productoimagen_id INT PRIMARY KEY AUTO_INCREMENT,
    producto_id INT,
    tiendaimagen_id INT,
    productoimagen_orden INT
);
```

**Estado**: ✅ Sigue funcionando con S3

## Configuración del Servidor

### Servidor
- **Host**: dev3.mitienda.host (132.145.154.192)
- **Usuario SSH**: opc
- **Webroot**: `/var/www/dev3.mitienda.host/`
- **Apache con OPcache habilitado**

### Base de Datos
- **Host**: 129.213.75.80
- **Database**: mitiendape
- **Usuario**: mitiendape
- **Acceso**: Desde dev3 server o desde API CI4

### Git
- **Remote**: `devpanel3`
- **Repo**: `/var/repo/dev3.mitienda.host.git`
- **Branch**: master
- **Commit actual**: `309e32d91a` - "fix: Hardcodear credenciales y simplificar constructor"

### Cloudflare Images
- **Account ID**: `2998d27925d94d6941e16e703022867d`
- **API Token**: `wg73vWKekhCgxk7LrCJvndtpVWomNSQjXhaDLMz_`
- **URL Base**: `https://imagedelivery.net/2998d27925d94d6941e16e703022867d/{cloudflare_id}/public`

## Logs y Debugging

### Problema con Logs
- **Archivo de logs**: `/var/www/dev3.mitienda.host/application/logs/log-2025-10-15.php`
- **Último INFO log**: 11:50 AM
- **Después de 11:50**: Solo aparecen logs de ERROR
- **log_threshold**: Probado con valores 0, 2, 4 (sin éxito)

### Logs Agregados que NO Aparecen
Se agregaron múltiples `log_message('debug', ...)` y `log_message('info', ...)` en:
- `subir_original_a_cloudflare()`
- `vincular_cloudflare_con_producto()`
- `agregarImagenProducto()`

**Ninguno de estos logs apareció en los archivos**, a pesar de:
- Verificar que el código está desplegado en servidor
- Reiniciar Apache
- Verificar permisos de archivos de log

## Solución Manual Temporal

Se creó un script PHP para vincular manualmente las 5 primeras imágenes:

```php
<?php
$link = mysqli_connect('129.213.75.80', 'mitiendape', 'password', 'mitiendape');

$imagenes_pendientes = [
    '96b7e141-a35b-4f63-d0ea-fcf3f030f800',
    'afbabb9a-a94b-43a7-b60e-c83b0d8d6300',
    'e37597f2-3f30-4410-7203-75a8b9d69400',
    '95517e7a-d285-4520-416b-ff1d9aff1600',
    '508ef3be-d52c-45bc-83f8-2b1221783500'
];

foreach ($imagenes_pendientes as $cf_id) {
    // Buscar tiendaimagen_id y producto_id
    // INSERT en productos_cloudflare_images
}
```

Este script confirmó que la estructura de BD está correcta.

## Próximos Pasos para Mañana

### 1. Investigar el Misterio de los Logs (CRÍTICO)
**Hipótesis a probar**:
- [ ] Verificar si existe otro archivo de configuración de logs que esté suprimiendo DEBUG/INFO
- [ ] Revisar configuración de Apache/PHP para ver si hay redirección de logs
- [ ] Verificar si hay un cron o proceso que limpia logs automáticamente
- [ ] Buscar en toda la aplicación si hay código que modifique `log_threshold` dinámicamente
- [ ] Revisar si hay middleware o hooks de CI3 que filtren logs

**Comando útil**:
```bash
# Buscar todas las menciones a log_threshold
grep -r "log_threshold" /var/www/dev3.mitienda.host/application/

# Buscar configuraciones de logging en php.ini
php -i | grep log
```

### 2. Rastrear el Código de Upload Real
**Hipótesis**: Puede que exista OTRO lugar donde se suben imágenes que no hemos identificado.

**Acciones**:
- [ ] Buscar TODAS las referencias a Cloudflare en el código:
  ```bash
  grep -r "cloudflare" /var/www/dev3.mitienda.host/application/ --include="*.php"
  ```
- [ ] Buscar llamadas a APIs HTTP que puedan ser Cloudflare:
  ```bash
  grep -r "curl_init\|file_get_contents.*http" /var/www/dev3.mitienda.host/application/ --include="*.php"
  ```
- [ ] Revisar si hay algún hook o evento de CI3 que se ejecute después de subir imágenes

### 3. Debugging Alternativo (Sin Logs)
Ya que los logs no funcionan, usar métodos alternativos:

**A. File-based debugging**:
```php
// En vincular_cloudflare_con_producto(), agregar:
file_put_contents('/tmp/cloudflare_debug.txt',
    date('Y-m-d H:i:s') . " - producto_id: $producto_id, tiendaimagen_id: $tiendaimagen_id\n",
    FILE_APPEND
);
```

**B. Database-based debugging**:
```sql
-- Crear tabla de debug
CREATE TABLE debug_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    timestamp DATETIME,
    function_name VARCHAR(100),
    message TEXT
);
```

```php
// En el código:
$CI->db->insert('debug_log', [
    'timestamp' => date('Y-m-d H:i:s'),
    'function_name' => 'vincular_cloudflare_con_producto',
    'message' => "Called with producto_id: $producto_id"
]);
```

**C. Error log de PHP**:
```php
error_log("CLOUDFLARE DEBUG: vincular called with producto_id: $producto_id");
// Ver: /var/log/php-fpm/error.log o similar
```

### 4. Verificar Ejecución de vincular_cloudflare_con_producto()

**Hipótesis**: La función puede estar siendo llamada pero retornando temprano por alguna validación.

**Acciones**:
- [ ] Agregar `file_put_contents('/tmp/cf_debug.txt', 'START\n', FILE_APPEND);` al inicio de la función
- [ ] Agregar similar después de cada `if` y `return` para ver dónde sale
- [ ] Verificar que `productos_cloudflare_images` existe:
  ```sql
  SHOW TABLES LIKE 'productos_cloudflare_images';
  DESC productos_cloudflare_images;
  ```

### 5. Probar con Error Forzado

Agregar código que DEBE fallar para confirmar que el código se ejecuta:

```php
private function vincular_cloudflare_con_producto($producto_id, $orden, $tiendaimagen_id) {
    // Esto DEBE generar un error si la función se ejecuta
    trigger_error("CLOUDFLARE DEBUG: Function called with producto_id=$producto_id", E_USER_WARNING);

    // ... resto del código
}
```

Si no aparece el error, confirmamos que la función NO se está ejecutando.

### 6. Revisar Commit Funcional Original

**IMPORTANTE**: Las imágenes funcionaban esta mañana a las 11:18, 11:32, 11:49.

**Acciones**:
- [ ] Revisar git log entre 11:00 y 12:00 para ver qué commits se hicieron
- [ ] Hacer `git diff` entre el último commit funcional y el actual
- [ ] Verificar si hubo cambios en el servidor fuera de git (archivos modificados directamente)

```bash
# Ver commits del día
git log --since="2025-10-15 11:00" --until="2025-10-15 12:00" --oneline

# Comparar con commit actual
git diff 309e32d91a HEAD

# Ver archivos modificados en servidor vs git
cd /var/www/dev3.mitienda.host
find application -name "*.php" -newer .git/FETCH_HEAD
```

## Preguntas Sin Responder

1. **¿Por qué los logs DEBUG/INFO dejaron de funcionar después de las 11:50 AM?**
   - No hay cambios en config.php
   - No hay errores de permisos
   - ERROR logs sí funcionan

2. **¿Cómo se están subiendo las imágenes a Cloudflare si no hay logs de ejecución?**
   - Solo hay UNA llamada a uploadImage() en todo el código
   - No aparecen logs de esa llamada
   - Pero las imágenes SÍ se suben

3. **¿Por qué vincular_cloudflare_con_producto() no ejecuta?**
   - Se llama desde agregarImagenProducto() línea 904
   - La tabla productos_cloudflare_images existe
   - No hay errores ni logs

4. **¿Hay algún proceso o cron ejecutándose en paralelo?**
   - Verificar con: `crontab -l` en servidor
   - Verificar procesos PHP: `ps aux | grep php`

## Recursos Útiles

### Comandos SSH
```bash
# Conectar al servidor
ssh opc@132.145.154.192

# Ver logs en tiempo real
tail -f /var/www/dev3.mitienda.host/application/logs/log-2025-10-15.php

# Ver últimas 100 líneas de logs
tail -n 100 /var/www/dev3.mitienda.host/application/logs/log-2025-10-15.php

# Verificar código desplegado
cat /var/www/dev3.mitienda.host/application/models/Tiendaimagen_model.php | grep -A 5 "vincular_cloudflare"

# Reiniciar Apache
sudo systemctl restart httpd
```

### Queries SQL Útiles
```sql
-- Ver imágenes con cloudflare_id
SELECT tiendaimagen_id, tiendaimagen_nombre, cloudflare_id, tiendaimagen_fechasubida
FROM tiendasimagenes
WHERE cloudflare_id IS NOT NULL
ORDER BY tiendaimagen_fechasubida DESC
LIMIT 20;

-- Ver productos vinculados en Cloudflare
SELECT * FROM productos_cloudflare_images;

-- Ver imágenes de un producto específico
SELECT p.*, t.cloudflare_id, t.tiendaimagen_nombre
FROM productosimagenes p
LEFT JOIN tiendasimagenes t ON p.tiendaimagen_id = t.tiendaimagen_id
WHERE p.producto_id = 261001;

-- Encontrar imágenes con cloudflare_id pero sin vincular
SELECT t.tiendaimagen_id, t.cloudflare_id, p.producto_id
FROM tiendasimagenes t
INNER JOIN productosimagenes p ON t.tiendaimagen_id = p.tiendaimagen_id
LEFT JOIN productos_cloudflare_images pcf ON p.producto_id = pcf.producto_id AND t.cloudflare_id = pcf.cloudflare_id
WHERE t.cloudflare_id IS NOT NULL
AND pcf.id IS NULL;
```

### API de Cloudflare
```bash
# Verificar imagen existe
curl -H "Authorization: Bearer wg73vWKekhCgxk7LrCJvndtpVWomNSQjXhaDLMz_" \
  "https://api.cloudflare.com/client/v4/accounts/2998d27925d94d6941e16e703022867d/images/v1/96b7e141-a35b-4f63-d0ea-fcf3f030f800"

# Listar últimas imágenes
curl -H "Authorization: Bearer wg73vWKekhCgxk7LrCJvndtpVWomNSQjXhaDLMz_" \
  "https://api.cloudflare.com/client/v4/accounts/2998d27925d94d6941e16e703022867d/images/v1?per_page=50"
```

## Notas Importantes

1. **NUNCA hacer cambios directos en el servidor** - TODO debe ir por git commit
2. **Git remote correcto**: `devpanel3` (NO `dev3`)
3. **Las credenciales están hardcodeadas** en CloudflareImagesService.php - esto es TEMPORAL
4. **5 imágenes ya vinculadas manualmente** - se puede usar como referencia
5. **El sistema legacy debe ser compatible con PHP 5.6** - cuidado con sintaxis moderna

## Contacto y Referencias

- **Panel Legacy**: https://dev3.panel.mitienda.host/administrador/producto/edicion/{producto_id}
- **API CI4**: Puede acceder a la misma base de datos
- **Documentación CI3**: https://codeigniter.com/userguide3/

---

**Última actualización**: 2025-10-15 17:30
**Commit funcional**: 309e32d91a
**Objetivo**: Lograr vinculación automática de imágenes a productos_cloudflare_images
