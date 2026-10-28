// src/backend/lib/validaciones.js
const { esTexto, esNumero } = require('./util');

const CATEGORIAS = ['Verduras', 'Frutas', 'Especias'];
const UNIDADES = ['lb', 'unidad'];
const REGEX_NOMBRE = /^[\p{L}\p{N}][\p{L}\p{N} .,'()\-]*$/u;
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_TELEFONO = /^[0-9]{7,15}$/;
const REGEX_NOMBRE_PERSONA = /^[\p{L}][\p{L} .'\-]*$/u;

// Devuelve un mensaje de error o null.
const validarCamposProducto = (body) => {
    if (!esTexto(body.nombre) || !body.nombre.trim()) return 'El nombre del producto es obligatorio.';
    const nombre = body.nombre.trim();
    if (nombre.length < 2 || nombre.length > 60 || !REGEX_NOMBRE.test(nombre)) {
        return 'El nombre debe tener entre 2 y 60 caracteres y solo letras, números o espacios.';
    }
    if (!esNumero(body.precio) || Number(body.precio) <= 0) return 'El precio debe ser un número mayor a 0.';
    if (!esTexto(body.categoria) || !body.categoria.trim()) return 'La categoría es obligatoria.';
    if (!CATEGORIAS.includes(body.categoria)) return 'La categoría no es válida.';
    if (!esNumero(body.stock) || Number(body.stock) < 0) return 'El stock debe ser un número mayor o igual a 0.';
    if (body.unidad !== undefined && !UNIDADES.includes(body.unidad)) return 'La unidad no es válida.';
    return null;
};

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
    else if (correo.length > 120 || !REGEX_CORREO.test(correo)) errores.correo = MSJ_CORREO;

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

module.exports = { CATEGORIAS, UNIDADES, validarCamposProducto, validarCamposCliente, limpiarEspacios, MSJ_CORREO };
