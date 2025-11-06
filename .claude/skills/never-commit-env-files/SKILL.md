# NUNCA Commitear Archivos .env

## ⚠️ REGLA CRÍTICA DE SEGURIDAD

**❌ PROHIBIDO ABSOLUTAMENTE:**
```bash
git add .env              # ❌ NUNCA
git add -f .env           # ❌ NUNCA (force)
git commit -m "fix: ..."  # Si .env está staged
```

## 🚨 Por Qué Esto Es CRÍTICO

### 1. Expone Credenciales
El archivo `.env` contiene:
```env
DB_PASSWORD=password_super_secreto
JWT_SECRET_KEY=clave_secreta_123
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
API_KEYS=...
```

Si se commitea:
- Las credenciales quedan en el historial de Git **PARA SIEMPRE**
- Aunque borres el commit, queda en el historial
- Si el repo es público, TODOS pueden ver las credenciales
- Si el repo es privado, cualquiera con acceso puede verlas

### 2. Historial de Git NO se Puede "Borrar Fácilmente"
```bash
# Esto NO es suficiente:
git rm .env
git commit -m "remove .env"

# El archivo SIGUE en el historial:
git log --all --full-history -- .env
git show <commit_hash>:.env  # ← TODAVÍA SE PUEDE VER
```

Para eliminar del historial requiere:
```bash
git filter-branch  # Reescribe TODO el historial
# o
git filter-repo    # Herramienta especializada
```

Y si ya se hizo push, **es casi imposible eliminarlo completamente**.

## 📋 Qué Ha Pasado Antes (NO Repetir)

**Han habido ocasiones en las que has borrado `.env` del `.gitignore` y lo has commiteado** porque:
- Algo no funcionaba
- Sospechábamos que faltaba algo en el archivo `.env`
- Intentabas "arreglar" el problema

**ESTO NO DEBE VOLVER A PASAR.**

## ✅ Forma Correcta de Manejar .env

### 1. .env SIEMPRE debe estar en .gitignore

**Verificar que existe:**
```bash
cat .gitignore | grep .env
# Debe aparecer:
# .env
# .env.*
# !.env.example
```

**Si no está, agregarlo:**
```bash
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore
echo "!.env.example" >> .gitignore
git add .gitignore
git commit -m "chore: ensure .env is ignored"
```

### 2. Usar .env.example en su lugar

**Estructura correcta:**
```
.env                 ← NO committear (gitignored)
.env.example         ← SÍ commitear (template sin valores reales)
```

**Contenido de `.env.example`:**
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=nombre_base_datos
DB_USERNAME=usuario
DB_PASSWORD=cambiar_en_produccion

# JWT
JWT_SECRET_KEY=generar_clave_secreta_aqui

# AWS (opcional)
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
```

**Nunca pongas valores reales en `.env.example`.**

### 3. Compartir Configuración Necesaria

**Si necesitas que otros sepan qué variables hay:**

```bash
# Copiar estructura sin valores
cp .env .env.example
nano .env.example
# Reemplazar todos los valores reales con placeholders
```

**O en documentación:**
```markdown
## Variables de Entorno Requeridas

Copiar `.env.example` a `.env` y configurar:

- `DB_PASSWORD`: Contraseña de la base de datos
- `JWT_SECRET_KEY`: Generar con `openssl rand -base64 32`
- `AWS_ACCESS_KEY_ID`: Obtener de AWS Console
```

## 🔍 Cómo Detectar Si .env Está Commiteado

### Verificar estado actual:
```bash
# Ver si .env está trackeado
git ls-files | grep .env

# Si aparece .env (sin .example), está trackeado ❌
# Si solo aparece .env.example, está bien ✅
```

### Verificar historial:
```bash
# Ver si .env estuvo commiteado alguna vez
git log --all --full-history -- .env

# Si hay resultados, .env estuvo en el historial
```

### Verificar .gitignore:
```bash
# Verificar que .env está ignorado
git check-ignore .env

