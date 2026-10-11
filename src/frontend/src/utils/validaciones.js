// src/utils/validaciones.js — validaciones de formularios de cliente (mismas reglas que el backend)
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_TELEFONO = /^[0-9]{7,15}$/;
const REGEX_NOMBRE = /^[\p{L}][\p{L} .'\-]*$/u;

export const OBLIGATORIO = 'Este campo es obligatorio';

export function validarNombre(valor) {
    const v = (valor || '').trim();
    if (!v) return OBLIGATORIO;
    if (v.length > 60 || !REGEX_NOMBRE.test(v)) return 'Ingresa un nombre válido';
    return undefined;
}
export function validarCorreo(valor) {
    const v = (valor || '').trim();
    if (!v) return OBLIGATORIO;
    if (!REGEX_CORREO.test(v)) return 'Ingresa un correo electrónico válido';
    return undefined;
}
export function validarTelefono(valor) {
    const v = (valor || '').trim();
    if (!v) return OBLIGATORIO;
    if (!REGEX_TELEFONO.test(v)) return 'Ingresa un teléfono válido';
    return undefined;
}
export function validarPassword(valor) {
    if (!valor) return OBLIGATORIO;
    if (valor.length < 8) return 'La contraseña debe tener mínimo 8 caracteres';
    return undefined;
}

const sinVacios = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v));

export function validarPerfil({ nombre, correo, telefono }) {
    return sinVacios({ nombre: validarNombre(nombre), correo: validarCorreo(correo), telefono: validarTelefono(telefono) });
}
export function validarRegistro({ nombre, correo, telefono, password }) {
    return sinVacios({
        nombre: validarNombre(nombre), correo: validarCorreo(correo),
        telefono: validarTelefono(telefono), password: validarPassword(password)
    });
}
