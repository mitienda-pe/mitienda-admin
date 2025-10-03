# 🚀 Guía de Despliegue - MiTienda Backoffice

## ✅ API Restaurada

La API ha sido revertida a su estado original (sin cambios de CORS).
- ✅ Apps móviles funcionando normalmente
- ✅ API estable en producción

## 📦 Preparar para Producción

El backoffice está listo para desplegarse en un servidor con su propio dominio.

### Opción 1: Desplegar en el Mismo Servidor (Recomendado)

**Dominio sugerido**: `admin.mitienda.pe` o `backoffice.mitienda.pe`

#### Ventajas:
- ✅ Mismo dominio base → NO hay problemas de CORS
- ✅ Comparte certificado SSL
- ✅ Fácil de configurar

#### Pasos:

1. **Build del proyecto**:
```bash
cd /Users/carlosvidal/www/mitienda/mitienda-administrador
npm run build
# Esto genera la carpeta dist/
```

2. **Subir al servidor**:
```bash
# Crear carpeta en el servidor
ssh user@servidor "mkdir -p /var/www/admin.mitienda.pe"

# Subir archivos
scp -r dist/* user@servidor:/var/www/admin.mitienda.pe/
```

3. **Configurar Apache/Nginx**:

**Apache** (`/etc/apache2/sites-available/admin.mitienda.pe.conf`):
```apache
<VirtualHost *:443>
    ServerName admin.mitienda.pe
    DocumentRoot /var/www/admin.mitienda.pe

    <Directory /var/www/admin.mitienda.pe>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # SPA - Todas las rutas van a index.html
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
</VirtualHost>
```

**Nginx**:
```nginx
server {
    listen 443 ssl http2;
    server_name admin.mitienda.pe;
    root /var/www/admin.mitienda.pe;
    index index.html;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Caché para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

4. **Variables de entorno para producción**:

El archivo `.env.production` ya está configurado:
```env
VITE_API_BASE_URL=https://api.mitienda.pe/api/v1
```

5. **Habilitar sitio y reiniciar**:
```bash
# Apache
sudo a2ensite admin.mitienda.pe
sudo systemctl reload apache2

# Nginx
sudo ln -s /etc/nginx/sites-available/admin.mitienda.pe /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

### Opción 2: Desplegar en Vercel/Netlify (Más Simple)

#### Vercel:

1. **Instalar Vercel CLI**:
```bash
npm install -g vercel
```

2. **Deploy**:
```bash
cd /Users/carlosvidal/www/mitienda/mitienda-administrador
vercel --prod
```

3. **Configurar dominio personalizado** en Vercel dashboard

#### Netlify:

1. **Build local**:
```bash
npm run build
```

2. **Deploy**:
```bash
npx netlify-cli deploy --prod --dir=dist
```

### Opción 3: GitHub Pages (Gratis pero limitado)

No recomendado para este proyecto porque no soporta HTTPS personalizado fácilmente.

## 🔐 Configuración de CORS en Producción

Una vez que el backoffice esté en `admin.mitienda.pe`:

**NO necesitarás configurar CORS** porque:
- `admin.mitienda.pe` → `api.mitienda.pe`
- Mismo dominio base (`.mitienda.pe`)
- Los navegadores lo permiten sin CORS

Si usas un dominio diferente (ej: Vercel), entonces SÍ necesitarás agregar el dominio a la configuración CORS de la API:

```php
// app/Config/Cors.php
'allowedOrigins' => [
    'https://mitienda-admin.vercel.app',
],
```

## 📋 Checklist Pre-Deploy

- [ ] `npm run build` funciona sin errores
- [ ] Verificar que `.env.production` tenga la URL correcta de la API
- [ ] Probar el build localmente: `npm run preview`
- [ ] Configurar dominio DNS (si es necesario)
- [ ] Configurar SSL/HTTPS
- [ ] Configurar Apache/Nginx con rewrite rules para SPA

## 🧪 Probar Después del Deploy

1. Acceder a `https://admin.mitienda.pe`
2. Intentar login
3. Verificar que no hay errores de CORS
4. Navegar entre rutas (Dashboard, Productos, etc.)
5. Hacer logout

## 📝 Configuración Recomendada

**Dominio**: `admin.mitienda.pe`
**Servidor**: Mismo servidor que la API
**SSL**: Usar Let's Encrypt (certbot)
**Web Server**: Apache o Nginx

## ⚡ Deploy Automático (Opcional)

Puedes configurar deploy automático con Git hooks, igual que tienes en la API:

```bash
# En el servidor, crear repo bare
git init --bare /var/repo/mitienda-admin.git

# Hook post-receive
cat > /var/repo/mitienda-admin.git/hooks/post-receive << 'EOF'
#!/bin/bash
TARGET="/var/www/admin.mitienda.pe"
GIT_DIR="/var/repo/mitienda-admin.git"
BRANCH="main"

while read oldrev newrev ref
do
    if [[ $ref = refs/heads/$BRANCH ]]; then
        echo ">>> Deploy iniciando en $TARGET"
        git --work-tree=$TARGET --git-dir=$GIT_DIR checkout -f $BRANCH
        echo ">>> Instalando dependencias"
        cd $TARGET && npm install
        echo ">>> Generando build"
        npm run build
        echo ">>> Copiando archivos"
        cp -r dist/* $TARGET/
        rm -rf dist
        echo ">>> Deploy completado ✅"
    fi
done
EOF

chmod +x /var/repo/mitienda-admin.git/hooks/post-receive
```

Luego en local:
```bash
git remote add live user@servidor:/var/repo/mitienda-admin.git
git push live main
```

## 🎯 Próximos Pasos

1. Decide el dominio: `admin.mitienda.pe` o similar
2. Configura DNS si es necesario
3. Haz el build y sube al servidor
4. Configura Apache/Nginx
5. Prueba el login

---

**¿Qué dominio quieres usar para el backoffice?**
