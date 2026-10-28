// src/backend/controllers/auth.controller.js
const { leer, esTexto } = require('../lib/store');

const ADMIN_CORREO = 'admin@samifruber.com';
const ADMIN_PASSWORD = 'admin123';
const TOKEN_ADMIN = 'mock-token-samifruber-12345';
const MSJ_INCORRECTO = 'La información de inicio de sesión que ingresaste es incorrecta.';

const normalizar = (body) => ({
    correo: esTexto(body && body.correo) ? body.correo.trim().toLowerCase() : '',
    password: esTexto(body && body.password) ? body.password.trim() : ''
});

// POST /api/auth/login  (E1-HU4 y E2-HU2: un solo endpoint para ambos roles)
// Devuelve usuario.rol = 'admin' | 'cliente'.
const login = (req, res) => {
    const { correo, password } = normalizar(req.body);

    if (correo === ADMIN_CORREO && password === ADMIN_PASSWORD) {
        return res.json({
            success: true,
            mensaje: 'Autenticación exitosa',
            token: TOKEN_ADMIN,
            usuario: { correo: ADMIN_CORREO, nombre: 'Administrador', rol: 'admin' }
        });
    }

    const cliente = correo && password
        ? leer('clientes.json').find((c) => c.correo.toLowerCase() === correo && c.password === password)
        : null;
    if (cliente) {
        const { password: _pw, ...datos } = cliente;
        return res.json({
            success: true,
            mensaje: 'Inicio de sesión exitoso',
            token: 'mock-token-cliente-' + cliente.id,
            usuario: { ...datos, rol: 'cliente' }
        });
    }

    // Mensaje genérico a propósito: no revela cuál dato falló.
    res.status(401).json({ success: false, mensaje: MSJ_INCORRECTO });
};

module.exports = { login, loginAdmin: login };
