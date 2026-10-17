// src/backend/app.js — configuración de Express (sin abrir el puerto, para poder probarla con supertest)
const express = require('express');
const { query } = require('./lib/db');
const cors = require('cors');
const productosRoutes = require('./routes/productos.routes');
const authRoutes = require('./routes/auth.routes');
const clientesRoutes = require('./routes/clientes.routes');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
// 6 MB: las fotos de producto viajan como imagen en base64 (máx. 2 MB de archivo).
app.use(express.json({ limit: '6mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/productos', productosRoutes);

app.get('/api/health', async (req, res) => {
    try {
        await query('SELECT 1');
        res.json({ status: 'OK', message: 'Servidor de SAMIFRUBER funcionando correctamente', baseDatos: 'conectada' });
    } catch (error) {
        res.status(503).json({ status: 'ERROR', message: 'El servidor funciona, pero no hay conexión con la base de datos', baseDatos: 'sin conexión' });
    }
});

// JSON mal formado u otros errores: respuesta 400/500 en JSON, sin filtrar detalles.
app.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') return res.status(400).json({ mensaje: 'JSON inválido.' });
    if (err && err.type === 'entity.too.large') return res.status(413).json({ mensaje: 'La imagen es demasiado grande.' });
    console.error(err);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
});

module.exports = app;
