// src/backend/controllers/metodos-pago.controller.js — Épica 4, HU3: gestionar métodos de pago (tarjetas guardadas)
//   GET /api/metodos-pago · POST /api/metodos-pago · DELETE /api/metodos-pago/:id
// Se identifica al cliente igual que en pedidos (cabecera X-Cliente-Id, ver requiereCliente).
const { query, transaccion } = require('../lib/db');
const { asincrono, idDeUrl } = require('../lib/util');
const { validarTarjeta } = require('../lib/tarjetas');

const MARCAS = { visa: 'Visa', mastercard: 'Mastercard' };
const MSJ_AGREGADA = 'Método de pago agregado correctamente';
const MSJ_ELIMINADA = 'Método de pago eliminado correctamente';
const MSJ_NO_ENCONTRADA = 'Método de pago no encontrado';
const MSJ_REVISA = 'Revisa los datos de tu tarjeta.';
const MAX_TARJETAS = 5;
const MSJ_LIMITE = `Puedes guardar hasta ${MAX_TARJETAS} tarjetas. Elimina una para agregar otra.`;

const aMetodo = (m) => ({
    id: m.id,
    marca: m.marca,
    marcaEtiqueta: MARCAS[m.marca] || m.marca,
    ultimos4: m.ultimos4,
    titular: m.titular,
    venceMes: Number(m.vence_mes),
    venceAnio: Number(m.vence_anio),
    vence: `${String(m.vence_mes).padStart(2, '0')}/${String(Number(m.vence_anio) % 100).padStart(2, '0')}`,
    predeterminada: Boolean(m.predeterminada),
    creadoEn: new Date(m.creado_en).toISOString(),
    descripcion: `${MARCAS[m.marca] || m.marca} terminada en ${m.ultimos4}`
});

const tarjetasDe = async (clienteId, ejecutar = query) => {
    const { rows } = await ejecutar(
        'SELECT * FROM metodos_pago WHERE cliente_id = $1 ORDER BY predeterminada DESC, creado_en DESC, id DESC',
        [clienteId]
    );
    return rows.map(aMetodo);
};

// GET /api/metodos-pago
const listarMetodos = asincrono(async (req, res) => {
    const metodos = await tarjetasDe(req.cliente.id);
    res.json({ metodos, total: metodos.length });
});

// POST /api/metodos-pago  { titular, numero, vencimiento:"MM/AA", cvv, predeterminada }
const agregarMetodo = asincrono(async (req, res) => {
    const { errores, datos } = validarTarjeta(req.body || {});
    if (!datos) return res.status(400).json({ mensaje: MSJ_REVISA, errores });

    const resultado = await transaccion(async (cx) => {
        const { rows: previas } = await cx.query('SELECT id, marca, ultimos4, vence_mes, vence_anio FROM metodos_pago WHERE cliente_id = $1', [req.cliente.id]);
        if (previas.length >= MAX_TARJETAS) return { limite: true };
        if (previas.some((t) => t.marca === datos.marca && t.ultimos4 === datos.ultimos4
            && Number(t.vence_mes) === datos.venceMes && Number(t.vence_anio) === datos.venceAnio)) {
            return { repetida: true };
        }
        // La primera tarjeta siempre queda como predeterminada; si se marca otra, la anterior deja de serlo.
        const predeterminada = datos.predeterminada || previas.length === 0;
        if (predeterminada) await cx.query('UPDATE metodos_pago SET predeterminada = FALSE WHERE cliente_id = $1', [req.cliente.id]);
        const ins = await cx.query(
            `INSERT INTO metodos_pago (cliente_id, marca, ultimos4, titular, vence_mes, vence_anio, predeterminada)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [req.cliente.id, datos.marca, datos.ultimos4, datos.titular, datos.venceMes, datos.venceAnio, predeterminada]
        );
        return { fila: ins.rows[0] };
    });

    if (resultado.limite) return res.status(409).json({ mensaje: MSJ_LIMITE });
    if (resultado.repetida) {
        return res.status(409).json({ mensaje: 'Esta tarjeta ya está guardada.', errores: { numero: 'Esta tarjeta ya está guardada' } });
    }
    res.status(201).json({ mensaje: MSJ_AGREGADA, metodo: aMetodo(resultado.fila), metodos: await tarjetasDe(req.cliente.id) });
});

// DELETE /api/metodos-pago/:id — el cliente solo puede borrar las suyas. Si borra la predeterminada, otra la reemplaza.
const eliminarMetodo = asincrono(async (req, res) => {
    const id = idDeUrl(req.params.id);
    if (id === null) return res.status(404).json({ mensaje: MSJ_NO_ENCONTRADA });
    const encontrada = await transaccion(async (cx) => {
        const del = await cx.query('DELETE FROM metodos_pago WHERE id = $1 AND cliente_id = $2 RETURNING predeterminada', [id, req.cliente.id]);
        if (!del.rows[0]) return false;
        if (del.rows[0].predeterminada) {
            const { rows } = await cx.query('SELECT id FROM metodos_pago WHERE cliente_id = $1 ORDER BY creado_en DESC, id DESC LIMIT 1', [req.cliente.id]);
            if (rows[0]) await cx.query('UPDATE metodos_pago SET predeterminada = TRUE WHERE id = $1', [rows[0].id]);
        }
        // Los pedidos conservan su copia del detalle del pago; solo se suelta el enlace a la tarjeta borrada.
        await cx.query('UPDATE pedidos SET metodo_pago_id = NULL WHERE metodo_pago_id = $1', [id]);
        return true;
    });
    if (!encontrada) return res.status(404).json({ mensaje: MSJ_NO_ENCONTRADA });
    res.json({ mensaje: MSJ_ELIMINADA, metodos: await tarjetasDe(req.cliente.id) });
});

module.exports = { listarMetodos, agregarMetodo, eliminarMetodo, aMetodo, MARCAS, MSJ_AGREGADA, MSJ_ELIMINADA };
