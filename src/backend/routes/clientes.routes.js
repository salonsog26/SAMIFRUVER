// src/backend/routes/clientes.routes.js
const express = require('express');
const { registrarCliente, loginCliente, obtenerCliente, actualizarCliente } = require('../controllers/clientes.controller');
const router = express.Router();

router.post('/registro', registrarCliente);
router.post('/login', loginCliente);
router.get('/:id', obtenerCliente);
router.put('/:id', actualizarCliente);

module.exports = router;
