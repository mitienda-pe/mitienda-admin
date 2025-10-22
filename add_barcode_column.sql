-- Script para agregar columna barcode a la tabla productos
-- Enfoque de 3 pasos para minimizar bloqueos

-- CONFIGURACIÓN: Aumentar timeouts para tablas grandes
SET SESSION max_execution_time = 0;
SET SESSION wait_timeout = 28800;
SET SESSION interactive_timeout = 28800;

-- PASO 1: Agregar columna sin índice (más rápido y menos bloqueante)
-- Esto usa ALGORITHM=COPY implícitamente pero es más estable
ALTER TABLE productos
ADD COLUMN producto_barcode VARCHAR(50) NULL
AFTER producto_sku;

-- PASO 2: Agregar índice en segundo comando (operación separada)
-- Ejecutar este comando DESPUÉS de que el anterior termine exitosamente
-- CREATE INDEX idx_productos_barcode ON productos(producto_barcode);

-- NOTAS IMPORTANTES:
-- 1. Ejecuta PASO 1 primero (agregar columna)
-- 2. Luego ejecuta PASO 2 (crear índice) cuando el PASO 1 termine
-- 3. Para tablas grandes (>1M registros), considera ejecutar durante horarios de bajo tráfico
-- 4. El índice es opcional, solo créalo si necesitas buscar por barcode frecuentemente
-- 5. Monitor: SELECT COUNT(*) FROM information_schema.processlist WHERE state = 'copy to tmp table';

-- ALTERNATIVA: Si quieres hacerlo todo en un comando (más lento pero funciona):
-- ALTER TABLE productos ADD COLUMN producto_barcode VARCHAR(50) NULL AFTER producto_sku, ADD INDEX idx_productos_barcode (producto_barcode);
