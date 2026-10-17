// src/utils/validaciones.js — validaciones de formularios de cliente (mismas reglas que el backend)
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_NOMBRE = /^[\p{L}][\p{L} .'\-]*$/u;
const REGEX_DOCUMENTO = /^[0-9][0-9. ]*$/;
const REGEX_CIUDAD = /^[\p{L}][\p{L} .,'\-]*$/u;

export const OBLIGATORIO = 'Este campo es obligatorio';
export const MSJ_CORREO = 'El correo debe incluir un dominio válido, por ejemplo: nombre@dominio.com';
export const MSJ_CORREO_LOGIN = 'Correo no válido';

const limpiar = (v) => String(v ?? '').trim().replace(/\s+/g, ' ');
const digitos = (v) => String(v ?? '').replace(/\D/g, '');

export function validarNombre(valor) {
    const v = limpiar(valor);
    if (!v) return OBLIGATORIO;
    if (v.length > 60 || !REGEX_NOMBRE.test(v)) return 'Ingresa un nombre válido';
    return undefined;
}
export function validarCorreo(valor) {
    const v = String(valor ?? '').trim();
    if (!v) return OBLIGATORIO;
    if (!REGEX_CORREO.test(v)) return MSJ_CORREO;
    return undefined;
}
// Acepta espacios: "300 456 7890" (7 a 15 dígitos).
export function validarTelefono(valor) {
    const v = limpiar(valor);
    if (!v) return OBLIGATORIO;
    if (!/^[0-9 ]+$/.test(v) || digitos(v).length < 7 || digitos(v).length > 15) return 'Ingresa un teléfono válido';
    return undefined;
}
export function validarPassword(valor) {
    const v = String(valor ?? '').trim(); // solo espacios = vacío
    if (!v) return OBLIGATORIO;
    if (v.length < 8) return 'La contraseña debe tener mínimo 8 caracteres';
    return undefined;
}
// Opcionales: vacío es válido.
export function validarDocumento(valor) {
    const v = limpiar(valor);
    if (!v) return undefined;
    if (!REGEX_DOCUMENTO.test(v) || digitos(v).length < 5 || digitos(v).length > 15) return 'Ingresa un documento válido';
    return undefined;
}
export function validarDireccion(valor) {
    return limpiar(valor).length > 120 ? 'La dirección es demasiado larga' : undefined;
}
export function validarCiudad(valor) {
    const v = limpiar(valor);
    if (!v) return undefined;
    if (v.length > 60 || !REGEX_CIUDAD.test(v)) return 'Ingresa una ciudad válida';
    return undefined;
}
// Login: solo se revisa el formato del correo (la contraseña la valida el servidor).
export function validarCorreoLogin(valor) {
    return REGEX_CORREO.test(String(valor ?? '').trim()) ? undefined : MSJ_CORREO_LOGIN;
}

const sinVacios = (obj) => Object.fromEntries(Object.entries(obj).filter(([, v]) => v));

export function validarPerfil({ nombre, correo, telefono, documento, direccion, ciudad }) {
    return sinVacios({
        nombre: validarNombre(nombre), correo: validarCorreo(correo), telefono: validarTelefono(telefono),
        documento: validarDocumento(documento), direccion: validarDireccion(direccion), ciudad: validarCiudad(ciudad)
    });
}
export function validarRegistro({ nombre, correo, telefono, password }) {
    return sinVacios({
        nombre: validarNombre(nombre), correo: validarCorreo(correo),
        telefono: validarTelefono(telefono), password: validarPassword(password)
    });
}
export const normalizarTexto = limpiar;
