// src/backend/lib/db.js
// Conexión a PostgreSQL. Variables de entorno:
//   DATABASE_URL  postgresql://usuario:clave@host:5432/basedatos   (obligatoria)
//   DATABASE_SSL  "true" si el proveedor lo exige (Render, Neon, Supabase)
const { Pool } = require('pg');

let pool = null;

const crearPool = () => {
    if (!process.env.DATABASE_URL) {
        throw new Error('Falta DATABASE_URL. Copia .env.example a .env y completa la conexión a PostgreSQL.');
    }
    return new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
        max: 10
    });
};

const getPool = () => {
    if (!pool) pool = crearPool();
    return pool;
};

// Las pruebas automáticas inyectan aquí una base en memoria.
const setPool = (nuevo) => { pool = nuevo; };

const query = (texto, parametros = []) => getPool().query(texto, parametros);

// Ejecuta `fn(cliente)` dentro de una transacción: o se guardan todos los cambios o ninguno.
// Se usa al crear/cancelar un pedido (pedido + productos + stock deben quedar consistentes).
const transaccion = async (fn) => {
    const cliente = await getPool().connect();
    try {
        await cliente.query('BEGIN');
        const resultado = await fn(cliente);
        await cliente.query('COMMIT');
        return resultado;
    } catch (error) {
        try { await cliente.query('ROLLBACK'); } catch (e) { /* conexión ya perdida */ }
        throw error;
    } finally {
        cliente.release();
    }
};

const cerrar = async () => {
    if (pool && pool.end) await pool.end();
    pool = null;
};

// Código de PostgreSQL para "violación de índice único".
const esDuplicado = (error) => Boolean(error) && error.code === '23505';

module.exports = { query, transaccion, getPool, setPool, cerrar, esDuplicado };
