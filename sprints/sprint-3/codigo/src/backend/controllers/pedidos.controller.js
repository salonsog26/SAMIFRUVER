// src/backend/controllers/pedidos.controller.js — Épica 3: Gestión de Pedidos
//   HU1 consultar pedido (seguimiento) · HU2 crear pedido · HU3 historial · HU4 cancelar pedido
//
// Sesión: por ahora el cliente se identifica con la cabecera X-Cliente-Id (la envía el frontend con el id de su
// sesión). No es una autenticación real —los tokens del proyecto siguen siendo de demostración—, pero cada
// consulta se filtra por ese cliente, así que nadie puede ver ni cancelar pedidos ajenos desde la aplicación.
const { query, transaccion } = require('../lib/db');
const { esTexto, asincrono, idDeUrl } = require('../lib/util');

const DOMICILIO = 5000;                         // valor fijo del domicilio (COP), como en los mockups
const MINUTOS_LLEGADA = [30, 40];               // ventana de llegada estimada desde que sale "En camino"
const METODOS_PAGO = { tarjeta: 'Visa ···· 4242', mercadopago: 'Mercado Pago' }; // pago simulado: no se cobra nada
const ESTADOS = ['recibido', 'preparacion', 'en_camino', 'entregado', 'cancelado'];
const SIGUIENTE = { recibido: 'preparacion', preparacion: 'en_camino', en_camino: 'entregado' };
const COLUMNA_HORA = { preparacion: 'preparacion_en', en_camino: 'en_camino_en', entregado: 'entregado_en' };
const REPARTIDOR_DEMO = { nombre: 'Andrés Martínez', vehiculo: 'Bicicleta', telefono: '310 555 0194' };

const MSJ_SIN_SESION = 'Inicia sesión para continuar.';
const MSJ_CARRITO_VACIO = 'No puedes realizar un pedido sin productos. Agrega al menos un producto a tu carrito.';
const MSJ_SIN_PAGO = 'Selección de método de pago es obligatorio';
const MSJ_SIN_DIRECCION = 'Selecciona o agrega una dirección de entrega.';
const MSJ_NO_ENCONTRADO = 'Pedido no encontrado';
const MSJ_NO_CANCELABLE = 'Este pedido ya no se puede cancelar porque está en camino o fue entregado.';
const MSJ_YA_CANCELADO = 'Este pedido ya fue cancelado.';

// Error "esperado" (400, 404, 409...): se responde tal cual y, si ocurre dentro de una transacción, la deshace.
class ErrorNegocio extends Error {
    constructor(status, mensaje) { super(mensaje); this.status = status; this.mensaje = mensaje; }
}
const responderError = (res, error) => res.status(error.status).json({ mensaje: error.mensaje });

const iso = (fecha) => (fecha ? new Date(fecha).toISOString() : null);
const numeroPedido = (id) => `SF-${1000 + id}`;

// ---------------------------------------------------------------- serialización
const aItem = (i) => ({
    id: i.id,
    productoId: i.producto_id,
    nombre: i.nombre,
    imagen: i.imagen,
    unidad: i.unidad,
    precioUnitario: Number(i.precio_unitario),
    cantidad: Number(i.cantidad),
    subtotal: Number(i.subtotal)
});

// Línea de seguimiento: siempre las 4 etapas; las completadas llevan su hora, las pendientes `hora: null`.
const etapasDe = (p) => ([
    { clave: 'recibido', hora: iso(p.creado_en) },
    { clave: 'preparacion', hora: iso(p.preparacion_en) },
    { clave: 'en_camino', hora: iso(p.en_camino_en) },
    { clave: 'entregado', hora: iso(p.entregado_en) }
].map((e) => ({ ...e, completada: Boolean(e.hora) })));

const llegadaEstimadaDe = (p) => {
    if (p.estado !== 'en_camino' || !p.en_camino_en) return null;
    const salida = new Date(p.en_camino_en).getTime();
    return {
        desde: new Date(salida + MINUTOS_LLEGADA[0] * 60000).toISOString(),
        hasta: new Date(salida + MINUTOS_LLEGADA[1] * 60000).toISOString()
    };
};

