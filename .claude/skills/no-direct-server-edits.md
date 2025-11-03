# NO Editar Archivos Directamente en el Servidor

## ⚠️ REGLA DE ORO: NUNCA edites código directamente en producción

**❌ PROHIBIDO hacer esto:**
```bash
ssh mtserv
nano /var/www/mitienda-api-ci4/app/Controllers/ProductController.php
# Hacer cambios directos...
```

## 🚨 Problemas de Editar en Servidor

### 1. Pérdida de Trabajo
**Han habido ocasiones en las que hemos perdido trabajo** porque los cambios no los teníamos localmente:
- Los cambios en el servidor se pierden en el próximo despliegue
- No hay historial de cambios (git log)
- No se pueden revertir fácilmente
- No hay backup del código modificado

### 2. Inconsistencias
- Código en servidor diferente al código en git
- Imposible reproducir el ambiente de producción localmente
- Confusión sobre qué versión está realmente desplegada

### 3. No hay Code Review
- Los cambios no pasan por revisión
- No hay tests
- Mayor probabilidad de bugs

## ✅ Proceso Correcto

### Para Backend (mitienda-api-ci4):
```bash
# 1. Hacer cambios LOCALMENTE
nano app/Controllers/ProductController.php

# 2. Probar localmente
php spark serve

# 3. Commitear
git add .
git commit -m "fix: corregir bug en ProductController"

# 4. Subir a GitHub (backup)
git push origin main

# 5. Desplegar a producción
git push live main:master
```

### Para Frontends (mitienda-administrador, mitienda-POS):
```bash
# 1. Hacer cambios LOCALMENTE
nano src/components/ProductList.vue

# 2. Probar localmente
npm run dev

# 3. Commitear
git add .
git commit -m "fix: corregir bug en lista de productos"

# 4. Desplegar (Netlify lo despliega automáticamente)
git push origin main
```

## 🔥 Situaciones de Emergencia

### "¡Hay un bug crítico en producción!"

**Todavía NO edites en el servidor.** Sigue el proceso:

```bash
# 1. Crear rama de hotfix
git checkout -b hotfix/critical-bug

# 2. Hacer el fix localmente
nano app/Controllers/BuggyController.php

# 3. Commitear
git commit -am "hotfix: arreglar bug crítico"

# 4. Desplegar inmediatamente
git push live hotfix/critical-bug:master

# 5. Merge a main después
git checkout main
git merge hotfix/critical-bug
git push origin main
```

Esto toma **menos de 2 minutos** y preserva el historial.

## 🛠️ Si REALMENTE Necesitas Ver Algo en el Servidor

### Ver logs:
```bash
ssh mtserv
tail -f /var/www/mitienda-api-ci4/writable/logs/log-*.php
```

### Ver archivos (solo lectura):
```bash
ssh mtserv
cat /var/www/mitienda-api-ci4/app/Config/Database.php
ls -la /var/www/mitienda-api-ci4/
```

### Ver estado de servicios:
```bash
ssh mtserv
systemctl status apache2
systemctl status mysql
```

**Pero NUNCA:**
```bash
nano /var/www/mitienda-api-ci4/...  # ❌ NO
vim /var/www/mitienda-api-ci4/...   # ❌ NO
sed -i ...                           # ❌ NO
```

## 📋 Excepción: Archivos de Configuración No Versionados

**Solo estos archivos pueden editarse en servidor:**
- `.env` (variables de entorno - NO está en git)
- Configuración de Apache/Nginx
- Configuración de servicios del sistema

**Pero aún así, documenta los cambios:**
```bash
# Si cambias .env en servidor
ssh mtserv
nano /var/www/mitienda-api-ci4/.env
# Cambiar DB_PASSWORD=...

# DOCUMENTAR el cambio localmente:
# Actualiza .env.example con comentario
# O documenta en README.md
```

## 🎯 Checklist Antes de Hacer Cambios

- [ ] ¿Estoy conectado por SSH al servidor?
  - **SÍ** → ❌ NO edites código, sal y hazlo localmente
  - **NO** → ✅ Continúa

- [ ] ¿El archivo está en `.gitignore`? (como `.env`)
  - **SÍ** → ⚠️ Puedes editarlo en servidor, pero documenta
  - **NO** → ✅ Edítalo localmente y despliega con git

- [ ] ¿Es una emergencia crítica?
  - **SÍ** → ✅ Usa branch hotfix y despliega rápido
  - **NO** → ✅ Usa el flujo normal

## 💡 Recordatorios

1. **Git es más rápido que SSH + nano**
   - Push con git: 30 segundos
   - SSH + nano + rezar que funcione: 5 minutos + riesgo

2. **Siempre hay tiempo para un commit**
   - Incluso en emergencias, el flujo git toma < 2 minutos

3. **Los cambios en servidor NO están respaldados**
   - Si el servidor se cae, los cambios se pierden

4. **El próximo despliegue sobrescribirá cambios manuales**
   - Git checkout -f sobrescribe todo en el servidor

## 🔍 Cómo Detectar Si Hay Cambios No Commiteados en Servidor

```bash
# En el servidor (solo para verificar, NO para editar)
ssh mtserv
cd /var/www/mitienda-api-ci4

# Ver si hay cambios no commiteados
git status
git diff

# Si hay cambios, hacer backup y traerlos localmente
git diff > ~/backup-changes.patch
# Descargar el patch localmente
exit
scp mtserv:~/backup-changes.patch .
git apply backup-changes.patch
```

## 🎯 Resumen

**SIEMPRE:**
✅ Editar código localmente
✅ Commitear cambios
✅ Desplegar con git

**NUNCA:**
❌ SSH + editar archivos de código
❌ "Solo un cambio rápido" en el servidor
❌ "Es más rápido editarlo directo"

**Hemos perdido trabajo antes. No volverá a pasar.**
