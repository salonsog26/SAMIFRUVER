// src/backend/routes/metodos-pago.routes.js — Épica 4 (HU3)
const express = require('express');
const { requiereCliente } = require('../controllers/pedidos.controller');
const { listarMetodos, agregarMetodo, eliminarMetodo } = require('../controllers/metodos-pago.controller');
const router = express.Router();

router.use(requiereCliente);
router.get('/', listarMetodos);
router.post('/', agregarMetodo);
router.delete('/:id', eliminarMetodo);

module.exports = router;
