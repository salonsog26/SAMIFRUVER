// src/backend/server.js
const express = require('express');
const cors = require('cors');
const productosRoutes = require('./routes/productos.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares (deben ir ANTES de montar las rutas para que req.body esté disponible)
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

// Usar las rutas modularizadas
app.use('/api/productos', productosRoutes);

// Ruta de comprobación de estado
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Servidor de SAMIFRUBER funcionando correctamente' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});