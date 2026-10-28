import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prepararEntorno } from './helpers.js';

let env;
beforeEach(() => { env = prepararEntorno(); });
afterEach(() => env.limpiar());

const valido = { nombre: 'Papaya', precio: 4500, categoria: 'Frutas', stock: 12, unidad: 'lb' };

describe('E1-HU1 Registrar producto (API)', () => {
    it('E1-HU1 ESC2: producto nuevo → 201 y se guarda con id nuevo', async () => {
        const r = await env.api.post('/api/productos').send(valido);
        expect(r.status).toBe(201);
        expect(r.body.producto.id).toBe(3);
        expect(env.leerArchivo('productos.json')).toHaveLength(3);
    });
    it('E1-HU1 ESC1: producto duplicado (sin importar mayúsculas/espacios) → 409', async () => {
        const r = await env.api.post('/api/productos').send({ ...valido, nombre: '  tomate ' });
        expect(r.status).toBe(409);
        expect(r.body.mensaje).toBe('El producto ya existe.');
        expect(env.leerArchivo('productos.json')).toHaveLength(2);
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
        expect(env.leerArchivo('productos.json')).toHaveLength(2);
    });
    it('E1-HU1 ESC3b: acepta nombres con tildes y stock decimal o 0', async () => {
        const r = await env.api.post('/api/productos').send({ ...valido, nombre: 'Piña dulce', stock: 2.5 });
        expect(r.status).toBe(201);
        expect((await env.api.post('/api/productos').send({ ...valido, nombre: 'Mora', stock: 0 })).status).toBe(201);
    });
    it('E1-HU1 ESC2b: guarda el nombre sin espacios sobrantes y asigna imagen por defecto', async () => {
        const r = await env.api.post('/api/productos').send({ ...valido, nombre: '  Papaya  ' });
        expect(r.body.producto.nombre).toBe('Papaya');
        expect(r.body.producto.imagen).toBe('/images/producto-defecto.webp');
    });
    it('E1-HU1 ESC3c: cuerpo vacío no rompe el servidor', async () => {
        expect((await env.api.post('/api/productos').send({})).status).toBe(400);
    });
    it('E1-HU1: el id no se repite tras eliminar el último producto', async () => {
        await env.api.delete('/api/productos/2');
        const r = await env.api.post('/api/productos').send(valido);
        expect(r.body.producto.id).toBe(2);
    });
});

describe('E1-HU3 Consultar productos (API)', () => {
    it('E1-HU3 ESC2: lista los productos existentes', async () => {
        const r = await env.api.get('/api/productos');
        expect(r.status).toBe(200);
        expect(r.body.map((p) => p.nombre)).toEqual(['Tomate', 'Jengibre']);
    });
    it('E1-HU3 ESC1: con la base vacía devuelve lista vacía', async () => {
        await env.api.delete('/api/productos/1');
        await env.api.delete('/api/productos/2');
        expect((await env.api.get('/api/productos')).body).toEqual([]);
    });
});

describe('E1-HU2 Actualizar producto (API)', () => {
    it('E1-HU2 ESC1: cambios válidos → 200 y se persisten', async () => {
        const r = await env.api.put('/api/productos/1').send({ nombre: 'Tomate chonto', precio: 3500, categoria: 'Verduras', stock: 15, unidad: 'lb' });
        expect(r.status).toBe(200);
        expect(env.leerArchivo('productos.json')[0].precio).toBe(3500);
    });
    it('E1-HU2: actualización parcial conserva los demás campos', async () => {
        const r = await env.api.put('/api/productos/1').send({ precio: 9999 });
        expect(r.body.producto.nombre).toBe('Tomate');
        expect(r.body.producto.precio).toBe(9999);
    });
    it('E1-HU2: producto inexistente → 404', async () => {
        expect((await env.api.put('/api/productos/99').send({ precio: 1 })).status).toBe(404);
    });
    it('E1-HU2: datos inválidos → 400 y no modifica', async () => {
        const r = await env.api.put('/api/productos/1').send({ precio: -1 });
        expect(r.status).toBe(400);
        expect(env.leerArchivo('productos.json')[0].precio).toBe(3000);
    });
    it('E1-HU2: nombre ya usado por OTRO producto → 409; el propio nombre sí se permite', async () => {
        expect((await env.api.put('/api/productos/1').send({ nombre: 'jengibre' })).status).toBe(409);
        expect((await env.api.put('/api/productos/1').send({ nombre: 'TOMATE' })).status).toBe(200);
    });
    it('E1-HU2: nombre no texto no rompe el servidor', async () => {
        expect((await env.api.put('/api/productos/1').send({ nombre: 5 })).status).toBe(400);
    });
});

describe('Eliminar producto (API)', () => {
    it('elimina un producto existente → 200', async () => {
        expect((await env.api.delete('/api/productos/1')).status).toBe(200);
        expect(env.leerArchivo('productos.json')).toHaveLength(1);
    });
    it('producto inexistente → 404', async () => {
        expect((await env.api.delete('/api/productos/77')).status).toBe(404);
    });
});

describe('General', () => {
    it('GET /api/health responde OK', async () => {
        expect((await env.api.get('/api/health')).body.status).toBe('OK');
    });
    it('JSON mal formado → 400 JSON', async () => {
        const r = await env.api.post('/api/productos').set('Content-Type', 'application/json').send('{malo');
        expect(r.status).toBe(400);
    });
});
