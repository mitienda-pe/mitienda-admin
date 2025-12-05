#!/bin/bash

# Script para probar endpoints de superadmin
# Uso: ./test-superadmin.sh

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Test de SuperAdmin API"
echo "=========================="
echo ""

# 1. Login para obtener token
echo "1️⃣  Obteniendo token de autenticación..."
LOGIN_RESPONSE=$(curl -s -X POST "https://api2.mitienda.pe/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "carlos@mitienda.pe",
    "password": "aq6cgMbFXEjCKys"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.access_token')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.data.user.id')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Error al obtener token${NC}"
  echo "$LOGIN_RESPONSE" | jq .
  exit 1
fi

echo -e "${GREEN}✅ Token obtenido${NC}"
echo "User ID: $USER_ID"
echo "Token: ${TOKEN:0:50}..."
echo ""

# 2. Verificar si es superadmin
echo "2️⃣  Verificando si usuario es superadmin..."
SUPERADMIN_RESPONSE=$(curl -s -X GET "https://api2.mitienda.pe/api/v1/superadmin/check" \
  -H "Authorization: Bearer $TOKEN")

echo "$SUPERADMIN_RESPONSE" | jq .

IS_SUPERADMIN=$(echo $SUPERADMIN_RESPONSE | jq -r '.data.is_superadmin')

if [ "$IS_SUPERADMIN" = "true" ]; then
  echo -e "${GREEN}✅ Usuario ES superadmin${NC}"
  echo ""

  # 3. Listar tiendas
  echo "3️⃣  Listando primeras 5 tiendas..."
  STORES_RESPONSE=$(curl -s -X GET "https://api2.mitienda.pe/api/v1/superadmin/stores" \
    -H "Authorization: Bearer $TOKEN")

  echo "$STORES_RESPONSE" | jq '.data.stores[0:5] | .[] | {id, name, plan: .plan.name, status: .plan.status}'

  TOTAL=$(echo $STORES_RESPONSE | jq -r '.data.pagination.total')
  echo -e "${GREEN}Total de tiendas: $TOTAL${NC}"

else
  echo -e "${RED}❌ Usuario NO es superadmin${NC}"
  echo ""
  echo "Para convertir al usuario en superadmin, ejecuta en la BD:"
  echo ""
  echo -e "${YELLOW}INSERT INTO superadministradores (usuario_id, parner_id, superadmintipo_id)${NC}"
  echo -e "${YELLOW}VALUES ($USER_ID, 1, 1);${NC}"
fi

echo ""
echo "=========================="
echo "✅ Test completado"
