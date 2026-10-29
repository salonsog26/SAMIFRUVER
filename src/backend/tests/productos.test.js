import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prepararEntorno } from './helpers.js';

let env;
beforeEach(() => { env = prepararEntorno(); });
afterEach(() => env.limpiar());

const valido = { nombre: 'Papaya', precio: 4500, categoria: 'Frutas', stock: 12, unidad: 'lb' };

describe('E1-HU1 Registrar producto (API)', () => {
    it('E1-HU1 ESC1: producto duplicado (sin importar mayúsculas/espacios) → 409', async () => {
        const r = await env.api.post('/api/productos').send({ ...valido, nombre: '  tomate ' });
        expect(r.status).toBe(409);
        expect(r.body.mensaje).toBe('El producto ya existe.');
        expect(env.leerTabla('productos')).toHaveLength(2);
    });
    it.each([
        ['nombre vacío', { nombre: '' }],
        ['nombre solo espacios', { nombre: '    ' }],
        ['nombre de 1 carácter', { nombre: 'A' }],
        ['nombre con símbolos', { nombre: '@@@###' }],
        ['nombre de 61 caracteres', { nombre: 'a'.repeat(61) }],
        ['nombre no es texto', { nombre: 123 }],
        ['precio vacío', { precio: '' }],
        ['precio cero', { precio: 0 }],
        ['precio negativo', { precio: -5 }],
        ['precio no numérico', { precio: 'abc' }],
        ['categoría vacía', { categoria: '' }],
        ['categoría fuera de la lista', { categoria: 'Carnes' }],
        ['stock negativo', { stock: -1 }],
        ['stock no numérico', { stock: 'mucho' }],
        ['unidad inválida', { unidad: 'tonelada' }]
    ])('E1-HU1 ESC3: campos inválidos (%s) → 400 y no guarda', async (_n, cambio) => {
        const r = await env.api.post('/api/productos').send({ ...valido, ...cambio });
        expect(r.status).toBe(400);
        expect(env.leerTabla('productos')).toHaveLength(2);
    });
});

describe('E1-HU3 Consultar productos (API)', () => {
    it('E1-HU3 ESC1: con la base vacía devuelve lista vacía', async () => {
        await env.api.delete('/api/productos/1');
        await env.api.delete('/api/productos/2');
        expect((await env.api.get('/api/productos')).body).toEqual([]);
    });
    it('E1-HU3 ESC2: lista los productos existentes', async () => {
        const r = await env.api.get('/api/productos');
        expect(r.status).toBe(200);
        expect(r.body.map((p) => p.nombre)).toEqual(['Tomate', 'Jengibre']);
    });
});

describe('E1-HU2 Actualizar producto (API)', () => {
    it('E1-HU2 ESC1: cambios válidos → 200 y se persisten', async () => {
        const r = await env.api.put('/api/productos/1').send({ nombre: 'Tomate chonto', precio: 3500, categoria: 'Verduras', stock: 15, unidad: 'lb' });
        expect(r.status).toBe(200);
        expect(env.leerTabla('productos')[0].precio).toBe(3500);
    });
});
