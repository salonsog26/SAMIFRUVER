// src/backend/controllers/auth.controller.js — inicio de sesión unificado (admin y cliente)
const { query } = require('../lib/db');
const { esTexto, asincrono } = require('../lib/util');
const passwords = require('../lib/passwords');

const TOKEN_ADMIN = 'mock-token-samifruber-12345';
const MSJ_INCORRECTO = 'La información de inicio de sesión que ingresaste es incorrecta.';

const normalizar = (body) => ({
    correo: esTexto(body && body.correo) ? body.correo.trim().toLowerCase() : '',
    password: esTexto(body && body.password) ? body.password.trim() : ''
});

const login = asincrono(async (req, res) => {
    const { correo, password } = normalizar(req.body);

    if (correo && password) {
        // 1) ¿Es administrador?
        const admin = (await query('SELECT nombre, correo, password_hash FROM administradores WHERE LOWER(correo) = $1', [correo])).rows[0];
        if (admin && (await passwords.verificar(password, admin.password_hash))) {
            return res.json({
                success: true,
                mensaje: 'Autenticación exitosa',
                token: TOKEN_ADMIN,
                usuario: { correo: admin.correo, nombre: admin.nombre, rol: 'admin' }
            });
        }

        // 2) ¿Es cliente?
        const cliente = (await query(
            'SELECT id, nombre, correo, telefono, documento, direccion, ciudad, password_hash FROM clientes WHERE LOWER(correo) = $1',
            [correo]
        )).rows[0];
        if (cliente && (await passwords.verificar(password, cliente.password_hash))) {
            const { password_hash, ...datos } = cliente;
            return res.json({
                success: true,
                mensaje: 'Inicio de sesión exitoso',
                token: 'mock-token-cliente-' + cliente.id,
                usuario: { ...datos, rol: 'cliente' }
            });
        }
    }

    // Mensaje genérico a propósito: no revela cuál dato falló.
    res.status(401).json({ success: false, mensaje: MSJ_INCORRECTO });
});

module.exports = { login, loginAdmin: login };
