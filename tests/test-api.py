#!/usr/bin/env python3
import requests
import json

API_URL = "https://api2.mitienda.pe/api/v1"
EMAIL = "carlos@mitienda.pe"
PASSWORD = "aq6cgMbFXEjCKys"

print("=" * 60)
print("  PRUEBA DE ENDPOINTS - MITIENDA API")
print("=" * 60)
print()

# 1. Login
print("1. 🔐 Probando LOGIN...")
response = requests.post(f"{API_URL}/auth/login", json={
    "email": EMAIL,
    "password": PASSWORD
})
login_data = response.json()

if login_data.get("error") == 0:
    token = login_data["data"]["access_token"]
    print(f"✅ Login exitoso")
    print(f"Token: {token[:50]}...")
    print()
else:
    print("❌ Error al hacer login")
    print(json.dumps(login_data, indent=2))
    exit(1)

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# 2. Obtener tiendas
print("2. 🏪 Probando GET /user/stores...")
response = requests.get(f"{API_URL}/user/stores", headers=headers)
stores_data = response.json()
print(f"Status: {response.status_code}")
if stores_data.get("error") == 0:
    stores = stores_data["data"].get("stores", [])
    print(f"✅ {len(stores)} tiendas encontradas")
    for store in stores[:3]:
        print(f"  - {store.get('tienda_nombre_comercial')} ({store.get('tienda_plan_status_text')})")
else:
    print("❌ Error:", stores_data.get("message"))
print()

# 3. Obtener perfil
print("3. 👤 Probando GET /user/profile...")
response = requests.get(f"{API_URL}/user/profile", headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    print("✅ Perfil obtenido")
    print(json.dumps(response.json(), indent=2)[:200])
else:
    print("❌ Error:", response.status_code)
print()

# 4. Obtener pedidos
print("4. 📦 Probando GET /orders...")
response = requests.get(f"{API_URL}/orders?page=1&limit=5", headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    orders_data = response.json()
    print("✅ Pedidos obtenidos")
    print(json.dumps(orders_data, indent=2)[:300])
else:
    print("❌ Error:", response.status_code)
    print(response.text[:200])
print()

# 5. Obtener productos
print("5. 🛍️  Probando GET /products...")
response = requests.get(f"{API_URL}/products?page=1&limit=5", headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    products_data = response.json()
    print("✅ Productos obtenidos")
    print(json.dumps(products_data, indent=2)[:300])
else:
    print("❌ Error:", response.status_code)
    print(response.text[:200])
print()

# 6. Obtener clientes
print("6. 👥 Probando GET /customers...")
response = requests.get(f"{API_URL}/customers?page=1&limit=5", headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    customers_data = response.json()
    print("✅ Clientes obtenidos")
    print(json.dumps(customers_data, indent=2)[:300])
else:
    print("❌ Error:", response.status_code)
    print(response.text[:200])
print()

# 7. Obtener categorías
print("7. 📁 Probando GET /categories...")
response = requests.get(f"{API_URL}/categories", headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    categories_data = response.json()
    print("✅ Categorías obtenidas")
    print(json.dumps(categories_data, indent=2)[:300])
else:
    print("❌ Error:", response.status_code)
    print(response.text[:200])
print()

# 8. Obtener marcas
print("8. 🏷️  Probando GET /brands...")
response = requests.get(f"{API_URL}/brands", headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    brands_data = response.json()
    print("✅ Marcas obtenidas")
    print(json.dumps(brands_data, indent=2)[:300])
else:
    print("❌ Error:", response.status_code)
    print(response.text[:200])
print()

# 9. Obtener estadísticas
print("9. 📊 Probando GET /dashboard/stats...")
response = requests.get(f"{API_URL}/dashboard/stats", headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    stats_data = response.json()
    print("✅ Estadísticas obtenidas")
    print(json.dumps(stats_data, indent=2)[:300])
else:
    print("❌ Error:", response.status_code)
    print(response.text[:200])
print()

# 10. Test de conectividad
print("10. 🔌 Probando GET /auth/test...")
response = requests.get(f"{API_URL}/auth/test", headers=headers)
print(f"Status: {response.status_code}")
if response.status_code == 200:
    print("✅ Test de conectividad exitoso")
    print(json.dumps(response.json(), indent=2))
else:
    print("❌ Error:", response.status_code)
print()

print("=" * 60)
print("  ✅ PRUEBA COMPLETA")
print("=" * 60)
