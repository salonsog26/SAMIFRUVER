// src/backend/controllers/domicilios.controller.js — Épica 5: gestión de domicilios
// El domiciliario se identifica con X-Domiciliario-Id (mismo esquema de demostración que X-Cliente-Id).
// Solo consulta y actualiza pedidos asignados a él.
const { query, transaccion } = require('../lib/db');
const { asincrono, idDeUrl } = require('../lib/util');
const { serializarPedido, itemsDe, ErrorNegocio, MSJ_NO_ENCONTRADO } = require('./pedidos.controller');

const MSJ_SIN_SESION = 'Inicia sesión para continuar.';
const MSJ_INICIADO = 'Estado actualizado correctamente';
const MSJ_ENTREGADO = 'Pedido entregado correctamente';
const MSJ_PRIMERO_INICIAR = 'Primero debes iniciar la entrega para poder confirmarla';
const MSJ_CANCELADO = 'Este pedido fue cancelado y no se puede entregar.';
const MSJ_YA_ENTREGADO = 'Este pedido ya fue entregado.';
const MSJ_NO_LISTO = 'Este pedido todavía no está listo para iniciar la entrega.';

const responderError = (res, error) => res.status(error.status).json({ mensaje: error.mensaje });

const diaBogota = (fecha) => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit'
}).format(fecha ? new Date(fecha) : new Date());

const requiereDomiciliario = asincrono(async (req, res, next) => {
    const id = idDeUrl(req.get('x-domiciliario-id'));
    if (id === null) return res.status(401).json({ mensaje: MSJ_SIN_SESION });
    const { rows } = await query(
        'SELECT id, nombre, correo, telefono, vehiculo, foto FROM domiciliarios WHERE id = $1',
        [id]
    );
    if (!rows[0]) return res.status(401).json({ mensaje: MSJ_SIN_SESION });
    req.domiciliario = rows[0];
    next();
});

const filasAsignadas = async (domiciliarioId, pedidoId = null) => {
    const params = [domiciliarioId];
    let filtro = '';
    if (pedidoId !== null) {
        params.push(pedidoId);
        filtro = ' AND p.id = $2';
    }
    const { rows } = await query(
        `SELECT p.*, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono, c.foto AS cliente_foto
         FROM pedidos p
         JOIN clientes c ON c.id = p.cliente_id
         WHERE p.domiciliario_id = $1${filtro}
         ORDER BY p.id`,
        params
    );
    return rows;
};

const pedidoCompleto = async (fila) => serializarPedido(fila, await itemsDe(fila.id));

const resumenDe = (pedidos) => {
    const hoy = diaBogota();
    return {
        porRecoger: pedidos.filter((p) => p.estado === 'preparacion').length,
        enCamino: pedidos.filter((p) => p.estado === 'en_camino').length,
        entregadosHoy: pedidos.filter((p) => p.estado === 'entregado' && diaBogota(p.entregadoEn) === hoy).length
    };
};

const porHoraEstimada = (a, b) => {
    if (a.entregaEstimada && b.entregaEstimada) return a.entregaEstimada < b.entregaEstimada ? -1 : a.entregaEstimada > b.entregaEstimada ? 1 : a.id - b.id;
    if (a.entregaEstimada) return -1;
    if (b.entregaEstimada) return 1;
    return a.id - b.id;
};

// GET /api/domicilios/pedidos?vista=activos|historial
const listarAsignados = asincrono(async (req, res) => {
    const filas = await filasAsignadas(req.domiciliario.id);
    const pedidos = [];
    for (const fila of filas) pedidos.push(await pedidoCompleto(fila));
    const hoy = diaBogota();
    const vista = req.query.vista === 'historial' ? 'historial' : 'activos';
    const visibles = pedidos.filter((p) => {
        if (vista === 'historial') return p.estado === 'entregado' || p.estado === 'cancelado';
        if (p.estado === 'preparacion' || p.estado === 'en_camino') return true;
        return p.estado === 'cancelado' && diaBogota(p.canceladoEn) === hoy;
    });
    visibles.sort(porHoraEstimada);
    res.json({ pedidos: visibles, resumen: resumenDe(pedidos), total: visibles.length });
});

