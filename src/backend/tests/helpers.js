// Cada prueba usa una base PostgreSQL en memoria (pg-mem) creada con el mismo esquema SQL del proyecto
// (database/01_schema.sql). No se necesita instalar PostgreSQL para correr `npm test`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import { newDb } from 'pg-mem';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const ESQUEMA = fs.readFileSync(path.join(AQUI, '../../../database/01_schema.sql'), 'utf-8');

const { hashSync } = require('../lib/passwords');
const { setPool, cerrar } = require('../lib/db');

export const PRODUCTOS_SEMILLA = [
    { id: 1, nombre: 'Tomate', precio: 3000, categoria: 'Verduras', stock: 20, unidad: 'lb', imagen: '/images/tomate.webp' },
    { id: 2, nombre: 'Jengibre', precio: 5000, categoria: 'Especias', stock: 10, unidad: 'lb', imagen: '/images/jengibre.webp' }
];
export const CLIENTES_SEMILLA = [
    { id: 1, nombre: 'Ana Pérez', correo: 'ana@correo.com', telefono: '3001234567', password: 'clave1234' },
    { id: 2, nombre: 'Luis Gómez', correo: 'luis@correo.com', telefono: '3109876543', password: 'secreto99' }
];
const ADMIN = { nombre: 'Administrador', password: 'admin123', correos: ['admin@samifruver.com', 'admin@samifruber.com'] };

const q = (v) => `'${String(v).replace(/'/g, "''")}'`;

export function prepararEntorno() {
    const db = newDb();
    db.public.none(ESQUEMA);
    db.public.none("INSERT INTO categorias (nombre) VALUES ('Verduras'), ('Frutas'), ('Especias')");
    for (const c of ADMIN.correos) {
        db.public.none(`INSERT INTO administradores (nombre, correo, password_hash) VALUES (${q(ADMIN.nombre)}, ${q(c)}, ${q(hashSync(ADMIN.password))})`);
    }
    for (const p of PRODUCTOS_SEMILLA) {
        db.public.none(`INSERT INTO productos (nombre, precio, categoria_id, stock, unidad, imagen)
            VALUES (${q(p.nombre)}, ${p.precio}, (SELECT id FROM categorias WHERE nombre = ${q(p.categoria)}), ${p.stock}, ${q(p.unidad)}, ${q(p.imagen)})`);
    }
    for (const c of CLIENTES_SEMILLA) {
        db.public.none(`INSERT INTO clientes (nombre, correo, telefono, password_hash)
            VALUES (${q(c.nombre)}, ${q(c.correo)}, ${q(c.telefono)}, ${q(hashSync(c.password))})`);
    }
    // Los ids (1, 2, ...) los asigna la propia base, igual que en PostgreSQL real.
    const { Pool } = db.adapters.createPg();
    setPool(new Pool());
    const app = require('../app');
    return {
        api: request(app),
        // Devuelve las filas de una tabla ('clientes', 'productos', ...) ordenadas por id.
        leerTabla: (nombre) => db.public.many(`SELECT * FROM ${nombre} ORDER BY id`),
        // Ejecuta SQL directo (para preparar casos que la API no permite, como una tarjeta ya vencida).
        ejecutar: (sql) => db.public.none(sql),
        limpiar: () => cerrar()
    };
}

// Tarjetas de prueba (E4). Ambas pasan el algoritmo de Luhn; la pasarela simulada rechaza la que termina en 0002.
export const TARJETA_OK = { titular: 'Ana Pérez', numero: '4242 4242 4242 4242', vencimiento: '08/40', cvv: '123' };
export const TARJETA_RECHAZADA = { titular: 'Ana Pérez', numero: '4000 0000 0000 0002', vencimiento: '08/40', cvv: '123' };
// Guarda una tarjeta del cliente por la API y devuelve su id.
export async function guardarTarjeta(api, clienteId = 1, tarjeta = TARJETA_OK) {
    const r = await api.post('/api/metodos-pago').set({ 'X-Cliente-Id': String(clienteId) }).send(tarjeta);
    if (r.status !== 201) throw new Error(`No se pudo guardar la tarjeta de prueba: ${r.status} ${JSON.stringify(r.body)}`);
    return r.body.metodo.id;
}
