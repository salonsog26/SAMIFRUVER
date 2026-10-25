// src/utils/carrito.js — Épica 3 (HU2): carrito de compras del cliente
// El carrito vive en localStorage (uno por cliente) para que no se pierda al recargar ni al cambiar de pantalla.
// Cualquier componente puede leerlo con useCarrito(); al cambiar, todos se actualizan solos.
import { useMemo, useSyncExternalStore } from 'react';
import { obtenerSesion } from './auth';
import { DOMICILIO } from './pedidos';

const EVENTO = 'samifruber:carrito';
export const MSJ_SIN_STOCK = 'No hay más unidades disponibles de este producto';

const clave = () => {
    const sesion = obtenerSesion();
    return sesion && sesion.rol === 'cliente' && sesion.id ? `samifruber_carrito_${sesion.id}` : null;
};

const leerTexto = () => {
    try { const k = clave(); return k ? localStorage.getItem(k) || '[]' : '[]'; } catch (e) { return '[]'; }
};
const parsear = (texto) => {
    try {
        const lista = JSON.parse(texto);
        return Array.isArray(lista) ? lista.filter((i) => i && Number.isInteger(i.productoId) && i.cantidad > 0) : [];
    } catch (e) { return []; }
};
const guardar = (items) => {
    try {
        const k = clave();
        if (!k) return;
        localStorage.setItem(k, JSON.stringify(items));
    } catch (e) { /* almacenamiento no disponible */ }
    window.dispatchEvent(new Event(EVENTO));
};

export const leerCarrito = () => parsear(leerTexto());

// Agrega 1 unidad. Devuelve { ok } o { ok:false, mensaje, disponible } si no hay más stock.
export function agregarAlCarrito(producto) {
    if (!clave()) return { ok: false, mensaje: 'Inicia sesión como cliente para usar el carrito.', sinSesion: true };
    const stock = Number(producto.stock);
    const items = leerCarrito();
    const actual = items.find((i) => i.productoId === producto.id);
    const cantidadActual = actual ? actual.cantidad : 0;
    if (!(stock > 0)) return { ok: false, mensaje: 'Este producto está agotado.', disponible: 0 };
    if (cantidadActual + 1 > stock) return { ok: false, mensaje: MSJ_SIN_STOCK, disponible: stock };

    if (actual) {
        actual.cantidad += 1;
        actual.stock = stock;
    } else {
        items.push({
            productoId: producto.id, nombre: producto.nombre, precio: Number(producto.precio),
            unidad: producto.unidad || 'lb', imagen: producto.imagen || '', stock, cantidad: 1
        });
    }
    guardar(items);
    return { ok: true };
}

// delta = +1 / -1. Nunca baja de 1 (para quitar un producto se usa "Eliminar") ni pasa del stock.
export function cambiarCantidad(productoId, delta) {
    const items = leerCarrito();
    const item = items.find((i) => i.productoId === productoId);
    if (!item) return { ok: false };
    const nueva = item.cantidad + delta;
    if (delta > 0 && nueva > item.stock) return { ok: false, mensaje: MSJ_SIN_STOCK, disponible: item.stock, item };
    if (nueva < 1) return { ok: false };
    item.cantidad = nueva;
    guardar(items);
    return { ok: true };
}

export function eliminarDelCarrito(productoId) {
    guardar(leerCarrito().filter((i) => i.productoId !== productoId));
}

export function vaciarCarrito() {
    guardar([]);
}

// Actualiza precio y stock con los datos actuales del catálogo; quita lo que ya no existe o se agotó.
// Devuelve los nombres que se quitaron para avisarle al cliente.
export function sincronizarConCatalogo(productos) {
    const items = leerCarrito();
    const quitados = [];
    const nuevos = [];
    for (const i of items) {
        const p = productos.find((x) => x.id === i.productoId);
        if (!p || !(Number(p.stock) > 0)) { quitados.push(i.nombre); continue; }
        const stock = Number(p.stock);
        nuevos.push({ ...i, nombre: p.nombre, precio: Number(p.precio), unidad: p.unidad || i.unidad, imagen: p.imagen || i.imagen, stock, cantidad: Math.min(i.cantidad, Math.floor(stock)) });
    }
    if (JSON.stringify(nuevos) !== JSON.stringify(items)) guardar(nuevos);
    return quitados;
}

export const totalesDe = (items) => {
    const subtotal = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const unidades = items.reduce((s, i) => s + i.cantidad, 0);
    const domicilio = items.length > 0 ? DOMICILIO : 0;
    return { productos: items.length, unidades, subtotal, domicilio, total: subtotal + domicilio };
};

const suscribir = (aviso) => {
    window.addEventListener(EVENTO, aviso);
    window.addEventListener('storage', aviso);
    return () => { window.removeEventListener(EVENTO, aviso); window.removeEventListener('storage', aviso); };
};

// Hook: { items, ...totales }. Se vuelve a calcular solo cuando cambia el carrito o la sesión.
export function useCarrito() {
    const texto = useSyncExternalStore(suscribir, leerTexto, () => '[]');
    return useMemo(() => {
        const items = parsear(texto);
        return { items, ...totalesDe(items) };
    }, [texto]);
}