const aPedido = (p, items = []) => {
    const lista = items.map(aItem);
    return {
        id: p.id,
        numero: numeroPedido(p.id),
        estado: p.estado,
        subtotal: Number(p.subtotal),
        domicilio: Number(p.domicilio),
        total: Number(p.total),
        metodoPago: p.metodo_pago,
        pagoDetalle: p.pago_detalle,
        direccion: { alias: p.dir_alias, nombre: p.dir_nombre, linea: p.dir_linea, ciudad: p.dir_ciudad, telefono: p.dir_telefono },
        repartidor: p.repartidor_nombre
            ? { nombre: p.repartidor_nombre, vehiculo: p.repartidor_vehiculo, telefono: p.repartidor_telefono }
            : null,
        devolucionIniciada: Boolean(p.devolucion_iniciada),
        creadoEn: iso(p.creado_en),
        canceladoEn: iso(p.cancelado_en),
        entregadoEn: iso(p.entregado_en),
        etapas: etapasDe(p),
        llegadaEstimada: llegadaEstimadaDe(p),
        puedeCancelar: p.estado === 'recibido' || p.estado === 'preparacion',
        productos: lista.length,
        unidades: lista.reduce((suma, i) => suma + i.cantidad, 0),
        items: lista
    };
};

const itemsDe = async (pedidoId, ejecutar = query) => {
    const { rows } = await ejecutar('SELECT * FROM pedido_items WHERE pedido_id = $1 ORDER BY id', [pedidoId]);
    return rows;
};

// ---------------------------------------------------------------- identificación del cliente
const requiereCliente = asincrono(async (req, res, next) => {
    const id = idDeUrl(req.get('x-cliente-id'));
    if (id === null) return res.status(401).json({ mensaje: MSJ_SIN_SESION });
    const { rows } = await query('SELECT id, nombre, telefono, direccion, ciudad FROM clientes WHERE id = $1', [id]);
    if (!rows[0]) return res.status(401).json({ mensaje: MSJ_SIN_SESION });
    req.cliente = rows[0];
    next();
});

// Solo para avanzar el estado (lo harán las épicas de despacho/domicilios). Requiere ADMIN_KEY en el servidor.
const requiereAdmin = (req, res, next) => {
    const clave = process.env.ADMIN_KEY;
    if (!clave) return res.status(403).json({ mensaje: 'Función deshabilitada: define ADMIN_KEY en el servidor.' });
    if (req.get('x-admin-key') !== clave) return res.status(403).json({ mensaje: 'Clave de administrador incorrecta.' });
    next();
};

// ---------------------------------------------------------------- validación de la solicitud
const telefonoValido = (t) => /^\+?[0-9 ]{7,15}$/.test(t);

const leerDireccion = (body, cliente) => {
    const d = body.direccion && typeof body.direccion === 'object' ? body.direccion : {};
    const texto = (v) => (esTexto(v) ? v.trim().replace(/\s+/g, ' ') : '');
    const linea = texto(d.linea);
    const ciudad = texto(d.ciudad);
    if (linea.length < 5 || linea.length > 160 || ciudad.length < 2 || ciudad.length > 60) {
        throw new ErrorNegocio(400, MSJ_SIN_DIRECCION);
    }
    const telefono = texto(d.telefono) || cliente.telefono || '';
    if (telefono && !telefonoValido(telefono)) throw new ErrorNegocio(400, 'El teléfono de entrega no es válido.');
    return {
        alias: (texto(d.alias) || 'Casa').slice(0, 40),
        nombre: (texto(d.nombre) || cliente.nombre || '').slice(0, 80),
        linea, ciudad, telefono
    };
};

// Devuelve un Map(productoId → cantidad) con los productos repetidos sumados.
const leerItems = (body) => {
    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) throw new ErrorNegocio(400, MSJ_CARRITO_VACIO);
    if (items.length > 50) throw new ErrorNegocio(400, 'El carrito tiene demasiados productos.');
    const mapa = new Map();
    for (const it of items) {
        const productoId = idDeUrl(it && it.productoId);
        const cantidad = Number(it && it.cantidad);
        if (productoId === null || !Number.isInteger(cantidad) || cantidad < 1 || cantidad > 9999) {
            throw new ErrorNegocio(400, 'Los productos del carrito no son válidos.');
        }
        mapa.set(productoId, (mapa.get(productoId) || 0) + cantidad);
    }
    return mapa;
};

