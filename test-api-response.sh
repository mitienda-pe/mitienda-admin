#!/bin/bash

# Test what the API is actually returning
# Get your actual access_token from localStorage in the browser console

echo "Ingresa tu access_token (desde localStorage del navegador):"
read TOKEN

if [ -z "$TOKEN" ]; then
  echo "Error: Token vacío"
  exit 1
fi

echo ""
echo "Consultando API..."
echo ""

RESPONSE=$(curl -s \
  -H "Authorization: Bearer $TOKEN" \
  "https://api2.mitienda.pe/api/v1/superadmin/s3-images?store_id=8379&page=1&per_page=2")

echo "$RESPONSE" | python3 -m json.tool

echo ""
echo "=============================================="
echo "Extrayendo URLs de las imágenes..."
echo ""

echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'data' in data and 'images' in data['data']:
        for img in data['data']['images']:
            print(f\"ID: {img['id']}\")
            print(f\"CDN URL: {img['cdn_url']}\")
            print()
    else:
        print('Error en la respuesta:', data)
except Exception as e:
    print('Error:', e)
"