# Si imprime ".env", está ignorado ✅
# Si no imprime nada, NO está ignorado ❌
```

## 🚨 Si Accidentalmente Commiteas .env

### Paso 1: NO HACER PUSH (si todavía no hiciste push)
```bash
# Quitar del último commit
git reset HEAD~1
# O quitar solo el archivo
git reset HEAD .env
git checkout -- .env
```

### Paso 2: Si ya hiciste push (CRISIS)

**Opción A: Si es un repo privado y nadie más lo ha bajado**
```bash
# Quitar del historial (PELIGROSO)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (reescribe historial en GitHub)
git push origin --force --all
```

**Opción B: Si otros ya lo bajaron**
1. **ROTAR TODAS LAS CREDENCIALES INMEDIATAMENTE**
   - Cambiar contraseña de DB
   - Regenerar JWT_SECRET_KEY
   - Rotar AWS keys
   - Cambiar todos los secrets expuestos

2. Notificar al equipo
3. Limpiar historial (opcional, pero el daño ya está hecho)

## 🛠️ Debugging Sin Exponer .env

### Si sospechas que falta algo en .env:

**❌ NO hagas esto:**
```bash
git add .env  # NUNCA
```

**✅ Haz esto en su lugar:**
```bash
# Opción 1: Actualizar .env.example
nano .env.example
# Agregar la variable que falta (sin valor real)
git add .env.example
git commit -m "docs: add missing env variable to example"

# Opción 2: Documentar en README
echo "## Nueva Variable Requerida" >> README.md
echo "- NUEVA_VAR: descripción de qué hace" >> README.md
git add README.md
git commit -m "docs: document new env variable"

# Opción 3: Comparar manualmente
diff .env .env.example
# O compartir estructura sin valores:
cat .env | sed 's/=.*/=***/' > env-structure.txt
```

### Si necesitas compartir configuración con el equipo:

**❌ NO:**
```bash
git add .env
git push  # Exponer secretos a todo el equipo
```

**✅ SÍ:**
```bash
# Usar comunicación segura (Slack/Email/1Password/LastPass)
"Hey, agrega esta variable a tu .env local:
NUEVA_VAR=valor_aqui"

# O compartir via herramienta de secrets:
# - 1Password Team Secrets
# - LastPass Shared Folders
# - AWS Secrets Manager
# - Doppler
```

## 📋 Checklist de Seguridad .env

Antes de hacer commit:

- [ ] ¿Ejecuté `git status`?
- [ ] ¿Aparece `.env` en la lista de archivos?
  - **SÍ** → ❌ STOP, no commitear
  - **NO** → ✅ Continuar

- [ ] ¿Verificué que `.env` está en `.gitignore`?
  - **SÍ** → ✅ Bien
  - **NO** → ❌ Agregarlo ahora

- [ ] ¿Actualicé `.env.example` si agregué nuevas variables?
  - **SÍ** → ✅ Perfecto
  - **NO** → ⚠️ Considera hacerlo

## 🎯 Configuración de Git para Protección Extra

### Prevenir accidentalmente agregar .env:

```bash
# Agregar hook pre-commit
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
if git diff --cached --name-only | grep -q "^\.env$"; then
    echo "❌ ERROR: Intentaste commitear .env"
    echo "Ejecuta: git reset HEAD .env"
    exit 1
fi
EOF

chmod +x .git/hooks/pre-commit
```

## 🎯 Resumen

**SIEMPRE:**
✅ Mantener `.env` en `.gitignore`
✅ Commitear `.env.example` (sin valores reales)
✅ Documentar variables necesarias en README
✅ Rotar credenciales si se exponen

**NUNCA:**
❌ `git add .env`
❌ `git add -f .env`
❌ Quitar `.env` de `.gitignore`
❌ Commitear archivos con credenciales

**Esto ya pasó antes. NO volverá a pasar.**

## 🔐 Recursos Adicionales

- Generar secrets seguros: `openssl rand -base64 32`
- Verificar si hay secrets expuestos: https://github.com/trufflesecurity/trufflehog
- Limpiar historial: https://rtyley.github.io/bfg-repo-cleaner/
