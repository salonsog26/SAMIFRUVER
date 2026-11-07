import { describe, it, expect } from 'vitest';
import { validarTarjeta, formatearNumero, formatearVencimiento, formatearCvv, marcaDe } from '../utils/pagos';
import { etiquetaPago, tonoPago } from '../utils/pedidos';

const OK = { titular: 'Ana Pérez', numero: '4242 4242 4242 4242', vencimiento: '08/40', cvv: '123' };
const AHORA = new Date(2026, 10, 6);   // 6 nov 2026

describe('E4 utilidades de pagos', () => {
    it('formatea número, vencimiento y CVV mientras se escribe', () => {
        expect(formatearNumero('4242424242424242')).toBe('4242 4242 4242 4242');
        expect(formatearNumero('42a4 2')).toBe('4242');
        expect(formatearNumero('42424242424242429999')).toBe('4242 4242 4242 4242');   // máx. 16 dígitos
        expect(formatearVencimiento('0840')).toBe('08/40');
        expect(formatearVencimiento('08')).toBe('08');
        expect(formatearCvv('12a345')).toBe('1234');
    });
    it('detecta la marca', () => {
        expect(marcaDe('4242')).toBe('visa');
        expect(marcaDe('5555 5555')).toBe('mastercard');
        expect(marcaDe('2221 0000')).toBe('mastercard');
        expect(marcaDe('3782')).toBeNull();
    });
    it('una tarjeta correcta no tiene errores', () => {
        expect(validarTarjeta(OK, AHORA)).toEqual({});
        expect(validarTarjeta({ ...OK, numero: '5555555555554444' }, AHORA)).toEqual({});
    });
    it('campos vacíos → "Este campo es obligatorio"', () => {
        expect(validarTarjeta({}, AHORA)).toEqual({
            titular: 'Este campo es obligatorio', numero: 'Este campo es obligatorio',
            vencimiento: 'Este campo es obligatorio', cvv: 'Este campo es obligatorio'
        });
        expect(validarTarjeta({ titular: '   ', numero: '  ', vencimiento: ' ', cvv: ' ' }, AHORA).titular).toBe('Este campo es obligatorio');
    });
    it('número inválido: corto, Luhn incorrecto, con letras o de otra marca', () => {
        for (const numero of ['1234 5678 90', '4242 4242 4242 4241', '4242 4242 4242 42AB', '3782 8224 6310 005']) {
            expect(validarTarjeta({ ...OK, numero }, AHORA).numero).toBe('Tarjeta inválida');
        }
    });
    it('vencimiento: mal escrito, mes 13, vencida; el mes actual todavía vale', () => {
        expect(validarTarjeta({ ...OK, vencimiento: '8' }, AHORA).vencimiento).toBe('Fecha inválida (MM/AA)');
        expect(validarTarjeta({ ...OK, vencimiento: '13/30' }, AHORA).vencimiento).toBe('Fecha inválida (MM/AA)');
        expect(validarTarjeta({ ...OK, vencimiento: '10/26' }, AHORA).vencimiento).toBe('La tarjeta está vencida');
        expect(validarTarjeta({ ...OK, vencimiento: '11/26' }, AHORA).vencimiento).toBeUndefined();
    });
    it('CVV de 3 o 4 dígitos y titular con nombre válido', () => {
        expect(validarTarjeta({ ...OK, cvv: '12' }, AHORA).cvv).toBe('Código de seguridad inválido');
        expect(validarTarjeta({ ...OK, cvv: '1234' }, AHORA).cvv).toBeUndefined();
        expect(validarTarjeta({ ...OK, titular: '1234' }, AHORA).titular).toBe('Ingresa un nombre válido');
    });
    it('etiquetas y colores de estado de pago', () => {
        expect(etiquetaPago('aprobado')).toBe('Aprobado');
        expect(etiquetaPago('pendiente')).toBe('Pendiente');
        expect(etiquetaPago('devolucion_en_proceso')).toBe('Devolución en proceso');
        expect(etiquetaPago('devuelto')).toBe('Devuelto');
        expect(tonoPago('pendiente')).toBe('ambar');
        expect(tonoPago('aprobado')).toBe('verde');
    });
});
