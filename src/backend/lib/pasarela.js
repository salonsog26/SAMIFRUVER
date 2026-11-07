// src/backend/lib/pasarela.js — Épica 4: pasarela de pago SIMULADA (no se cobra nada de verdad).
//
// Regla de la simulación (para poder demostrar los dos resultados): la tarjeta cuyos últimos 4 dígitos
// son "0002" es rechazada por la entidad; cualquier otra tarjeta válida se aprueba.
// Para usar una pasarela real (Wompi, Mercado Pago...) solo habría que reemplazar `cobrar`.
const ULTIMOS4_RECHAZADA = '0002';

// Devuelve { aprobado, referencia } — referencia "INT-xxxxxx" para un intento rechazado.
// El código TX-<n> de un cobro aprobado se asigna con el id del pedido (ver pedidos.controller).
const cobrar = async ({ ultimos4 }) => {
    if (String(ultimos4) === ULTIMOS4_RECHAZADA) {
        return { aprobado: false, referencia: `INT-${Date.now().toString().slice(-6)}` };
    }
    return { aprobado: true };
};

module.exports = { cobrar, ULTIMOS4_RECHAZADA };
