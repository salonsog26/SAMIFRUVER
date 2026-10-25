-- =====================================================================
-- SAMIFRUVER — Esquema de la base de datos (PostgreSQL 14+)
-- Ejecutar UNA vez sobre una base vacía:  npm run db:init   (ver README.md)
-- =====================================================================

-- Categorías del catálogo (Verduras, Frutas, Especias...).
CREATE TABLE IF NOT EXISTS categorias (
    id      SERIAL PRIMARY KEY,
    nombre  VARCHAR(40) NOT NULL UNIQUE
);

-- Administradores del panel (Épica 1, HU4). La contraseña se guarda cifrada (scrypt), nunca en texto plano.
CREATE TABLE IF NOT EXISTS administradores (
    id             SERIAL PRIMARY KEY,
    nombre         VARCHAR(60)  NOT NULL,
    correo         VARCHAR(120) NOT NULL,
    password_hash  TEXT         NOT NULL,
    creado_en      TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_administradores_correo ON administradores (LOWER(correo));

-- Clientes registrados (Épica 2: HU1 registro, HU2 login, HU3 editar perfil).
-- documento, direccion y ciudad son opcionales: se guardan como texto vacío si no se llenan.
CREATE TABLE IF NOT EXISTS clientes (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(60)  NOT NULL,
    correo          VARCHAR(120) NOT NULL,
    telefono        VARCHAR(30)  NOT NULL,
    password_hash   TEXT         NOT NULL,
    documento       VARCHAR(30)  NOT NULL DEFAULT '',
    direccion       VARCHAR(120) NOT NULL DEFAULT '',
    ciudad          VARCHAR(60)  NOT NULL DEFAULT '',
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    actualizado_en  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
-- El correo no distingue mayúsculas: ANA@x.com y ana@x.com son el mismo cliente ("El usuario ya existe").
CREATE UNIQUE INDEX IF NOT EXISTS ux_clientes_correo ON clientes (LOWER(correo));

-- Productos del catálogo (Épica 1: HU1 registrar, HU2 actualizar, HU3 consultar).
CREATE TABLE IF NOT EXISTS productos (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(60)    NOT NULL,
    precio          NUMERIC(12,2)  NOT NULL CHECK (precio > 0),
    categoria_id    INTEGER        NOT NULL REFERENCES categorias (id),
    stock           NUMERIC(12,2)  NOT NULL CHECK (stock >= 0),
    unidad          VARCHAR(10)    NOT NULL DEFAULT 'lb' CHECK (unidad IN ('lb', 'unidad')),
    imagen          TEXT           NOT NULL DEFAULT '/images/producto-defecto.webp',
    creado_en       TIMESTAMPTZ    NOT NULL DEFAULT now(),
    actualizado_en  TIMESTAMPTZ    NOT NULL DEFAULT now()
);
-- No puede haber dos productos con el mismo nombre (sin importar mayúsculas).
CREATE UNIQUE INDEX IF NOT EXISTS ux_productos_nombre ON productos (LOWER(nombre));
CREATE INDEX IF NOT EXISTS ix_productos_categoria ON productos (categoria_id);

-- =====================================================================
-- Épica 3 — Gestión de Pedidos
-- =====================================================================

-- Pedidos de los clientes (E3-HU2 crear, HU1 consultar/seguimiento, HU3 historial, HU4 cancelar).
-- estado: recibido → preparacion → en_camino → entregado   (o cancelado)
-- La dirección y el pago se guardan COPIADOS en el pedido: si el cliente cambia su perfil después,
-- el pedido conserva los datos con los que se hizo.
-- Cada cambio de estado guarda su hora (creado_en = "Pedido recibido") para la línea de seguimiento.
CREATE TABLE IF NOT EXISTS pedidos (
    id                   SERIAL PRIMARY KEY,
    cliente_id           INTEGER        NOT NULL REFERENCES clientes (id),
    estado               VARCHAR(15)    NOT NULL DEFAULT 'recibido'
                         CHECK (estado IN ('recibido', 'preparacion', 'en_camino', 'entregado', 'cancelado')),
    subtotal             NUMERIC(12,2)  NOT NULL CHECK (subtotal >= 0),
    domicilio            NUMERIC(12,2)  NOT NULL DEFAULT 0 CHECK (domicilio >= 0),
    total                NUMERIC(12,2)  NOT NULL CHECK (total >= 0),
    metodo_pago          VARCHAR(15)    NOT NULL CHECK (metodo_pago IN ('tarjeta', 'mercadopago')),
    pago_detalle         VARCHAR(60)    NOT NULL DEFAULT '',
    dir_alias            VARCHAR(40)    NOT NULL DEFAULT 'Casa',
    dir_nombre           VARCHAR(80)    NOT NULL DEFAULT '',
    dir_linea            VARCHAR(160)   NOT NULL,
    dir_ciudad           VARCHAR(60)    NOT NULL,
    dir_telefono         VARCHAR(30)    NOT NULL DEFAULT '',
    repartidor_nombre    VARCHAR(80),
    repartidor_vehiculo  VARCHAR(40),
    repartidor_telefono  VARCHAR(30),
    devolucion_iniciada  BOOLEAN        NOT NULL DEFAULT FALSE,
    creado_en            TIMESTAMPTZ    NOT NULL DEFAULT now(),
    preparacion_en       TIMESTAMPTZ,
    en_camino_en         TIMESTAMPTZ,
    entregado_en         TIMESTAMPTZ,
    cancelado_en         TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ix_pedidos_cliente ON pedidos (cliente_id, creado_en);

-- Productos de cada pedido. Se copian nombre, imagen y precio del momento de la compra, así el historial
-- no cambia si luego se edita o se elimina el producto (en ese caso producto_id queda en NULL).
CREATE TABLE IF NOT EXISTS pedido_items (
    id               SERIAL PRIMARY KEY,
    pedido_id        INTEGER        NOT NULL REFERENCES pedidos (id) ON DELETE CASCADE,
    producto_id      INTEGER        REFERENCES productos (id) ON DELETE SET NULL,
    nombre           VARCHAR(60)    NOT NULL,
    imagen           TEXT           NOT NULL DEFAULT '/images/producto-defecto.webp',
    unidad           VARCHAR(10)    NOT NULL DEFAULT 'lb',
    precio_unitario  NUMERIC(12,2)  NOT NULL CHECK (precio_unitario >= 0),
    cantidad         INTEGER        NOT NULL CHECK (cantidad > 0),
    subtotal         NUMERIC(12,2)  NOT NULL CHECK (subtotal >= 0)
);
CREATE INDEX IF NOT EXISTS ix_pedido_items_pedido ON pedido_items (pedido_id);