// ---------------------------------------------------------------- HU2: crear pedido
// POST /api/pedidos  { items:[{productoId, cantidad}], direccion:{alias,nombre,linea,ciudad,telefono}, metodoPago }
const crearPedido = asincrono(async (req, res) => {
    const body = req.body || {};
    try {
        const mapa = leerItems(body);
        if (!METODOS_PAGO[body.metodoPago]) throw new ErrorNegocio(400, MSJ_SIN_PAGO);
        const dir = leerDireccion(body, req.cliente);

        const pedidoId = await transaccion(async (cx) => {
            const lineas = [];
            // Orden por id: dos pedidos simultáneos con los mismos productos no se bloquean entre sí.
            for (const [productoId, cantidad] of [...mapa.entries()].sort((a, b) => a[0] - b[0])) {
                // Descuenta el stock solo si alcanza (una sola sentencia → sin carreras entre clientes).
                const r = await cx.query(
                    `UPDATE productos SET stock = stock - $2, actualizado_en = now()
                     WHERE id = $1 AND stock >= $2
                     RETURNING nombre, precio, unidad, imagen`,
                    [productoId, cantidad]
                );
                if (!r.rows[0]) {
                    const p = await cx.query('SELECT nombre, stock, unidad FROM productos WHERE id = $1', [productoId]);
                    if (!p.rows[0]) throw new ErrorNegocio(400, 'Uno de los productos del carrito ya no está disponible.');
                    throw new ErrorNegocio(409, `No hay suficiente stock de ${p.rows[0].nombre}. Disponible: ${Number(p.rows[0].stock)} ${p.rows[0].unidad}.`);
                }
                const f = r.rows[0];
                lineas.push({
                    productoId, cantidad, nombre: f.nombre, imagen: f.imagen, unidad: f.unidad,
                    precio: Number(f.precio), subtotal: Number(f.precio) * cantidad
                });
            }
            const subtotal = lineas.reduce((s, l) => s + l.subtotal, 0);
            const ins = await cx.query(
                `INSERT INTO pedidos (cliente_id, subtotal, domicilio, total, metodo_pago, pago_detalle,
                                      dir_alias, dir_nombre, dir_linea, dir_ciudad, dir_telefono)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
                [req.cliente.id, subtotal, DOMICILIO, subtotal + DOMICILIO, body.metodoPago, METODOS_PAGO[body.metodoPago],
                    dir.alias, dir.nombre, dir.linea, dir.ciudad, dir.telefono]
            );
            const id = ins.rows[0].id;
            for (const l of lineas) {
                await cx.query(
                    `INSERT INTO pedido_items (pedido_id, producto_id, nombre, imagen, unidad, precio_unitario, cantidad, subtotal)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [id, l.productoId, l.nombre, l.imagen, l.unidad, l.precio, l.cantidad, l.subtotal]
                );
            }
            return id;
        });

        const { rows } = await query('SELECT * FROM pedidos WHERE id = $1', [pedidoId]);
        res.status(201).json({ mensaje: 'Pedido creado correctamente', pedido: aPedido(rows[0], await itemsDe(pedidoId)) });
    } catch (error) {
        if (error instanceof ErrorNegocio) return responderError(res, error);
        throw error;
    }
});

// ---------------------------------------------------------------- HU3: historial
// GET /api/pedidos[?estado=entregado] → del más reciente al más antiguo
const listarPedidos = asincrono(async (req, res) => {
    const filtro = ESTADOS.includes(req.query.estado) ? req.query.estado : null;
    const { rows } = await query(
        'SELECT * FROM pedidos WHERE cliente_id = $1 ORDER BY creado_en DESC, id DESC',
        [req.cliente.id]
    );
    const { rows: items } = await query(
        `SELECT i.* FROM pedido_items i JOIN pedidos p ON p.id = i.pedido_id WHERE p.cliente_id = $1 ORDER BY i.id`,
        [req.cliente.id]
    );
    const pedidos = rows
        .filter((p) => !filtro || p.estado === filtro)
        .map((p) => aPedido(p, items.filter((i) => i.pedido_id === p.id)));
    res.json({ pedidos, total: rows.length });
});

// ---------------------------------------------------------------- HU1: seguimiento
// GET /api/pedidos/:id
const obtenerPedido = asincrono(async (req, res) => {
    const id = idDeUrl(req.params.id);
    if (id === null) return res.status(404).json({ mensaje: MSJ_NO_ENCONTRADO });
    const { rows } = await query('SELECT * FROM pedidos WHERE id = $1 AND cliente_id = $2', [id, req.cliente.id]);
    if (!rows[0]) return res.status(404).json({ mensaje: MSJ_NO_ENCONTRADO });
    res.json({ pedido: aPedido(rows[0], await itemsDe(id)) });
});

