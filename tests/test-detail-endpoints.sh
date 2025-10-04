#!/bin/bash

# Token de prueba (cámbialo por el token actual desde localStorage)
TOKEN="REEMPLAZAR_CON_TOKEN_DE_LOCALSTORAGE"

echo "========================================="
echo "Testing API Detail Endpoints"
echo "========================================="
echo ""

# 1. Get first product ID
echo "1. Getting product list..."
PRODUCTS=$(curl -s -X GET "https://api2.mitienda.pe/products?limit=1" \
  -H "Authorization: Bearer $TOKEN")

PRODUCT_ID=$(echo $PRODUCTS | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['id'] if isinstance(data, list) and len(data) > 0 else 'ERROR')" 2>/dev/null)

echo "First product ID: $PRODUCT_ID"
echo ""

# 2. Test product detail
if [ "$PRODUCT_ID" != "ERROR" ] && [ "$PRODUCT_ID" != "" ]; then
  echo "2. Testing GET /products/$PRODUCT_ID"
  echo "---"
  curl -s -X GET "https://api2.mitienda.pe/products/$PRODUCT_ID" \
    -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
  echo ""
  echo ""
fi

# 3. Get first order ID
echo "3. Getting orders list..."
ORDERS=$(curl -s -X GET "https://api2.mitienda.pe/orders?limit=1" \
  -H "Authorization: Bearer $TOKEN")

ORDER_ID=$(echo $ORDERS | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('orders', [])[0]['tiendaventa_id'] if 'orders' in data and len(data['orders']) > 0 else 'ERROR')" 2>/dev/null)

echo "First order ID: $ORDER_ID"
echo ""

# 4. Test order detail
if [ "$ORDER_ID" != "ERROR" ] && [ "$ORDER_ID" != "" ]; then
  echo "4. Testing GET /orders/$ORDER_ID"
  echo "---"
  curl -s -X GET "https://api2.mitienda.pe/orders/$ORDER_ID" \
    -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
  echo ""
  echo ""
fi

# 5. Get first customer ID
echo "5. Getting customers list..."
CUSTOMERS=$(curl -s -X GET "https://api2.mitienda.pe/customers?limit=1" \
  -H "Authorization: Bearer $TOKEN")

CUSTOMER_ID=$(echo $CUSTOMERS | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', [])[0]['id'] if 'data' in data and len(data['data']) > 0 else 'ERROR')" 2>/dev/null)

echo "First customer ID: $CUSTOMER_ID"
echo ""

# 6. Test customer detail
if [ "$CUSTOMER_ID" != "ERROR" ] && [ "$CUSTOMER_ID" != "" ]; then
  echo "6. Testing GET /customers/$CUSTOMER_ID"
  echo "---"
  curl -s -X GET "https://api2.mitienda.pe/customers/$CUSTOMER_ID" \
    -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
  echo ""
fi

echo "========================================="
echo "Test completed"
echo "========================================="
