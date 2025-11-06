# Despliegue con Repositorio Bare Git

⚠️ **NOTA:** Este skill aplica SOLO para el **backend PHP (mitienda-api-ci4)**.
Los frontends (mitienda-administrador y mitienda-POS) se despliegan en Netlify - ver `deployment-netlify.md`.

## 🚀 Proceso de Despliegue a Producción (Backend PHP)

Este proyecto **NO se despliega con `git pull` en el servidor**. Usa un **repositorio bare** con un hook `post-receive` que automáticamente actualiza el código en producción.

## ⚠️ IMPORTANTE: NO hagas SSH + git pull

**❌ NUNCA intentes esto:**
```bash
ssh mtserv
cd /var/www/mitienda-api-ci4
git pull  # ← ESTO NO FUNCIONA
```

**¿Por qué?** Porque `/var/www/mitienda-api-ci4` NO es un repositorio git. Es un directorio de trabajo que se actualiza automáticamente mediante un hook.

## ✅ Forma Correcta de Desplegar

### Remote configurado:
```bash
git remote -v
# live	mtserv:/var/repo/mitienda-api-ci4.git (fetch)
# live	mtserv:/var/repo/mitienda-api-ci4.git (push)
```

### Comando de despliegue:
```bash
git push live main:master
```

**Explicación:**
- `live` → nombre del remote (repositorio bare en el servidor)
- `main` → rama local que quieres desplegar
- `master` → rama en el servidor (el hook escucha esta rama)

## 🔄 Qué Sucede Automáticamente

1. Haces `git push live main:master`
2. El código se envía a `/var/repo/mitienda-api-ci4.git` (repositorio bare)
3. Se dispara el hook `post-receive`
4. El hook ejecuta:
   ```bash
   git --work-tree=/var/www/mitienda-api-ci4 --git-dir=/var/repo/mitienda-api-ci4.git checkout -f master
   ```
5. El código se actualiza automáticamente en `/var/www/mitienda-api-ci4`
6. (Opcional) El hook puede ejecutar comandos adicionales como:
   - `composer install --no-dev`
   - Limpiar caché
   - Reiniciar servicios

## 📋 Flujo Completo de Despliegue

```bash
# 1. Verificar cambios locales
git status

# 2. Commitear cambios (si hay alguno)
git add .
git commit -m "fix: descripción del cambio"

# 3. Subir a GitHub (opcional pero recomendado)
git push origin main

# 4. Desplegar a producción
git push live main:master

# 5. Verificar en producción
curl https://api.mitienda.pe/api/v1/health
```

## 🔍 Verificar Estado del Despliegue

### Ver logs del servidor (si tienes acceso SSH):
```bash
ssh mtserv
tail -f /var/www/mitienda-api-ci4/writable/logs/log-*.php
```

### Ver último commit desplegado:
```bash
ssh mtserv
cd /var/www/mitienda-api-ci4
git log -1 --oneline
# O simplemente ver la fecha de modificación de archivos
ls -la app/Controllers/
```

## ⚙️ Estructura del Servidor

```
/var/repo/mitienda-api-ci4.git/        ← Repositorio bare (recibe push)
├── hooks/
│   └── post-receive                    ← Hook que actualiza código
├── objects/
├── refs/
└── config

/var/www/mitienda-api-ci4/             ← Directorio de trabajo (código en producción)
├── app/
├── public/
├── vendor/
└── writable/
```

## 🛠️ Si Necesitas Crear un Bare Repository en Otro Proyecto

```bash
# En el servidor
ssh usuario@servidor
cd /var/repo
git init --bare nombre-proyecto.git
cd nombre-proyecto.git/hooks
nano post-receive
```

**Contenido básico de `post-receive`:**
```bash
#!/bin/bash
GIT_WORK_TREE=/var/www/nombre-proyecto
GIT_DIR=/var/repo/nombre-proyecto.git
export GIT_WORK_TREE GIT_DIR

git checkout -f master

# Opcional: comandos post-despliegue
cd $GIT_WORK_TREE
composer install --no-dev --optimize-autoloader
# php spark migrate
# php spark cache:clear
```

```bash
# Hacer el hook ejecutable
chmod +x post-receive
```

**En local:**
```bash
git remote add live usuario@servidor:/var/repo/nombre-proyecto.git
git push live main:master
```

## 🚨 Troubleshooting

### Problema: "Permission denied" al hacer push
```bash
# Verificar permisos en el servidor
ssh mtserv
ls -la /var/repo/mitienda-api-ci4.git
# Los directorios deben tener permisos 775 o 755
# El dueño debe ser tu usuario o www-data
```

### Problema: El hook no se ejecuta
```bash
# Verificar que el hook sea ejecutable
ssh mtserv
ls -la /var/repo/mitienda-api-ci4.git/hooks/post-receive
chmod +x /var/repo/mitienda-api-ci4.git/hooks/post-receive
```

### Problema: "No such remote 'live'"
```bash
# Agregar el remote
git remote add live mtserv:/var/repo/mitienda-api-ci4.git
```

### Problema: Quiero ver el contenido del hook
```bash
ssh mtserv
cat /var/repo/mitienda-api-ci4.git/hooks/post-receive
```

## 📝 Otros Proyectos con Bare Repository

Según mencionaste, usas este método en "casi siempre en proyectos PHP". Si hay otros proyectos con el mismo setup, probablemente usen:

```bash
git remote -v | grep live
# Verificar si existe el remote 'live'

# Si existe, el despliegue es:
git push live main:master
# o
git push live master:master
```

## 🎯 Checklist Antes de Desplegar

- [ ] ¿Hiciste commit de todos los cambios?
- [ ] ¿Los tests pasan localmente?
- [ ] ¿Subiste a GitHub? (`git push origin main`)
- [ ] ¿Verificaste que el remote 'live' existe? (`git remote -v`)
- [ ] ¿Estás en la rama correcta? (`git branch`)
- [ ] **Ejecuta:** `git push live main:master`
- [ ] ¿Verificaste que el despliegue funcionó? (curl al API)

## 💡 Recordatorio Final

**SIEMPRE que quieras desplegar cambios:**
```bash
git push live main:master
```

**NUNCA:**
- ❌ SSH al servidor + git pull
- ❌ SSH al servidor + git fetch
- ❌ Copiar archivos manualmente con scp/rsync
- ❌ Editar archivos directamente en el servidor

El repositorio bare + hook post-receive es el único método de despliegue válido para este proyecto.
