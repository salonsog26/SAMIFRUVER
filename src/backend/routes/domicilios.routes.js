// src/backend/routes/domicilios.routes.js — Épica 5
const express = require('express');
const {
    requiereDomiciliario, listarAsignados, obtenerAsignado, iniciarEntrega, confirmarEntrega, perfil
} = require('../controllers/domicilios.controller');

const router = express.Router();

router.use(requiereDomiciliario);
router.get('/perfil', perfil);
router.get('/pedidos', listarAsignados);
router.get('/pedidos/:id', obtenerAsignado);
router.post('/pedidos/:id/iniciar', iniciarEntrega);
router.post('/pedidos/:id/confirmar', confirmarEntrega);

module.exports = router;
