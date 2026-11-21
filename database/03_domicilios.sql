-- =====================================================================
-- SAMIFRUVER — Épica 5: domicilios
-- Para bases que ya tenían el esquema de la Épica 3.
-- Se puede ejecutar varias veces. No borra pedidos ni clientes.
-- npm run db:init lo ejecuta después de 01_schema.sql.
-- =====================================================================

CREATE TABLE IF NOT EXISTS domiciliarios (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(60)  NOT NULL,
    correo          VARCHAR(120) NOT NULL,
    telefono        VARCHAR(30)  NOT NULL,
    vehiculo        VARCHAR(40)  NOT NULL DEFAULT 'Moto',
    password_hash   TEXT         NOT NULL,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_domiciliarios_correo ON domiciliarios (LOWER(correo));

ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pago_estado VARCHAR(15) NOT NULL DEFAULT 'aprobado';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS dir_indicaciones VARCHAR(200) NOT NULL DEFAULT '';
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS domiciliario_id INTEGER REFERENCES domiciliarios (id);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS entrega_estimada TIMESTAMPTZ;

ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_metodo_pago_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_metodo_pago_check
    CHECK (metodo_pago IN ('tarjeta', 'mercadopago', 'efectivo'));

ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_pago_estado_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_pago_estado_check
    CHECK (pago_estado IN ('aprobado', 'pendiente', 'recibido'));

CREATE INDEX IF NOT EXISTS ix_pedidos_domiciliario ON pedidos (domiciliario_id, estado);
