// src/backend/controllers/clientes.controller.js — clientes (Épica 2)
const { query, esDuplicado } = require('../lib/db');
const { esTexto, asincrono, idDeUrl } = require('../lib/util');
const { validarCamposCliente, limpiarEspacios } = require('../lib/validaciones');
const passwords = require('../lib/passwords');

const MSJ_YA_EXISTE = 'El usuario ya existe';
const MSJ_CORREO_AJENO = 'El correo le pertenece a otro cliente ya existe';
const MSJ_DOCUMENTO_AJENO = 'El documento le pertenece a otro cliente ya existe';
const MSJ_INCORRECTO = 'La información de inicio de sesión que ingresaste es incorrecta.';

const COLUMNAS_PUBLICAS = 'id, nombre, correo, telefono, documento, direccion, ciudad';

const publico = (fila) => ({
    id: fila.id,
    nombre: fila.nombre,
    correo: fila.correo,
    telefono: fila.telefono,
    documento: fila.documento || '',
    direccion: fila.direccion || '',
    ciudad: fila.ciudad || '',
    rol: 'cliente'
});

const buscarPorId = async (id) => {
    if (id === null) return null;
    const { rows } = await query(`SELECT ${COLUMNAS_PUBLICAS} FROM clientes WHERE id = $1`, [id]);
    return rows[0] || null;
};

// POST /api/clientes/registro (E2-HU1)
const registrarCliente = asincrono(async (req, res) => {
    const body = req.body || {};
    const errores = validarCamposCliente(body);
    if (Object.keys(errores).length > 0) {
        return res.status(400).json({ mensaje: 'Revisa los datos ingresados.', errores });
    }

    const correo = body.correo.trim().toLowerCase();
    const existente = await query('SELECT 1 FROM clientes WHERE LOWER(correo) = $1', [correo]);
    if (existente.rows.length > 0) {
        return res.status(409).json({ mensaje: MSJ_YA_EXISTE, errores: { correo: MSJ_YA_EXISTE } });
    }

    try {
        const { rows } = await query(
            `INSERT INTO clientes (nombre, correo, telefono, password_hash)
             VALUES ($1, $2, $3, $4)
             RETURNING ${COLUMNAS_PUBLICAS}`,
            [limpiarEspacios(body.nombre), correo, limpiarEspacios(body.telefono), await passwords.hash(body.password.trim())]
        );
        res.status(201).json({ mensaje: 'Registro exitoso', cliente: publico(rows[0]) });
    } catch (error) {
        if (esDuplicado(error)) return res.status(409).json({ mensaje: MSJ_YA_EXISTE, errores: { correo: MSJ_YA_EXISTE } });
        throw error;
    }
});

// POST /api/clientes/login (E2-HU2)
const loginCliente = asincrono(async (req, res) => {
    const body = req.body || {};
    const correo = esTexto(body.correo) ? body.correo.trim().toLowerCase() : '';
    const password = esTexto(body.password) ? body.password.trim() : '';

    let cliente = null;
    if (correo && password) {
        const { rows } = await query(`SELECT ${COLUMNAS_PUBLICAS}, password_hash FROM clientes WHERE LOWER(correo) = $1`, [correo]);
        if (rows[0] && (await passwords.verificar(password, rows[0].password_hash))) cliente = rows[0];
    }
    if (!cliente) return res.status(401).json({ mensaje: MSJ_INCORRECTO });

    res.json({ mensaje: 'Inicio de sesión exitoso', token: 'mock-token-cliente-' + cliente.id, cliente: publico(cliente) });
});

// GET /api/clientes/:id
const obtenerCliente = asincrono(async (req, res) => {
    const cliente = await buscarPorId(idDeUrl(req.params.id));
    if (!cliente) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    res.json({ cliente: publico(cliente) });
});

// PUT /api/clientes/:id (E2-HU3) — edita nombre, correo, teléfono, documento, dirección y ciudad.
const actualizarCliente = asincrono(async (req, res) => {
    const body = req.body || {};
    const id = idDeUrl(req.params.id);
    const fila = await buscarPorId(id);
    if (!fila) return res.status(404).json({ mensaje: 'Cliente no encontrado' });

    const errores = validarCamposCliente(body, { conPassword: false, conExtras: true });
    if (Object.keys(errores).length > 0) {
        return res.status(400).json({ mensaje: 'Revisa los datos ingresados.', errores });
    }

    const actual = publico(fila);
    const nuevo = {
        nombre: limpiarEspacios(body.nombre),
        correo: body.correo.trim().toLowerCase(),
        telefono: limpiarEspacios(body.telefono),
        documento: body.documento === undefined ? actual.documento : limpiarEspacios(body.documento),
        direccion: body.direccion === undefined ? actual.direccion : limpiarEspacios(body.direccion),
        ciudad: body.ciudad === undefined ? actual.ciudad : limpiarEspacios(body.ciudad)
    };

    // Escenario: el correo ya pertenece a otro cliente
    const correoAjeno = await query('SELECT 1 FROM clientes WHERE LOWER(correo) = $1 AND id <> $2', [nuevo.correo, id]);
    if (correoAjeno.rows.length > 0) {
        return res.status(409).json({ mensaje: MSJ_CORREO_AJENO, errores: { correo: MSJ_CORREO_AJENO } });
    }

    // Escenario: el documento ya pertenece a otro cliente
    if (nuevo.documento) {
        const documentoAjeno = await query('SELECT 1 FROM clientes WHERE documento = $1 AND id <> $2', [nuevo.documento, id]);
        if (documentoAjeno.rows.length > 0) {
            return res.status(409).json({ mensaje: MSJ_DOCUMENTO_AJENO, errores: { documento: MSJ_DOCUMENTO_AJENO } });
        }
    }

    const sinCambios = Object.keys(nuevo).every((k) => (k === 'correo' ? actual.correo.toLowerCase() : actual[k]) === nuevo[k]);
    if (sinCambios) {
        return res.json({ mensaje: 'No se ha realizado ningún cambio', cambios: false, cliente: actual });
    }

    try {
        const { rows } = await query(
            `UPDATE clientes
                SET nombre = $1, correo = $2, telefono = $3, documento = $4, direccion = $5, ciudad = $6, actualizado_en = now()
              WHERE id = $7
          RETURNING ${COLUMNAS_PUBLICAS}`,
            [nuevo.nombre, nuevo.correo, nuevo.telefono, nuevo.documento, nuevo.direccion, nuevo.ciudad, id]
        );
        res.json({ mensaje: 'Cambios guardados correctamente', cambios: true, cliente: publico(rows[0]) });
    } catch (error) {
        if (esDuplicado(error)) return res.status(409).json({ mensaje: MSJ_CORREO_AJENO, errores: { correo: MSJ_CORREO_AJENO } });
        throw error;
    }
});

module.exports = { registrarCliente, loginCliente, obtenerCliente, actualizarCliente };