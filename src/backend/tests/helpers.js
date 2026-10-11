// Prepara una carpeta de datos temporal para cada prueba (no toca data/ real).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

export const PRODUCTOS_SEMILLA = [
    { id: 1, nombre: 'Tomate', precio: 3000, categoria: 'Verduras', stock: 20, unidad: 'lb', imagen: '/images/tomate.webp' },
    { id: 2, nombre: 'Jengibre', precio: 5000, categoria: 'Especias', stock: 10, unidad: 'lb', imagen: '/images/jengibre.webp' }
];
export const CLIENTES_SEMILLA = [
    { id: 1, nombre: 'Ana Pérez', correo: 'ana@correo.com', telefono: '3001234567', password: 'clave1234', rol: 'cliente' },
    { id: 2, nombre: 'Luis Gómez', correo: 'luis@correo.com', telefono: '3109876543', password: 'secreto99', rol: 'cliente' }
];

export function prepararEntorno() {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'samifruber-'));
    fs.writeFileSync(path.join(dir, 'productos.json'), JSON.stringify(PRODUCTOS_SEMILLA));
    fs.writeFileSync(path.join(dir, 'clientes.json'), JSON.stringify(CLIENTES_SEMILLA));
    process.env.DATA_DIR = dir;
    const app = require('../app');
    return {
        api: request(app),
        leerArchivo: (n) => JSON.parse(fs.readFileSync(path.join(dir, n), 'utf-8')),
        limpiar: () => fs.rmSync(dir, { recursive: true, force: true })
    };
}
