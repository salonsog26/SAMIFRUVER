// src/utils/auth.js
// Autenticación contra el backend real (POST /api/auth/login) y manejo de la sesión en localStorage.
import { API_URL } from './config';

const CLAVE_SESION = 'samifruber_sesion';
export const MSJ_LOGIN_INCORRECTO = 'La información de inicio de sesión que ingresaste es incorrecta.';

// Inicia sesión (admin o cliente). Devuelve { ok:true, usuario } o { ok:false, mensaje, red? }.
export async function login(correo, contrasena) {
    try {
        const respuesta = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, password: contrasena })
        });
        const data = await respuesta.json();

        if (respuesta.ok && data.success) {
            const usuario = { ...data.usuario, token: data.token };
            guardarSesion(usuario);
            return { ok: true, usuario };
        }
        return { ok: false, mensaje: data.mensaje || MSJ_LOGIN_INCORRECTO };
    } catch (error) {
        return { ok: false, red: true, mensaje: 'No se pudo conectar con el servidor. Intenta de nuevo.' };
    }
}

export function guardarSesion(usuario) {
    try {
        localStorage.setItem(CLAVE_SESION, JSON.stringify(usuario));
    } catch (error) { /* almacenamiento no disponible */ }
}

export function obtenerSesion() {
    try {
        const data = localStorage.getItem(CLAVE_SESION);
        const sesion = data ? JSON.parse(data) : null;
        return sesion && typeof sesion === 'object' ? sesion : null;
    } catch (error) {
        return null; // sesión corrupta → se trata como sin sesión
    }
}

export function obtenerToken() {
    return obtenerSesion()?.token || null;
}

export function cerrarSesion() {
    try {
        localStorage.removeItem(CLAVE_SESION);
    } catch (error) { /* nada */ }
}
