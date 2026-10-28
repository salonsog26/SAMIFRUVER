// src/backend/controllers/clientes.controller.js
const { leer, escribir, siguienteId, esTexto } = require('../lib/store');
const { validarCamposCliente } = require('../lib/validaciones');

const ARCHIVO = 'clientes.json';
const sinPassword = ({ password, ...resto }) => resto;

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
        return res.status(409).json({ mensaje: 'usuario ya existe', errores: { correo: 'usuario ya existe' } });
    }

    const nuevo = {
        id: siguienteId(clientes),
        nombre: body.nombre.trim(),
        correo,
        telefono: body.telefono.trim(),
        password: body.password, // TODO: aplicar hash (bcrypt) antes de producción
        rol: 'cliente'
    };
    clientes.push(nuevo);
    escribir(ARCHIVO, clientes);
    res.status(201).json({ mensaje: 'Registro exitoso', cliente: sinPassword(nuevo) });
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
        cliente: sinPassword(cliente)
    });
};

// GET /api/clientes/:id
const obtenerCliente = (req, res) => {
    const cliente = leer(ARCHIVO).find((c) => c.id === Number(req.params.id));
    if (!cliente) return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    res.json({ cliente: sinPassword(cliente) });
};

// PUT /api/clientes/:id (E2-HU3) — edita nombre, correo y teléfono.
const actualizarCliente = (req, res) => {
    const body = req.body || {};
    const clientes = leer(ARCHIVO);
    const index = clientes.findIndex((c) => c.id === Number(req.params.id));
    if (index === -1) return res.status(404).json({ mensaje: 'Cliente no encontrado' });

    const errores = validarCamposCliente(body, { conPassword: false });
    if (Object.keys(errores).length > 0) {
        return res.status(400).json({ mensaje: 'Revisa los datos ingresados.', errores });
    }

    const nuevo = {
        nombre: body.nombre.trim(),
        correo: body.correo.trim().toLowerCase(),
        telefono: body.telefono.trim()
    };

    // Escenario: el correo ya pertenece a otro usuario
    if (clientes.some((c, i) => i !== index && c.correo.toLowerCase() === nuevo.correo)) {
        return res.status(409).json({
            mensaje: 'El correo ya está registrado por otro usuario',
            errores: { correo: 'El correo ya está registrado por otro usuario' }
        });
    }

    const actual = clientes[index];
    const sinCambios = actual.nombre === nuevo.nombre && actual.correo.toLowerCase() === nuevo.correo
        && actual.telefono === nuevo.telefono;
    if (sinCambios) {
        // Escenario: guardar sin cambios
        return res.json({ mensaje: 'No se ha realizado ningún cambio', cambios: false, cliente: sinPassword(actual) });
    }

    clientes[index] = { ...actual, ...nuevo };
    escribir(ARCHIVO, clientes);
    res.json({ mensaje: 'Cambios guardados correctamente', cambios: true, cliente: sinPassword(clientes[index]) });
};

module.exports = { registrarCliente, loginCliente, obtenerCliente, actualizarCliente };
