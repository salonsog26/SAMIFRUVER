// src/backend/controllers/auth.controller.js

const loginAdmin = (req, res) => {
    const { correo, password } = req.body;

    // Credenciales de prueba para el administrador de SAMIFRUBER
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
        res.status(401).json({
            success: false,
            mensaje: 'Credenciales inválidas. Verifica tu correo y contraseña.'
        });
    }
};

module.exports = {
    loginAdmin
};