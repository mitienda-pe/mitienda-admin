-- Script para agregar índice a producto_barcode (PASO 2)
-- Para tabla con ~600,000 productos

-- CONFIGURACIÓN: Aumentar timeouts
SET SESSION max_execution_time = 0;
SET SESSION wait_timeout = 28800;
SET SESSION interactive_timeout = 28800;

-- IMPORTANTE: Esta operación será BLOQUEANTE y puede tomar 2-5 minutos
-- Considera ejecutar durante horario de bajo tráfico (madrugada)

-- OPCIÓN 1: Crear índice estándar (RECOMENDADO para ahora)
-- Como todos los valores son NULL, será más rápido
-- Ejecuta esto cuando tengas bajo tráfico
CREATE INDEX idx_productos_barcode ON productos(producto_barcode);

-- OPCIÓN 2: Si tienes Percona/MariaDB 10.3+, usar online DDL
-- CREATE INDEX idx_productos_barcode ON productos(producto_barcode) ALGORITHM=INPLACE, LOCK=NONE;

-- VERIFICAR: Confirmar que el índice fue creado
-- SHOW INDEX FROM productos WHERE Key_name = 'idx_productos_barcode';

-- NOTAS:
-- 1. Con 600K registros, tomará entre 2-5 minutos
-- 2. Durante la creación del índice, la tabla estará en modo READ (lecturas OK, escrituras bloqueadas)
-- 3. Alternativa: NO crear el índice ahora, esperar a que varios productos tengan barcode
-- 4. El índice es opcional - solo mejora velocidad de búsqueda por barcode
