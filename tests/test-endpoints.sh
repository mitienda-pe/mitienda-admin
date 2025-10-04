#!/bin/bash

# Script para probar todos los endpoints de la API
API_URL="https://api2.mitienda.pe/api/v1"
EMAIL="carlos@mitienda.pe"
PASSWORD="aq6cgMbFXEjCKys"

echo "=========================================="
echo "  PRUEBA DE ENDPOINTS - MITIENDA API"
echo "=========================================="
echo ""

# 1. Login
echo "1. 🔐 Probando LOGIN..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Error al obtener token"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login exitoso"
echo "Token: ${TOKEN:0:50}..."
echo ""

# 2. Obtener tiendas
echo "2. 🏪 Probando GET /user/stores..."
STORES=$(curl -s -X GET "$API_URL/user/stores" \
  -H "Authorization: Bearer $TOKEN")
echo "$STORES" | head -20
echo ""

# 3. Obtener perfil
echo "3. 👤 Probando GET /user/profile..."
PROFILE=$(curl -s -X GET "$API_URL/user/profile" \
  -H "Authorization: Bearer $TOKEN")
echo "$PROFILE"
echo ""

# 4. Obtener pedidos
echo "4. 📦 Probando GET /orders..."
ORDERS=$(curl -s -X GET "$API_URL/orders?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")
echo "$ORDERS" | head -30
echo ""

# 5. Obtener productos
echo "5. 🛍️  Probando GET /products..."
PRODUCTS=$(curl -s -X GET "$API_URL/products?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")
echo "$PRODUCTS" | head -30
echo ""

# 6. Obtener clientes
echo "6. 👥 Probando GET /customers..."
CUSTOMERS=$(curl -s -X GET "$API_URL/customers?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")
echo "$CUSTOMERS" | head -30
echo ""

# 7. Obtener categorías
echo "7. 📁 Probando GET /categories..."
CATEGORIES=$(curl -s -X GET "$API_URL/categories" \
  -H "Authorization: Bearer $TOKEN")
echo "$CATEGORIES" | head -30
echo ""

# 8. Obtener marcas
echo "8. 🏷️  Probando GET /brands..."
BRANDS=$(curl -s -X GET "$API_URL/brands" \
  -H "Authorization: Bearer $TOKEN")
echo "$BRANDS" | head -30
echo ""

# 9. Obtener estadísticas del dashboard
echo "9. 📊 Probando GET /dashboard/stats..."
STATS=$(curl -s -X GET "$API_URL/dashboard/stats" \
  -H "Authorization: Bearer $TOKEN")
echo "$STATS"
echo ""

# 10. Test de conectividad
echo "10. 🔌 Probando GET /auth/test..."
TEST=$(curl -s -X GET "$API_URL/auth/test" \
  -H "Authorization: Bearer $TOKEN")
echo "$TEST"
echo ""

echo "=========================================="
echo "  ✅ PRUEBA COMPLETA"
echo "=========================================="
