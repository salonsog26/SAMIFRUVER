// src/backend/lib/util.js — utilidades pequeñas compartidas
const esTexto = (v) => typeof v === 'string';
const esNumero = (v) =>
    (typeof v === 'number' || (esTexto(v) && v.trim() !== '')) && Number.isFinite(Number(v));

// Envuelve un controlador async: cualquier error pasa al manejador de errores de Express.
const asincrono = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Id numérico de la URL, o null si no es un entero positivo (evita errores de SQL con "abc").
const idDeUrl = (valor) => (/^[0-9]{1,9}$/.test(String(valor)) ? Number(valor) : null);

module.exports = { esTexto, esNumero, asincrono, idDeUrl };
