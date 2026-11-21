-- =====================================================================
-- SAMIFRUVER — Migración de bases con pedidos del esquema antiguo
-- (previo a la Épica 3). Agrega las columnas que usa el backend actual.
-- Es idempotente y no borra datos: pedidos/pedido_items vacíos o con
-- filas antiguas conservan todo; las columnas nuevas quedan con su
-- valor por defecto.
-- npm run db:init lo ejecuta después de 03_domicilios.sql.
-- =====================================================================

-- pedidos: desglose y dirección copiados al momento de la compra
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS domicilio NUMERIC(12,2) NOT NULL DEFAULT 0;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pago_detalle VARCHAR(60) NOT NULL DEFAULT '';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS dir_alias VARCHAR(40) NOT NULL DEFAULT 'Casa';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS dir_nombre VARCHAR(80) NOT NULL DEFAULT '';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS dir_linea VARCHAR(160) NOT NULL DEFAULT '';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS dir_ciudad VARCHAR(60) NOT NULL DEFAULT '';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS dir_telefono VARCHAR(30) NOT NULL DEFAULT '';

-- La columna vieja "direccion" (texto libre) ya no se usa: el backend guarda dir_*.
-- Se conserva por compatibilidad pero se permite NULL para los INSERT actuales.
ALTER TABLE pedidos ALTER COLUMN direccion DROP NOT NULL;

-- repartidor con los nombres que usa el backend (el esquema viejo usaba repartidor_tel)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS repartidor_vehiculo VARCHAR(40);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS repartidor_telefono VARCHAR(30);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS devolucion_iniciada BOOLEAN NOT NULL DEFAULT FALSE;

-- horas por estado (el esquema viejo usaba hora_recibido/hora_preparacion/...)
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS preparacion_en TIMESTAMPTZ;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS en_camino_en TIMESTAMPTZ;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS entregado_en TIMESTAMPTZ;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cancelado_en TIMESTAMPTZ;

-- estado: el esquema viejo admitía 'camino'; el actual usa 'en_camino'
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_estado_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_estado_check
    CHECK (estado IN ('recibido', 'preparacion', 'en_camino', 'entregado', 'cancelado'));

ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_subtotal_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_subtotal_check CHECK (subtotal >= 0);
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_domicilio_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_domicilio_check CHECK (domicilio >= 0);

-- pedido_items: el esquema viejo guardaba nombre_producto; el actual copia
-- nombre, imagen y subtotal del producto al momento de la compra.
ALTER TABLE pedido_items ADD COLUMN IF NOT EXISTS nombre VARCHAR(60);
ALTER TABLE pedido_items ADD COLUMN IF NOT EXISTS imagen TEXT NOT NULL DEFAULT '/images/producto-defecto.webp';
ALTER TABLE pedido_items ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2) NOT NULL DEFAULT 0;
UPDATE pedido_items SET nombre = nombre_producto WHERE nombre IS NULL AND nombre_producto IS NOT NULL;
ALTER TABLE pedido_items ALTER COLUMN nombre SET NOT NULL;
-- nombre_producto queda como columna legada; el backend inserta "nombre".
ALTER TABLE pedido_items ALTER COLUMN nombre_producto DROP NOT NULL;
ALTER TABLE pedido_items DROP CONSTRAINT IF EXISTS pedido_items_subtotal_check;
ALTER TABLE pedido_items ADD CONSTRAINT pedido_items_subtotal_check CHECK (subtotal >= 0);

-- Foto de perfil (clientes y domiciliarios). Vacío = la interfaz muestra iniciales.
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS foto TEXT NOT NULL DEFAULT '';
ALTER TABLE domiciliarios ADD COLUMN IF NOT EXISTS foto TEXT NOT NULL DEFAULT '';
