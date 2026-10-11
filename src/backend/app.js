// src/backend/app.js — configuración de Express (sin abrir el puerto, para poder probarla con supertest)
const express = require('express');
const cors = require('cors');
const productosRoutes = require('./routes/productos.routes');
const authRoutes = require('./routes/auth.routes');
const clientesRoutes = require('./routes/clientes.routes');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/productos', productosRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Servidor de SAMIFRUBER funcionando correctamente' });
});

// JSON mal formado u otros errores: respuesta 400/500 en JSON, sin filtrar detalles.
app.use((err, req, res, next) => {
    if (err && err.type === 'entity.parse.failed') return res.status(400).json({ mensaje: 'JSON inválido.' });
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
});

module.exports = app;
