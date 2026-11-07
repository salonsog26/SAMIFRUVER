import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prepararEntorno, guardarTarjeta, TARJETA_OK } from './helpers.js';

let env;
beforeEach(() => { env = prepararEntorno(); });
afterEach(() => env.limpiar());

const como = (id) => ({ 'X-Cliente-Id': String(id) });
const guardar = (cuerpo, cliente = 1) => env.api.post('/api/metodos-pago').set(como(cliente)).send(cuerpo);
const listar = (cliente = 1) => env.api.get('/api/metodos-pago').set(como(cliente));

describe('E4-HU3 Gestionar métodos de pago', () => {
    it('ESC1: agregar tarjeta válida → 201 "Método de pago agregado correctamente", solo últimos 4 dígitos y tipo', async () => {
        const r = await guardar(TARJETA_OK);
        expect(r.status).toBe(201);
        expect(r.body.mensaje).toBe('Método de pago agregado correctamente');
        expect(r.body.metodo).toMatchObject({ marca: 'visa', ultimos4: '4242', vence: '08/40', descripcion: 'Visa terminada en 4242', predeterminada: true });
        // Se listan solo los 4 últimos dígitos: el número completo y el CVV nunca llegan a la base de datos.
        const fila = env.leerTabla('metodos_pago')[0];
        expect(JSON.stringify(fila)).not.toMatch(/4242424242424242|123/);
        expect(Object.keys(fila)).not.toContain('cvv');
        expect(Object.keys(fila)).not.toContain('numero');
        const l = await listar();
        expect(l.body.total).toBe(1);
        expect(JSON.stringify(l.body)).not.toContain('4242424242424242');
    });
    it('reconoce Mastercard y la primera tarjeta queda predeterminada; la siguiente solo si se pide', async () => {
        await guardar(TARJETA_OK);
        const m = await guardar({ ...TARJETA_OK, numero: '5555 5555 5555 4444' });
        expect(m.body.metodo).toMatchObject({ marca: 'mastercard', ultimos4: '4444', predeterminada: false });
        const p = await guardar({ ...TARJETA_OK, numero: '5105 1051 0510 5100', predeterminada: true });
        expect(p.body.metodo.predeterminada).toBe(true);
        const filas = env.leerTabla('metodos_pago');
        expect(filas.filter((f) => f.predeterminada)).toHaveLength(1);
    });
    it('ESC2: campos obligatorios en blanco → 400, nada se guarda y cada campo trae su mensaje', async () => {
        const r = await guardar({ titular: '', numero: '', vencimiento: '', cvv: '' });
        expect(r.status).toBe(400);
        expect(r.body.errores).toEqual({
            titular: 'Este campo es obligatorio', numero: 'Este campo es obligatorio',
            vencimiento: 'Este campo es obligatorio', cvv: 'Este campo es obligatorio'
        });
        expect(env.leerTabla('metodos_pago')).toHaveLength(0);
    });
    it('ESC2: número inválido (corto, sin letras, Luhn incorrecto, marca no soportada) → "Tarjeta inválida"', async () => {
        for (const numero of ['1234 5678 90', '4242 4242 4242 4241', '4242 4242 4242 42AB', '3782 8224 6310 005']) {
            const r = await guardar({ ...TARJETA_OK, numero });
            expect(r.status).toBe(400);
            expect(r.body.errores.numero).toBe('Tarjeta inválida');
        }
        expect(env.leerTabla('metodos_pago')).toHaveLength(0);
    });
    it('ESC2: tarjeta vencida o con fecha/CVV mal escritos → 400', async () => {
        expect((await guardar({ ...TARJETA_OK, vencimiento: '01/20' })).body.errores.vencimiento).toBe('La tarjeta está vencida');
        expect((await guardar({ ...TARJETA_OK, vencimiento: '13/30' })).body.errores.vencimiento).toBe('Fecha inválida (MM/AA)');
        expect((await guardar({ ...TARJETA_OK, vencimiento: 'abc' })).body.errores.vencimiento).toBe('Fecha inválida (MM/AA)');
        expect((await guardar({ ...TARJETA_OK, cvv: '12' })).body.errores.cvv).toBe('Código de seguridad inválido');
        expect((await guardar({ ...TARJETA_OK, titular: '1234' })).body.errores.titular).toBe('Ingresa un nombre válido');
        expect(env.leerTabla('metodos_pago')).toHaveLength(0);
    });
    it('una tarjeta que vence este mismo mes todavía es válida', async () => {
        const ahora = new Date();
        const mm = String(ahora.getMonth() + 1).padStart(2, '0');
        const aa = String(ahora.getFullYear() % 100).padStart(2, '0');
        expect((await guardar({ ...TARJETA_OK, vencimiento: `${mm}/${aa}` })).status).toBe(201);
    });
    it('la misma tarjeta no se guarda dos veces (409) y hay un máximo de 5', async () => {
        await guardar(TARJETA_OK);
        const repetida = await guardar(TARJETA_OK);
        expect(repetida.status).toBe(409);
        expect(repetida.body.errores.numero).toBe('Esta tarjeta ya está guardada');
        for (const n of ['5555 5555 5555 4444', '5105 1051 0510 5100', '4012 8888 8888 1881', '4111 1111 1111 1111']) {
            expect((await guardar({ ...TARJETA_OK, numero: n })).status).toBe(201);
        }
        const sexta = await guardar({ ...TARJETA_OK, numero: '4000 0566 5566 5556' });
        expect(sexta.status).toBe(409);
        expect(env.leerTabla('metodos_pago')).toHaveLength(5);
    });
    it('ESC3: eliminar → 200 "Método de pago eliminado correctamente" y deja de listarse', async () => {
        const id = await guardarTarjeta(env.api, 1);
        const r = await env.api.delete(`/api/metodos-pago/${id}`).set(como(1));
        expect(r.status).toBe(200);
        expect(r.body.mensaje).toBe('Método de pago eliminado correctamente');
        expect(r.body.metodos).toEqual([]);
        expect((await listar()).body.total).toBe(0);
    });
    it('al eliminar la predeterminada, otra tarjeta pasa a serlo', async () => {
        await guardar({ ...TARJETA_OK, numero: '5555 5555 5555 4444' });
        const predet = await guardar({ ...TARJETA_OK, predeterminada: true });
        const r = await env.api.delete(`/api/metodos-pago/${predet.body.metodo.id}`).set(como(1));
        expect(r.body.metodos).toHaveLength(1);
        expect(r.body.metodos[0]).toMatchObject({ ultimos4: '4444', predeterminada: true });
    });
    it('cada cliente ve y borra solo sus tarjetas; sin sesión → 401; id inexistente → 404', async () => {
        const id = await guardarTarjeta(env.api, 1);
        expect((await listar(2)).body.total).toBe(0);
        expect((await env.api.delete(`/api/metodos-pago/${id}`).set(como(2))).status).toBe(404);
        expect(env.leerTabla('metodos_pago')).toHaveLength(1);
        expect((await env.api.get('/api/metodos-pago')).status).toBe(401);
        expect((await env.api.get('/api/metodos-pago').set(como(99))).status).toBe(401);
        expect((await env.api.delete('/api/metodos-pago/abc').set(como(1))).status).toBe(404);
        expect((await env.api.delete('/api/metodos-pago/999').set(como(1))).status).toBe(404);
    });
});
