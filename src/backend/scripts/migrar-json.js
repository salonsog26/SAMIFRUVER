// Pasa los datos que estaban en los archivos JSON (data/clientes.json y data/productos.json) a PostgreSQL.
// Las contraseñas en texto plano se cifran en el camino. Se puede ejecutar más de una vez: no duplica nada.
//   npm run db:migrar-json
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { query, cerrar } = require('../lib/db');
const { hash } = require('../lib/passwords');

const leerJson = (nombre) => {
    try { return JSON.parse(fs.readFileSync(path.join(__dirname, '../data', nombre), 'utf-8')); } catch (e) { return []; }
};

(async () => {
    try {
        let clientes = 0, productos = 0, omitidos = 0;

        for (const c of leerJson('clientes.json')) {
            const pass = String(c.password || '').trim();
            if (!c.correo || !pass) { omitidos++; console.warn(`  - cliente sin correo o contraseña, omitido: ${c.nombre || c.id}`); continue; }
            const r = await query(
                `INSERT INTO clientes (nombre, correo, telefono, password_hash, documento, direccion, ciudad)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (LOWER(correo)) DO NOTHING`,
                [c.nombre, String(c.correo).trim().toLowerCase(), c.telefono || '', await hash(pass), c.documento || '', c.direccion || '', c.ciudad || '']
            );
            clientes += r.rowCount;
        }

        for (const p of leerJson('productos.json')) {
            await query('INSERT INTO categorias (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING', [p.categoria]);
            const r = await query(
                `INSERT INTO productos (nombre, precio, categoria_id, stock, unidad, imagen)
                 VALUES ($1, $2, (SELECT id FROM categorias WHERE nombre = $3), $4, $5, $6)
                 ON CONFLICT (LOWER(nombre)) DO NOTHING`,
                [p.nombre, p.precio, p.categoria, p.stock, p.unidad || 'lb', p.imagen || '/images/producto-defecto.webp']
            );
            productos += r.rowCount;
        }

        console.log(`✔ Clientes nuevos: ${clientes}. Productos nuevos: ${productos}. Omitidos: ${omitidos}.`);
    } catch (error) {
        console.error('✘ No se pudo migrar:', error.message);
        process.exitCode = 1;
    } finally {
        await cerrar();
    }
})();
