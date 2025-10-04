#!/bin/bash

# Obtener el token actual desde localStorage
# INSTRUCCIONES:
# 1. Abre DevTools (F12)
# 2. Ve a Console
# 3. Ejecuta: localStorage.getItem('access_token')
# 4. Copia el token (sin las comillas)
# 5. Reemplaza TOKEN_AQUI con ese valor

TOKEN="TOKEN_AQUI"

echo "Testing Order Detail Endpoint"
echo "=============================="
echo ""

# Probar con el pedido que dio error: 797606
ORDER_ID="797606"

echo "GET /api/v1/orders/$ORDER_ID"
echo "---"
curl -v -X GET "https://api2.mitienda.pe/api/v1/orders/$ORDER_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  2>&1 | grep -A 100 "< HTTP"

echo ""
echo "=============================="
