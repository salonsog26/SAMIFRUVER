import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ProductosContext = createContext(null);

const API_URL = 'http://localhost:4000';

export function validarProducto(datos) {
    const errores = {};
    if (!datos.nombre?.trim()) {
        errores.nombre = 'Este campo es obligatorio';
    }

    const precioNumero = Number(datos.precio);
    if (datos.precio === '' || datos.precio == null || Number.isNaN(precioNumero) || precioNumero <= 0) {
        errores.precio = 'Ingresa un precio válido';
    }

    if (!datos.categoria) {
        errores.categoria = 'Selecciona una categoría';
    }

    const stockNumero = Number(datos.stock);
    if (datos.stock === '' || datos.stock == null || Number.isNaN(stockNumero) || stockNumero < 0) {
        errores.stock = 'Ingresa un stock válido';
    }

    if (!datos.unidad) {
        errores.unidad = 'Selecciona una unidad de medida';
    }
    return errores;
}

export function ProductosProvider({ children }) {
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState('');

    const cargarProductos = async () => {
        setCargando(true);
        try {
            const respuesta = await fetch(`${API_URL}/api/productos`);
            const data = await respuesta.json();
            setProductos(data);
            setErrorCarga('');
        } catch (error) {
            setErrorCarga('No se pudo conectar con el servidor.');
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarProductos();
    }, []);

    const value = useMemo(() => ({
        productos,
        cargando,
        errorCarga,
        recargar: cargarProductos,

        obtenerPorId: (id) => productos.find((producto) => String(producto.id) === String(id)),

        // Devuelve el producto creado o lanza un error con un mensaje legible.
        agregarProducto: async (datos) => {
            const respuesta = await fetch(`${API_URL}/api/productos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: datos.nombre.trim(),
                    precio: Number(datos.precio),
                    categoria: datos.categoria,
                    stock: Number(datos.stock),
                    unidad: datos.unidad || 'lb'
                })
            });
            const data = await respuesta.json();
            if (!respuesta.ok) throw new Error(data.mensaje || 'No se pudo registrar el producto.');

            setProductos((prev) => [...prev, data.producto]);
            return data.producto;
        },

        actualizarProducto: async (id, datos) => {
            const respuesta = await fetch(`${API_URL}/api/productos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: datos.nombre.trim(),
                    precio: Number(datos.precio),
                    categoria: datos.categoria,
                    stock: Number(datos.stock),
                    unidad: datos.unidad || 'lb'
                })
            });
            const data = await respuesta.json();
            if (!respuesta.ok) throw new Error(data.mensaje || 'No se pudo actualizar el producto.');

            setProductos((prev) => prev.map((p) => (String(p.id) === String(id) ? data.producto : p)));
            return data.producto;
        },

        eliminarProducto: async (id) => {
            const respuesta = await fetch(`${API_URL}/api/productos/${id}`, { method: 'DELETE' });
            if (!respuesta.ok) {
                const data = await respuesta.json().catch(() => ({}));
                throw new Error(data.mensaje || 'No se pudo eliminar el producto.');
            }
            setProductos((prev) => prev.filter((p) => String(p.id) !== String(id)));
        },
    }), [productos, cargando, errorCarga]);

    return (
        <ProductosContext.Provider value={value}>
            {children}
        </ProductosContext.Provider>
    );
}

export function useProductos() {
    const context = useContext(ProductosContext);
    if (!context) {
        throw new Error('useProductos debe usarse dentro de ProductosProvider');
    }
    return context;
}
