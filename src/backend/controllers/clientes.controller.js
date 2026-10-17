// src/backend/controllers/clientes.controller.js
const { leer, escribir, siguienteId, esTexto } = require('../lib/store');
const { validarCamposCliente, limpiarEspacios } = require('../lib/validaciones');

const ARCHIVO = 'clientes.json';
const MSJ_YA_EXISTE = 'El usuario ya existe';
const MSJ_CORREO_AJENO = 'El correo le pertenece a otro cliente ya existe';
const sinPassword = ({ password, ...resto }) => resto;
// Siempre devolvemos los campos opcionales del perfil (vacíos si no se han llenado).
const publico = (c) => ({ documento: '', direccion: '', ciudad: '', ...sinPassword(c) });

// POST /api/clientes/registro (E2-HU1)
const registrarCliente = (req, res) => {
    const body = req.body || {};
    const errores = validarCamposCliente(body);
    if (Object.keys(errores).length > 0) {
        return res.status(400).json({ mensaje: 'Revisa los datos ingresados.', errores });
    }

    const correo = body.correo.trim().toLowerCase();
    const clientes = leer(ARCHIVO);
    if (clientes.some((c) => c.correo.toLowerCase() === correo)) {
        return res.status(409).json({ mensaje: MSJ_YA_EXISTE, errores: { correo: MSJ_YA_EXISTE } });
    }

    const nuevo = {
        id: siguienteId(clientes),
        nombre: limpiarEspacios(body.nombre),
        correo,
        telefono: limpiarEspacios(body.telefono),
        password: body.password.trim(), // TODO: aplicar hash (bcrypt) antes de producción
        rol: 'cliente'
    };
    clientes.push(nuevo);
    escribir(ARCHIVO, clientes);
    res.status(201).json({ mensaje: 'Registro exitoso', cliente: publico(nuevo) });
};

// POST /api/clientes/login (E2-HU2)
const loginCliente = (req, res) => {
    const body = req.body || {};
    const correo = esTexto(body.correo) ? body.correo.trim().toLowerCase() : '';
    const password = esTexto(body.password) ? body.password.trim() : '';

    const cliente = leer(ARCHIVO).find((c) => c.correo.toLowerCase() === correo && c.password === password);
    if (!correo || !password || !cliente) {
        return res.status(401).json({ mensaje: 'La información de inicio de sesión que ingresaste es incorrecta.' });
    }
    res.json({
        mensaje: 'Inicio de sesión exitoso',
        token: 'mock-token-cliente-' + cliente.id,
        cliente: publico(cliente)
    });
};

// GET /api/clientes/:id
const obtenerCliente = (req, res) => {
    const cliente = leer(ARCHIVO).find((c) => c.id === Number(req.params.id));
    if (!cliente) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    res.json({ cliente: publico(cliente) });
};

// PUT /api/clientes/:id (E2-HU3) — edita nombre, correo, teléfono, documento, dirección y ciudad.
const actualizarCliente = (req, res) => {
    const body = req.body || {};
    const clientes = leer(ARCHIVO);
    const index = clientes.findIndex((c) => c.id === Number(req.params.id));
    if (index === -1) return res.status(404).json({ mensaje: 'Cliente no encontrado' });

    const errores = validarCamposCliente(body, { conPassword: false, conExtras: true });
    if (Object.keys(errores).length > 0) {
        return res.status(400).json({ mensaje: 'Revisa los datos ingresados.', errores });
    }

    const actual = publico(clientes[index]);
    const nuevo = {
        nombre: limpiarEspacios(body.nombre),
        correo: body.correo.trim().toLowerCase(),
        telefono: limpiarEspacios(body.telefono),
        // Si el campo opcional no viene en la petición, se conserva el valor actual.
        documento: body.documento === undefined ? actual.documento : limpiarEspacios(body.documento),
        direccion: body.direccion === undefined ? actual.direccion : limpiarEspacios(body.direccion),
        ciudad: body.ciudad === undefined ? actual.ciudad : limpiarEspacios(body.ciudad)
    };

    // Escenario: el correo ya pertenece a otro usuario
    if (clientes.some((c, i) => i !== index && c.correo.toLowerCase() === nuevo.correo)) {
        return res.status(409).json({ mensaje: MSJ_CORREO_AJENO, errores: { correo: MSJ_CORREO_AJENO } });
    }

    const sinCambios = Object.keys(nuevo).every((k) => (k === 'correo' ? actual.correo.toLowerCase() : actual[k]) === nuevo[k]);
    if (sinCambios) {
        // Escenario: guardar sin cambios
        return res.json({ mensaje: 'No se ha realizado ningún cambio', cambios: false, cliente: actual });
    }

    clientes[index] = { ...clientes[index], ...nuevo };
    escribir(ARCHIVO, clientes);
    res.json({ mensaje: 'Cambios guardados correctamente', cambios: true, cliente: publico(clientes[index]) });
};

module.exports = { registrarCliente, loginCliente, obtenerCliente, actualizarCliente };
