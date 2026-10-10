// src/backend/controllers/clientes.controller.js
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/clientes.json');

const leerClientes = () => {
    try {
        const jsonData = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(jsonData);
    } catch (error) {
        return [];
    }
};

const escribirClientes = (clientes) => {
    fs.writeFileSync(filePath, JSON.stringify(clientes, null, 2), 'utf-8');
};

const correoValido = (correo) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

// Valida los campos del registro. Devuelve { campo: mensaje } con los errores encontrados.
const validarCamposCliente = (body) => {
    const errores = {};

    if (!body.nombre || !body.nombre.trim()) {
        errores.nombre = 'Este campo es obligatorio';
    }

    if (!body.correo || !body.correo.trim()) {
        errores.correo = 'Este campo es obligatorio';
    } else if (!correoValido(body.correo.trim())) {
        errores.correo = 'Ingresa un correo electrónico válido';
    }

    if (!body.telefono || !body.telefono.trim()) {
        errores.telefono = 'Este campo es obligatorio';
    } else if (!/^[0-9]{7,15}$/.test(body.telefono.trim())) {
        errores.telefono = 'Ingresa un teléfono válido';
    }

    if (!body.password) {
        errores.password = 'Este campo es obligatorio';
    } else if (body.password.length < 8) {
        errores.password = 'La contraseña debe tener mínimo 8 caracteres';
    }

    return errores;
};

// POST /api/clientes/registro
const registrarCliente = (req, res) => {
    const errores = validarCamposCliente(req.body);
    if (Object.keys(errores).length > 0) {
        return res.status(400).json({ mensaje: 'Revisa los datos ingresados.', errores });
    }

    const correo = req.body.correo.trim().toLowerCase();
    const clientes = leerClientes();

    const yaExiste = clientes.some((c) => c.correo.toLowerCase() === correo);
    if (yaExiste) {
        return res.status(409).json({
            mensaje: 'usuario ya existe',
            errores: { correo: 'usuario ya existe' }
        });
    }

    const nuevoCliente = {
        id: clientes.length > 0 ? clientes[clientes.length - 1].id + 1 : 1,
        nombre: req.body.nombre.trim(),
        correo,
        telefono: req.body.telefono.trim(),
        password: req.body.password, // TODO: aplicar hash (bcrypt) antes de producción
        rol: 'cliente'
    };

    clientes.push(nuevoCliente);
    escribirClientes(clientes);

    const { password, ...clienteSinPassword } = nuevoCliente;
    res.status(201).json({ mensaje: 'Registro exitoso', cliente: clienteSinPassword });
};

// POST /api/clientes/login
const loginCliente = (req, res) => {
    const correo = (req.body.correo || '').trim().toLowerCase();
    const password = (req.body.password || '').trim();

    const clientes = leerClientes();
    const cliente = clientes.find((c) => c.correo.toLowerCase() === correo && c.password === password);

    if (!cliente) {
        // Mensaje genérico a propósito: no revela cuál dato es incorrecto.
        return res.status(401).json({
            mensaje: 'La información de inicio de sesión que ingresaste es incorrecta.'
        });
    }

    const { password: _pw, ...clienteSinPassword } = cliente;
    res.json({
        mensaje: 'Inicio de sesión exitoso',
        token: 'mock-token-cliente-' + cliente.id,
        cliente: clienteSinPassword
    });
};

module.exports = {
    registrarCliente,
    loginCliente
};