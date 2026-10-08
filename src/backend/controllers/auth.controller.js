// src/backend/controllers/auth.controller.js

const loginAdmin = (req, res) => {
    const correo = (req.body.correo || '').trim().toLowerCase();
    const password = (req.body.password || '').trim();

    // Credenciales de prueba para el administrador de SAMIFRUVER
    const ADMIN_CORREO = "admin@samifruber.com";
    const ADMIN_PASSWORD = "admin123";

    if (correo === ADMIN_CORREO && password === ADMIN_PASSWORD) {
        res.json({
            success: true,
            mensaje: 'Autenticación exitosa',
            token: 'mock-token-samifruber-12345', // Token simulado para la sesión
            usuario: { correo: ADMIN_CORREO, rol: 'Administrador' }
        });
    } else {
        // Mensaje genérico a propósito: no revela si falló el correo o la contraseña.
        res.status(401).json({
            success: false,
            mensaje: 'Correo o contraseña incorrectos.'
        });
    }
};

module.exports = {
    loginAdmin
};