// src/backend/lib/validaciones.js
const { esTexto } = require('./store');

const CATEGORIAS = ['Verduras', 'Frutas', 'Especias'];
const UNIDADES = ['lb', 'unidad'];
const REGEX_NOMBRE = /^[\p{L}\p{N}][\p{L}\p{N} .,'()\-]*$/u;
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_TELEFONO = /^[0-9]{7,15}$/;
const REGEX_NOMBRE_PERSONA = /^[\p{L}][\p{L} .'\-]*$/u;

const esNumero = (v) =>
    (typeof v === 'number' || (esTexto(v) && v.trim() !== '')) && Number.isFinite(Number(v));

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

// Devuelve { campo: mensaje }. Con { parcial:true, conPassword:false } sirve para editar perfil.
const validarCamposCliente = (body, { conPassword = true } = {}) => {
    const errores = {};
    const nombre = esTexto(body.nombre) ? body.nombre.trim() : '';
    const correo = esTexto(body.correo) ? body.correo.trim() : '';
    const telefono = esTexto(body.telefono) ? body.telefono.trim() : '';

    if (!nombre) errores.nombre = 'Este campo es obligatorio';
    else if (nombre.length > 60 || !REGEX_NOMBRE_PERSONA.test(nombre)) errores.nombre = 'Ingresa un nombre válido';

    if (!correo) errores.correo = 'Este campo es obligatorio';
    else if (!REGEX_CORREO.test(correo)) errores.correo = 'Ingresa un correo electrónico válido';

    if (!telefono) errores.telefono = 'Este campo es obligatorio';
    else if (!REGEX_TELEFONO.test(telefono)) errores.telefono = 'Ingresa un teléfono válido';

    if (conPassword) {
        if (!esTexto(body.password) || !body.password) errores.password = 'Este campo es obligatorio';
        else if (body.password.length < 8) errores.password = 'La contraseña debe tener mínimo 8 caracteres';
    }
    return errores;
};

module.exports = { CATEGORIAS, UNIDADES, validarCamposProducto, validarCamposCliente, esNumero };
