// src/backend/server.js
const express = require('express');
const cors = require('cors');
const productosRoutes = require('./routes/productos.routes');
const authRoutes = require('./routes/auth.routes');
const clientesRoutes = require('./routes/clientes.routes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/productos', productosRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Servidor de SAMIFRUBER funcionando correctamente' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});