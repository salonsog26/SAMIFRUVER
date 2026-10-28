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

// 2. Crear producto
const crearProducto = (req, res) => {
    const productos = leerProductos();
    const nuevoProducto = {
        id: productos.length > 0 ? productos[productos.length - 1].id + 1 : 1,
        nombre: req.body.nombre,
        precio: Number(req.body.precio),
        categoria: req.body.categoria,
        stock: Number(req.body.stock),
        unidad: req.body.unidad || 'lb',
        imagen: req.body.imagen || 'https://placehold.co/280x220'
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

    productos[index] = {
        ...productos[index],
        nombre: req.body.nombre || productos[index].nombre,
        precio: req.body.precio ? Number(req.body.precio) : productos[index].precio,
        categoria: req.body.categoria || productos[index].categoria,
        stock: req.body.stock ? Number(req.body.stock) : productos[index].stock
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