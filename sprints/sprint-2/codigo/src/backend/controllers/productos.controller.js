// src/backend/controllers/productos.controller.js
const { leer, escribir, siguienteId, esTexto } = require('../lib/store');
const { validarCamposProducto } = require('../lib/validaciones');

const ARCHIVO = 'productos.json';
const mismoNombre = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

// 1. Obtener todos
const obtenerProductos = (req, res) => {
    res.json(leer(ARCHIVO));
};

// 2. Crear producto (E1-HU1)
const crearProducto = (req, res) => {
    const body = req.body || {};
    const errorValidacion = validarCamposProducto(body);
    if (errorValidacion) return res.status(400).json({ mensaje: errorValidacion });

    const productos = leer(ARCHIVO);
    if (productos.some((p) => mismoNombre(p.nombre, body.nombre))) {
        return res.status(409).json({ mensaje: 'El producto ya existe.' });
    }

    const nuevoProducto = {
        id: siguienteId(productos),
        nombre: body.nombre.trim(),
        precio: Number(body.precio),
        categoria: body.categoria,
        stock: Number(body.stock),
        unidad: body.unidad || 'lb',
        imagen: esTexto(body.imagen) && body.imagen ? body.imagen : '/images/producto-defecto.webp'
    };

    productos.push(nuevoProducto);
    escribir(ARCHIVO, productos);
    res.status(201).json({ mensaje: 'Producto registrado con éxito', producto: nuevoProducto });
};

// 3. Actualizar producto (E1-HU2). Admite actualización parcial.
const actualizarProducto = (req, res) => {
    const body = req.body || {};
    const productos = leer(ARCHIVO);
    const index = productos.findIndex((p) => p.id === Number(req.params.id));
    if (index === -1) return res.status(404).json({ mensaje: 'Producto no encontrado' });

    const actual = productos[index];
    const combinado = {
        nombre: body.nombre !== undefined ? body.nombre : actual.nombre,
        precio: body.precio !== undefined ? body.precio : actual.precio,
        categoria: body.categoria !== undefined ? body.categoria : actual.categoria,
        stock: body.stock !== undefined ? body.stock : actual.stock,
        unidad: body.unidad !== undefined ? body.unidad : actual.unidad
    };
    const errorValidacion = validarCamposProducto(combinado);
    if (errorValidacion) return res.status(400).json({ mensaje: errorValidacion });

    if (productos.some((p, i) => i !== index && mismoNombre(p.nombre, combinado.nombre))) {
        return res.status(409).json({ mensaje: 'El producto ya existe.' });
    }

    productos[index] = {
        ...actual,
        nombre: combinado.nombre.trim(),
        precio: Number(combinado.precio),
        categoria: combinado.categoria,
        stock: Number(combinado.stock),
        unidad: combinado.unidad
    };
    escribir(ARCHIVO, productos);
    res.json({ mensaje: 'Producto actualizado con éxito', producto: productos[index] });
};

// 4. Eliminar producto
const eliminarProducto = (req, res) => {
    const productos = leer(ARCHIVO);
    const filtrados = productos.filter((p) => p.id !== Number(req.params.id));
    if (filtrados.length === productos.length) return res.status(404).json({ mensaje: 'Producto no encontrado' });
    escribir(ARCHIVO, filtrados);
    res.json({ mensaje: 'Producto eliminado con éxito' });
};

module.exports = { obtenerProductos, crearProducto, actualizarProducto, eliminarProducto };
