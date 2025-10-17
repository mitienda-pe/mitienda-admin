#!/bin/bash

# Script para probar los endpoints de Cloudflare Images
# Asegúrate de tener el servidor CI4 corriendo antes de ejecutar

API_URL="https://api2.mitienda.pe/api/v1"
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2FwaTIubWl0aWVuZGEucGUvIiwic3ViIjoiNDA4IiwiYXVkIjoibW9iaWxlIiwiaWF0IjoxNzU5NDYyMzM3LCJleHAiOjE3NjIwNTQzMzcsInVzZXJfaWQiOjQwOCwiZW1haWwiOiJHY2tsNkt2Q3VKeXA3VUxDLzhkZmtNemxYU3dQRGY2SXA1OTZxZ2FsLzVkU1JnPT0iLCJzdG9yZV9pZCI6NDA4LCJwZXJtaXNzaW9ucyI6WyJyZWFkX3Byb2R1Y3RzIiwicmVhZF9vcmRlcnMiLCJyZWFkX2N1c3RvbWVycyJdfQ.aVDR1RwR7JHubdAFcf8KWh9KjSuTvU6v8WNijU-WmSc"

echo "========================================="
echo "Testing Cloudflare Images Integration"
echo "========================================="
echo ""

# 1. Get a sample product with images
echo "1. Getting product details..."
PRODUCT_ID=130921
curl -s -H "Authorization: Bearer $TOKEN" \
     "$API_URL/products/$PRODUCT_ID" \
     | jq '.data | {id, name, images: .images | map({id, cloudflare_imagen_id, cloudflare_url, source, position})}'
echo ""
echo ""

# 2. Upload test image
echo "2. Upload test image (manual - requires image file):"
echo "   curl -H \"Authorization: Bearer $TOKEN\" \\"
echo "        -F \"image=@/path/to/test-image.jpg\" \\"
echo "        \"$API_URL/products/$PRODUCT_ID/images\""
echo ""
echo "   Expected response:"
echo "   {"
echo "     \"success\": true,"
echo "     \"data\": {"
echo "       \"cloudflare_imagen_id\": 123,"
echo "       \"cloudflare_id\": \"uuid-string\","
echo "       \"cloudflare_url\": \"https://imagedelivery.net/...\","
echo "       \"all_images\": [...]"
echo "     }"
echo "   }"
echo ""

# 3. Delete image test
echo "3. Delete image (update IMAGE_ID before running):"
echo "   IMAGE_ID=123  # Set this to cloudflare_imagen_id from upload response"
echo "   curl -X DELETE -H \"Authorization: Bearer $TOKEN\" \\"
echo "        \"$API_URL/products/$PRODUCT_ID/images/\$IMAGE_ID\""
echo ""
echo "   Expected response:"
echo "   {"
echo "     \"success\": true,"
echo "     \"message\": \"Image deleted successfully\","
echo "     \"data\": {"
echo "       \"all_images\": [...]"
echo "     }"
echo "   }"
echo ""

echo "========================================="
echo "Database Verification Queries"
echo "========================================="
echo ""
echo "-- Check cloudflare_images table structure:"
echo "DESCRIBE cloudflare_images;"
echo ""
echo "-- Check productos_cloudflare_images table structure:"
echo "DESCRIBE productos_cloudflare_images;"
echo ""
echo "-- Count images by source:"
echo "SELECT 'cloudflare' as source, COUNT(*) as count FROM cloudflare_images WHERE status = 1"
echo "UNION"
echo "SELECT 'legacy' as source, COUNT(*) as count FROM tiendasimagenesdetalles;"
echo ""
echo "-- Get products with Cloudflare images:"
echo "SELECT p.producto_id, p.producto_titulo, COUNT(pci.cloudflare_imagen_id) as cf_images"
echo "FROM productos p"
echo "LEFT JOIN productos_cloudflare_images pci ON pci.producto_id = p.producto_id"
echo "GROUP BY p.producto_id, p.producto_titulo"
echo "HAVING cf_images > 0"
echo "ORDER BY cf_images DESC"
echo "LIMIT 10;"
echo ""
