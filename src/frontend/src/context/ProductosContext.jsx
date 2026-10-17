import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_URL } from '../utils/config';

import { API_URL } from '../utils/config';

const ProductosContext = createContext(null);

export function validarProducto(datos) {
    const errores = {};
    const nombre = (datos.nombre || '').trim();
    if (!nombre) {
        errores.nombre = 'Este campo es obligatorio';
    } else if (nombre.length < 2 || nombre.length > 60 || !/^[\p{L}\p{N}][\p{L}\p{N} .,'()\-]*$/u.test(nombre)) {
        errores.nombre = 'Ingresa un nombre válido (2 a 60 caracteres, solo letras y números)';
    }

    if (datos.precio === '' || datos.precio == null) {
        errores.precio = 'El precio es obligatorio';
    } else if (!/^\d+(\.\d+)?$/.test(String(datos.precio).trim())) {
        errores.precio = 'El precio debe ser un número válido';
    } else if (Number(datos.precio) <= 0) {
        errores.precio = 'El precio debe ser mayor que cero';
    }

    if (!datos.categoria) {
        errores.categoria = 'Selecciona una categoría';
    }

    if (datos.stock === '' || datos.stock == null) {
        errores.stock = 'El stock es obligatorio';
    } else if (!/^\d+$/.test(String(datos.stock).trim())) {
        errores.stock = 'El stock debe ser un número entero válido (sin decimales)';
    } else if (Number(datos.stock) < 0) {
        errores.stock = 'El stock no puede ser negativo';
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

        agregarProducto: async (datos) => {
            const respuesta = await fetch(`${API_URL}/api/productos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: datos.nombre.trim(),
                    precio: Number(datos.precio),
                    categoria: datos.categoria,
                    stock: Number(datos.stock),
                    unidad: datos.unidad || 'lb',
                    imagen: datos.imagen || ''
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
                    unidad: datos.unidad || 'lb',
                    imagen: datos.imagen || ''
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