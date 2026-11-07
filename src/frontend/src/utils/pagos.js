// src/utils/pagos.js — Épica 4: métodos de pago (tarjetas guardadas): validación, formato y llamadas a la API.
// Las reglas de validación son las mismas del servidor (backend/lib/tarjetas.js): el servidor es quien manda,
// esto solo avisa antes de enviar.
import { pedir } from './pedidos';

export const MSJ_OBLIGATORIO = 'Este campo es obligatorio';
export const MSJ_TARJETA_INVALIDA = 'Tarjeta inválida';
export const MSJ_AGREGADO = 'Método de pago agregado correctamente';
export const MSJ_ELIMINADO = 'Método de pago eliminado correctamente';
export const MSJ_REVISA = 'Revisa los datos de tu tarjeta.';
export const MSJ_SIN_TARJETA = 'Selecciona una tarjeta guardada o agrega una nueva para pagar con tarjeta.';

export const MARCAS = { visa: 'Visa', mastercard: 'Mastercard' };

const soloDigitos = (v) => String(v || '').replace(/\D/g, '');

// "4242424242424242" → "4242 4242 4242 4242" (mientras se escribe)
export const formatearNumero = (v) => soloDigitos(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
// "0828" → "08/28"; "8" se deja igual para no estorbar al escribir
export const formatearVencimiento = (v) => {
    const d = soloDigitos(v).slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};
export const formatearCvv = (v) => soloDigitos(v).slice(0, 4);

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

export const marcaDe = (valor) => {
    const n = soloDigitos(valor);
    if (/^4/.test(n)) return 'visa';
    if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(n)) return 'mastercard';
    return null;
};

// Devuelve { campo: mensaje } — vacío si todo está bien.
export const validarTarjeta = ({ titular, numero, vencimiento, cvv }, ahora = new Date()) => {
    const errores = {};
    const t = String(titular || '').trim().replace(/\s+/g, ' ');
    if (!t) errores.titular = MSJ_OBLIGATORIO;
    else if (t.length < 3 || t.length > 80 || !/^[\p{L}][\p{L} .'-]*$/u.test(t)) errores.titular = 'Ingresa un nombre válido';

    const n = soloDigitos(numero);
    if (!String(numero || '').trim()) errores.numero = MSJ_OBLIGATORIO;
    else if (!/^\d{16}$/.test(n) || !luhn(n) || !marcaDe(n) || /[^\d\s-]/.test(String(numero))) errores.numero = MSJ_TARJETA_INVALIDA;

    const v = String(vencimiento || '').trim();
    const m = /^(\d{1,2})\s*\/\s*(\d{2}|\d{4})$/.exec(v);
    if (!v) errores.vencimiento = MSJ_OBLIGATORIO;
    else if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) errores.vencimiento = 'Fecha inválida (MM/AA)';
    else {
        const anio = m[2].length === 2 ? 2000 + Number(m[2]) : Number(m[2]);
        if (anio * 12 + (Number(m[1]) - 1) < ahora.getFullYear() * 12 + ahora.getMonth()) errores.vencimiento = 'La tarjeta está vencida';
    }

    const c = String(cvv || '').trim();
    if (!c) errores.cvv = MSJ_OBLIGATORIO;
    else if (!/^\d{3,4}$/.test(c)) errores.cvv = 'Código de seguridad inválido';
    return errores;
};

// ------------------------------------------------------------ API (misma identificación por X-Cliente-Id que pedidos)
export const listarMetodos = () => pedir('/api/metodos-pago');
export const agregarMetodo = (cuerpo) => pedir('/api/metodos-pago', { method: 'POST', body: JSON.stringify(cuerpo) });
export const eliminarMetodo = (id) => pedir(`/api/metodos-pago/${id}`, { method: 'DELETE' });
