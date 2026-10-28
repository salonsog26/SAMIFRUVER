// src/routes/RutaProtegida.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { obtenerSesion } from '../utils/auth';

// Sin sesión → /login. Con sesión pero rol incorrecto → a su pantalla principal.
function RutaProtegida({ rolRequerido, children }) {
    const sesion = obtenerSesion();

    if (!sesion) return <Navigate to="/login" replace />;
    if (rolRequerido && sesion.rol !== rolRequerido) {
        return <Navigate to={sesion.rol === 'admin' ? '/admin/productos' : '/'} replace />;
    }
    return children;
}

export default RutaProtegida;
