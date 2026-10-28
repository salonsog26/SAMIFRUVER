// Crea las tablas y carga los datos iniciales ejecutando los .sql de la carpeta /database (en la raíz del repo).
//   npm run db:init            -> esquema + datos iniciales
//   npm run db:init -- --sin-datos   -> solo el esquema
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { getPool, cerrar } = require('../lib/db');

const CARPETA = path.join(__dirname, '../../../database');

(async () => {
    const archivos = ['01_schema.sql'];
    if (!process.argv.includes('--sin-datos')) archivos.push('02_seed.sql');
    try {
        for (const nombre of archivos) {
            const sql = fs.readFileSync(path.join(CARPETA, nombre), 'utf-8');
            await getPool().query(sql);
            console.log(`✔ ${nombre}`);
        }
        console.log('Base de datos lista.');
    } catch (error) {
        console.error('✘ No se pudo preparar la base de datos:', error.message);
        process.exitCode = 1;
    } finally {
        await cerrar();
    }
})();
