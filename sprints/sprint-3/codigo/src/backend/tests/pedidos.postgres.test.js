// Prueba de integración contra un PostgreSQL REAL (pg-mem no soporta ROLLBACK ni bloqueos concurrentes).
// Solo corre si defines TEST_DATABASE_URL apuntando a una base VACÍA y desechable, por ejemplo:
//   TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/samifruver_test npm test
// Sin esa variable las pruebas se omiten (así `npm test` no necesita PostgreSQL instalado).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import pg from 'pg';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const URL_BD = process.env.TEST_DATABASE_URL;
const ESQUEMA = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../database/01_schema.sql'), 'utf-8');

describe.skipIf(!URL_BD)('Pedidos sobre PostgreSQL real (transacciones)', () => {
    let pool, api, db;
    const como = (id) => ({ 'X-Cliente-Id': String(id) });
    const stock = async (id) => Number((await pool.query('SELECT stock FROM productos WHERE id = $1', [id])).rows[0].stock);
    const direccion = { alias: 'Casa', nombre: 'Ana', linea: 'Calle 95 # 15-42', ciudad: 'Bogotá', telefono: '3105550182' };

    beforeAll(async () => {
        pool = new pg.Pool({ connectionString: URL_BD });
        await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
        await pool.query(ESQUEMA);
        db = require('../lib/db');
        db.setPool(pool);
        api = request(require('../app'));
    });
    beforeEach(async () => {
        await pool.query('TRUNCATE pedido_items, pedidos, productos, clientes, categorias RESTART IDENTITY CASCADE');
        await pool.query("INSERT INTO categorias (nombre) VALUES ('Verduras')");
        await pool.query(`INSERT INTO productos (nombre, precio, categoria_id, stock, unidad) VALUES
            ('Tomate', 3000, 1, 20, 'lb'), ('Jengibre', 5000, 1, 10, 'lb')`);
        await pool.query("INSERT INTO clientes (nombre, correo, telefono, password_hash) VALUES ('Ana', 'ana@correo.com', '3001234567', 'x')");
    });
    afterAll(async () => { if (pool) await pool.end(); });

    it('si un producto no alcanza, ROLLBACK: el stock de los productos anteriores del pedido se restituye', async () => {
        const r = await api.post('/api/pedidos').set(como(1)).send({
            items: [{ productoId: 1, cantidad: 5 }, { productoId: 2, cantidad: 11 }], direccion, metodoPago: 'tarjeta'
        });
        expect(r.status).toBe(409);
        expect(await stock(1)).toBe(20);
        expect(await stock(2)).toBe(10);
        expect((await pool.query('SELECT count(*)::int AS n FROM pedidos')).rows[0].n).toBe(0);
    });
    it('crear y cancelar deja el stock como estaba', async () => {
        const c = await api.post('/api/pedidos').set(como(1)).send({ items: [{ productoId: 1, cantidad: 5 }], direccion, metodoPago: 'mercadopago' });
        expect(c.status).toBe(201);
        expect(await stock(1)).toBe(15);
        expect((await api.post(`/api/pedidos/${c.body.pedido.id}/cancelar`).set(como(1))).status).toBe(200);
        expect(await stock(1)).toBe(20);
    });
    it('dos compras simultáneas del mismo stock: solo una se concreta y nunca queda stock negativo', async () => {
        const comprar = () => api.post('/api/pedidos').set(como(1)).send({ items: [{ productoId: 2, cantidad: 6 }], direccion, metodoPago: 'tarjeta' });
        const respuestas = await Promise.all([comprar(), comprar(), comprar()]);
        expect(respuestas.filter((r) => r.status === 201)).toHaveLength(1);
        expect(respuestas.filter((r) => r.status === 409)).toHaveLength(2);
        expect(await stock(2)).toBe(4);
    });
    it('dos cancelaciones simultáneas del mismo pedido devuelven el stock una sola vez', async () => {
        const c = await api.post('/api/pedidos').set(como(1)).send({ items: [{ productoId: 1, cantidad: 8 }], direccion, metodoPago: 'tarjeta' });
        const id = c.body.pedido.id;
        const rs = await Promise.all([1, 2, 3].map(() => api.post(`/api/pedidos/${id}/cancelar`).set(como(1))));
        expect(rs.filter((r) => r.status === 200)).toHaveLength(1);
        expect(await stock(1)).toBe(20);
    });
});
