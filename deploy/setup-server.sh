#!/bin/bash
# Server setup script for backoffice deployment
# Run once on the target server: bash setup-server.sh

set -e

echo "=== Creating deployment directory ==="
sudo mkdir -p /var/www/backoffice
sudo chown ubuntu:ubuntu /var/www/backoffice

echo "=== Adding Caddy config ==="
# Append backoffice config to existing Caddyfile
# Review the existing Caddyfile first to avoid conflicts
echo ""
echo "Current Caddyfile:"
cat /etc/caddy/Caddyfile 2>/dev/null || echo "(no existing Caddyfile found)"
echo ""
echo "---"
echo "Add the following block to /etc/caddy/Caddyfile:"
echo ""
cat <<'CADDY'
admin.tiendabox.co, admin.tiendabox.ec, admin.mitienda.pe {
	root * /var/www/backoffice
	file_server
	encode gzip

	try_files {path} /index.html

	@static path *.js *.css *.svg *.png *.jpg *.webp *.woff2 *.woff
	header @static Cache-Control "public, max-age=31536000, immutable"

	@html path /index.html
	header @html Cache-Control "no-cache, no-store, must-revalidate"
}
CADDY
echo ""
echo "Then reload Caddy:"
echo "  sudo systemctl reload caddy"
echo ""
echo "=== Setup complete ==="
echo "Make sure DNS records point to this server for:"
echo "  - admin.tiendabox.co"
echo "  - admin.tiendabox.ec"
echo "  - admin.mitienda.pe"
echo ""
echo "Caddy will auto-provision TLS certificates via Let's Encrypt."
