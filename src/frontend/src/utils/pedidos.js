// src/utils/pedidos.js — Épica 3: formato, estados y llamadas a la API de pedidos
import { API_URL } from './config';
import { obtenerSesion } from './auth';

export const DOMICILIO = 5000;   // mismo valor que el backend (se usa solo para mostrar el resumen del carrito)

export const ESTADOS = {
    recibido: { etiqueta: 'Pedido recibido', tono: 'verde' },
    preparacion: { etiqueta: 'En preparación', tono: 'ambar' },
    en_camino: { etiqueta: 'En camino', tono: 'verde' },
    entregado: { etiqueta: 'Entregado', tono: 'verde' },
    cancelado: { etiqueta: 'Cancelado', tono: 'rojo' }
};
export const etiquetaEstado = (estado) => ESTADOS[estado]?.etiqueta || estado;
export const tonoEstado = (estado) => ESTADOS[estado]?.tono || 'verde';

// Etapas de la línea de seguimiento y el texto que se muestra mientras están pendientes.
export const ETAPAS = [
    { clave: 'recibido', etiqueta: 'Pedido recibido', pendiente: 'Por confirmar' },
    { clave: 'preparacion', etiqueta: 'En preparación', pendiente: 'Por confirmar' },
    { clave: 'en_camino', etiqueta: 'En camino', pendiente: 'Por confirmar' },
    { clave: 'entregado', etiqueta: 'Entregado', pendiente: 'Por estimar' }
];

// $ 39.500
export const formatoCOP = (valor) => `$ ${Math.round(Number(valor) || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

// Horas y fechas siempre en hora de Colombia, sin depender de la zona del computador.
const PARTES = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
});
const partes = (iso) => {
    const d = Object.fromEntries(PARTES.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
    return { dia: Number(d.day), mes: Number(d.month) - 1, anio: d.year, hora: d.hour, minuto: d.minute };
};
const MESES_CORTOS = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const hora = (iso) => { if (!iso) return ''; const p = partes(iso); return `${p.hora}:${p.minuto}`; };
export const fechaCorta = (iso) => { if (!iso) return ''; const p = partes(iso); return `${p.dia} ${MESES_CORTOS[p.mes]} ${p.anio}`; };
export const fechaHoraCorta = (iso) => (iso ? `${fechaCorta(iso)} · ${hora(iso)}` : '');
export const fechaLarga = (iso) => { if (!iso) return ''; const p = partes(iso); return `${p.dia} de ${MESES[p.mes]} de ${p.anio}`; };
export const fechaLargaHora = (iso) => (iso ? `${fechaLarga(iso)} · ${hora(iso)}` : '');
export const diaMes = (iso) => { if (!iso) return ''; const p = partes(iso); return `${p.dia} de ${MESES[p.mes]}`; };

// "12.000 / lb"
export const precioPorUnidad = (precio, unidad) => `${formatoCOP(precio)} / ${unidad || 'lb'}`;
export const pluralUnidad = (n, unidad) => (unidad === 'unidad' ? (n === 1 ? 'unidad' : 'unidades') : 'lb');

// "3 productos · 4 unidades de venta"
export const resumenCantidades = (productos, unidades) =>
    `${productos} ${productos === 1 ? 'producto' : 'productos'} · ${unidades} ${unidades === 1 ? 'unidad' : 'unidades'} de venta`;

// Texto "En 15–25 min" a partir de la ventana de llegada estimada.
export const minutosRestantes = (llegada, ahora = Date.now()) => {
    if (!llegada) return '';
    const a = Math.max(0, Math.round((new Date(llegada.desde) - ahora) / 60000));
    const b = Math.max(0, Math.round((new Date(llegada.hasta) - ahora) / 60000));
    return b <= 0 ? 'Llegando ahora' : `En ${a}–${b} min`;
};

// ------------------------------------------------------------ llamadas a la API
// Mientras la autenticación sea de demostración, el cliente se identifica con la cabecera X-Cliente-Id.
const cabeceras = (extra = {}) => {
    const sesion = obtenerSesion();
    return { 'Content-Type': 'application/json', ...(sesion?.id ? { 'X-Cliente-Id': String(sesion.id) } : {}), ...extra };
};

// Devuelve { ok, status, data, red? } sin lanzar errores: las pantallas deciden qué mensaje mostrar.
async function pedir(ruta, opciones = {}) {
    try {
        const respuesta = await fetch(`${API_URL}${ruta}`, { ...opciones, headers: cabeceras(opciones.headers) });
        let data = {};
        try { data = await respuesta.json(); } catch (e) { /* respuesta sin cuerpo */ }
        return { ok: respuesta.ok, status: respuesta.status, data };
    } catch (error) {
        return { ok: false, status: 0, red: true, data: {}, mensaje: 'No se pudo conectar con el servidor. Intenta de nuevo.' };
    }
}

export const crearPedido = (cuerpo) => pedir('/api/pedidos', { method: 'POST', body: JSON.stringify(cuerpo) });
export const listarPedidos = () => pedir('/api/pedidos');
export const obtenerPedido = (id) => pedir(`/api/pedidos/${id}`);
export const cancelarPedido = (id) => pedir(`/api/pedidos/${id}/cancelar`, { method: 'POST' });
