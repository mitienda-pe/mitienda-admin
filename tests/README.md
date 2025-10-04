# Tests y Scripts de Prueba

Scripts de prueba para validar el funcionamiento del API y backoffice.

## Scripts disponibles

### API Testing
- `test-api.py` - Suite completa de pruebas del API (Python)
- `test-endpoints.sh` - Prueba endpoints principales (Bash)
- `test-detail-endpoints.sh` - Prueba endpoints de detalle (productos, pedidos, clientes)
- `test-order-detail.sh` - Prueba específica para detalle de pedidos

### Configuración
- `fix-apache-cors.sh` - Script para configurar CORS en Apache (solo desarrollo local)

## Uso

### Python (recomendado)
```bash
python3 tests/test-api.py
```

### Bash
```bash
chmod +x tests/test-endpoints.sh
./tests/test-endpoints.sh
```

## Nota
Estos scripts usan tokens de prueba. Actualiza las variables de entorno o tokens según tu entorno.