// GET /api/domicilios/pedidos/:id
const obtenerAsignado = asincrono(async (req, res) => {
    const id = idDeUrl(req.params.id);
    if (id === null) return res.status(404).json({ mensaje: MSJ_NO_ENCONTRADO });
    const filas = await filasAsignadas(req.domiciliario.id, id);
    if (!filas[0]) return res.status(404).json({ mensaje: MSJ_NO_ENCONTRADO });
    res.json({ pedido: await pedidoCompleto(filas[0]) });
});

const motivoDeRechazo = async (id, domiciliarioId) => {
    const { rows } = await query('SELECT estado, domiciliario_id FROM pedidos WHERE id = $1', [id]);
    if (!rows[0] || Number(rows[0].domiciliario_id) !== Number(domiciliarioId)) throw new ErrorNegocio(404, MSJ_NO_ENCONTRADO);
    if (rows[0].estado === 'cancelado') throw new ErrorNegocio(409, MSJ_CANCELADO);
    if (rows[0].estado === 'entregado') throw new ErrorNegocio(409, MSJ_YA_ENTREGADO);
    return rows[0].estado;
};

// POST /api/domicilios/pedidos/:id/iniciar  — solo desde "preparacion"
const iniciarEntrega = asincrono(async (req, res) => {
    const id = idDeUrl(req.params.id);
    if (id === null) return res.status(404).json({ mensaje: MSJ_NO_ENCONTRADO });
    const dom = req.domiciliario;
    try {
        const r = await query(
            `UPDATE pedidos SET estado = 'en_camino', en_camino_en = now(),
                repartidor_nombre = $3, repartidor_vehiculo = $4, repartidor_telefono = $5
             WHERE id = $1 AND domiciliario_id = $2 AND estado = 'preparacion'
             RETURNING id`,
            [id, dom.id, dom.nombre, dom.vehiculo, dom.telefono]
        );
        if (!r.rows[0]) {
            const estado = await motivoDeRechazo(id, dom.id);
            throw new ErrorNegocio(409, estado === 'en_camino' ? 'La entrega ya fue iniciada.' : MSJ_NO_LISTO);
        }
        const filas = await filasAsignadas(dom.id, id);
        res.json({ mensaje: MSJ_INICIADO, pedido: await pedidoCompleto(filas[0]) });
    } catch (error) {
        if (error instanceof ErrorNegocio) return responderError(res, error);
        throw error;
    }
});

// POST /api/domicilios/pedidos/:id/confirmar — solo desde "en_camino".
// El efectivo pendiente pasa a recibido en la misma sentencia, así no se cobra dos veces.
const confirmarEntrega = asincrono(async (req, res) => {
    const id = idDeUrl(req.params.id);
    if (id === null) return res.status(404).json({ mensaje: MSJ_NO_ENCONTRADO });
    const dom = req.domiciliario;
    try {
        const actualizado = await transaccion(async (cx) => {
            const r = await cx.query(
                `UPDATE pedidos SET
                    estado = 'entregado',
                    entregado_en = now(),
                    pago_estado = CASE WHEN metodo_pago = 'efectivo' AND pago_estado = 'pendiente' THEN 'recibido' ELSE pago_estado END,
                    pago_detalle = CASE WHEN metodo_pago = 'efectivo' AND pago_estado = 'pendiente' THEN 'Efectivo recibido' ELSE pago_detalle END
                 WHERE id = $1 AND domiciliario_id = $2 AND estado = 'en_camino'
                 RETURNING id`,
                [id, dom.id]
            );
            return r.rows[0] || null;
        });
        if (!actualizado) {
            const estado = await motivoDeRechazo(id, dom.id);
            throw new ErrorNegocio(409, estado === 'preparacion' || estado === 'recibido' ? MSJ_PRIMERO_INICIAR : MSJ_NO_LISTO);
        }
        const filas = await filasAsignadas(dom.id, id);
        res.json({ mensaje: MSJ_ENTREGADO, pedido: await pedidoCompleto(filas[0]) });
    } catch (error) {
        if (error instanceof ErrorNegocio) return responderError(res, error);
        throw error;
    }
});

const perfil = asincrono(async (req, res) => {
    res.json({ domiciliario: req.domiciliario });
});

module.exports = {
    requiereDomiciliario, listarAsignados, obtenerAsignado, iniciarEntrega, confirmarEntrega, perfil
};
