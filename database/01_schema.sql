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
