// src/backend/controllers/productos.controller.js
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/productos.json');

const leerProductos = () => {
    try {
        const jsonData = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(jsonData);
    } catch (error) {
        return [];
    }
};

const escribirProductos = (productos) => {
    fs.writeFileSync(filePath, JSON.stringify(productos, null, 2), 'utf-8');
};

// 1. Obtener todos
const obtenerProductos = (req, res) => {
    const productos = leerProductos();
    res.json(productos);
};

// Valida los campos de un producto. Devuelve un mensaje de error, o null si todo está bien.
const validarCamposProducto = (body) => {
    const nombre = (body.nombre || '').trim();
    if (!nombre) return 'El nombre del producto es obligatorio.';

    const precio = Number(body.precio);
    if (body.precio === undefined || body.precio === '' || Number.isNaN(precio) || precio <= 0) {
        return 'El precio debe ser un número mayor a 0.';
    }

    if (!body.categoria) return 'La categoría es obligatoria.';

    const stock = Number(body.stock);
    if (body.stock === undefined || body.stock === '' || Number.isNaN(stock) || stock < 0) {
        return 'El stock debe ser un número mayor o igual a 0.';
    }

    return null;
};

// 2. Crear producto
const crearProducto = (req, res) => {
    const errorValidacion = validarCamposProducto(req.body);
    if (errorValidacion) {
        return res.status(400).json({ mensaje: errorValidacion });
    }

    const productos = leerProductos();
    const nuevoProducto = {
        id: productos.length > 0 ? productos[productos.length - 1].id + 1 : 1,
        nombre: req.body.nombre.trim(),
        precio: Number(req.body.precio),
        categoria: req.body.categoria,
        stock: Number(req.body.stock),
        unidad: req.body.unidad || 'lb',
        imagen: req.body.imagen || '/images/producto-defecto.webp'
    };

    productos.push(nuevoProducto);
    escribirProductos(productos);
    res.status(201).json({ mensaje: 'Producto registrado con éxito', producto: nuevoProducto });
};

// 3. Actualizar producto (PUT)
const actualizarProducto = (req, res) => {
    const { id } = req.params;
    let productos = leerProductos();

    const index = productos.findIndex(p => p.id === Number(id));
    if (index === -1) {
        return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    // Solo valida los campos que realmente vienen en la petición (actualización parcial).
    const datosAValidar = {
        nombre: req.body.nombre !== undefined ? req.body.nombre : productos[index].nombre,
        precio: req.body.precio !== undefined ? req.body.precio : productos[index].precio,
        categoria: req.body.categoria !== undefined ? req.body.categoria : productos[index].categoria,
        stock: req.body.stock !== undefined ? req.body.stock : productos[index].stock,
    };
    const errorValidacion = validarCamposProducto(datosAValidar);
    if (errorValidacion) {
        return res.status(400).json({ mensaje: errorValidacion });
    }

    productos[index] = {
        ...productos[index],
        nombre: req.body.nombre !== undefined ? req.body.nombre.trim() : productos[index].nombre,
        precio: req.body.precio !== undefined ? Number(req.body.precio) : productos[index].precio,
        categoria: req.body.categoria || productos[index].categoria,
        stock: req.body.stock !== undefined ? Number(req.body.stock) : productos[index].stock,
        unidad: req.body.unidad || productos[index].unidad
    };

    escribirProductos(productos);
    res.json({ mensaje: 'Producto actualizado con éxito', producto: productos[index] });
};

// 4. Eliminar producto (DELETE)
const eliminarProducto = (req, res) => {
    const { id } = req.params;
    let productos = leerProductos();

    const productosFiltrados = productos.filter(p => p.id !== Number(id));

    if (productos.length === productosFiltrados.length) {
        return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    escribirProductos(productosFiltrados);
    res.json({ mensaje: 'Producto eliminado con éxito' });
};

module.exports = {
    obtenerProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto
};