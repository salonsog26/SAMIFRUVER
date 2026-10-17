// src/backend/controllers/productos.controller.js — catálogo de productos (Épica 1)
const { query, esDuplicado } = require('../lib/db');
const { esTexto, asincrono, idDeUrl } = require('../lib/util');
const { validarCamposProducto } = require('../lib/validaciones');

const MSJ_DUPLICADO = 'El producto ya existe.';
const MSJ_NO_ENCONTRADO = 'Producto no encontrado';

// Mismo formato JSON que usaba el frontend: categoria como texto, precio y stock como número.
const SELECT_PRODUCTO = `
    SELECT p.id, p.nombre, p.precio, c.nombre AS categoria, p.stock, p.unidad, p.imagen
    FROM productos p
    JOIN categorias c ON c.id = p.categoria_id`;

const aProducto = (r) => ({
    id: r.id,
    nombre: r.nombre,
    precio: Number(r.precio),
    categoria: r.categoria,
    stock: Number(r.stock),
    unidad: r.unidad,
    imagen: r.imagen
});

const buscarPorId = async (id) => {
    const { rows } = await query(`${SELECT_PRODUCTO} WHERE p.id = $1`, [id]);
    return rows[0] ? aProducto(rows[0]) : null;
};

const mismoNombre = async (nombre, exceptoId = null) => {
    const { rows } = await query(
        'SELECT 1 FROM productos WHERE LOWER(nombre) = LOWER($1) AND ($2::int IS NULL OR id <> $2) LIMIT 1',
        [nombre.trim(), exceptoId]
    );
    return rows.length > 0;
};

// 1. Obtener todos
const obtenerProductos = asincrono(async (req, res) => {
    const { rows } = await query(`${SELECT_PRODUCTO} ORDER BY p.id`);
    res.json(rows.map(aProducto));
});

// 2. Crear producto (E1-HU1)
const crearProducto = asincrono(async (req, res) => {
    const body = req.body || {};
    const errorValidacion = validarCamposProducto(body);
    if (errorValidacion) return res.status(400).json({ mensaje: errorValidacion });

    if (await mismoNombre(body.nombre)) return res.status(409).json({ mensaje: MSJ_DUPLICADO });

    const imagen = esTexto(body.imagen) && body.imagen ? body.imagen : '/images/producto-defecto.webp';
    try {
        const { rows } = await query(
            `INSERT INTO productos (nombre, precio, categoria_id, stock, unidad, imagen)
             VALUES ($1, $2, (SELECT id FROM categorias WHERE nombre = $3), $4, $5, $6)
             RETURNING id`,
            [body.nombre.trim(), Number(body.precio), body.categoria, Number(body.stock), body.unidad || 'lb', imagen]
        );
        res.status(201).json({ mensaje: 'Producto registrado con éxito', producto: await buscarPorId(rows[0].id) });
    } catch (error) {
        if (esDuplicado(error)) return res.status(409).json({ mensaje: MSJ_DUPLICADO });
        throw error;
    }
});

// 3. Actualizar producto (E1-HU2). Admite actualización parcial.
const actualizarProducto = asincrono(async (req, res) => {
    const body = req.body || {};
    const id = idDeUrl(req.params.id);
    const actual = id === null ? null : await buscarPorId(id);
    if (!actual) return res.status(404).json({ mensaje: MSJ_NO_ENCONTRADO });

    const combinado = {
        nombre: body.nombre !== undefined ? body.nombre : actual.nombre,
        precio: body.precio !== undefined ? body.precio : actual.precio,
        categoria: body.categoria !== undefined ? body.categoria : actual.categoria,
        stock: body.stock !== undefined ? body.stock : actual.stock,
        unidad: body.unidad !== undefined ? body.unidad : actual.unidad
    };
    const errorValidacion = validarCamposProducto(combinado);
    if (errorValidacion) return res.status(400).json({ mensaje: errorValidacion });

    if (await mismoNombre(combinado.nombre, id)) return res.status(409).json({ mensaje: MSJ_DUPLICADO });

    // La imagen solo cambia si viene una nueva (texto no vacío).
    const imagen = esTexto(body.imagen) && body.imagen ? body.imagen : actual.imagen;
    try {
        await query(
            `UPDATE productos
                SET nombre = $1, precio = $2, categoria_id = (SELECT id FROM categorias WHERE nombre = $3),
                    stock = $4, unidad = $5, imagen = $6, actualizado_en = now()
              WHERE id = $7`,
            [combinado.nombre.trim(), Number(combinado.precio), combinado.categoria, Number(combinado.stock), combinado.unidad, imagen, id]
        );
        res.json({ mensaje: 'Producto actualizado con éxito', producto: await buscarPorId(id) });
    } catch (error) {
        if (esDuplicado(error)) return res.status(409).json({ mensaje: MSJ_DUPLICADO });
        throw error;
    }
});

// 4. Eliminar producto
const eliminarProducto = asincrono(async (req, res) => {
    const id = idDeUrl(req.params.id);
    const resultado = id === null ? { rowCount: 0 } : await query('DELETE FROM productos WHERE id = $1', [id]);
    if (resultado.rowCount === 0) return res.status(404).json({ mensaje: MSJ_NO_ENCONTRADO });
    res.json({ mensaje: 'Producto eliminado con éxito' });
});

module.exports = { obtenerProductos, crearProducto, actualizarProducto, eliminarProducto };
