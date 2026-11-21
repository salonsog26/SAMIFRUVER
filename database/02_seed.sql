-- =====================================================================
-- SAMIFRUVER — Datos iniciales (desarrollo y demo)
-- Se puede ejecutar varias veces: no duplica registros.
-- =====================================================================

INSERT INTO categorias (nombre)
SELECT v.nombre FROM (VALUES ('Verduras'), ('Frutas'), ('Especias')) AS v (nombre)
WHERE NOT EXISTS (SELECT 1 FROM categorias c WHERE c.nombre = v.nombre);

-- Administrador de demostración. Contraseña: admin123
-- >>> En producción cambia la contraseña (ver database/README.md, sección "Contraseña del administrador").
-- Se crean dos correos porque el proyecto se escribe SAMIFRUVER / SAMIFRUBER y el equipo prueba con ambos.
INSERT INTO administradores (nombre, correo, password_hash)
SELECT v.nombre, v.correo, v.hash
FROM (VALUES
    ('Administrador', 'admin@samifruver.com', 'scrypt$16384$73616d696672757665722d64656d6f2d73616c74$53c2d5d82f63a5c10128dae8c7685af7086659880dc6d862f329be1ffb5ae3b8821e7c97c6b8f0987b5f2eaa0c6782b75a4281f26d19cdcddc76a099493e263c'),
    ('Administrador', 'admin@samifruber.com', 'scrypt$16384$73616d696672757665722d64656d6f2d73616c74$53c2d5d82f63a5c10128dae8c7685af7086659880dc6d862f329be1ffb5ae3b8821e7c97c6b8f0987b5f2eaa0c6782b75a4281f26d19cdcddc76a099493e263c')
) AS v (nombre, correo, hash)
WHERE NOT EXISTS (SELECT 1 FROM administradores a WHERE LOWER(a.correo) = LOWER(v.correo));

-- Domiciliario de demostración (Épica 5). Contraseña: domicilio123
INSERT INTO domiciliarios (nombre, correo, telefono, vehiculo, foto, password_hash)
SELECT 'Carlos Ruiz', 'domicilio@samifruver.com', '310 555 0194', 'Moto', '/images/avatares/carlos-ruiz.svg',
       'scrypt$16384$73616d696672757665722d64656d6f2d73616c74$396fc659960231c206589e66cf17c8f4d63e10ac5d4f36a50726e16071c35423fb30e8c4a9f3ca42e04af4b559bb722e4d3452275ae731e09346e55d78d24926'
WHERE NOT EXISTS (SELECT 1 FROM domiciliarios d WHERE LOWER(d.correo) = 'domicilio@samifruver.com');

-- Productos de ejemplo (las imágenes viven en src/frontend/public/images).
-- Se usa WHERE NOT EXISTS para que volver a ejecutar el archivo no consuma números de id.
INSERT INTO productos (nombre, precio, categoria_id, stock, unidad, imagen)
SELECT v.nombre, v.precio, c.id, v.stock, v.unidad, v.imagen
FROM (VALUES
    ('Jengibre',      2800, 'Especias',  45, 'lb', '/images/jengibre.webp'),
    ('Tomate Chonto', 3500, 'Verduras', 120, 'lb', '/images/tomate-chonto.webp')
) AS v (nombre, precio, categoria, stock, unidad, imagen)
JOIN categorias c ON c.nombre = v.categoria
WHERE NOT EXISTS (SELECT 1 FROM productos p WHERE LOWER(p.nombre) = LOWER(v.nombre));
