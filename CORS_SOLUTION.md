# 🔧 Solución al Problema de CORS

## 🚨 Problema Detectado

Al intentar hacer login desde el desarrollo local, se produce un error de CORS:

```
Access to XMLHttpRequest at 'https://api.mitienda.pe/api/v1/auth/login'
from origin 'http://192.168.3.118:3001' has been blocked by CORS policy
```

## ✅ Solución Implementada: Proxy de Vite

Se ha configurado un **proxy en Vite** para desarrollo local. Esto evita problemas de CORS sin necesidad de modificar el backend.

### ¿Cómo funciona?

```
Frontend (localhost:3002)
    ↓
   /api/v1/auth/login
    ↓
Proxy de Vite (mismo origen)
    ↓
https://api.mitienda.pe/api/v1/auth/login
    ↓
Backend API
```

### Configuración Aplicada

#### 1. `vite.config.ts`
```typescript
server: {
  port: 3000,
  host: true,
  proxy: {
    '/api': {
      target: 'https://api.mitienda.pe',
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.replace(/^\/api/, '/api')
    }
  }
}
```

#### 2. `.env.development`
```env
# Usando proxy de Vite (ruta relativa)
VITE_API_BASE_URL=/api/v1
```

#### 3. `.env.production`
```env
# URL completa en producción
VITE_API_BASE_URL=https://api.mitienda.pe/api/v1
```

## 🎯 Ventajas de esta Solución

1. ✅ **No requiere cambios en el backend**
2. ✅ **No expone credenciales en el frontend**
3. ✅ **Funciona automáticamente en desarrollo**
4. ✅ **Fácil de configurar**
5. ✅ **Soporta HTTPS sin problemas de certificados**

## 🔄 Alternativas (si no funciona el proxy)

### Opción 2: Agregar IP al Backend (CORS Headers)

Si necesitas que el backend acepte directamente tu IP, debes modificar el backend para incluir:

```php
// En el backend PHP (CI4)
header('Access-Control-Allow-Origin: http://192.168.3.118:3002');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
```

**Ubicación en CI4:**
- `app/Config/Filters.php`
- O crear un filtro CORS personalizado

### Opción 3: Deploy en Producción

Si despliegas el frontend en producción (mismo dominio o subdomain), no habrá problemas de CORS:

```
Frontend: https://admin.mitienda.pe
Backend:  https://api.mitienda.pe
```

Ambos en el mismo dominio `mitienda.pe` → Sin problemas de CORS

## 🧪 Verificar que Funciona

1. **Reiniciar el servidor**:
```bash
# El servidor debería reiniciarse automáticamente
# Si no, detén y vuelve a iniciar:
npm run dev
```

2. **Abrir el navegador**:
```
http://localhost:3002/login
```

3. **Intentar login**:
- Las credenciales deberían estar pre-cargadas
- Al hacer clic en "Iniciar Sesión", la petición irá a `/api/v1/auth/login`
- Vite la redirigirá a `https://api.mitienda.pe/api/v1/auth/login`
- No habrá error de CORS

## 📝 Notas Importantes

### Desarrollo vs Producción

- **Desarrollo**: Usa `/api/v1` (proxy de Vite)
- **Producción**: Usa `https://api.mitienda.pe/api/v1` (URL completa)

Los archivos de entorno se cargan automáticamente según el modo:
- `npm run dev` → carga `.env.development`
- `npm run build` → carga `.env.production`

### Cambios en `.env`

Si modificas `.env.development`, necesitas **reiniciar el servidor** de Vite para que tome los cambios.

## 🐛 Troubleshooting

### El proxy no funciona

Verifica que:
1. El servidor de Vite esté corriendo
2. Estés usando la URL correcta: `http://localhost:3002` (no 3000 ni 3001)
3. El archivo `.env.development` tenga `VITE_API_BASE_URL=/api/v1`

### Sigue apareciendo CORS

1. Limpia la caché del navegador (Ctrl+Shift+R o Cmd+Shift+R)
2. Reinicia el servidor de Vite
3. Verifica en Network DevTools que la petición vaya a `/api/v1/...` (no a `https://api...`)

### Error de certificado SSL

El proxy de Vite tiene `secure: false` para evitar problemas con certificados auto-firmados. Si necesitas validación SSL estricta, cambia a `secure: true` en `vite.config.ts`.

## ✨ Estado Actual

- ✅ Proxy configurado
- ✅ Variables de entorno actualizadas
- ✅ Servidor reiniciado
- ✅ Listo para probar

**Ahora puedes hacer login sin problemas de CORS** 🎉

---

**Última actualización**: 2 de Octubre, 2025
