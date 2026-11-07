-- Épica 4 — Gestión de Pago: migración para bases de datos que YA tenían la Épica 3.
-- Es idempotente (se puede ejecutar varias veces) y no hace nada en una base nueva creada con 01_schema.sql.
-- La ejecuta `npm run db:init` justo después de 01_schema.sql.

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pago_estado     VARCHAR(25) NOT NULL DEFAULT 'pendiente';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pago_referencia VARCHAR(20);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pagado_en       TIMESTAMPTZ;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS metodo_pago_id  INTEGER;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS devolucion_ref  VARCHAR(20);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS devuelto_en     TIMESTAMPTZ;

-- Mercado Pago ya no existe como método: esos pedidos antiguos pasan a "tarjeta".
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_metodo_pago_check;
UPDATE pedidos SET metodo_pago = 'tarjeta' WHERE metodo_pago = 'mercadopago';
ALTER TABLE pedidos ADD CONSTRAINT pedidos_metodo_pago_check CHECK (metodo_pago IN ('tarjeta', 'efectivo'));

ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_pago_estado_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_pago_estado_check
    CHECK (pago_estado IN ('pendiente', 'aprobado', 'devolucion_en_proceso', 'devuelto', 'anulado'));

-- Pedidos anteriores a la E4 (se pagaban "con tarjeta" de forma simulada): quedan como aprobados.
UPDATE pedidos SET pago_estado = 'aprobado', pagado_en = creado_en, pago_referencia = 'TX-' || (1000 + id)
 WHERE metodo_pago = 'tarjeta' AND pago_referencia IS NULL AND pago_estado = 'pendiente' AND estado <> 'cancelado';
UPDATE pedidos SET pago_estado = 'devolucion_en_proceso', pagado_en = creado_en,
                   pago_referencia = 'TX-' || (1000 + id), devolucion_ref = 'DEV-' || (1000 + id)
 WHERE metodo_pago = 'tarjeta' AND pago_referencia IS NULL AND pago_estado = 'pendiente' AND estado = 'cancelado';

-- Las tarjetas guardadas (tabla nueva) ya vienen de 01_schema.sql.
