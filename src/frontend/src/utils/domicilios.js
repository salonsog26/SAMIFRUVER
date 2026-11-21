// src/utils/domicilios.js — Épica 5: llamadas a la API del portal del domiciliario
// Mientras la autenticación sea de demostración, el domiciliario se identifica con X-Domiciliario-Id
// (igual que el cliente usa X-Cliente-Id). El backend solo devuelve los pedidos asignados a ese id.
import { API_URL } from './config';
import { obtenerSesion } from './auth';

const cabeceras = (extra = {}) => {
    const sesion = obtenerSesion();
    return {
        'Content-Type': 'application/json',
        ...(sesion?.id ? { 'X-Domiciliario-Id': String(sesion.id) } : {}),
        ...extra
    };
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

export const listarPedidosDomiciliario = (vista = 'activos') => pedir(`/api/domicilios/pedidos?vista=${vista}`);
export const obtenerPedidoDomiciliario = (id) => pedir(`/api/domicilios/pedidos/${id}`);
export const obtenerPerfilDomiciliario = () => pedir('/api/domicilios/perfil');
export const iniciarEntregaDomiciliario = (id) => pedir(`/api/domicilios/pedidos/${id}/iniciar`, { method: 'POST' });
export const confirmarEntregaDomiciliario = (id) => pedir(`/api/domicilios/pedidos/${id}/confirmar`, { method: 'POST' });

// ------------------------------------------------------------ textos de la guía del portal
export const MSJ_ESTADO_OK = 'Estado actualizado correctamente';
export const MSJ_ENTREGADO_OK = 'Pedido entregado correctamente';
export const MSJ_PAGO_EFECTIVO_OK = 'Pago en efectivo recibido';
export const MSJ_PRIMERO_INICIAR = 'Primero debes iniciar la entrega para poder confirmarla';
export const MSJ_ERROR_ESTADO = 'No se pudo actualizar el estado del pedido. Verifica tu conexión e intenta nuevamente';
export const MSJ_NUEVO_PEDIDO = 'Tienes un nuevo pedido asignado';
export const MSJ_NUEVO_DETALLE = 'Consulta los detalles para preparar tu entrega.';
export const MSJ_PEDIDO_CANCELADO = (numero) => `El cliente canceló el pedido ${numero}. Fue retirado de tus entregas pendientes`;
export const MSJ_SIN_PEDIDOS = 'No tienes pedidos asignados por el momento';
export const MSJ_SIN_PEDIDOS_DETALLE = 'Te avisaremos cuando se te asigne un nuevo pedido';
export const MSJ_DISPONIBLE = 'Disponible para nuevas entregas';
export const MSJ_CONTACTO = 'Coordina los detalles de la entrega con tu cliente.';

export const ETIQUETA_PAGO = { tarjeta: 'Tarjeta débito/crédito', mercadopago: 'Mercado Pago', efectivo: 'Efectivo' };
export const ETIQUETA_PAGO_ESTADO = { aprobado: 'Aprobado', pendiente: 'Pendiente', recibido: 'Recibido' };

// "10:45 a. m." — hora de Colombia en formato 12 h, como en los mockups.
const FORMATO_HORA = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota', hour: 'numeric', minute: '2-digit', hour12: true
});
export const hora12 = (iso) => {
    if (!iso) return '';
    return FORMATO_HORA.format(new Date(iso)).replace(/\s+/g, ' ').trim();
};

// "Hoy, 20 de noviembre" / "Ayer, ..." / fecha larga, en hora de Colombia.
const FORMATO_FECHA = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota', day: 'numeric', month: 'long', year: 'numeric'
});
export const fechaLargaDom = (iso) => {
    if (!iso) return '';
    const texto = FORMATO_FECHA.format(new Date(iso));
    const hoy = FORMATO_FECHA.format(new Date());
    if (texto === hoy) return `Hoy, ${texto}`;
    const ayer = new Date(Date.now() - 86400000);
    if (texto === FORMATO_FECHA.format(ayer)) return `Ayer, ${texto}`;
    return texto;
};

// Enlace tel: para el botón "Llamar". Los celulares colombianos de 10 dígitos llevan +57.
export const enlaceTel = (telefono = '') => {
    const digitos = String(telefono).replace(/\D/g, '');
    if (!digitos) return '';
    if (digitos.startsWith('57') && digitos.length >= 12) return `tel:+${digitos}`;
    if (digitos.length === 10 && digitos.startsWith('3')) return `tel:+57${digitos}`;
    return `tel:+${digitos}`;
};
