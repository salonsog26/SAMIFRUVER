// src/utils/auth.js
// Autenticación contra el backend real (POST /api/auth/login).

const API_URL = 'http://localhost:4000';
const CLAVE_SESION = 'samifruber_sesion';

// Intenta iniciar sesión contra el backend.
// Devuelve { ok: true, usuario } o { ok: false, mensaje }.
export async function login(correo, contrasena) {
    try {
        const respuesta = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, password: contrasena })
        });
        const data = await respuesta.json();

        if (data.success) {
            const usuario = { correo: data.usuario.correo, rol: data.usuario.rol, token: data.token };
            guardarSesion(usuario);
            return { ok: true, usuario };
        }

        return { ok: false, mensaje: data.mensaje || 'Credenciales inválidas.' };
    } catch (error) {
        return { ok: false, mensaje: 'No se pudo conectar con el servidor.' };
    }
}

export function guardarSesion(usuario) {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(usuario));
}

export function obtenerSesion() {
    const data = localStorage.getItem(CLAVE_SESION);
    return data ? JSON.parse(data) : null;
}

export function obtenerToken() {
    return obtenerSesion()?.token || null;
}

export function cerrarSesion() {
    localStorage.removeItem(CLAVE_SESION);
}
