// src/backend/lib/tarjetas.js — Épica 4: validación de los datos de una tarjeta (E4-HU3).
// Todo se valida en el servidor; el frontend repite las mismas reglas para avisar antes de enviar.
const { esTexto } = require('./util');

const MSJ_OBLIGATORIO = 'Este campo es obligatorio';
const MSJ_TARJETA_INVALIDA = 'Tarjeta inválida';
const MSJ_VENCIDA = 'La tarjeta está vencida';
const MSJ_FECHA_INVALIDA = 'Fecha inválida (MM/AA)';
const MSJ_CVV_INVALIDO = 'Código de seguridad inválido';
const MSJ_TITULAR_INVALIDO = 'Ingresa un nombre válido';

const soloDigitos = (v) => (esTexto(v) || typeof v === 'number' ? String(v).replace(/[\s-]/g, '') : '');

// Algoritmo de Luhn: detecta errores de digitación en el número.
const luhn = (numero) => {
    let suma = 0;
    let doble = false;
    for (let i = numero.length - 1; i >= 0; i -= 1) {
        let d = Number(numero[i]);
        if (doble) { d *= 2; if (d > 9) d -= 9; }
        suma += d;
        doble = !doble;
    }
    return suma % 10 === 0;
};

// 'visa' (empieza por 4) | 'mastercard' (51–55 o 2221–2720) | null
const marcaDe = (numero) => {
    if (/^4\d{15}$/.test(numero)) return 'visa';
    if (/^(5[1-5]\d{14}|2(2[2-9][1-9]|2[3-9]\d\d|[3-6]\d{3}|7[01]\d\d|720\d)\d{12})$/.test(numero)) return 'mastercard';
    return null;
};

// "08/28" → { mes: 8, anio: 2028 } | null
const leerVencimiento = (texto) => {
    const m = /^(\d{1,2})\s*\/\s*(\d{2}|\d{4})$/.exec(esTexto(texto) ? texto.trim() : '');
    if (!m) return null;
    const mes = Number(m[1]);
    const anio = m[2].length === 2 ? 2000 + Number(m[2]) : Number(m[2]);
    return mes >= 1 && mes <= 12 ? { mes, anio } : null;
};

// Vence al terminar el mes indicado.
const estaVencida = ({ mes, anio }, ahora = new Date()) => {
    const actual = ahora.getFullYear() * 12 + ahora.getMonth();   // getMonth(): 0–11
    return anio * 12 + (mes - 1) < actual;
};

// Devuelve { errores, datos }. `errores` está vacío si todo es válido.
const validarTarjeta = (body = {}, ahora = new Date()) => {
    const errores = {};

    const titular = esTexto(body.titular) ? body.titular.trim().replace(/\s+/g, ' ') : '';
    if (!titular) errores.titular = MSJ_OBLIGATORIO;
    else if (titular.length < 3 || titular.length > 80 || !/^[\p{L}][\p{L} .'\-]*$/u.test(titular)) errores.titular = MSJ_TITULAR_INVALIDO;

    const numero = soloDigitos(body.numero);
    let marca = null;
    if (!numero) errores.numero = MSJ_OBLIGATORIO;
    else if (!/^\d{16}$/.test(numero) || !luhn(numero) || !(marca = marcaDe(numero))) errores.numero = MSJ_TARJETA_INVALIDA;

    let vence = null;
    const textoVence = esTexto(body.vencimiento) ? body.vencimiento.trim() : '';
    if (!textoVence) errores.vencimiento = MSJ_OBLIGATORIO;
    else if (!(vence = leerVencimiento(textoVence))) errores.vencimiento = MSJ_FECHA_INVALIDA;
    else if (estaVencida(vence, ahora)) errores.vencimiento = MSJ_VENCIDA;

    const cvv = soloDigitos(body.cvv);
    if (!cvv) errores.cvv = MSJ_OBLIGATORIO;
    else if (!/^\d{3,4}$/.test(cvv)) errores.cvv = MSJ_CVV_INVALIDO;

    // El número completo y el CVV se validan aquí y se descartan: solo se conservan los 4 últimos dígitos.
    const datos = Object.keys(errores).length
        ? null
        : { titular, marca, ultimos4: numero.slice(-4), venceMes: vence.mes, venceAnio: vence.anio, predeterminada: body.predeterminada === true };
    return { errores, datos };
};

module.exports = { validarTarjeta, luhn, marcaDe, leerVencimiento, estaVencida, MSJ_OBLIGATORIO, MSJ_TARJETA_INVALIDA };
