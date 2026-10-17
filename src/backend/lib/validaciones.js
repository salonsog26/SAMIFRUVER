// src/backend/lib/validaciones.js
const { esTexto } = require('./store');

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_TELEFONO = /^[0-9]{7,15}$/;
const REGEX_NOMBRE_PERSONA = /^[\p{L}][\p{L} .'\-]*$/u;

const MSJ_OBLIGATORIO = 'Este campo es obligatorio';
const MSJ_CORREO = 'El correo debe incluir un dominio válido, por ejemplo: nombre@dominio.com';
const REGEX_DOCUMENTO = /^[0-9][0-9. ]*$/;
const REGEX_CIUDAD = /^[\p{L}][\p{L} .,'\-]*$/u;

// Quita espacios sobrantes: "  300   456 7890 " -> "300 456 7890"
const limpiarEspacios = (v) => (esTexto(v) ? v.trim().replace(/\s+/g, ' ') : '');
const soloDigitos = (v) => (esTexto(v) ? v.replace(/\D/g, '') : '');

// Devuelve { campo: mensaje }. Obligatorios: nombre, correo, teléfono (y contraseña al registrar).
// Opcionales (solo perfil): documento, dirección, ciudad.
const validarCamposCliente = (body, { conPassword = true, conExtras = false } = {}) => {
    const errores = {};
    const nombre = limpiarEspacios(body.nombre);
    const correo = esTexto(body.correo) ? body.correo.trim() : '';
    const telefono = limpiarEspacios(body.telefono);

    if (!nombre) errores.nombre = MSJ_OBLIGATORIO;
    else if (nombre.length > 60 || !REGEX_NOMBRE_PERSONA.test(nombre)) errores.nombre = 'Ingresa un nombre válido';

    if (!correo) errores.correo = MSJ_OBLIGATORIO;
    else if (!REGEX_CORREO.test(correo)) errores.correo = MSJ_CORREO;

    if (!telefono) errores.telefono = MSJ_OBLIGATORIO;
    else if (!/^[0-9 ]+$/.test(telefono) || soloDigitos(telefono).length < 7 || soloDigitos(telefono).length > 15) {
        errores.telefono = 'Ingresa un teléfono válido';
    }

    if (conPassword) {
        // Solo espacios cuenta como vacío; se mide sin espacios en los extremos (el login también los recorta).
        const pass = esTexto(body.password) ? body.password.trim() : '';
        if (!pass) errores.password = MSJ_OBLIGATORIO;
        else if (pass.length < 8) errores.password = 'La contraseña debe tener mínimo 8 caracteres';
    }

    if (conExtras) {
        const documento = limpiarEspacios(body.documento);
        const direccion = limpiarEspacios(body.direccion);
        const ciudad = limpiarEspacios(body.ciudad);
        if (body.documento !== undefined && body.documento !== null && !esTexto(body.documento)) errores.documento = 'Ingresa un documento válido';
        else if (documento && (!REGEX_DOCUMENTO.test(documento) || soloDigitos(documento).length < 5 || soloDigitos(documento).length > 15)) {
            errores.documento = 'Ingresa un documento válido';
        }
        if (body.direccion !== undefined && body.direccion !== null && !esTexto(body.direccion)) errores.direccion = 'Ingresa una dirección válida';
        else if (direccion.length > 120) errores.direccion = 'La dirección es demasiado larga';
        if (body.ciudad !== undefined && body.ciudad !== null && !esTexto(body.ciudad)) errores.ciudad = 'Ingresa una ciudad válida';
        else if (ciudad && (ciudad.length > 60 || !REGEX_CIUDAD.test(ciudad))) errores.ciudad = 'Ingresa una ciudad válida';
    }
    return errores;
};

module.exports = { validarCamposCliente, limpiarEspacios, MSJ_CORREO };
