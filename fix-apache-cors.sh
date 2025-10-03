#!/bin/bash

# Script para desactivar CORS de Apache y dejar que CodeIgniter lo maneje
# Ejecutar en el servidor: bash fix-apache-cors.sh

echo "🔧 Desactivando CORS de Apache..."

# Archivo de configuración de Apache para api.mitienda.pe
APACHE_CONF="/etc/apache2/sites-available/api.mitienda.pe.conf"

# Backup del archivo original
sudo cp $APACHE_CONF ${APACHE_CONF}.backup

# Buscar y comentar las líneas de CORS de Apache
sudo sed -i 's/^\s*Header set Access-Control-Allow-Origin/# Header set Access-Control-Allow-Origin/g' $APACHE_CONF
sudo sed -i 's/^\s*Header always set Access-Control-Allow-Origin/# Header always set Access-Control-Allow-Origin/g' $APACHE_CONF

echo "✅ CORS de Apache desactivado"
echo "📋 Backup guardado en: ${APACHE_CONF}.backup"

# Recargar Apache
echo "🔄 Recargando Apache..."
sudo systemctl reload apache2

echo "✅ ¡Listo! Apache configurado correctamente"
echo ""
echo "Ahora el filtro CORS de CodeIgniter manejará todas las peticiones CORS"