// ---------------------------------------------------------------- HU4: cancelar
// POST /api/pedidos/:id/cancelar — solo en "Pedido recibido" o "En preparación"; devuelve las unidades al stock.
const cancelarPedido = asincrono(async (req, res) => {
    const id = idDeUrl(req.params.id);
    if (id === null) return res.status(404).json({ mensaje: MSJ_NO_ENCONTRADO });
    try {
        await transaccion(async (cx) => {
            // Una sola sentencia comprueba dueño + estado y cancela: dos "Cancelar" a la vez no devuelven stock dos veces.
            const r = await cx.query(
                `UPDATE pedidos SET estado = 'cancelado', cancelado_en = now(), devolucion_iniciada = TRUE
                 WHERE id = $1 AND cliente_id = $2 AND estado IN ('recibido', 'preparacion') RETURNING id`,
                [id, req.cliente.id]
            );
            if (!r.rows[0]) {
                const p = await cx.query('SELECT estado FROM pedidos WHERE id = $1 AND cliente_id = $2', [id, req.cliente.id]);
                if (!p.rows[0]) throw new ErrorNegocio(404, MSJ_NO_ENCONTRADO);
                throw new ErrorNegocio(409, p.rows[0].estado === 'cancelado' ? MSJ_YA_CANCELADO : MSJ_NO_CANCELABLE);
            }
            for (const i of await itemsDe(id, cx.query.bind(cx))) {
                if (i.producto_id !== null) {
                    await cx.query('UPDATE productos SET stock = stock + $2, actualizado_en = now() WHERE id = $1',
                        [i.producto_id, Number(i.cantidad)]);
                }
            }
        });
        const { rows } = await query('SELECT * FROM pedidos WHERE id = $1', [id]);
        res.json({ mensaje: 'Pedido cancelado correctamente', pedido: aPedido(rows[0], await itemsDe(id)) });
    } catch (error) {
        if (error instanceof ErrorNegocio) return responderError(res, error);
        throw error;
    }
});

// ---------------------------------------------------------------- avanzar estado (provisional, para la demo)
// recibido → preparacion → en_camino → entregado. Al pasar a "en_camino" se asigna un repartidor (de demostración
// si no se indica uno). La asignación real de repartidores es de las Épicas 5 y 6.
const avanzarEstado = async (id, { repartidor } = {}) => {
    const { rows } = await query('SELECT estado FROM pedidos WHERE id = $1', [id]);
    if (!rows[0]) throw new ErrorNegocio(404, MSJ_NO_ENCONTRADO);
    const actual = rows[0].estado;
    const nuevo = SIGUIENTE[actual];
    if (!nuevo) throw new ErrorNegocio(409, `El pedido está "${actual}" y no puede avanzar.`);

    const columna = COLUMNA_HORA[nuevo];
    const rep = nuevo === 'en_camino' ? { ...REPARTIDOR_DEMO, ...(repartidor || {}) } : null;
    const r = await query(
        `UPDATE pedidos SET estado = $2, ${columna} = now()
            ${rep ? ', repartidor_nombre = $4, repartidor_vehiculo = $5, repartidor_telefono = $6' : ''}
         WHERE id = $1 AND estado = $3 RETURNING id`,
        rep ? [id, nuevo, actual, rep.nombre, rep.vehiculo, rep.telefono] : [id, nuevo, actual]
    );
    if (!r.rows[0]) throw new ErrorNegocio(409, 'El pedido cambió de estado mientras se actualizaba. Intenta de nuevo.');
    const { rows: fila } = await query('SELECT * FROM pedidos WHERE id = $1', [id]);
    return aPedido(fila[0], await itemsDe(id));
};

// PATCH /api/pedidos/:id/estado  (cabecera X-Admin-Key) — body opcional: { repartidor:{nombre,vehiculo,telefono} }
const avanzarEstadoHttp = asincrono(async (req, res) => {
    const id = idDeUrl(req.params.id);
    if (id === null) return res.status(404).json({ mensaje: MSJ_NO_ENCONTRADO });
    try {
        const rep = req.body && typeof req.body.repartidor === 'object' ? req.body.repartidor : undefined;
        res.json({ mensaje: 'Estado actualizado', pedido: await avanzarEstado(id, { repartidor: rep }) });
    } catch (error) {
        if (error instanceof ErrorNegocio) return responderError(res, error);
        throw error;
    }
});

module.exports = {
    requiereCliente, requiereAdmin,
    crearPedido, listarPedidos, obtenerPedido, cancelarPedido, avanzarEstadoHttp,
    avanzarEstado, ErrorNegocio, numeroPedido, DOMICILIO
};
