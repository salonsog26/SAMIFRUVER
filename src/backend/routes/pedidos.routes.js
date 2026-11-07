// src/backend/routes/pedidos.routes.js — Épica 3
const express = require('express');
const {
    requiereCliente, requiereAdmin,
    crearPedido, listarPedidos, obtenerPedido, cancelarPedido, avanzarEstadoHttp, completarDevolucionHttp
} = require('../controllers/pedidos.controller');
const router = express.Router();

// Avanzar estado: solo con la clave de administrador (no usa la sesión del cliente).
router.patch('/:id/estado', requiereAdmin, avanzarEstadoHttp);
router.patch('/:id/devolucion', requiereAdmin, completarDevolucionHttp);   // E4: confirma el reintegro

// El resto exige un cliente identificado (cabecera X-Cliente-Id).
router.use(requiereCliente);
router.post('/', crearPedido);
router.get('/', listarPedidos);
router.get('/:id', obtenerPedido);
router.post('/:id/cancelar', cancelarPedido);

module.exports = router;
