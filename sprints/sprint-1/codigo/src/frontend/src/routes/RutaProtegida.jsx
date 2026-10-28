// src/routes/RutaProtegida.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';

// Envuelve las rutas de administrador. Si no hay token en localStorage,
// el usuario no puede acceder por URL directa y se le redirige al login.
function RutaProtegida({ children }) {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default RutaProtegida;