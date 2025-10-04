# ✅ CORS Configurado en el Backend

## 🔧 Solución Implementada

Se ha configurado **CORS directamente en el backend** (API CodeIgniter 4) para permitir peticiones desde el desarrollo local del backoffice.

### 📋 Cambios Realizados en el Backend

#### 1. Configuración CORS ([app/Config/Cors.php](../mitienda-api-ci4/app/Config/Cors.php))

```php
public array $default = [
    'allowedOrigins' => [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://192.168.3.118:3000',
        'http://192.168.3.118:3001',
        'http://192.168.3.118:3002',
    ],
    'supportsCredentials' => true,
    'allowedHeaders' => [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin'
    ],
    'exposedHeaders' => ['Authorization'],
    'allowedMethods' => [
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'OPTIONS',
        'PATCH'
    ],
    'maxAge' => 7200,
];
```

#### 2. Filtro CORS Habilitado Globalmente ([app/Config/Filters.php](../mitienda-api-ci4/app/Config/Filters.php))

```php
public array $globals = [
    'before' => [
        'cors', // ← Habilitado para todas las peticiones
    ],
    'after' => [],
];
```

### 📝 Configuración del Frontend

#### `.env.development`
```env
# Usar URL completa de la API
VITE_API_BASE_URL=https://api.mitienda.pe/api/v1
```

Ya **NO** necesitamos usar el proxy de Vite porque el backend acepta peticiones desde los orígenes locales.

## 🎯 Orígenes Permitidos

El backend ahora acepta peticiones desde:
- ✅ `http://localhost:3000`
- ✅ `http://localhost:3001`
- ✅ `http://localhost:3002`
- ✅ `http://192.168.3.118:3000`
- ✅ `http://192.168.3.118:3001`
- ✅ `http://192.168.3.118:3002`

## 🚀 Cómo Probar

1. **Asegúrate de que el backend esté corriendo**:
```bash
# Verifica que la API esté accesible
curl https://api.mitienda.pe/api/v1/auth/test
```

2. **Inicia el backoffice**:
```bash
npm run dev
```

3. **Abre el navegador**:
- Local: http://localhost:3001/
- Network: http://192.168.3.118:3001/

4. **Intenta hacer login**:
- Las credenciales están pre-cargadas
- Deberías poder autenticarte sin errores de CORS

## 🔍 Verificar Headers CORS

En las DevTools del navegador (Network tab), deberías ver los headers CORS en la respuesta:

```
Access-Control-Allow-Origin: http://192.168.3.118:3001
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization, ...
```

## ⚠️ Importante para Producción

### Seguridad

La configuración actual permite orígenes de desarrollo local. Para producción:

1. **Actualizar `allowedOrigins`** en producción:
```php
'allowedOrigins' => [
    'https://admin.mitienda.pe',  // Frontend de producción
    'https://app.mitienda.pe',     // App móvil web (si existe)
],
```

2. **Eliminar orígenes localhost** en producción

3. **Usar HTTPS** obligatoriamente

### Archivo `.env.production`

Para el build de producción del frontend:
```env
VITE_API_BASE_URL=https://api.mitienda.pe/api/v1
```

## 🐛 Troubleshooting

### Sigue apareciendo error de CORS

1. **Verifica que el backend esté corriendo** y actualizado con los cambios
2. **Limpia caché del navegador** (Ctrl+Shift+R o Cmd+Shift+R)
3. **Verifica el origen** en Network DevTools:
   - Debe coincidir con uno de los `allowedOrigins`
   - Debe incluir el puerto correcto

### Preflight request failed

Si ves error en la petición OPTIONS:
- Verifica que `allowedMethods` incluya `'OPTIONS'`
- Verifica que `allowedHeaders` incluya todos los headers que envías

### Headers no válidos

Si el backend rechaza algún header:
- Agrégalo a `allowedHeaders` en `Cors.php`
- Ejemplo: si agregas un header personalizado `X-Custom-Header`, inclúyelo en la configuración

## ✨ Ventajas de esta Solución

1. ✅ **Sin proxy**: Llamadas directas a la API
2. ✅ **Más rápido**: No hay intermediario
3. ✅ **Más simple**: Menos configuración en el frontend
4. ✅ **Mejor para debugging**: Ves la URL real en Network tab
5. ✅ **Funciona en cualquier puerto**: localhost:3000, 3001, 3002, etc.

## 📚 Referencias

- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [CodeIgniter 4: CORS Filter](https://codeigniter.com/user_guide/incoming/filters.html#cors)

---

**Estado**: ✅ CORS Configurado
**Última actualización**: 2 de Octubre, 2025
