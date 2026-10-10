// src/backend/routes/clientes.routes.js
const express = require('express');
const { registrarCliente, loginCliente } = require('../controllers/clientes.controller');
const router = express.Router();

router.post('/registro', registrarCliente);
router.post('/login', loginCliente);

module.exports = router;