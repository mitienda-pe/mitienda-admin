# Despliegue en Netlify - Backoffice Vue.js

## 🚀 Proceso de Despliegue

Este proyecto (mitienda-administrador) se despliega **automáticamente en Netlify** mediante integración continua con GitHub.

## ✅ Forma Correcta de Desplegar

```bash
# 1. Verificar cambios
git status

# 2. Commitear cambios
git add .
git commit -m "feat: descripción del cambio"

# 3. Push a GitHub
git push origin main

# 4. ¡Listo! Netlify despliega automáticamente
```

**Netlify detecta el push y:**
1. Descarga el código desde GitHub
2. Ejecuta `npm run build` (o el comando configurado)
3. Despliega el build a producción
4. Genera una URL de preview si es un PR

## ⚠️ IMPORTANTE: NO uses git push live

**❌ ESTE PROYECTO NO usa repositorio bare:**
```bash
git push live main:master  # ← NO EXISTE para frontends
```

El despliegue bare con `git push live` **SOLO aplica para el backend PHP** (mitienda-api-ci4).

## 🔍 Verificar Despliegue en Netlify

1. **Dashboard de Netlify:** https://app.netlify.com
2. Ver el estado del deploy en tiempo real
3. Ver logs de build si hay errores
4. Acceder a la URL de producción

## 📋 Flujo Completo

```bash
# Desarrollo local
npm run dev

# Hacer cambios...

# Commitear
git add .
git commit -m "feat: nueva funcionalidad"

# Desplegar a producción
git push origin main

# Verificar en Netlify dashboard
# URL: https://app.netlify.com/sites/[tu-sitio]/deploys
```

## 🌐 URLs del Proyecto

- **Producción:** https://[tu-sitio].netlify.app (o dominio custom)
- **Dashboard Netlify:** https://app.netlify.com
- **Repositorio:** git@github.com:mitienda-pe/[repo-name].git

## 🛠️ Variables de Entorno

Las variables de entorno se configuran en Netlify Dashboard:
- Settings → Environment variables
- Agregar: `VITE_API_URL`, `VITE_API_KEY`, etc.

**No se requiere archivo `.env` en el repositorio** (solo `.env.local` para desarrollo).

## 🚨 Troubleshooting

### Build falla en Netlify
```bash
# Ver logs en Netlify Dashboard
# Verificar que el comando de build sea correcto:
# Build command: npm run build
# Publish directory: dist
```

### Variables de entorno no funcionan
- Verificar en Netlify Dashboard → Environment variables
- Las variables deben empezar con `VITE_` para estar disponibles en el frontend
- Redesplegar después de agregar variables

### Quiero hacer rollback
- En Netlify Dashboard → Deploys
- Seleccionar deploy anterior
- Click en "Publish deploy"

## 📝 Diferencias con Backend (mitienda-api-ci4)

| Aspecto | Backend (API) | Frontend (Backoffice) |
|---------|---------------|----------------------|
| Método de despliegue | `git push live main:master` | `git push origin main` |
| Servidor | Bare repository en mtserv | Netlify CI/CD |
| Build | No requiere | `npm run build` |
| Hook | `post-receive` | Netlify webhook |

## 🎯 Resumen

**Para desplegar este proyecto (mitienda-administrador):**
```bash
git push origin main
```

**Solo el backend usa:**
```bash
git push live main:master
```
